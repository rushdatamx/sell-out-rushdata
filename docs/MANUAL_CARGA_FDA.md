# Manual de Carga de Datos Farmacias del Ahorro (FDA)

Este manual está dividido en 3 secciones:
1. **Contexto Técnico** - Para que Claude entienda la arquitectura
2. **Onboarding de Usuario Nuevo** - Qué información pedir al cliente
3. **Carga Manual Mensual** - Paso a paso para cargar ventas

---

# SECCIÓN 1: CONTEXTO TÉCNICO (PARA CLAUDE)

> **IMPORTANTE:** Esta sección es para que Claude Code entienda la arquitectura de datos de Farmacias del Ahorro. Léela cada vez que te pidan modificaciones relacionadas con FDA.

## 1.1 Identificadores Clave

| Concepto | Valor | Descripción |
|----------|-------|-------------|
| **Retailer ID** | `5` | ID de FDA en `dim_retailers` |
| **Código** | `fahorro` | Usado en URLs: `/fahorro/dashboard` |
| **Calendario** | Gregoriano | Meses calendario estándar |
| **Granularidad** | **MENSUAL** | UN registro por mes (no diario) |
| **Color** | `#000000` | Negro |

## 1.2 Diferencias Clave vs HEB

| Aspecto | HEB | FDA |
|---------|-----|-----|
| **Granularidad** | Diaria | **Mensual** |
| **Inventario** | ✅ Disponible | ❌ NO HAY |
| **Precios dinámicos** | ✅ Disponible | ❌ Solo costo fijo |
| **Frecuencia carga** | Diaria | **Mensual** |
| **Retailer ID** | 1 | **5** |
| **Tiendas** | 62 | **985** |
| **Productos** | 11 | **8** |

## 1.3 Modelo de Datos (Star Schema)

```
                    ┌─────────────────┐
                    │    tenants      │
                    │ (empresas)      │
                    └────────┬────────┘
                             │ tenant_id (UUID)
         ┌───────────────────┼───────────────────┐
         │                   │                   │
         ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│  dim_productos  │ │   dim_tiendas   │ │  dim_retailers  │
│  (por tenant)   │ │  (por tenant)   │ │   (global)      │
└────────┬────────┘ └────────┬────────┘ └────────┬────────┘
         │                   │                   │
         │ producto_id       │ tienda_id         │ retailer_id = 5
         │                   │                   │
         └───────────────────┼───────────────────┘
                             │
                             ▼
              ┌──────────────────────────┐
              │       fact_ventas        │
              │   (SOLO VENTAS - FDA)    │
              ├──────────────────────────┤
              │ - tenant_id (UUID)       │
              │ - retailer_id (5=FDA)    │
              │ - tienda_id              │
              │ - producto_id            │
              │ - fecha (último día mes) │
              │ - unidades               │
              │ - venta_pesos            │
              │ - precio_unitario (costo)│
              └──────────────────────────┘
                             │
                             ▼
              ┌──────────────────────────┐
              │     fact_inventario      │
              │   ❌ NO APLICA PARA FDA  │
              └──────────────────────────┘
```

## 1.4 Estructura de Tablas

### `dim_retailers` (Global)
```sql
id              INTEGER PRIMARY KEY  -- 5 = FDA
codigo          VARCHAR NOT NULL     -- 'fahorro'
nombre          VARCHAR NOT NULL     -- 'Farmacias del Ahorro'
color_hex       VARCHAR              -- '#000000'
activo          BOOLEAN              -- true
```

### `dim_tiendas` (Por Tenant) - FDA usa "Sucursal" como código
```sql
id              INTEGER PRIMARY KEY
tenant_id       UUID NOT NULL        -- FK a tenants
retailer_id     INTEGER NOT NULL     -- 5 = FDA
codigo_tienda   VARCHAR NOT NULL     -- 'ACGP GRAN PLAZA' (nombre sucursal)
nombre          VARCHAR NOT NULL     -- 'ACGP GRAN PLAZA' (mismo que código)
ciudad          VARCHAR              -- 'ACAPULCO' (Plaza Operativa)
estado          VARCHAR              -- NULL (no disponible)
region          VARCHAR              -- NULL (no disponible)
cluster         VARCHAR              -- NULL (no disponible)
formato         VARCHAR              -- NULL (no disponible)
activo          BOOLEAN
```

