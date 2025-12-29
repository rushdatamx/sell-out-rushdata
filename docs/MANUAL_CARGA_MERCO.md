# Manual de Carga de Datos - MERCO

Este documento describe el proceso completo para cargar datos de **Merco** en la plataforma RushData.

---

## Tabla de Contenido

1. [Contexto Técnico](#1-contexto-técnico)
2. [Onboarding de Usuario Nuevo](#2-onboarding-de-usuario-nuevo)
3. [Carga Manual Mensual](#3-carga-manual-mensual)

---

## 1. Contexto Técnico

### 1.1 Identificadores del Retailer

| Campo | Valor |
|-------|-------|
| **retailer_id** | `4` |
| **codigo** | `merco` |
| **nombre** | `Merco` |
| **color_hex** | `#FF6B00` (naranja) |

### 1.2 Características de los Datos MERCO

| Aspecto | Detalle |
|---------|---------|
| **Granularidad Ventas** | Mensual (un registro por producto/tienda/mes) |
| **Granularidad Inventario** | Mensual (snapshot del día 1-12 del mes) |
| **Formato Fechas** | `YYYY-MM-DD` (último día del mes para ventas) |
| **Identificador Tienda** | Código numérico: `502`, `503`, `510`, etc. |
| **Identificador Producto** | UPC (código de barras, SIEMPRE como TEXTO) |
| **Moneda** | Pesos Mexicanos (MXN) |
| **Tiene Inventario** | ✅ SÍ |

### 1.3 Modelo de Datos (Star Schema)

```
                         ┌─────────────────┐
                         │    tenants      │
                         │   (DELIKOS)     │
                         │ ae32c9d2-...    │
                         └────────┬────────┘
                                  │ tenant_id
          ┌───────────────────────┼───────────────────────┐
          │                       │                       │
          ▼                       ▼                       ▼
┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐
│  dim_productos   │   │   dim_tiendas    │   │  dim_retailers   │
│  (59 productos)  │   │  (43 tiendas)    │   │  (retailer_id=4) │
└────────┬─────────┘   └────────┬─────────┘   └────────┬─────────┘
         │                      │                      │
         │ producto_id          │ tienda_id            │ retailer_id = 4
         │                      │                      │
         └──────────────────────┼──────────────────────┘
                                │
                ┌───────────────┴───────────────┐
                │                               │
                ▼                               ▼
     ┌──────────────────┐            ┌──────────────────┐
     │   fact_ventas    │            │  fact_inventario │
     │ (8,683 registros)│            │ (1,300 registros)│
     │   Mensual        │            │  Snapshot Mensual│
     └──────────────────┘            └──────────────────┘
```

### 1.4 Tablas Staging

MERCO utiliza tablas staging para recibir los datos crudos antes de transformarlos:

#### `merco_staging_ventas`
```sql
CREATE TABLE merco_staging_ventas (
  id              SERIAL PRIMARY KEY,
  tenant_id       UUID,
  fecha           DATE NOT NULL,         -- Último día del mes
  tienda_codigo   VARCHAR NOT NULL,      -- '502', '503', etc.
  upc             VARCHAR NOT NULL,      -- Código de barras (TEXTO)
  unidades        INTEGER NOT NULL,      -- Cantidad vendida en el mes
  venta_pesos     NUMERIC,               -- Monto total en MXN
  costo_unitario  NUMERIC,               -- Costo unitario (opcional)
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

#### `merco_staging_inventario`
```sql
CREATE TABLE merco_staging_inventario (
  id                  SERIAL PRIMARY KEY,
  tenant_id           UUID,
  fecha               DATE NOT NULL,         -- Día del snapshot (1-12 del mes)
  tienda_codigo       VARCHAR NOT NULL,      -- '502', '503', etc.
  upc                 VARCHAR NOT NULL,      -- Código de barras (TEXTO)
  inventario_unidades INTEGER NOT NULL,      -- Unidades en inventario
  inventario_costo    NUMERIC,               -- Costo del inventario (opcional)
  created_at          TIMESTAMPTZ DEFAULT NOW()
);
```

#### `merco_staging_tiendas`
```sql
CREATE TABLE merco_staging_tiendas (
  id            SERIAL PRIMARY KEY,
  codigo_tienda VARCHAR NOT NULL,      -- '502', '503', etc.
  nombre        VARCHAR NOT NULL,      -- '502-MERCO HIDALGO'
  ciudad        VARCHAR,               -- Ciudad (opcional)
  estado        VARCHAR,               -- Estado (opcional)
  region        VARCHAR,               -- Región (opcional)
  formato       VARCHAR,               -- Formato de tienda (opcional)
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
```

### 1.5 Estadísticas Actuales (Diciembre 2025)

| Métrica | Valor |
|---------|-------|
| **Total Registros Ventas** | 8,683 |
| **Total Registros Inventario** | 1,300 |
| **Productos Únicos** | 59 |
| **Tiendas Únicas** | 43 |
| **Rango de Fechas** | 2025-01-01 → 2025-12-12 |
| **Venta Total** | $21,507,413.67 MXN |
| **Unidades Totales** | 655,098 |

---

## 2. Onboarding de Usuario Nuevo

### 2.1 Información Requerida del Cliente

Antes de comenzar la carga de datos, solicitar al cliente:

#### A) Datos de la Empresa
| Campo | Ejemplo | Notas |
|-------|---------|-------|
| Nombre de la empresa | DELIKOS | Nombre comercial |
| Correo de contacto | admin@delikos.com | Para crear usuario |
| Plan contratado | Pro / Basic | Determina funcionalidades |

#### B) Catálogo de Productos
| Campo | Ejemplo | Obligatorio |
|-------|---------|-------------|
| UPC | 7500940000052 | ✅ Sí (TEXTO, no número) |
| Nombre del producto | DELIKOS TOSTADA ROJA 70 PZ | ✅ Sí |
| Categoría | BOTANAS | ❌ Opcional |
| Subcategoría | TOSTADAS | ❌ Opcional |
| Marca | DELIKOS | ❌ Opcional |

#### C) Catálogo de Tiendas (si no viene en los datos)
| Campo | Ejemplo | Obligatorio |
|-------|---------|-------------|
| Código Tienda | 502 | ✅ Sí |
| Nombre | MERCO HIDALGO | ✅ Sí |
| Ciudad | Monterrey | ❌ Opcional |
| Estado | Nuevo León | ❌ Opcional |
| Región | Norte | ❌ Opcional |

#### D) Archivos de Datos Mensuales

**Archivo de Ventas:**
| Columna | Tipo | Ejemplo |
|---------|------|---------|
| Fecha | DATE | 2025-01-31 (último día del mes) |
| Código Tienda | VARCHAR | 502 |
| UPC | VARCHAR | 7500940000052 |
| Unidades | INTEGER | 280 |
| Venta (MXN) | NUMERIC | 11197.20 |

**Archivo de Inventario:**
| Columna | Tipo | Ejemplo |
|---------|------|---------|
| Fecha | DATE | 2025-01-12 (día del snapshot) |
| Código Tienda | VARCHAR | 502 |
| UPC | VARCHAR | 7500940000052 |
| Inventario (unidades) | INTEGER | 150 |

### 2.2 Pasos del Onboarding

```
1. Crear tenant en tabla `tenants`
2. Crear usuario en Supabase Auth y vincular a tenant
3. Cargar catálogo de productos en `dim_productos`
4. Cargar catálogo de tiendas en `dim_tiendas` (si aplica)
5. Verificar acceso a retailer MERCO (retailer_id = 4)
6. Cargar datos históricos de ventas
7. Cargar datos históricos de inventario
8. Verificar dashboards y métricas
```

### 2.3 SQL para Crear Nuevo Tenant

```sql
-- 1. Insertar nuevo tenant
INSERT INTO tenants (id, nombre_empresa, contacto_email, plan, estado)
VALUES (
  gen_random_uuid(),  -- O UUID específico
  'NOMBRE_EMPRESA',
  'email@empresa.com',
  'pro',  -- o 'basic'
  'activo'
);

-- 2. Obtener el tenant_id creado
SELECT id FROM tenants WHERE nombre_empresa = 'NOMBRE_EMPRESA';
-- Resultado ejemplo: ae32c9d2-2cc0-4eef-a715-7ea7626aefa4
```

### 2.4 SQL para Cargar Catálogo de Productos

```sql
-- Insertar productos del cliente para MERCO
INSERT INTO dim_productos (tenant_id, upc, nombre, categoria, subcategoria, marca, activo)
VALUES
  ('ae32c9d2-2cc0-4eef-a715-7ea7626aefa4', '7500940000052', 'DELIKOS TOSTADA ROJA 70 PZ', 'BOTANAS', 'TOSTADAS', 'DELIKOS', true),
  ('ae32c9d2-2cc0-4eef-a715-7ea7626aefa4', '7500940000014', 'DURITO CHILINDRINAS MI MARCA CON 5 PIEZAS', 'BOTANAS', 'DURITOS', 'MI MARCA', true),
  -- ... más productos
;
```

### 2.5 SQL para Cargar Catálogo de Tiendas

```sql
-- Insertar tiendas MERCO para el tenant
INSERT INTO dim_tiendas (tenant_id, retailer_id, codigo_tienda, nombre, ciudad, estado, region, activo)
VALUES
  ('ae32c9d2-2cc0-4eef-a715-7ea7626aefa4', 4, '502', 'MERCO HIDALGO', NULL, NULL, NULL, true),
  ('ae32c9d2-2cc0-4eef-a715-7ea7626aefa4', 4, '503', 'MERCO ROSITA', NULL, NULL, NULL, true),
  ('ae32c9d2-2cc0-4eef-a715-7ea7626aefa4', 4, '510', 'MERCO PIEDRAS NEGRAS', NULL, NULL, NULL, true),
  -- ... más tiendas
;
```

---

## 3. Carga Manual Mensual

### 3.1 Flujo de Carga de Datos

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        FLUJO DE CARGA MERCO                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Excel/CSV del Cliente                                                  │
│         │                                                               │
│         ▼                                                               │
│  ┌─────────────────────┐    ┌─────────────────────────┐                 │
│  │ merco_staging_ventas │    │ merco_staging_inventario│                │
│  │ (datos crudos)       │    │ (datos crudos)          │                │
│  └──────────┬──────────┘    └───────────┬─────────────┘                 │
│             │                           │                               │
│             ▼                           ▼                               │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    SCRIPT DE TRANSFORMACIÓN                      │   │
│  │  • Mapeo a dim_productos (por UPC)                               │   │
│  │  • Mapeo a dim_tiendas (por codigo_tienda)                       │   │
│  │  • Cálculo de precio_unitario                                    │   │
│  │  • Validación de datos                                           │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│             │                           │                               │
│             ▼                           ▼                               │
│  ┌─────────────────────┐    ┌─────────────────────────┐                 │
│  │    fact_ventas      │    │    fact_inventario      │                 │
│  │  (datos finales)    │    │    (datos finales)      │                 │
│  └─────────────────────┘    └─────────────────────────┘                 │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Paso 1: Preparar Datos en Excel

#### Formato de Archivo de Ventas

| fecha | tienda_codigo | upc | unidades | venta_pesos |
|-------|---------------|-----|----------|-------------|
| 2025-01-31 | 502 | 7500940000052 | 280 | 11197.20 |
| 2025-01-31 | 503 | 7500940000052 | 391 | 15636.09 |
| 2025-01-31 | 510 | 7500940000052 | 358 | 14316.42 |

**Reglas importantes:**
- ⚠️ **UPC SIEMPRE como TEXTO** (formatear columna como texto antes de pegar)
- La fecha debe ser el último día del mes (2025-01-31, 2025-02-28, etc.)
- Un registro por combinación tienda/producto/mes

#### Formato de Archivo de Inventario

| fecha | tienda_codigo | upc | inventario_unidades |
|-------|---------------|-----|---------------------|
| 2025-01-12 | 502 | 7500940000052 | 150 |
| 2025-01-12 | 503 | 7500940000052 | 200 |
| 2025-01-12 | 510 | 7500940000052 | 175 |

**Reglas importantes:**
- ⚠️ **UPC SIEMPRE como TEXTO**
- La fecha es el día del snapshot (puede ser cualquier día del mes, típicamente 1-12)
- Un registro por combinación tienda/producto/fecha

### 3.3 Paso 2: Limpiar Tablas Staging

```sql
-- Limpiar staging de ventas para el tenant
DELETE FROM merco_staging_ventas
WHERE tenant_id = 'ae32c9d2-2cc0-4eef-a715-7ea7626aefa4';

-- Limpiar staging de inventario para el tenant
DELETE FROM merco_staging_inventario
WHERE tenant_id = 'ae32c9d2-2cc0-4eef-a715-7ea7626aefa4';
```

### 3.4 Paso 3: Cargar Datos en Staging

#### Opción A: INSERT desde SQL Editor

```sql
-- Insertar ventas en staging
INSERT INTO merco_staging_ventas (tenant_id, fecha, tienda_codigo, upc, unidades, venta_pesos)
VALUES
  ('ae32c9d2-2cc0-4eef-a715-7ea7626aefa4', '2025-01-31', '502', '7500940000052', 280, 11197.20),
  ('ae32c9d2-2cc0-4eef-a715-7ea7626aefa4', '2025-01-31', '503', '7500940000052', 391, 15636.09),
  -- ... más registros
;

-- Insertar inventario en staging
INSERT INTO merco_staging_inventario (tenant_id, fecha, tienda_codigo, upc, inventario_unidades)
VALUES
  ('ae32c9d2-2cc0-4eef-a715-7ea7626aefa4', '2025-01-12', '502', '7500940000052', 150),
  ('ae32c9d2-2cc0-4eef-a715-7ea7626aefa4', '2025-01-12', '503', '7500940000052', 200),
  -- ... más registros
;
```

#### Opción B: Importar CSV desde Supabase Dashboard

1. Ir a **Table Editor** → `merco_staging_ventas`
2. Click en **Import data from CSV**
3. Seleccionar archivo CSV
4. Mapear columnas
5. Importar

### 3.5 Paso 4: Verificar Datos en Staging

```sql
-- Verificar ventas cargadas
SELECT
  fecha,
  COUNT(*) as registros,
  SUM(unidades) as total_unidades,
  SUM(venta_pesos) as total_venta
FROM merco_staging_ventas
WHERE tenant_id = 'ae32c9d2-2cc0-4eef-a715-7ea7626aefa4'
GROUP BY fecha
ORDER BY fecha DESC;

-- Verificar inventario cargado
SELECT
  fecha,
  COUNT(*) as registros,
  SUM(inventario_unidades) as total_inventario
FROM merco_staging_inventario
WHERE tenant_id = 'ae32c9d2-2cc0-4eef-a715-7ea7626aefa4'
GROUP BY fecha
ORDER BY fecha DESC;

-- Verificar tiendas únicas en staging
SELECT DISTINCT tienda_codigo
FROM merco_staging_ventas
WHERE tenant_id = 'ae32c9d2-2cc0-4eef-a715-7ea7626aefa4'
ORDER BY tienda_codigo;

-- Verificar UPCs únicos en staging
SELECT DISTINCT upc
FROM merco_staging_ventas
WHERE tenant_id = 'ae32c9d2-2cc0-4eef-a715-7ea7626aefa4'
ORDER BY upc;
```

### 3.6 Paso 5: Crear Nuevas Tiendas (si aplica)

```sql
-- Encontrar tiendas en staging que no existen en dim_tiendas
SELECT DISTINCT s.tienda_codigo
FROM merco_staging_ventas s
WHERE s.tenant_id = 'ae32c9d2-2cc0-4eef-a715-7ea7626aefa4'
  AND NOT EXISTS (
    SELECT 1 FROM dim_tiendas t
    WHERE t.codigo_tienda = s.tienda_codigo
      AND t.tenant_id = s.tenant_id
      AND t.retailer_id = 4
  );

-- Insertar tiendas faltantes
INSERT INTO dim_tiendas (tenant_id, retailer_id, codigo_tienda, nombre, activo)
SELECT DISTINCT
  s.tenant_id,
  4 as retailer_id,
  s.tienda_codigo,
  s.tienda_codigo || '-MERCO NUEVA' as nombre,  -- Ajustar nombre manualmente después
  true
FROM merco_staging_ventas s
WHERE s.tenant_id = 'ae32c9d2-2cc0-4eef-a715-7ea7626aefa4'
  AND NOT EXISTS (
    SELECT 1 FROM dim_tiendas t
    WHERE t.codigo_tienda = s.tienda_codigo
      AND t.tenant_id = s.tenant_id
      AND t.retailer_id = 4
  );
```

### 3.7 Paso 6: Crear Nuevos Productos (si aplica)

```sql
-- Encontrar UPCs en staging que no existen en dim_productos
SELECT DISTINCT s.upc
FROM merco_staging_ventas s
WHERE s.tenant_id = 'ae32c9d2-2cc0-4eef-a715-7ea7626aefa4'
  AND NOT EXISTS (
    SELECT 1 FROM dim_productos p
    WHERE p.upc = s.upc
      AND p.tenant_id = s.tenant_id
  );

-- Insertar productos faltantes (requiere datos adicionales del cliente)
INSERT INTO dim_productos (tenant_id, upc, nombre, activo)
SELECT DISTINCT
  s.tenant_id,
  s.upc,
  s.upc || ', PRODUCTO NUEVO' as nombre,  -- Ajustar con nombre real
  true
FROM merco_staging_ventas s
WHERE s.tenant_id = 'ae32c9d2-2cc0-4eef-a715-7ea7626aefa4'
  AND NOT EXISTS (
    SELECT 1 FROM dim_productos p
    WHERE p.upc = s.upc
      AND p.tenant_id = s.tenant_id
  );
```

### 3.8 Paso 7: Transformar Ventas a fact_ventas

```sql
-- Insertar/actualizar ventas en fact_ventas
INSERT INTO fact_ventas (
  tenant_id,
  retailer_id,
  tienda_id,
  producto_id,
  fecha,
  unidades,
  venta_pesos,
  precio_unitario
)
SELECT
  s.tenant_id,
  4 as retailer_id,
  t.id as tienda_id,
  p.id as producto_id,
  s.fecha,
  s.unidades,
  s.venta_pesos,
  CASE
    WHEN s.unidades > 0 THEN ROUND(s.venta_pesos / s.unidades, 2)
    ELSE NULL
  END as precio_unitario
FROM merco_staging_ventas s
JOIN dim_tiendas t ON t.codigo_tienda = s.tienda_codigo
                   AND t.tenant_id = s.tenant_id
                   AND t.retailer_id = 4
JOIN dim_productos p ON p.upc = s.upc
                     AND p.tenant_id = s.tenant_id
WHERE s.tenant_id = 'ae32c9d2-2cc0-4eef-a715-7ea7626aefa4'
ON CONFLICT (tenant_id, retailer_id, tienda_id, producto_id, fecha)
DO UPDATE SET
  unidades = EXCLUDED.unidades,
  venta_pesos = EXCLUDED.venta_pesos,
  precio_unitario = EXCLUDED.precio_unitario;
```

### 3.9 Paso 8: Transformar Inventario a fact_inventario

```sql
-- Insertar/actualizar inventario en fact_inventario
INSERT INTO fact_inventario (
  tenant_id,
  retailer_id,
  tienda_id,
  producto_id,
  fecha,
  inventario_unidades
)
SELECT
  s.tenant_id,
  4 as retailer_id,
  t.id as tienda_id,
  p.id as producto_id,
  s.fecha,
  s.inventario_unidades
FROM merco_staging_inventario s
JOIN dim_tiendas t ON t.codigo_tienda = s.tienda_codigo
                   AND t.tenant_id = s.tenant_id
                   AND t.retailer_id = 4
JOIN dim_productos p ON p.upc = s.upc
                     AND p.tenant_id = s.tenant_id
WHERE s.tenant_id = 'ae32c9d2-2cc0-4eef-a715-7ea7626aefa4'
ON CONFLICT (tenant_id, retailer_id, tienda_id, producto_id, fecha)
DO UPDATE SET
  inventario_unidades = EXCLUDED.inventario_unidades;
```

### 3.10 Paso 9: Verificar Carga Final

```sql
-- Verificar ventas cargadas en fact_ventas
SELECT
  DATE_TRUNC('month', fecha) as mes,
  COUNT(*) as registros,
  SUM(unidades) as total_unidades,
  SUM(venta_pesos) as total_venta
FROM fact_ventas
WHERE tenant_id = 'ae32c9d2-2cc0-4eef-a715-7ea7626aefa4'
  AND retailer_id = 4
GROUP BY DATE_TRUNC('month', fecha)
ORDER BY mes DESC;

-- Verificar inventario cargado en fact_inventario
SELECT
  fecha,
  COUNT(*) as registros,
  SUM(inventario_unidades) as total_inventario
FROM fact_inventario
WHERE tenant_id = 'ae32c9d2-2cc0-4eef-a715-7ea7626aefa4'
  AND retailer_id = 4
GROUP BY fecha
ORDER BY fecha DESC;

-- Verificar productos con venta
SELECT
  p.nombre,
  SUM(f.unidades) as unidades,
  SUM(f.venta_pesos) as venta_total
FROM fact_ventas f
JOIN dim_productos p ON p.id = f.producto_id
WHERE f.tenant_id = 'ae32c9d2-2cc0-4eef-a715-7ea7626aefa4'
  AND f.retailer_id = 4
GROUP BY p.nombre
ORDER BY venta_total DESC;

-- Verificar tiendas con venta
SELECT
  t.nombre,
  COUNT(*) as registros,
  SUM(f.venta_pesos) as venta_total
FROM fact_ventas f
JOIN dim_tiendas t ON t.id = f.tienda_id
WHERE f.tenant_id = 'ae32c9d2-2cc0-4eef-a715-7ea7626aefa4'
  AND f.retailer_id = 4
GROUP BY t.nombre
ORDER BY venta_total DESC
LIMIT 10;
```

### 3.11 Paso 10: Limpiar Staging (Opcional)

```sql
-- Una vez verificada la carga, limpiar staging
DELETE FROM merco_staging_ventas
WHERE tenant_id = 'ae32c9d2-2cc0-4eef-a715-7ea7626aefa4';

DELETE FROM merco_staging_inventario
WHERE tenant_id = 'ae32c9d2-2cc0-4eef-a715-7ea7626aefa4';
```

---

## 4. Troubleshooting

### 4.1 Problemas Comunes

| Problema | Causa | Solución |
|----------|-------|----------|
| UPC en notación científica (7.5E+12) | Excel convirtió a número | Formatear columna como TEXTO antes de pegar |
| "No matching product" | UPC no existe en dim_productos | Insertar producto faltante primero |
| "No matching store" | Código tienda no existe en dim_tiendas | Insertar tienda faltante primero |
| Datos duplicados | ON CONFLICT no funcionó | Verificar UNIQUE constraint en fact_ventas |
| Inventario vacío | Fecha incorrecta o UPC no coincide | Verificar formato de fecha y UPCs |
| Venta $0 con unidades | Campo venta_pesos vacío en origen | Revisar archivo fuente |

### 4.2 Queries de Diagnóstico

```sql
-- Verificar UPCs huérfanos (sin producto en catálogo)
SELECT DISTINCT s.upc
FROM merco_staging_ventas s
LEFT JOIN dim_productos p ON p.upc = s.upc AND p.tenant_id = s.tenant_id
WHERE s.tenant_id = 'ae32c9d2-2cc0-4eef-a715-7ea7626aefa4'
  AND p.id IS NULL;

-- Verificar tiendas huérfanas (sin tienda en catálogo)
SELECT DISTINCT s.tienda_codigo
FROM merco_staging_ventas s
LEFT JOIN dim_tiendas t ON t.codigo_tienda = s.tienda_codigo
                        AND t.tenant_id = s.tenant_id
                        AND t.retailer_id = 4
WHERE s.tenant_id = 'ae32c9d2-2cc0-4eef-a715-7ea7626aefa4'
  AND t.id IS NULL;

-- Verificar registros con datos inconsistentes
SELECT *
FROM merco_staging_ventas
WHERE tenant_id = 'ae32c9d2-2cc0-4eef-a715-7ea7626aefa4'
  AND (unidades < 0 OR venta_pesos < 0 OR upc IS NULL OR tienda_codigo IS NULL);

-- Estadísticas generales del tenant
SELECT
  (SELECT COUNT(*) FROM fact_ventas WHERE tenant_id = 'ae32c9d2-2cc0-4eef-a715-7ea7626aefa4' AND retailer_id = 4) as total_ventas,
  (SELECT COUNT(*) FROM fact_inventario WHERE tenant_id = 'ae32c9d2-2cc0-4eef-a715-7ea7626aefa4' AND retailer_id = 4) as total_inventario,
  (SELECT COUNT(*) FROM dim_productos WHERE tenant_id = 'ae32c9d2-2cc0-4eef-a715-7ea7626aefa4') as total_productos,
  (SELECT COUNT(*) FROM dim_tiendas WHERE tenant_id = 'ae32c9d2-2cc0-4eef-a715-7ea7626aefa4' AND retailer_id = 4) as total_tiendas;
```

### 4.3 Rollback de Carga

```sql
-- Si algo salió mal, eliminar datos del mes específico
DELETE FROM fact_ventas
WHERE tenant_id = 'ae32c9d2-2cc0-4eef-a715-7ea7626aefa4'
  AND retailer_id = 4
  AND fecha >= '2025-01-01'
  AND fecha <= '2025-01-31';

DELETE FROM fact_inventario
WHERE tenant_id = 'ae32c9d2-2cc0-4eef-a715-7ea7626aefa4'
  AND retailer_id = 4
  AND fecha >= '2025-01-01'
  AND fecha <= '2025-01-31';
```

---

## 5. Checklist de Carga Mensual

```
□ 1. Recibir archivos del cliente (ventas + inventario)
□ 2. Verificar formato de UPCs (TEXTO, no número)
□ 3. Limpiar tablas staging
□ 4. Cargar datos en staging (ventas e inventario)
□ 5. Verificar conteos en staging
□ 6. Crear tiendas faltantes (si aplica)
□ 7. Crear productos faltantes (si aplica)
□ 8. Ejecutar transformación a fact_ventas
□ 9. Ejecutar transformación a fact_inventario
□ 10. Verificar conteos finales
□ 11. Probar dashboards en la aplicación
□ 12. Limpiar staging (opcional)
□ 13. Notificar al cliente que los datos están disponibles
```

---

## 6. Contacto y Soporte

Para dudas sobre este proceso, contactar al equipo de RushData.

---

*Última actualización: Diciembre 2025*
