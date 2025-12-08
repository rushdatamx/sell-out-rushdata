# Manual de Onboarding de Nuevos Clientes

Este manual describe el proceso paso a paso para dar de alta un nuevo cliente en la plataforma Sellout RushData.

## Índice
1. [Requisitos Previos](#1-requisitos-previos)
2. [Paso 1: Crear Tenant](#2-paso-1-crear-tenant)
3. [Paso 2: Crear Usuario](#3-paso-2-crear-usuario)
4. [Paso 3: Crear Retailer](#4-paso-3-crear-retailer)
5. [Paso 4: Cargar Tiendas](#5-paso-4-cargar-tiendas)
6. [Paso 5: Cargar Productos](#6-paso-5-cargar-productos)
7. [Paso 6: Cargar Ventas](#7-paso-6-cargar-ventas)
8. [Paso 7: Cargar Inventario](#8-paso-7-cargar-inventario)
9. [Paso 8: Refrescar Vistas Materializadas](#9-paso-8-refrescar-vistas-materializadas)
10. [Paso 9: Verificación Final](#10-paso-9-verificación-final)
11. [Troubleshooting](#11-troubleshooting)

---

## 1. Requisitos Previos

### Archivos necesarios del cliente:
- **Archivo de Ventas** (Excel): Con columnas de ID Tienda, UPC, Fecha, Unidades, Ventas ($), Precio
- **Archivo de Inventario** (Excel): Con columnas de ID Tienda, UPC, Fecha, Inventario
- **Catálogo de Tiendas**: Lista de tiendas con código y nombre
- **Catálogo de Productos**: Lista de productos con UPC y nombre

### Herramientas necesarias:
- Acceso a Supabase (Dashboard)
- Node.js instalado localmente
- Librería `xlsx` instalada (`npm install xlsx`)

---

## 2. Paso 1: Crear Tenant

Ejecutar en Supabase SQL Editor:

```sql
INSERT INTO tenants (nombre_empresa, contacto_email, plan, estado)
VALUES ('NOMBRE_EMPRESA', 'email@empresa.com', 'basic', 'activo')
RETURNING id;
```

**IMPORTANTE:** Guardar el `id` (UUID) generado. Se usará en todos los pasos siguientes.

Ejemplo de respuesta:
```
id: c529e450-3708-48c9-90ca-cfb2a01a57ed
```

---

## 3. Paso 2: Crear Usuario

### 3.1 Crear usuario en Supabase Auth

1. Ir a **Authentication > Users** en el Dashboard de Supabase
2. Click en **Add User**
3. Llenar:
   - Email: `usuario@empresa.com`
   - Password: (generar uno seguro)
4. Click en **Create User**
5. Copiar el `User UID` generado

### 3.2 Asociar usuario al tenant

```sql
INSERT INTO users (id, tenant_id, email, nombre, activo)
VALUES (
  'USER_UID_DE_AUTH',
  'TENANT_ID',
  'usuario@empresa.com',
  'Nombre del Usuario',
  true
);
```

---

## 4. Paso 3: Crear Retailer

```sql
INSERT INTO dim_retailers (tenant_id, codigo, nombre, color_hex, activo)
VALUES ('TENANT_ID', 'HEB', 'HEB', '#e31837', true)
RETURNING id;
```

**IMPORTANTE:** Guardar el `id` del retailer (número entero).

---

## 5. Paso 4: Cargar Tiendas

### Opción A: Carga manual via CSV (RECOMENDADO para muchos registros)

1. Crear archivo CSV con el formato:
```csv
tenant_id,retailer_id,codigo_tienda,nombre,ciudad,estado,activo
c529e450-...,3,2992,HEB Plus Monterrey,Monterrey,Nuevo León,true
```

2. En Supabase Dashboard:
   - Ir a **Table Editor > dim_tiendas**
   - Click en **Import data from CSV**
   - Seleccionar el archivo CSV
   - Click en **Import**

### Opción B: Carga via SQL (para pocos registros)

```sql
INSERT INTO dim_tiendas (tenant_id, retailer_id, codigo_tienda, nombre, ciudad, estado, activo)
VALUES
  ('TENANT_ID', RETAILER_ID, '2992', 'HEB Plus Monterrey', 'Monterrey', 'Nuevo León', true),
  ('TENANT_ID', RETAILER_ID, '2913', 'HEB Lincoln', 'Monterrey', 'Nuevo León', true);
```

### Obtener IDs generados

Después de cargar, obtener el mapeo de códigos a IDs:

```sql
SELECT id, codigo_tienda
FROM dim_tiendas
WHERE tenant_id = 'TENANT_ID'
ORDER BY id;
```

**IMPORTANTE:** Guardar este mapeo para usarlo en la carga de ventas/inventario.

---

## 6. Paso 5: Cargar Productos

### Opción A: Carga manual via CSV (RECOMENDADO)

1. Crear archivo CSV con el formato:
```csv
tenant_id,upc,nombre,descripcion_corta,categoria,marca,activo
c529e450-...,7500462417826,Producto A,Descripción,Categoría,Marca,true
```

2. Importar via Supabase Dashboard igual que tiendas

### Obtener IDs generados

```sql
SELECT id, upc, nombre
FROM dim_productos
WHERE tenant_id = 'TENANT_ID'
ORDER BY id;
```

**IMPORTANTE:** Guardar este mapeo para usarlo en la carga de ventas/inventario.

---

## 7. Paso 6: Cargar Ventas

### 7.1 Crear script de transformación

Crear archivo `scripts/prepare-ventas-CLIENTE.js`:

```javascript
const XLSX = require('xlsx');
const fs = require('fs');

// Configuración del cliente
const VENTAS_PATH = '/ruta/al/archivo/ventas.xlsx';
const OUTPUT_PATH = '/ruta/salida/ventas_cliente.csv';
const TENANT_ID = 'tu-tenant-id';
const RETAILER_ID = 3; // ID del retailer creado

// Mapeo de códigos de tienda a IDs de Supabase
// (obtener con la query de paso 5)
const tiendasMap = {
  '2992': 29,
  '2913': 30,
  // ... agregar todos los códigos
};

// Mapeo de UPCs a IDs de Supabase
// (obtener con la query de paso 6)
const productosMap = {
  '7500462417826': 20,
  '7500462417833': 21,
  // ... agregar todos los UPCs
};

function excelDateToString(serial) {
  const utc_days = Math.floor(serial - 25569);
  const date = new Date(utc_days * 86400 * 1000);
  return date.toISOString().split('T')[0];
}

// Leer Excel
const wb = XLSX.readFile(VENTAS_PATH);
const sheet = wb.Sheets[wb.SheetNames[0]]; // Ajustar nombre de hoja si es necesario
const data = XLSX.utils.sheet_to_json(sheet);

console.log(`Total registros en archivo: ${data.length}`);

let ventas = [];
let skipped = 0;

data.forEach(row => {
  // Ajustar nombres de columnas según el archivo del cliente
  const tiendaId = tiendasMap[String(row['ID Tienda'] || row['ID_Tienda'])];
  const productoId = productosMap[String(row['UPC'])];

  if (!tiendaId || !productoId) {
    skipped++;
    return;
  }

  ventas.push({
    tenant_id: TENANT_ID,
    retailer_id: RETAILER_ID,
    tienda_id: tiendaId,
    producto_id: productoId,
    fecha: excelDateToString(row['Fecha'] || row['Día']),
    unidades: row['Unidades'] || 0,
    venta_pesos: row['Ventas'] || row['Venta'] || 0,
    precio_unitario: row['Precio'] || row['Precio Promedio'] || 0
  });
});

console.log(`Ventas válidas: ${ventas.length}`);
console.log(`Ventas omitidas: ${skipped}`);

// IMPORTANTE: Reemplazar nulls con 0 para evitar errores de importación
let csv = 'tenant_id,retailer_id,tienda_id,producto_id,fecha,unidades,venta_pesos,precio_unitario\n';
ventas.forEach(v => {
  csv += `${v.tenant_id},${v.retailer_id},${v.tienda_id},${v.producto_id},${v.fecha},${v.unidades || 0},${v.venta_pesos || 0},${v.precio_unitario || 0}\n`;
});

fs.writeFileSync(OUTPUT_PATH, csv);
console.log(`CSV guardado en ${OUTPUT_PATH}`);
```

### 7.2 Ejecutar script

```bash
node scripts/prepare-ventas-CLIENTE.js
```

### 7.3 Importar CSV en Supabase

1. Ir a **Table Editor > fact_ventas**
2. Click en **Import data from CSV**
3. Seleccionar el archivo CSV generado
4. Click en **Import**

### Errores comunes y soluciones:

| Error | Causa | Solución |
|-------|-------|----------|
| `invalid input syntax for type numeric: null` | Hay valores null en columnas numéricas | Reemplazar nulls con 0 en el script |
| `duplicate key value violates unique constraint` | Ya existen registros con la misma combinación tenant/retailer/tienda/producto/fecha | Eliminar registros existentes primero (ver Troubleshooting) |
| `violates foreign key constraint` | El tienda_id o producto_id no existe | Verificar que los IDs en el mapeo coincidan con los de la BD |

---

## 8. Paso 7: Cargar Inventario

### 8.1 Crear script de transformación

Crear archivo `scripts/prepare-inventario-CLIENTE.js`:

```javascript
const XLSX = require('xlsx');
const fs = require('fs');

const INVENTARIO_PATH = '/ruta/al/archivo/inventario.xlsx';
const OUTPUT_PATH = '/ruta/salida/inventario_cliente.csv';
const TENANT_ID = 'tu-tenant-id';
const RETAILER_ID = 3;

// IMPORTANTE: Usar los mismos mapeos que en ventas
const tiendasMap = { /* ... */ };
const productosMap = { /* ... */ };

function excelDateToString(serial) {
  const utc_days = Math.floor(serial - 25569);
  const date = new Date(utc_days * 86400 * 1000);
  return date.toISOString().split('T')[0];
}

const wb = XLSX.readFile(INVENTARIO_PATH);
const sheet = wb.Sheets[wb.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(sheet);

// IMPORTANTE: Usar Map para deduplicar (evita errores de unique constraint)
const inventarioMap = new Map();
let skipped = 0;
let duplicates = 0;

data.forEach(row => {
  const tiendaId = tiendasMap[String(row['ID_Tienda'])];
  const productoId = productosMap[String(row['UPC'])];

  if (!tiendaId || !productoId) {
    skipped++;
    return;
  }

  const fecha = excelDateToString(row['Fecha']);
  const key = `${TENANT_ID}|${RETAILER_ID}|${tiendaId}|${productoId}|${fecha}`;
  const inventario = row['Inventario'] || 0;

  if (inventarioMap.has(key)) {
    // Si hay duplicados, tomar el valor máximo
    const existing = inventarioMap.get(key);
    existing.inventario_unidades = Math.max(existing.inventario_unidades, inventario);
    duplicates++;
  } else {
    inventarioMap.set(key, {
      tenant_id: TENANT_ID,
      retailer_id: RETAILER_ID,
      tienda_id: tiendaId,
      producto_id: productoId,
      fecha: fecha,
      inventario_unidades: inventario
    });
  }
});

const inventario = Array.from(inventarioMap.values());

console.log(`Registros únicos: ${inventario.length}`);
console.log(`Omitidos: ${skipped}`);
console.log(`Duplicados fusionados: ${duplicates}`);

// IMPORTANTE: Nombre de columna es "inventario_unidades" (no "unidades_inventario")
let csv = 'tenant_id,retailer_id,tienda_id,producto_id,fecha,inventario_unidades\n';
inventario.forEach(i => {
  csv += `${i.tenant_id},${i.retailer_id},${i.tienda_id},${i.producto_id},${i.fecha},${i.inventario_unidades}\n`;
});

fs.writeFileSync(OUTPUT_PATH, csv);
console.log(`CSV guardado en ${OUTPUT_PATH}`);
```

### 8.2 Ejecutar e importar

```bash
node scripts/prepare-inventario-CLIENTE.js
```

Importar via Supabase Dashboard igual que ventas.

---

## 9. Paso 8: Refrescar Vistas Materializadas

Después de cargar todos los datos, refrescar las vistas materializadas:

```sql
REFRESH MATERIALIZED VIEW mv_metricas_producto_tienda;
```

---

## 10. Paso 9: Verificación Final

Ejecutar esta query para verificar que todo esté correcto:

```sql
SELECT
  'Tenant' as tabla, COUNT(*) as registros
FROM tenants WHERE id = 'TENANT_ID'
UNION ALL
SELECT 'Retailers', COUNT(*) FROM dim_retailers WHERE tenant_id = 'TENANT_ID'
UNION ALL
SELECT 'Tiendas', COUNT(*) FROM dim_tiendas WHERE tenant_id = 'TENANT_ID'
UNION ALL
SELECT 'Productos', COUNT(*) FROM dim_productos WHERE tenant_id = 'TENANT_ID'
UNION ALL
SELECT 'Ventas', COUNT(*) FROM fact_ventas WHERE tenant_id = 'TENANT_ID'
UNION ALL
SELECT 'Inventario', COUNT(*) FROM fact_inventario WHERE tenant_id = 'TENANT_ID';
```

Verificar rango de fechas:

```sql
SELECT
  'Ventas' as tipo,
  MIN(fecha) as desde,
  MAX(fecha) as hasta,
  COUNT(DISTINCT fecha) as dias
FROM fact_ventas WHERE tenant_id = 'TENANT_ID'
UNION ALL
SELECT 'Inventario', MIN(fecha), MAX(fecha), COUNT(DISTINCT fecha)
FROM fact_inventario WHERE tenant_id = 'TENANT_ID';
```

---

## 11. Troubleshooting

### Eliminar datos para reimportación

Si necesitas eliminar datos para volver a cargar:

```sql
-- Eliminar ventas
DELETE FROM fact_ventas WHERE tenant_id = 'TENANT_ID';

-- Eliminar inventario
DELETE FROM fact_inventario WHERE tenant_id = 'TENANT_ID';

-- Verificar que se eliminaron
SELECT COUNT(*) FROM fact_ventas WHERE tenant_id = 'TENANT_ID';
```

### Verificar duplicados en CSV antes de importar

Crear script `scripts/check-duplicates.js`:

```javascript
const fs = require('fs');
const lines = fs.readFileSync('/ruta/al/archivo.csv', 'utf8').split('\n');
const keys = new Set();
let duplicates = 0;

lines.slice(1).forEach(line => {
  if (!line.trim()) return;
  const parts = line.split(',');
  const key = parts.slice(0, 5).join('|'); // tenant,retailer,tienda,producto,fecha
  if (keys.has(key)) duplicates++;
  keys.add(key);
});

console.log('Total duplicados:', duplicates);
```

### Archivo con tiendas/productos diferentes entre ventas e inventario

Si el archivo de inventario tiene códigos de tienda o UPCs diferentes al de ventas:

1. Verificar qué tiendas/productos ya existen:
```sql
SELECT id, codigo_tienda FROM dim_tiendas WHERE tenant_id = 'TENANT_ID';
SELECT id, upc FROM dim_productos WHERE tenant_id = 'TENANT_ID';
```

2. Usar esos IDs en el mapeo del script de inventario

### Error "incompatible data structure"

Verificar que:
- Los nombres de columnas en el CSV coincidan exactamente con los de la tabla
- No haya columnas extra en el CSV
- El orden de columnas no importa, pero los nombres sí

---

## Checklist Rápido

- [ ] Tenant creado (guardar UUID)
- [ ] Usuario creado en Auth y asociado al tenant
- [ ] Retailer creado (guardar ID numérico)
- [ ] Tiendas cargadas (guardar mapeo código → ID)
- [ ] Productos cargados (guardar mapeo UPC → ID)
- [ ] Script de ventas creado con mapeos correctos
- [ ] CSV de ventas generado (sin nulls, sin duplicados)
- [ ] Ventas importadas via Supabase
- [ ] Script de inventario creado con mapeos correctos
- [ ] CSV de inventario generado (sin duplicados, columna correcta)
- [ ] Inventario importado via Supabase
- [ ] Vista materializada refrescada
- [ ] Verificación final ejecutada
- [ ] Cliente puede hacer login y ver datos