**NOTA:** En FDA, `codigo_tienda` y `nombre` son iguales (el nombre de la sucursal). La columna `ciudad` almacena la **Plaza Operativa**.

### `dim_productos` (Por Tenant) - 8 productos FDA
```sql
id              INTEGER PRIMARY KEY
tenant_id       UUID NOT NULL
upc             VARCHAR NOT NULL     -- '7500462860042' (13 dígitos)
nombre          VARCHAR NOT NULL     -- '4 BUDDIES RODAJITAS DE PAPA SPICY LIMON'
categoria       VARCHAR              -- '760-126 BOTANAS'
subcategoria    VARCHAR              -- '760-126-520 FRITURAS'
marca           VARCHAR              -- '4BUDDIES'
activo          BOOLEAN
```

### `fact_ventas` (Por Tenant + Retailer)
```sql
id              BIGINT PRIMARY KEY
tenant_id       UUID NOT NULL
retailer_id     INTEGER NOT NULL     -- 5 = FDA
tienda_id       INTEGER NOT NULL     -- FK a dim_tiendas
producto_id     INTEGER NOT NULL     -- FK a dim_productos
fecha           DATE NOT NULL        -- Último día del mes: '2025-11-11'
unidades        INTEGER NOT NULL     -- Cantidad vendida en el MES
venta_pesos     NUMERIC NOT NULL     -- unidades × costo
precio_unitario NUMERIC              -- "Costo" del reporte FDA

-- UNIQUE CONSTRAINT:
UNIQUE (tenant_id, retailer_id, tienda_id, producto_id, fecha)
```

### `fact_inventario` - ❌ NO EXISTE PARA FDA
FDA **NO proporciona datos de inventario**. Los módulos de Inventario y Reabastecimiento están deshabilitados.

## 1.5 Tablas Staging FDA

### `fda_staging_ventas`
```sql
id              INTEGER PRIMARY KEY
fecha           DATE                 -- Fecha del período (primer día del mes)
sucursal        TEXT                 -- 'ACGP GRAN PLAZA'
producto        TEXT                 -- UPC: '7500462860042'
unidades        INTEGER              -- Unidades vendidas en el mes
costo           NUMERIC              -- Precio unitario (costo al público)
created_at      TIMESTAMP
```

### `fda_staging_sucursales`
```sql
id              INTEGER PRIMARY KEY
sucursal        TEXT                 -- 'ACGP GRAN PLAZA'
plaza_operativa TEXT                 -- 'ACAPULCO'
created_at      TIMESTAMP
```

## 1.6 Flujo de Datos FDA

```
Reporte FDA (Excel) → CSV → Staging Tables → SQL Transform → fact_ventas
                               │
                               ▼
                    fda_staging_ventas
                    fda_staging_sucursales (solo para nuevas sucursales)
```

### Proceso de Transformación:
1. **Staging → Fact**: JOIN con `dim_tiendas` (por `sucursal`) y `dim_productos` (por `producto`/UPC)
2. **Cálculo de venta_pesos**: `unidades × costo`
3. **UPSERT**: Si ya existe registro para (tenant, retailer, tienda, producto, fecha), se actualiza
4. **NO hay limpieza de inventario** (no aplica)

## 1.7 RPCs Relevantes para FDA

Todas las funciones reciben `p_retailer_id` para filtrar por cadena:

| Función | Propósito | Aplica FDA |
|---------|-----------|------------|
| `get_dashboard_metrics(dias, p_retailer_id)` | KPIs principales | ✅ |
| `get_productos_tabla_v3(..., p_retailer_id)` | Tabla de productos | ✅ |
| `get_tiendas_tabla(..., p_retailer_id)` | Tabla de tiendas | ✅ |
| `get_analisis_ventas_mensuales_yoy(...)` | Análisis YoY | ✅ |
| `get_inventario_*` | Inventario | ❌ N/A |
| `get_reabastecimiento_*` | Reabastecimiento | ❌ N/A |
| `get_precios_*` | Precios | ❌ N/A |

