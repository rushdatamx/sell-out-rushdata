# Manual de Carga de Datos HEB

Este manual está dividido en 3 secciones:
1. **Contexto Técnico** - Para que Claude entienda la arquitectura
2. **Onboarding de Usuario Nuevo** - Qué información pedir al cliente
3. **Carga Manual Diaria** - Paso a paso para cargar ventas e inventario

---

# SECCIÓN 1: CONTEXTO TÉCNICO (PARA CLAUDE)

> **IMPORTANTE:** Esta sección es para que Claude Code entienda la arquitectura de datos de HEB. Léela cada vez que te pidan modificaciones relacionadas con HEB.

## 1.1 Identificadores Clave

| Concepto | Valor | Descripción |
|----------|-------|-------------|
| **Retailer ID** | `1` | ID de HEB en `dim_retailers` |
| **Código** | `heb` | Usado en URLs: `/heb/dashboard` |
| **Calendario** | Fiscal 4-4-5 | Semanas empiezan en domingo |
| **Granularidad** | Diaria | Datos por día (no mensual) |

## 1.2 Modelo de Datos (Star Schema)

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
         │ producto_id       │ tienda_id         │ retailer_id
         │                   │                   │
         └───────────────────┼───────────────────┘
                             │
                             ▼
              ┌──────────────────────────┐
              │       fact_ventas        │
              │  (tenant + retailer)     │
              ├──────────────────────────┤
              │ - tenant_id (UUID)       │
              │ - retailer_id (1=HEB)    │
              │ - tienda_id              │
              │ - producto_id            │
              │ - fecha                  │
              │ - unidades               │
              │ - venta_pesos            │
              │ - precio_unitario        │
              └──────────────────────────┘
                             │
                             ▼
              ┌──────────────────────────┐
              │     fact_inventario      │
              │  (tenant + retailer)     │
              ├──────────────────────────┤
              │ - tenant_id (UUID)       │
              │ - retailer_id (1=HEB)    │
              │ - tienda_id              │
              │ - producto_id            │
              │ - fecha                  │
              │ - inventario_unidades    │
              └──────────────────────────┘
```

## 1.3 Estructura de Tablas

### `dim_retailers` (Global - NO tiene tenant_id)
```sql
id              INTEGER PRIMARY KEY  -- 1 = HEB
codigo          VARCHAR NOT NULL     -- 'heb'
nombre          VARCHAR NOT NULL     -- 'H-E-B'
color_hex       VARCHAR              -- '#e31837'
activo          BOOLEAN              -- true
```

### `dim_tiendas` (Por Tenant)
```sql
id              INTEGER PRIMARY KEY
tenant_id       UUID NOT NULL        -- FK a tenants
retailer_id     INTEGER NOT NULL     -- 1 = HEB
codigo_tienda   VARCHAR NOT NULL     -- '2913' (número de tienda HEB)
nombre          VARCHAR NOT NULL     -- 'HEB AGS SANTA MONICA'
ciudad          VARCHAR              -- 'AGUASCALIENTES'
estado          VARCHAR              -- 'AGS'
region          VARCHAR              -- 'NORTE'
cluster         VARCHAR              -- 'Cluster A'
formato         VARCHAR              -- 'HEB', 'MI TIENDA'
activo          BOOLEAN
```

### `dim_productos` (Por Tenant)
```sql
id              INTEGER PRIMARY KEY
tenant_id       UUID NOT NULL        -- FK a tenants
upc             VARCHAR NOT NULL     -- '7500462417819' (13 dígitos)
sku_fabricante  VARCHAR              -- Código interno del fabricante
nombre          VARCHAR NOT NULL     -- 'PALOMITAS CHEDDAR JALAPENO 25G'
descripcion_corta VARCHAR            -- 'Cheddar Jalapeño 25gr'
categoria       VARCHAR              -- 'BOTANAS'
subcategoria    VARCHAR              -- 'PALOMITAS'
marca           VARCHAR              -- '4BUDDIES'
case_pack       INTEGER              -- Unidades por caja
precio_sugerido NUMERIC              -- MSRP
activo          BOOLEAN
```

### `fact_ventas` (Por Tenant + Retailer)
```sql
id              BIGINT PRIMARY KEY
tenant_id       UUID NOT NULL
retailer_id     INTEGER NOT NULL     -- 1 = HEB
tienda_id       INTEGER NOT NULL     -- FK a dim_tiendas
producto_id     INTEGER NOT NULL     -- FK a dim_productos
fecha           DATE NOT NULL        -- '2025-12-26'
unidades        INTEGER NOT NULL     -- Cantidad vendida
venta_pesos     NUMERIC NOT NULL     -- Monto en MXN (sin IVA)
precio_unitario NUMERIC              -- Precio promedio
precio_calculado NUMERIC             -- venta_pesos / unidades
upload_id       UUID                 -- Para trazabilidad de carga

