# Manual de Actualización Diaria de Datos

Este manual describe cómo cargar los datos diarios de ventas e inventario para clientes existentes.

## Índice
1. [Resumen del Proceso](#1-resumen-del-proceso)
2. [Preparar Datos de Ventas](#2-preparar-datos-de-ventas)
3. [Preparar Datos de Inventario](#3-preparar-datos-de-inventario)
4. [Importar en Supabase](#4-importar-en-supabase)
5. [Política de Retención de Inventario](#5-política-de-retención-de-inventario)
6. [Refrescar Vistas Materializadas](#6-refrescar-vistas-materializadas)
7. [Scripts Reutilizables](#7-scripts-reutilizables)

---

## 1. Resumen del Proceso

### Flujo diario:
1. Recibir archivos Excel del cliente (ventas del día, inventario del día)
2. Ejecutar script para transformar a CSV
3. Importar CSV manualmente en Supabase
4. (Opcional) Limpiar inventario antiguo (>30 días)
5. Refrescar vista materializada

### Diferencia con el onboarding inicial:
- **NO** se crean tenant, usuario, retailer, tiendas ni productos
- Solo se agregan registros a `fact_ventas` y `fact_inventario`
- Los mapeos de tiendas/productos ya existen

---

## 2. Preparar Datos de Ventas

### 2.1 Estructura esperada del archivo Excel

El archivo de ventas diarias debe tener columnas similares a:
- ID Tienda (código de tienda del retailer)
- UPC (código de producto)
- Fecha
- Unidades vendidas
- Venta en pesos
- Precio promedio (opcional)

### 2.2 Script para procesar ventas diarias

Usar el script existente del cliente, solo cambiar la ruta del archivo:

```javascript
// scripts/update-ventas-4buddies.js
const XLSX = require('xlsx');
const fs = require('fs');

// === CONFIGURACIÓN - MODIFICAR SEGÚN EL DÍA ===
const VENTAS_PATH = '/ruta/al/archivo/VENTAS_2025-12-08.xlsx';
const OUTPUT_PATH = '/Users/jmariopgarcia/Desktop/4BUDDIES HEB/ventas_diarias.csv';

// Configuración fija del cliente
const TENANT_ID = 'c529e450-3708-48c9-90ca-cfb2a01a57ed';
const RETAILER_ID = 3;

// Mapeos ya establecidos (no modificar a menos que agreguen tiendas/productos)
const tiendasMap = {
  '2992': 29, '2913': 30, '2985': 31, '2928': 32, '2918': 33, '2937': 34, '2907': 35, '2984': 36,
  '2930': 37, '2962': 38, '2927': 39, '2924': 40, '2926': 41, '2945': 42, '2951': 43, '2952': 44,
  '2959': 45, '2950': 46, '2975': 47, '2996': 48, '2946': 49, '2978': 50, '2981': 51, '2935': 52,
  '2943': 53, '2953': 54, '2961': 55, '2963': 56, '2979': 57, '2980': 58, '9108': 59, '2929': 60,
  '2957': 61, '2958': 62, '2965': 63, '2967': 64, '2974': 65, '2976': 66, '2977': 67, '9106': 68,
  '2968': 69, '2971': 70, '2915': 71, '2919': 72, '2997': 73, '2982': 74, '9100': 75, '9105': 76,
  '2960': 77, '2987': 78, '2954': 79, '2993': 80, '2989': 81, '2912': 82, '2922': 83, '2986': 84,
  '2940': 85, '2936': 86, '2964': 87, '2973': 88, '2934': 89, '2933': 90, '2970': 91
};

const productosMap = {
  '7500462417826': 20, '7500462417833': 21, '7500462417819': 22, '7500462860004': 23,
  '7500462417802': 24, '7500462860042': 25, '7503028921317': 26, '7503028921133': 27,
  '7503028921003': 28, '7503028921010': 29, '7500462860066': 30, '7500462860011': 31,
  '7500462860035': 32, '7503028921324': 33
};

function excelDateToString(serial) {
  if (typeof serial === 'string') return serial; // Ya es fecha string
  const utc_days = Math.floor(serial - 25569);
  const date = new Date(utc_days * 86400 * 1000);
  return date.toISOString().split('T')[0];
}

// Leer Excel
const wb = XLSX.readFile(VENTAS_PATH);
const sheet = wb.Sheets[wb.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(sheet);

console.log(`Registros en archivo: ${data.length}`);

let ventas = [];
let skipped = 0;

data.forEach(row => {
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
console.log(`Omitidas: ${skipped}`);

// Generar CSV
let csv = 'tenant_id,retailer_id,tienda_id,producto_id,fecha,unidades,venta_pesos,precio_unitario\n';
ventas.forEach(v => {
  csv += `${v.tenant_id},${v.retailer_id},${v.tienda_id},${v.producto_id},${v.fecha},${v.unidades || 0},${v.venta_pesos || 0},${v.precio_unitario || 0}\n`;
});

fs.writeFileSync(OUTPUT_PATH, csv);
console.log(`\nCSV guardado en: ${OUTPUT_PATH}`);
console.log(`Listo para importar en Supabase`);
```

### 2.3 Ejecutar

```bash
cd /Users/jmariopgarcia/Desktop/Cursor\ Local/sellout-rushdata
node scripts/update-ventas-4buddies.js
```

---

## 3. Preparar Datos de Inventario

### 3.1 Script para procesar inventario diario

```javascript
// scripts/update-inventario-4buddies.js
const XLSX = require('xlsx');
const fs = require('fs');

// === CONFIGURACIÓN - MODIFICAR SEGÚN EL DÍA ===
const INVENTARIO_PATH = '/ruta/al/archivo/INVENTARIO_2025-12-08.xlsx';
const OUTPUT_PATH = '/Users/jmariopgarcia/Desktop/4BUDDIES HEB/inventario_diario.csv';

const TENANT_ID = 'c529e450-3708-48c9-90ca-cfb2a01a57ed';
const RETAILER_ID = 3;

// Mapeos (incluye tienda 2160 que mapea a 86)
const tiendasMap = {
  '2907': 35, '2912': 82, '2913': 30, '2915': 71, '2918': 33, '2919': 72, '2922': 83,
  '2924': 40, '2926': 41, '2927': 39, '2928': 32, '2929': 60, '2930': 37, '2933': 90,
  '2934': 89, '2935': 52, '2936': 86, '2937': 34, '2940': 85, '2943': 53, '2945': 42,
  '2946': 49, '2950': 46, '2951': 43, '2952': 44, '2953': 54, '2954': 79, '2957': 61,
  '2958': 62, '2959': 45, '2960': 77, '2961': 55, '2962': 38, '2963': 56, '2964': 87,
  '2965': 63, '2967': 64, '2968': 69, '2970': 91, '2971': 70, '2973': 88, '2974': 65,
  '2975': 47, '2976': 66, '2977': 67, '2978': 50, '2979': 57, '2980': 58, '2981': 51,
  '2982': 74, '2984': 36, '2985': 31, '2986': 84, '2987': 78, '2989': 81, '2992': 29,
  '2993': 80, '2996': 48, '2997': 73, '9100': 75, '9105': 76, '9106': 68, '9108': 59,
  '2160': 86
};

const productosMap = {
  '7500462417802': 24, '7500462417819': 22, '7500462417826': 20, '7500462417833': 21,
  '7500462860004': 23, '7500462860011': 31, '7500462860035': 32, '7500462860042': 25,
  '7500462860066': 30, '7503028921003': 28, '7503028921010': 29, '7503028921133': 27,
  '7503028921317': 26, '7503028921324': 33
};

function excelDateToString(serial) {
  if (typeof serial === 'string') return serial;
  const utc_days = Math.floor(serial - 25569);
  const date = new Date(utc_days * 86400 * 1000);
  return date.toISOString().split('T')[0];
}

const wb = XLSX.readFile(INVENTARIO_PATH);
const sheet = wb.Sheets[wb.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(sheet);

console.log(`Registros en archivo: ${data.length}`);

// IMPORTANTE: Deduplicar para evitar errores de unique constraint
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
  const key = `${tiendaId}|${productoId}|${fecha}`;
  const inventario = row['Inventario'] || 0;

  if (inventarioMap.has(key)) {
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

// IMPORTANTE: Nombre de columna es "inventario_unidades"
let csv = 'tenant_id,retailer_id,tienda_id,producto_id,fecha,inventario_unidades\n';
inventario.forEach(i => {
  csv += `${i.tenant_id},${i.retailer_id},${i.tienda_id},${i.producto_id},${i.fecha},${i.inventario_unidades}\n`;
});

fs.writeFileSync(OUTPUT_PATH, csv);
console.log(`\nCSV guardado en: ${OUTPUT_PATH}`);
```

---

## 4. Importar en Supabase

### 4.1 Para Ventas

1. Ir a **Supabase Dashboard > Table Editor > fact_ventas**
2. Click en **Import data from CSV**
3. Seleccionar el archivo `ventas_diarias.csv`
4. Click en **Import**

### 4.2 Para Inventario

1. Ir a **Supabase Dashboard > Table Editor > fact_inventario**
2. Click en **Import data from CSV**
3. Seleccionar el archivo `inventario_diario.csv`
4. Click en **Import**

### Manejo de duplicados

Si aparece error de "duplicate key":
- **Ventas**: Normalmente no deberían existir duplicados. Si ya se cargó el día, eliminar primero:
  ```sql
  DELETE FROM fact_ventas
  WHERE tenant_id = 'TENANT_ID'
    AND fecha = '2025-12-08';
  ```

- **Inventario**: Igual que ventas:
  ```sql
  DELETE FROM fact_inventario
  WHERE tenant_id = 'TENANT_ID'
    AND fecha = '2025-12-08';
  ```

---

## 5. Política de Retención de Inventario

### ¿Debo borrar inventario antiguo?

**Recomendación: SÍ, mantener solo los últimos 30-60 días.**

### Razones:
1. El inventario es una "foto" del día, no tiene sentido acumulativo como las ventas
2. Para análisis se usa el inventario reciente vs ventas
3. Reduce el tamaño de la base de datos
4. Las ventas SÍ se mantienen históricas (para comparar año vs año)

### Script de limpieza mensual

Ejecutar cada mes (o cuando se haga la carga diaria):

```sql
-- Eliminar inventario mayor a 30 días para un tenant específico
DELETE FROM fact_inventario
WHERE tenant_id = 'c529e450-3708-48c9-90ca-cfb2a01a57ed'
  AND fecha < CURRENT_DATE - INTERVAL '30 days';

-- Verificar cuántos registros quedaron
SELECT
  MIN(fecha) as desde,
  MAX(fecha) as hasta,
  COUNT(*) as registros
FROM fact_inventario
WHERE tenant_id = 'c529e450-3708-48c9-90ca-cfb2a01a57ed';
```

### Limpieza para TODOS los tenants

```sql
-- Eliminar inventario mayor a 30 días para todos
DELETE FROM fact_inventario
WHERE fecha < CURRENT_DATE - INTERVAL '30 days';
```

### Automatización futura

Considerar crear un cron job o función programada en Supabase para limpiar automáticamente.

---

## 6. Refrescar Vistas Materializadas

Después de cargar datos nuevos, refrescar la vista:

```sql
REFRESH MATERIALIZED VIEW mv_metricas_producto_tienda;
```

---

## 7. Scripts Reutilizables

Los scripts para cada cliente están en:
```
/Users/jmariopgarcia/Desktop/Cursor Local/sellout-rushdata/scripts/
```

### Para 4BUDDIES:
- `update-ventas-4buddies.js` - Procesar ventas diarias
- `update-inventario-4buddies.js` - Procesar inventario diario

### Crear scripts para nuevo cliente:
Copiar los scripts de 4BUDDIES y modificar:
1. `TENANT_ID`
2. `RETAILER_ID`
3. `tiendasMap` (obtener IDs de la BD)
4. `productosMap` (obtener IDs de la BD)

---

## Checklist de Actualización Diaria

- [ ] Recibir archivo de ventas del día
- [ ] Recibir archivo de inventario del día
- [ ] Modificar ruta del archivo en script de ventas
- [ ] Ejecutar script de ventas → generar CSV
- [ ] Importar CSV de ventas en Supabase
- [ ] Modificar ruta del archivo en script de inventario
- [ ] Ejecutar script de inventario → generar CSV
- [ ] Importar CSV de inventario en Supabase
- [ ] (Mensual) Limpiar inventario >30 días
- [ ] Refrescar vista materializada
- [ ] Verificar que los datos aparezcan en la app