## 1.8 Configuración en Frontend

Archivo: `lib/retailers/config.ts`

```typescript
fahorro: {
  codigo: 'fahorro',
  nombre: 'Farmacias del Ahorro',
  colorPrimario: '#000000',        // Negro
  colorSecundario: '#FFFFFF',
  iconName: 'Pill',                // Icono de farmacia
  calendario: {
    tipo: 'gregoriano',            // Calendario estándar
    inicioSemana: 1,               // Lunes
  },
  periodos: {
    default: 'ultimo_mes',
    granularidadMinima: 'mensual', // ⚠️ SOLO MENSUAL
  },
  modulos: {
    dashboard: true,
    productos: true,
    tiendas: true,
    inventario: false,             // ❌ SIN DATOS
    reabastecimiento: false,       // ❌ SIN DATOS
    precios: false,                // ❌ SOLO COSTO FIJO
    analisis: true,
  },
  dashboard: {
    kpisVisibles: ['ventas', 'unidades', 'tiendas_activas', 'skus_activos'],
    chartsVisibles: ['ventas_mensuales', 'top_productos', 'top_tiendas', 'mix_plazas'],
  },
}
```

## 1.9 Tenants Actuales con FDA

| Tenant | tenant_id | Productos | Tiendas | Plazas |
|--------|-----------|-----------|---------|--------|
| 4BUDDIES | `c529e450-3708-48c9-90ca-cfb2a01a57ed` | 8 | 972 | 111 |

## 1.10 Productos FDA (8 SKUs)

| UPC | Nombre |
|-----|--------|
| 7500462860042 | 4 BUDDIES RODAJITAS DE PAPA SPICY LIMON |
| 7503028921317 | 4 BUDDIES CHICHARRON DE CERDO NATURAL |
| 7500462417819 | 4 BUDDIES PALOMITAS DE MAIZ CHEDDAR JALAPENO |
| 7500462417826 | 4 BUDDIES PALOMITAS DE MAIZ STREET ELOTE |
| 7500462417833 | 4 BUDDIES PALOMITAS DE MAIZ CLASSIC WHITE |
| 7500462860004 | 4 BUDDIES PALOMITAS STREET ELOTE |
| 7500462860011 | 4 BUDDIES PALOMITAS SPICY CHIA |
| 7500462860066 | 4 BUDDIES PALOMITAS CHILE PIQUIN |

## 1.11 Estadísticas Actuales FDA

| Métrica | Valor |
|---------|-------|
| Total registros ventas | 27,724 |
| Productos únicos | 8 |
| Tiendas únicas | 972 |
| Plazas operativas | 111 |
| Fecha más antigua | 2024-01-01 |
| Fecha más reciente | 2025-11-11 |
| Venta total acumulada | $1,264,230.65 |
| Unidades totales | 79,958 |

## 1.12 Consideraciones Importantes

1. **Granularidad MENSUAL**: Los datos son mensuales, no diarios. La fecha representa el último día con datos del mes.
2. **NO HAY INVENTARIO**: FDA no proporciona datos de inventario, por lo que los módulos de Inventario y Reabastecimiento están deshabilitados.
3. **Costo = Precio fijo**: El "costo" en FDA es el precio al público, no cambia dinámicamente.
4. **Plaza Operativa como ciudad**: En `dim_tiendas`, el campo `ciudad` almacena la Plaza Operativa de FDA.
5. **Sucursal como código**: El nombre de la sucursal se usa como `codigo_tienda` y `nombre`.
6. **Multi-tenant**: Cada empresa (tenant) tiene su propio catálogo de productos.
7. **RLS (Row Level Security)**: Todas las consultas se filtran automáticamente por `tenant_id`.
8. **Retailer Isolation**: Se filtra por `retailer_id = 5` para FDA.

---

# SECCIÓN 2: ONBOARDING DE USUARIO NUEVO

> **Para el equipo RushData:** Usa esta sección cuando llegue un nuevo cliente que quiere ver sus datos de Farmacias del Ahorro.