-- UNIQUE CONSTRAINT:
UNIQUE (tenant_id, retailer_id, tienda_id, producto_id, fecha)
```

### `fact_inventario` (Por Tenant + Retailer)
```sql
id                  BIGINT PRIMARY KEY
tenant_id           UUID NOT NULL
retailer_id         INTEGER NOT NULL     -- 1 = HEB
tienda_id           INTEGER NOT NULL
producto_id         INTEGER NOT NULL
fecha               DATE NOT NULL
inventario_unidades INTEGER NOT NULL     -- Stock actual
upload_id           UUID

-- UNIQUE CONSTRAINT:
UNIQUE (tenant_id, retailer_id, tienda_id, producto_id, fecha)
```

## 1.4 Tablas Staging (Carga Temporal)

### `heb_staging_ventas`
```sql
tenant_id        UUID
periodo          VARCHAR     -- '2025-12' (YYYY-MM)
fecha            DATE        -- '2025-12-26'
tienda_codigo    VARCHAR     -- '2913'
upc              VARCHAR     -- '7500462417819'
venta_sin_iva    NUMERIC     -- 1234.56
unidades         INTEGER     -- 50
precio_promedio  NUMERIC     -- 24.69
```

### `heb_staging_inventario`
```sql
tenant_id           UUID
fecha               DATE
tienda_codigo       VARCHAR
upc                 VARCHAR
inventario_unidades NUMERIC
inventario_costo    NUMERIC     -- Costo total
inventario_precio   NUMERIC     -- Precio de venta
```

## 1.5 Flujo de Datos

```
Portal HEB → Excel/CSV → Staging Tables → SQL Transform → Fact Tables
                              │                               │
                              ▼                               ▼
                    heb_staging_ventas              fact_ventas
                    heb_staging_inventario          fact_inventario