## 2.1 Información a Solicitar al Cliente

### A) Datos de la Empresa (Obligatorio)

| Campo | Ejemplo | Notas |
|-------|---------|-------|
| Nombre de la empresa | "Snacks Premium S.A. de C.V." | Nombre comercial |
| Contacto principal | "María García" | Persona que usará el portal |
| Email del contacto | "maria@snackspremium.com" | Para crear cuenta |
| Teléfono | "+52 55 1234 5678" | Para soporte |

### B) Catálogo de Productos (Obligatorio)

**Solicitar archivo Excel/CSV con:**

| Columna | Obligatorio | Ejemplo | Notas |
|---------|-------------|---------|-------|
| UPC | ✅ Sí | 7500462860042 | 12-13 dígitos, SIN notación científica |
| Nombre | ✅ Sí | RODAJITAS DE PAPA SPICY LIMON | Nombre del producto |
| Categoría | ✅ Sí | BOTANAS | Categoría principal |
| Subcategoría | No | FRITURAS | Opcional |
| Marca | ✅ Sí | 4BUDDIES | Marca del producto |

**Ejemplo de archivo esperado:**
```
UPC,Nombre,Categoria,Subcategoria,Marca
7500462860042,RODAJITAS DE PAPA SPICY LIMON,BOTANAS,FRITURAS,4BUDDIES
7500462417819,PALOMITAS CHEDDAR JALAPENO,BOTANAS,PALOMITAS,4BUDDIES
7500462417826,PALOMITAS STREET ELOTE,BOTANAS,PALOMITAS,4BUDDIES
```

### C) Reporte de Ventas FDA (Obligatorio)

**Solicitar archivo con formato FDA:**

| Columna | Descripción | Ejemplo |
|---------|-------------|---------|
| Fecha | Fecha del período | 2025-11-01 |
| Sucursal | Nombre de la sucursal | ACGP GRAN PLAZA |
| Producto | UPC del producto | 7500462860042 |
| Unidades | Unidades vendidas en el mes | 25 |
| Costo | Precio al público | 13.66 |

### D) Catálogo de Sucursales FDA (Primera vez)

**Solicitar archivo con:**

| Columna | Descripción | Ejemplo |
|---------|-------------|---------|
| Sucursal | Nombre/código de sucursal | ACGP GRAN PLAZA |
| Plaza Operativa | Región/ciudad | ACAPULCO |

**Nota:** Las sucursales de FDA son ~985 a nivel nacional. Si el cliente nuevo comparte sucursales con un cliente existente, pueden reutilizarse.

## 2.2 Checklist de Onboarding

```
□ 1. Recibir datos de la empresa
□ 2. Recibir catálogo de productos (Excel/CSV)
□ 3. Validar formato de UPCs (texto, no científica)
□ 4. Crear tenant en Supabase
□ 5. Crear usuario y asociar al tenant
□ 6. Asociar tenant con FDA (retailer_id = 5)
□ 7. Cargar catálogo de productos a dim_productos
□ 8. Verificar sucursales de FDA existen (o cargar nuevas)
□ 9. Cargar histórico de ventas (si aplica)
□ 10. Cliente hace login y verifica acceso
□ 11. Explicar que los datos son MENSUALES (no diarios)
```

## 2.3 Pasos en Supabase (Para el equipo técnico)

### Paso 1: Crear Tenant
```sql
INSERT INTO tenants (nombre, activo)
VALUES ('Nombre de la Empresa', true)
RETURNING id;
-- Guardar el UUID retornado
```

### Paso 2: Asociar Usuario al Tenant
```sql
-- El usuario primero debe registrarse en /login
-- Luego asociarlo:
UPDATE users
SET tenant_id = 'UUID_DEL_TENANT'
WHERE email = 'email@empresa.com';
```

### Paso 3: Asociar Tenant con FDA
```sql
INSERT INTO tenant_retailers (tenant_id, retailer_id, activo)
VALUES ('UUID_DEL_TENANT', 5, true)  -- 5 = FDA
ON CONFLICT (tenant_id, retailer_id) DO NOTHING;
```