```

### Proceso de Transformación:
1. **Staging → Fact**: JOIN con `dim_tiendas` (por `codigo_tienda`) y `dim_productos` (por `upc`)
2. **UPSERT**: Si ya existe registro para (tenant, retailer, tienda, producto, fecha), se actualiza
3. **Limpieza**: Inventario > 30 días se elimina automáticamente

## 1.6 RPCs Relevantes para HEB

Todas las funciones reciben `p_retailer_id` para filtrar por cadena:

| Función | Propósito |
|---------|-----------|
| `get_dashboard_metrics(dias, p_retailer_id)` | KPIs principales |
| `get_productos_tabla_v3(..., p_retailer_id)` | Tabla de productos |
| `get_tiendas_tabla(..., p_retailer_id)` | Tabla de tiendas |
| `get_inventario_kpis(..., p_retailer_id)` | KPIs de inventario |
| `get_inventario_tabla(..., p_retailer_id)` | Tabla de inventario |

## 1.7 Configuración en Frontend

Archivo: `lib/retailers/config.ts`

```typescript
heb: {
  codigo: 'heb',
  nombre: 'HEB',
  colorPrimario: '#E31837',
  calendario: {
    tipo: 'fiscal_445',      // Calendario fiscal 4-4-5
    inicioSemana: 0,         // Domingo
  },
  periodos: {
    granularidadMinima: 'diaria',  // Datos diarios
  },
  modulos: {
    dashboard: true,
    productos: true,
    tiendas: true,
    inventario: true,         // HEB SÍ tiene inventario
    reabastecimiento: true,
    precios: true,
    analisis: true,
  },
}
```

## 1.8 Tenants Actuales con HEB

| Tenant | tenant_id | Productos | Tiendas |
|--------|-----------|-----------|---------|
| 4BUDDIES | `c529e450-3708-48c9-90ca-cfb2a01a57ed` | 11 | 62 |

## 1.9 Consideraciones Importantes

1. **Multi-tenant**: Cada empresa (tenant) tiene su propio catálogo de productos, pero las tiendas de HEB son compartidas
2. **RLS (Row Level Security)**: Todas las consultas se filtran automáticamente por `tenant_id` del usuario autenticado
3. **Retailer Isolation**: Además del tenant, se filtra por `retailer_id = 1` para HEB
4. **UPC como Texto**: SIEMPRE manejar UPC como texto de 13 dígitos, NUNCA como número (evita notación científica)
5. **Fechas ISO**: Formato `YYYY-MM-DD` obligatorio
6. **Inventario Rolling**: Solo se mantienen últimos 30 días de inventario

---

# SECCIÓN 2: ONBOARDING DE USUARIO NUEVO

> **Para el equipo RushData:** Usa esta sección cuando llegue un nuevo cliente que quiere ver sus datos de HEB.

## 2.1 Información a Solicitar al Cliente

### A) Datos de la Empresa (Obligatorio)

| Campo | Ejemplo | Notas |
|-------|---------|-------|
| Nombre de la empresa | "Mira Estels S.A. de C.V." | Nombre comercial |
| Contacto principal | "Juan Pérez" | Persona que usará el portal |
| Email del contacto | "juan@miraestels.com" | Para crear cuenta |
| Teléfono | "+52 81 1234 5678" | Para soporte |

### B) Catálogo de Productos (Obligatorio)

**Solicitar archivo Excel/CSV con:**

| Columna | Obligatorio | Ejemplo | Notas |
|---------|-------------|---------|-------|
| UPC | ✅ Sí | 7500462417819 | 12-13 dígitos, SIN notación científica |
| Nombre | ✅ Sí | PALOMITAS CHEDDAR 25G | Nombre corto del producto |
| Categoría | ✅ Sí | BOTANAS | Categoría principal |
| Subcategoría | No | PALOMITAS | Opcional |
| Marca | ✅ Sí | 4BUDDIES | Marca del producto |
| SKU Fabricante | No | PAL-CHD-25 | Código interno del cliente |

**Ejemplo de archivo esperado:**
```
UPC,Nombre,Categoria,Subcategoria,Marca,SKU_Fabricante
7500462417819,PALOMITAS CHEDDAR JALAPENO 25G,BOTANAS,PALOMITAS,4BUDDIES,PAL-CHD-25
7500462417826,PALOMITAS MANTEQUILLA 25G,BOTANAS,PALOMITAS,4BUDDIES,PAL-MAN-25
7500462417833,PALOMITAS QUESO 25G,BOTANAS,PALOMITAS,4BUDDIES,PAL-QUE-25
```

### C) Acceso al Portal HEB (Para carga automática - Opcional)

| Campo | Descripción |
|-------|-------------|
| Usuario portal HEB | Credenciales para descargar reportes |
| Password portal HEB | Para acceso automatizado |
| Frecuencia de reportes | Diario, semanal |

### D) Archivo de Ventas Histórico (Opcional pero Recomendado)

Si el cliente tiene histórico, solicitar archivo con:
- Rango de fechas (ej: "últimos 12 meses")
- Formato igual que el reporte diario de HEB

## 2.2 Checklist de Onboarding

```
□ 1. Recibir datos de la empresa
□ 2. Recibir catálogo de productos (Excel/CSV)
□ 3. Validar formato de UPCs (texto, no científica)
□ 4. Crear tenant en Supabase
□ 5. Crear usuario y asociar al tenant
□ 6. Asociar tenant con HEB (retailer_id = 1)
□ 7. Cargar catálogo de productos a dim_productos
□ 8. Verificar tiendas de HEB existen (normalmente ya están)
□ 9. Cargar histórico de ventas (si aplica)
□ 10. Cliente hace login y verifica acceso
□ 11. Capacitar en descarga de reportes HEB
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

### Paso 3: Asociar Tenant con HEB
```sql
INSERT INTO tenant_retailers (tenant_id, retailer_id, activo)
VALUES ('UUID_DEL_TENANT', 1, true)
ON CONFLICT (tenant_id, retailer_id) DO NOTHING;
```

### Paso 4: Cargar Productos
**Opción A - CSV Import:**
1. Preparar CSV con columnas: `tenant_id,upc,nombre,categoria,subcategoria,marca,activo`
2. Supabase Dashboard → Table Editor → `dim_productos` → Import CSV

**Opción B - SQL Directo:**
```sql
INSERT INTO dim_productos (tenant_id, upc, nombre, categoria, subcategoria, marca, activo)
VALUES
  ('UUID', '7500462417819', 'PALOMITAS CHEDDAR 25G', 'BOTANAS', 'PALOMITAS', '4BUDDIES', true),
  ('UUID', '7500462417826', 'PALOMITAS MANTEQUILLA 25G', 'BOTANAS', 'PALOMITAS', '4BUDDIES', true);
```

### Paso 5: Verificar Tiendas
```sql
-- Las tiendas de HEB ya deben existir
SELECT COUNT(*) FROM dim_tiendas
WHERE retailer_id = 1 AND tenant_id = 'UUID_DEL_TENANT';

-- Si no hay tiendas, copiar del tenant existente o cargar nuevas
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
SELECT 'Asociado a HEB',
  CASE WHEN EXISTS (SELECT 1 FROM tenant_retailers WHERE tenant_id = 'UUID' AND retailer_id = 1) THEN '✅' ELSE '❌' END
UNION ALL
SELECT 'Productos cargados',
  (SELECT COUNT(*)::text FROM dim_productos WHERE tenant_id = 'UUID')
UNION ALL
SELECT 'Tiendas disponibles',
  (SELECT COUNT(*)::text FROM dim_tiendas WHERE tenant_id = 'UUID' AND retailer_id = 1);
```

---

# SECCIÓN 3: CARGA MANUAL DIARIA

> **Para el equipo operativo:** Sigue estos pasos cada día para cargar ventas e inventario de HEB.

## 3.1 Resumen del Proceso

```
┌────────────────────────────────────────────────────────────────┐
│  PROCESO DIARIO (Ejecutar antes de las 10am)                   │
├────────────────────────────────────────────────────────────────┤
│  1. Descargar VENTAS de ayer del portal HEB                    │
│  2. Descargar INVENTARIO de hoy del portal HEB                 │
│  3. Preparar CSV de ventas (formato correcto)                  │
│  4. Preparar CSV de inventario (formato correcto)              │
│  5. Subir a tablas staging en Supabase                         │
│  6. Ejecutar SQL de transformación                             │
│  7. Verificar carga en dashboards                              │
└────────────────────────────────────────────────────────────────┘
```

## 3.2 Paso 1: Descargar del Portal HEB

1. Acceder al portal de proveedores de HEB
2. Ir a sección de reportes
3. Descargar:
   - **Ventas**: Reporte del día anterior
   - **Inventario**: Reporte de hoy

## 3.3 Paso 2: Preparar CSV de VENTAS

### Formato Requerido:
```csv
tenant_id,periodo,fecha,tienda_codigo,upc,venta_sin_iva,unidades,precio_promedio
```

### Reglas de Formato:

| Campo | Formato Correcto | Formato INCORRECTO |
|-------|------------------|-------------------|
| tenant_id | `c529e450-3708-48c9-90ca-cfb2a01a57ed` | - |
| periodo | `2025-12` | Dic-25, 12/2025 |
| fecha | `2025-12-26` | 26/12/25, 12/26/2025 |
| tienda_codigo | `2913` | HEB 2913 |
| upc | `7500462417819` | 7.5E+12, 7500462417819.0 |
| venta_sin_iva | `1234.56` | $1,234.56 |
| unidades | `50` | 50.00, 50 unidades |
| precio_promedio | `24.69` | $24.69 |

### Pasos en Excel:

1. **Agregar columna `tenant_id`**: Pegar el UUID del cliente en toda la columna
2. **Agregar columna `periodo`**: Formato `YYYY-MM` (ej: 2025-12)
3. **Formatear fecha**:
   - Seleccionar columna
   - Formato de celdas → Personalizado → `YYYY-MM-DD`
4. **Formatear UPC como TEXTO**:
   - Seleccionar columna ANTES de pegar datos
   - Formato de celdas → Texto
   - Esto evita que Excel convierta a notación científica