### Paso 4: Cargar Productos
```sql
INSERT INTO dim_productos (tenant_id, upc, nombre, categoria, subcategoria, marca, activo)
VALUES
  ('UUID', '7500462860042', 'RODAJITAS DE PAPA SPICY LIMON', 'BOTANAS', 'FRITURAS', '4BUDDIES', true),
  ('UUID', '7500462417819', 'PALOMITAS CHEDDAR JALAPENO', 'BOTANAS', 'PALOMITAS', '4BUDDIES', true);
```

### Paso 5: Verificar/Cargar Sucursales
```sql
-- Verificar si ya existen sucursales para el tenant
SELECT COUNT(*) FROM dim_tiendas
WHERE retailer_id = 5 AND tenant_id = 'UUID_DEL_TENANT';

-- Si no hay, cargar desde staging o copiar de otro tenant
INSERT INTO dim_tiendas (tenant_id, retailer_id, codigo_tienda, nombre, ciudad, activo)
SELECT
  'UUID_DEL_TENANT',
  5,
  sucursal,
  sucursal,
  plaza_operativa,
  true
FROM fda_staging_sucursales;
```

### Paso 6: Verificar Onboarding Completo
```sql
SELECT
  'Tenant' as item,
  CASE WHEN EXISTS (SELECT 1 FROM tenants WHERE id = 'UUID') THEN '✅' ELSE '❌' END as status
UNION ALL
SELECT 'Usuario asociado',
  CASE WHEN EXISTS (SELECT 1 FROM users WHERE tenant_id = 'UUID') THEN '✅' ELSE '❌' END
UNION ALL
SELECT 'Asociado a FDA',
  CASE WHEN EXISTS (SELECT 1 FROM tenant_retailers WHERE tenant_id = 'UUID' AND retailer_id = 5) THEN '✅' ELSE '❌' END
UNION ALL
SELECT 'Productos cargados',
  (SELECT COUNT(*)::text FROM dim_productos WHERE tenant_id = 'UUID')
UNION ALL
SELECT 'Sucursales disponibles',
  (SELECT COUNT(*)::text FROM dim_tiendas WHERE tenant_id = 'UUID' AND retailer_id = 5);
```

---

# SECCIÓN 3: CARGA MANUAL MENSUAL

> **Para el equipo operativo:** Sigue estos pasos cada mes para cargar ventas de Farmacias del Ahorro.

## 3.1 Resumen del Proceso

```
┌────────────────────────────────────────────────────────────────┐
│  PROCESO MENSUAL (Ejecutar cuando llegue el reporte)           │
├────────────────────────────────────────────────────────────────┤
│  1. Recibir reporte de ventas del mes anterior                 │
│  2. Preparar CSV de ventas (formato correcto)                  │
│  3. (Opcional) Preparar CSV de sucursales nuevas               │
│  4. Subir a tablas staging en Supabase                         │
│  5. Ejecutar SQL de transformación                             │
│  6. Verificar carga en dashboards                              │
└────────────────────────────────────────────────────────────────┘
```

**NOTA:** A diferencia de HEB que es diario, FDA es **MENSUAL**. Solo se carga una vez al mes.

## 3.2 Paso 1: Recibir Reporte FDA

El cliente recibe de FDA un reporte mensual que típicamente incluye:
- **Fecha**: Primer día del mes del reporte
- **Sucursal**: Nombre de la tienda
- **Producto**: UPC del producto
- **Unidades**: Cantidad vendida en el mes
- **Costo**: Precio unitario al público

## 3.3 Paso 2: Preparar CSV de VENTAS

### Formato Requerido:
```csv
fecha,sucursal,producto,unidades,costo
```

### Reglas de Formato:

| Campo | Formato Correcto | Formato INCORRECTO |
|-------|------------------|-------------------|
| fecha | `2025-11-01` | 01/11/25, Nov-2025 |
| sucursal | `ACGP GRAN PLAZA` | - |
| producto | `7500462860042` | 7.5E+12 |
| unidades | `25` | 25.00, 25 unidades |
| costo | `13.66` | $13.66 |

### Pasos en Excel:

1. **Formatear fecha**: `YYYY-MM-DD` (primer día del mes)
2. **Formatear UPC como TEXTO**:
   - Seleccionar columna ANTES de pegar datos
   - Formato de celdas → Texto
   - Esto evita notación científica
3. **Limpiar columnas numéricas**: Quitar símbolos `$`, comas
4. **Guardar como CSV UTF-8**

### Ejemplo de CSV Correcto:
```csv
fecha,sucursal,producto,unidades,costo
2025-11-01,ACGP GRAN PLAZA,7500462417833,3,11.10
2025-11-01,ACGP GRAN PLAZA,7500462860004,3,23.32
2025-11-01,ACGP GRAN PLAZA,7500462860042,1,13.66
2025-11-01,ACIV IMSS VICENTE GUERRERO,7500462860042,4,13.66
2025-11-01,ACMO MOZIMBA,7500462860042,3,13.66
```

## 3.4 Paso 3: (Opcional) Preparar CSV de Sucursales Nuevas

Si hay sucursales nuevas que no existen en el sistema:

### Formato Requerido:
```csv
sucursal,plaza_operativa
```

### Ejemplo:
```csv
sucursal,plaza_operativa
NUEVA SUCURSAL REFORMA,MEXICO CENTRO
NUEVA SUCURSAL POLANCO,MEXICO NORTE
```

## 3.5 Paso 4: Subir CSVs a Supabase

### Subir VENTAS:
1. Ir a **Supabase Dashboard** → **Table Editor**
2. Seleccionar tabla `fda_staging_ventas`
3. Click en **"Insert"** → **"Import data from CSV"**
4. Seleccionar archivo CSV de ventas
5. Verificar mapeo de columnas
6. Click **"Import"**

### Subir SUCURSALES (si hay nuevas):
1. Ir a **Supabase Dashboard** → **Table Editor**
2. Seleccionar tabla `fda_staging_sucursales`
3. Click en **"Insert"** → **"Import data from CSV"**
4. Seleccionar archivo CSV de sucursales
5. Click **"Import"**

## 3.6 Paso 5: Ejecutar SQL de Transformación

Ir a **Supabase Dashboard** → **SQL Editor** y ejecutar:

```sql
-- ═══════════════════════════════════════════════════════════════
-- SCRIPT DE CARGA MENSUAL FDA (Farmacias del Ahorro)
-- Ejecutar después de subir CSVs a staging
-- ═══════════════════════════════════════════════════════════════

DO $$
DECLARE
  -- ⚠️ MODIFICAR ESTOS VALORES SEGÚN EL CLIENTE Y MES:
  v_tenant_id UUID := 'c529e450-3708-48c9-90ca-cfb2a01a57ed';  -- UUID del tenant
  v_fecha_mes DATE := '2025-11-01';  -- Primer día del mes a cargar

  v_sucursales_nuevas INTEGER;
  v_ventas_insertadas INTEGER;
BEGIN

  -- ═══════════════════════════════════════════════════════════
  -- PASO 1: Insertar SUCURSALES nuevas (si las hay)
  -- ═══════════════════════════════════════════════════════════

  INSERT INTO dim_tiendas (tenant_id, retailer_id, codigo_tienda, nombre, ciudad, activo)
  SELECT DISTINCT
    v_tenant_id,
    5,  -- FDA retailer_id
    s.sucursal,
    s.sucursal,
    s.plaza_operativa,
    true
  FROM fda_staging_sucursales s
  WHERE NOT EXISTS (
    SELECT 1 FROM dim_tiendas t
    WHERE t.codigo_tienda = s.sucursal
      AND t.retailer_id = 5
      AND t.tenant_id = v_tenant_id
  );

  GET DIAGNOSTICS v_sucursales_nuevas = ROW_COUNT;

  -- ═══════════════════════════════════════════════════════════
  -- PASO 2: Transformar VENTAS de staging a fact_ventas
  -- ═══════════════════════════════════════════════════════════

  INSERT INTO fact_ventas (
    tenant_id, retailer_id, tienda_id, producto_id,
    fecha, unidades, venta_pesos, precio_unitario
  )
  SELECT
    v_tenant_id,
    5 as retailer_id,  -- FDA = 5
    t.id as tienda_id,
    p.id as producto_id,
    s.fecha,
    s.unidades,
    (s.unidades * s.costo) as venta_pesos,  -- Calcular venta = unidades × costo
    s.costo as precio_unitario
  FROM fda_staging_ventas s
  INNER JOIN dim_tiendas t
    ON t.codigo_tienda = s.sucursal
    AND t.retailer_id = 5
    AND t.tenant_id = v_tenant_id
  INNER JOIN dim_productos p
    ON p.upc = s.producto
    AND p.tenant_id = v_tenant_id
  WHERE s.fecha >= v_fecha_mes
    AND s.fecha < v_fecha_mes + INTERVAL '1 month'
  ON CONFLICT (tenant_id, retailer_id, tienda_id, producto_id, fecha)
  DO UPDATE SET
    unidades = EXCLUDED.unidades,
    venta_pesos = EXCLUDED.venta_pesos,
    precio_unitario = EXCLUDED.precio_unitario;

  GET DIAGNOSTICS v_ventas_insertadas = ROW_COUNT;

  -- ═══════════════════════════════════════════════════════════
  -- PASO 3: Limpiar staging procesado (opcional)
  -- ═══════════════════════════════════════════════════════════

  -- Descomentar si quieres limpiar staging después de cargar:
  -- DELETE FROM fda_staging_ventas
  -- WHERE fecha >= v_fecha_mes AND fecha < v_fecha_mes + INTERVAL '1 month';

  -- ═══════════════════════════════════════════════════════════
  -- RESUMEN
  -- ═══════════════════════════════════════════════════════════

  RAISE NOTICE '═══════════════════════════════════════════';
  RAISE NOTICE 'RESUMEN DE CARGA FDA:';
  RAISE NOTICE '  Mes procesado: %', TO_CHAR(v_fecha_mes, 'YYYY-MM');
  RAISE NOTICE '  Sucursales nuevas: %', v_sucursales_nuevas;
  RAISE NOTICE '  Ventas insertadas: %', v_ventas_insertadas;
  RAISE NOTICE '═══════════════════════════════════════════';

END $$;
```

## 3.7 Paso 6: Verificar Carga Exitosa

Ejecutar estas consultas para validar:

```sql
-- Verificar ventas del mes cargado
SELECT
  'VENTAS FDA' as tipo,
  TO_CHAR(fecha, 'YYYY-MM') as mes,
  COUNT(*) as registros,
  SUM(venta_pesos)::numeric(12,2) as total_ventas,
  SUM(unidades) as total_unidades,
  COUNT(DISTINCT tienda_id) as tiendas,
  COUNT(DISTINCT producto_id) as productos
FROM fact_ventas
WHERE tenant_id = 'UUID_DEL_TENANT'
  AND retailer_id = 5
  AND fecha >= '2025-11-01'
  AND fecha < '2025-12-01'
GROUP BY TO_CHAR(fecha, 'YYYY-MM');

-- Verificar histórico completo
SELECT
  TO_CHAR(fecha, 'YYYY-MM') as mes,
  COUNT(*) as registros,
  SUM(venta_pesos)::numeric(12,2) as total_ventas
FROM fact_ventas
WHERE tenant_id = 'UUID_DEL_TENANT'
  AND retailer_id = 5
GROUP BY TO_CHAR(fecha, 'YYYY-MM')
ORDER BY mes DESC
LIMIT 12;

-- Verificar productos sin match (si hay registros que no se cargaron)
SELECT DISTINCT s.producto as upc_sin_match
FROM fda_staging_ventas s
LEFT JOIN dim_productos p
  ON p.upc = s.producto
  AND p.tenant_id = 'UUID_DEL_TENANT'
WHERE p.id IS NULL;

-- Verificar sucursales sin match
SELECT DISTINCT s.sucursal as sucursal_sin_match
FROM fda_staging_ventas s
LEFT JOIN dim_tiendas t
  ON t.codigo_tienda = s.sucursal
  AND t.retailer_id = 5
  AND t.tenant_id = 'UUID_DEL_TENANT'
WHERE t.id IS NULL;
```