5. **Limpiar columnas numéricas**: Quitar símbolos `$`, comas, espacios
6. **Guardar como CSV UTF-8**

### Ejemplo de CSV Correcto:
```csv
tenant_id,periodo,fecha,tienda_codigo,upc,venta_sin_iva,unidades,precio_promedio
c529e450-3708-48c9-90ca-cfb2a01a57ed,2025-12,2025-12-26,2913,7500462417819,1234.56,50,24.69
c529e450-3708-48c9-90ca-cfb2a01a57ed,2025-12,2025-12-26,2913,7500462417826,567.89,25,22.72
c529e450-3708-48c9-90ca-cfb2a01a57ed,2025-12,2025-12-26,2914,7500462417819,890.12,35,25.43
```

## 3.4 Paso 3: Preparar CSV de INVENTARIO

### Formato Requerido:
```csv
tenant_id,fecha,tienda_codigo,upc,inventario_unidades,inventario_costo,inventario_precio
```

### Reglas de Formato:

| Campo | Formato Correcto | Formato INCORRECTO |
|-------|------------------|-------------------|
| tenant_id | UUID | - |
| fecha | `2025-12-27` | 27/12/25 |
| tienda_codigo | `2913` | - |
| upc | `7500462417819` | 7.5E+12 |
| inventario_unidades | `25` | 25 unidades |
| inventario_costo | `288.42` | $288.42 |
| inventario_precio | `460.65` | $460.65 |

### Ejemplo de CSV Correcto:
```csv
tenant_id,fecha,tienda_codigo,upc,inventario_unidades,inventario_costo,inventario_precio
c529e450-3708-48c9-90ca-cfb2a01a57ed,2025-12-27,2913,7500462417819,25,288.42,460.65
c529e450-3708-48c9-90ca-cfb2a01a57ed,2025-12-27,2913,7500462417826,18,198.00,316.80
c529e450-3708-48c9-90ca-cfb2a01a57ed,2025-12-27,2914,7500462417819,32,368.64,589.82
```

## 3.5 Paso 4: Subir CSVs a Supabase

### Subir VENTAS:
1. Ir a **Supabase Dashboard** → **Table Editor**
2. Seleccionar tabla `heb_staging_ventas`
3. Click en **"Insert"** → **"Import data from CSV"**
4. Seleccionar archivo CSV de ventas
5. Verificar que las columnas mapean correctamente
6. Click **"Import"**

### Subir INVENTARIO:
1. Ir a **Supabase Dashboard** → **Table Editor**
2. Seleccionar tabla `heb_staging_inventario`
3. Click en **"Insert"** → **"Import data from CSV"**
4. Seleccionar archivo CSV de inventario
5. Click **"Import"**

## 3.6 Paso 5: Ejecutar SQL de Transformación

Ir a **Supabase Dashboard** → **SQL Editor** y ejecutar:

```sql
-- ═══════════════════════════════════════════════════════════════
-- SCRIPT DE CARGA DIARIA HEB
-- Ejecutar después de subir CSVs a staging
-- ═══════════════════════════════════════════════════════════════

DO $$
DECLARE
  -- ⚠️ MODIFICAR ESTOS VALORES SEGÚN EL CLIENTE Y FECHA:
  v_tenant_id UUID := 'c529e450-3708-48c9-90ca-cfb2a01a57ed';  -- UUID del tenant
  v_fecha_ventas DATE := CURRENT_DATE - INTERVAL '1 day';      -- Ventas de ayer
  v_fecha_inventario DATE := CURRENT_DATE;                     -- Inventario de hoy

  v_ventas_insertadas INTEGER;
  v_inventario_insertado INTEGER;
  v_inventario_borrado INTEGER;
BEGIN

  -- ═══════════════════════════════════════════════════════════
  -- PASO 1: Transformar VENTAS de staging a fact_ventas
  -- ═══════════════════════════════════════════════════════════

  INSERT INTO fact_ventas (
    tenant_id, retailer_id, tienda_id, producto_id,
    fecha, unidades, venta_pesos, precio_unitario
  )
  SELECT
    s.tenant_id,
    1 as retailer_id,  -- HEB = 1
    t.id as tienda_id,
    p.id as producto_id,
    s.fecha,
    s.unidades,
    s.venta_sin_iva as venta_pesos,
    s.precio_promedio as precio_unitario
  FROM heb_staging_ventas s
  INNER JOIN dim_tiendas t
    ON t.codigo_tienda = s.tienda_codigo
    AND t.tenant_id = s.tenant_id
    AND t.retailer_id = 1
  INNER JOIN dim_productos p
    ON p.upc = s.upc
    AND p.tenant_id = s.tenant_id
  WHERE s.tenant_id = v_tenant_id
    AND s.fecha = v_fecha_ventas
  ON CONFLICT (tenant_id, retailer_id, tienda_id, producto_id, fecha)
  DO UPDATE SET
    unidades = EXCLUDED.unidades,
    venta_pesos = EXCLUDED.venta_pesos,
    precio_unitario = EXCLUDED.precio_unitario;

  GET DIAGNOSTICS v_ventas_insertadas = ROW_COUNT;

  -- ═══════════════════════════════════════════════════════════
  -- PASO 2: Transformar INVENTARIO de staging a fact_inventario
  -- ═══════════════════════════════════════════════════════════

  INSERT INTO fact_inventario (
    tenant_id, retailer_id, tienda_id, producto_id,
    fecha, inventario_unidades
  )
  SELECT
    s.tenant_id,
    1 as retailer_id,  -- HEB = 1
    t.id as tienda_id,
    p.id as producto_id,
    s.fecha,
    s.inventario_unidades::integer
  FROM heb_staging_inventario s
  INNER JOIN dim_tiendas t
    ON t.codigo_tienda = s.tienda_codigo
    AND t.tenant_id = s.tenant_id
    AND t.retailer_id = 1
  INNER JOIN dim_productos p
    ON p.upc = s.upc
    AND p.tenant_id = s.tenant_id
  WHERE s.tenant_id = v_tenant_id
    AND s.fecha = v_fecha_inventario
  ON CONFLICT (tenant_id, retailer_id, tienda_id, producto_id, fecha)
  DO UPDATE SET
    inventario_unidades = EXCLUDED.inventario_unidades;

  GET DIAGNOSTICS v_inventario_insertado = ROW_COUNT;

  -- ═══════════════════════════════════════════════════════════
  -- PASO 3: LIMPIAR inventario mayor a 30 días
  -- ═══════════════════════════════════════════════════════════

  DELETE FROM fact_inventario
  WHERE tenant_id = v_tenant_id
    AND retailer_id = 1
    AND fecha < CURRENT_DATE - INTERVAL '30 days';

  GET DIAGNOSTICS v_inventario_borrado = ROW_COUNT;

  -- ═══════════════════════════════════════════════════════════
  -- PASO 4: Limpiar staging viejo (>7 días)
  -- ═══════════════════════════════════════════════════════════

  DELETE FROM heb_staging_ventas
  WHERE tenant_id = v_tenant_id
    AND fecha < CURRENT_DATE - INTERVAL '7 days';

  DELETE FROM heb_staging_inventario
  WHERE tenant_id = v_tenant_id
    AND fecha < CURRENT_DATE - INTERVAL '7 days';

  -- ═══════════════════════════════════════════════════════════
  -- RESUMEN
  -- ═══════════════════════════════════════════════════════════

  RAISE NOTICE '═══════════════════════════════════════════';
  RAISE NOTICE 'RESUMEN DE CARGA HEB:';
  RAISE NOTICE '  Fecha ventas: %', v_fecha_ventas;
  RAISE NOTICE '  Fecha inventario: %', v_fecha_inventario;
  RAISE NOTICE '  Ventas insertadas: %', v_ventas_insertadas;
  RAISE NOTICE '  Inventario insertado: %', v_inventario_insertado;
  RAISE NOTICE '  Inventario borrado (>30d): %', v_inventario_borrado;
  RAISE NOTICE '═══════════════════════════════════════════';

END $$;
```

## 3.7 Paso 6: Verificar Carga Exitosa

Ejecutar estas consultas para validar:

```sql
-- Verificar ventas de ayer
SELECT
  'VENTAS' as tipo,
  fecha,
  COUNT(*) as registros,
  SUM(venta_pesos)::numeric(12,2) as total_ventas,
  SUM(unidades) as total_unidades
FROM fact_ventas
WHERE tenant_id = 'UUID_DEL_TENANT'
  AND retailer_id = 1
  AND fecha = CURRENT_DATE - INTERVAL '1 day'
GROUP BY fecha;

-- Verificar inventario de hoy
SELECT
  'INVENTARIO' as tipo,
  fecha,
  COUNT(*) as registros,
  SUM(inventario_unidades) as total_unidades
FROM fact_inventario
WHERE tenant_id = 'UUID_DEL_TENANT'
  AND retailer_id = 1
  AND fecha = CURRENT_DATE
GROUP BY fecha;

-- Verificar rango de inventario (solo últimos 30 días)
SELECT
  MIN(fecha) as fecha_mas_antigua,
  MAX(fecha) as fecha_mas_reciente,
  COUNT(DISTINCT fecha) as dias_con_datos
FROM fact_inventario
WHERE tenant_id = 'UUID_DEL_TENANT'
  AND retailer_id = 1;
```

## 3.8 Checklist Diario

```
□ Descargar ventas de AYER del portal HEB
□ Descargar inventario de HOY del portal HEB
□ Preparar CSV de ventas (verificar UPC como texto)
□ Preparar CSV de inventario (verificar UPC como texto)
□ Subir ventas a heb_staging_ventas
□ Subir inventario a heb_staging_inventario
□ Ejecutar SQL de transformación
□ Verificar conteos en consultas de validación
□ Revisar dashboard del cliente (datos actualizados)
```

---

# TROUBLESHOOTING

## Error: UPC en notación científica

**Síntoma:** UPC aparece como `7.5E+12` en lugar de `7500462417819`

**Solución:**
1. En Excel, ANTES de pegar datos, formatear columna como "Texto"
2. O agregar apóstrofe al inicio: `'7500462417819`
3. En Google Sheets: Formato → Número → Texto sin formato

## Error: Registros no aparecen después de cargar

**Síntoma:** Se suben a staging pero no aparecen en dashboards

**Causa:** El JOIN con dim_tiendas o dim_productos no encuentra coincidencia.

**Diagnóstico:**
```sql
-- Tiendas faltantes
SELECT DISTINCT s.tienda_codigo
FROM heb_staging_ventas s
LEFT JOIN dim_tiendas t
  ON t.codigo_tienda = s.tienda_codigo
  AND t.tenant_id = s.tenant_id
WHERE t.id IS NULL
  AND s.tenant_id = 'UUID_DEL_TENANT';

-- Productos faltantes
SELECT DISTINCT s.upc
FROM heb_staging_ventas s
LEFT JOIN dim_productos p
  ON p.upc = s.upc
  AND p.tenant_id = s.tenant_id
WHERE p.id IS NULL
  AND s.tenant_id = 'UUID_DEL_TENANT';
```

**Solución:** Agregar las tiendas/productos faltantes a las tablas de dimensiones.

## Error: Datos de otro retailer aparecen mezclados

**Síntoma:** Métricas de HEB incluyen datos de otras cadenas

**Causa:** No se está filtrando por `retailer_id`

**Solución:** Verificar que todas las consultas incluyan `WHERE retailer_id = 1`

---

# MAPEO DE COLUMNAS HEB → RUSHDATA

| Columna Reporte HEB | Campo CSV | Campo Final |
|---------------------|-----------|-------------|
| TPO_DFecha | fecha | fact_ventas.fecha |
| TPO_CPeriodo | periodo | (solo staging) |
| UNG_KUnidadNegocio | tienda_codigo | → dim_tiendas.codigo_tienda |
| UPC | upc | → dim_productos.upc |
| VTA_IVentasSinIva | venta_sin_iva | fact_ventas.venta_pesos |
| VTA_IUnidades | unidades | fact_ventas.unidades |
| PrecioPromedio | precio_promedio | fact_ventas.precio_unitario |
| INV_IUnidades | inventario_unidades | fact_inventario.inventario_unidades |

---

# RETAILER IDs

| Retailer | ID | Código |
|----------|-----|--------|
| HEB | 1 | heb |
| Walmart | 2 | walmart |
| Soriana | 3 | soriana |
| Merco | 4 | merco |
| Farmacias del Ahorro | 5 | fahorro |