## 3.8 Checklist Mensual

```
□ Recibir reporte de ventas de FDA del mes anterior
□ Preparar CSV de ventas (verificar UPC como texto)
□ (Si hay sucursales nuevas) Preparar CSV de sucursales
□ Subir ventas a fda_staging_ventas
□ (Si aplica) Subir sucursales a fda_staging_sucursales
□ Ejecutar SQL de transformación
□ Verificar conteos en consultas de validación
□ Revisar dashboard del cliente (datos actualizados)
□ Confirmar con el cliente que ve el mes nuevo
```

---

# TROUBLESHOOTING

## Error: UPC en notación científica

**Síntoma:** UPC aparece como `7.5E+12` en lugar de `7500462860042`

**Solución:**
1. En Excel, ANTES de pegar datos, formatear columna como "Texto"
2. O agregar apóstrofe al inicio: `'7500462860042`
3. En Google Sheets: Formato → Número → Texto sin formato

## Error: Registros no aparecen después de cargar

**Síntoma:** Se suben a staging pero no aparecen en dashboards

**Causa:** El JOIN con dim_tiendas o dim_productos no encuentra coincidencia.

**Diagnóstico:**
```sql
-- Sucursales faltantes
SELECT DISTINCT s.sucursal
FROM fda_staging_ventas s
LEFT JOIN dim_tiendas t
  ON t.codigo_tienda = s.sucursal
  AND t.retailer_id = 5
  AND t.tenant_id = 'UUID_DEL_TENANT'
WHERE t.id IS NULL;

-- Productos faltantes
SELECT DISTINCT s.producto
FROM fda_staging_ventas s
LEFT JOIN dim_productos p
  ON p.upc = s.producto
  AND p.tenant_id = 'UUID_DEL_TENANT'
WHERE p.id IS NULL;
```

**Solución:** Agregar las sucursales/productos faltantes a las tablas de dimensiones.

## Error: Datos de otro retailer aparecen mezclados

**Síntoma:** Métricas de FDA incluyen datos de otras cadenas

**Causa:** No se está filtrando por `retailer_id`

**Solución:** Verificar que todas las consultas incluyan `WHERE retailer_id = 5`

## Error: El dashboard no muestra el mes recién cargado

**Síntoma:** Los filtros de fecha no muestran el nuevo mes

**Causa:** El filtro puede estar usando un rango predeterminado

**Solución:** Verificar que la fecha en staging es correcta y que el filtro del dashboard incluye el rango correcto.

---

# MAPEO DE COLUMNAS FDA → RUSHDATA

| Columna Reporte FDA | Campo CSV | Campo Final |
|---------------------|-----------|-------------|
| Fecha | fecha | fact_ventas.fecha |
| Sucursal | sucursal | → dim_tiendas.codigo_tienda |
| Producto | producto (UPC) | → dim_productos.upc |
| Unidades | unidades | fact_ventas.unidades |
| Costo | costo | fact_ventas.precio_unitario |
| (calculado) | unidades × costo | fact_ventas.venta_pesos |

---

# RETAILER IDs

| Retailer | ID | Código |
|----------|-----|--------|
| HEB | 1 | heb |
| Walmart | 2 | walmart |
| Soriana | 3 | soriana |
| Merco | 4 | merco |
| **Farmacias del Ahorro** | **5** | **fahorro** |

---

# DIFERENCIAS CLAVE VS HEB

| Aspecto | HEB | FDA |
|---------|-----|-----|
| Frecuencia de carga | **Diaria** | **Mensual** |
| Granularidad datos | Diaria | Mensual |
| Inventario | ✅ Sí | ❌ No |
| Precios dinámicos | ✅ Sí | ❌ No (solo costo fijo) |
| Reabastecimiento | ✅ Sí | ❌ No |
| Número de tiendas | ~62 | ~985 |
| Número de productos | ~11 | ~8 |
| Retailer ID | 1 | 5 |
| Código URL | `/heb/*` | `/fahorro/*` |
