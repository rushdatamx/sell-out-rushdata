# Plan: RushData Sell-Out

## Resumen Ejecutivo

Crear **RushData Sell-Out**, un producto SaaS hermano de RushData que permite a fabricantes analizar sus ventas en retailers (HEB, Walmart, Soriana). El fabricante paga para ver cómo se venden sus productos en punto de venta.

**Diferencia clave:**
- RushData actual (Sell-In): Ventas B2B del fabricante → distribuidor
- RushData Sell-Out: Ventas del retailer → consumidor final

---

## 1. Arquitectura General

### Decisiones Técnicas
- **Supabase:** Proyecto SEPARADO (nueva instancia)
- **Frontend:** Clonar portal-rushdata (Next.js 15 + shadcn/ui + TanStack Query)
- **Multi-tenant:** Fabricantes como clientes (tenant_id en todas las tablas)
- **Multi-retailer:** Cada retailer tiene su formato de datos (mapeo configurable)

### Stack Tecnológico (Idéntico a portal-rushdata)
- Next.js 15 (App Router)
- TypeScript
- shadcn/ui + Tailwind CSS
- TanStack React Query
- Recharts
- Supabase (PostgreSQL)

---

## 2. Diseño de Base de Datos

### 2.1 Tablas Dimensionales

```sql
-- Fabricantes clientes
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre_empresa VARCHAR(255) NOT NULL,
    contacto_email VARCHAR(255) NOT NULL,
    plan VARCHAR(50) DEFAULT 'basic',
    estado VARCHAR(20) DEFAULT 'activo',
    config JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cadenas (HEB, Walmart, Soriana)
CREATE TABLE dim_retailers (
    id SERIAL PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id) NOT NULL,
    codigo VARCHAR(50) NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    color_hex VARCHAR(7),
    activo BOOLEAN DEFAULT true,
    UNIQUE(tenant_id, codigo)
);

-- Tiendas/Sucursales
CREATE TABLE dim_tiendas (
    id SERIAL PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id) NOT NULL,
    retailer_id INTEGER REFERENCES dim_retailers(id) NOT NULL,
    codigo_tienda VARCHAR(50) NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    ciudad VARCHAR(100),
    estado VARCHAR(100),
    cluster VARCHAR(50),
    activo BOOLEAN DEFAULT true,
    UNIQUE(tenant_id, retailer_id, codigo_tienda)
);

-- Productos del fabricante
CREATE TABLE dim_productos (
    id SERIAL PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id) NOT NULL,
    upc VARCHAR(20) NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    categoria VARCHAR(100),
    precio_sugerido DECIMAL(12, 2),
    activo BOOLEAN DEFAULT true,
    UNIQUE(tenant_id, upc)
);

-- Dimensión temporal
CREATE TABLE dim_fecha (
    fecha_id SERIAL PRIMARY KEY,
    fecha DATE UNIQUE NOT NULL,
    anio INTEGER,
    mes INTEGER,
    dia INTEGER,
    dia_semana INTEGER,
    semana_anio INTEGER,
    trimestre INTEGER
);
```

### 2.2 Tablas de Hechos

```sql
-- Ventas en punto de venta
CREATE TABLE fact_sellout_ventas (
    id BIGSERIAL PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id) NOT NULL,
    retailer_id INTEGER REFERENCES dim_retailers(id) NOT NULL,
    tienda_id INTEGER REFERENCES dim_tiendas(id) NOT NULL,
    producto_id INTEGER REFERENCES dim_productos(id) NOT NULL,
    fecha_id INTEGER REFERENCES dim_fecha(fecha_id) NOT NULL,

    unidades INTEGER NOT NULL DEFAULT 0,
    ventas_pesos DECIMAL(12, 2) NOT NULL DEFAULT 0,
    precio_promedio DECIMAL(12, 2),

    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, retailer_id, tienda_id, producto_id, fecha_id)
);

-- Inventario en punto de venta
CREATE TABLE fact_sellout_inventario (
    id BIGSERIAL PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id) NOT NULL,
    retailer_id INTEGER REFERENCES dim_retailers(id) NOT NULL,
    tienda_id INTEGER REFERENCES dim_tiendas(id) NOT NULL,
    producto_id INTEGER REFERENCES dim_productos(id) NOT NULL,
    fecha_id INTEGER REFERENCES dim_fecha(fecha_id) NOT NULL,

    inventario_unidades INTEGER NOT NULL DEFAULT 0,

    UNIQUE(tenant_id, retailer_id, tienda_id, producto_id, fecha_id)
);
```

### 2.3 Tablas de Configuración

```sql
-- Mapeo de columnas por retailer
CREATE TABLE config_retailer_mapping (
    id SERIAL PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id) NOT NULL,
    retailer_id INTEGER REFERENCES dim_retailers(id) NOT NULL,
    tipo_archivo VARCHAR(20) NOT NULL, -- 'ventas', 'inventario'
    column_mapping JSONB NOT NULL,
    date_format VARCHAR(50) DEFAULT 'YYYY-MM-DD',
    UNIQUE(tenant_id, retailer_id, tipo_archivo)
);

-- Registro de cargas
CREATE TABLE data_uploads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) NOT NULL,
    retailer_id INTEGER REFERENCES dim_retailers(id) NOT NULL,
    nombre_archivo VARCHAR(255) NOT NULL,
    tipo_archivo VARCHAR(20) NOT NULL,
    estado VARCHAR(20) DEFAULT 'pendiente',
    registros_insertados INTEGER DEFAULT 0,
    registros_con_error INTEGER DEFAULT 0,
    errores JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2.4 Mapeo de Columnas por Retailer

**HEB:**
```json
{
  "Día": "fecha",
  "ID Tienda": "codigo_tienda",
  "UPC": "upc",
  "Ventas": "ventas_pesos",
  "Unidades": "unidades",
  "Precio Promedio": "precio_promedio",
  "Tienda": "nombre_tienda",
  "Cluster": "cluster",
  "Ciudad": "ciudad",
  "Artículo": "nombre_producto"
}
```

---

## 3. Funciones RPC (Backend)

### 3.1 Dashboard
- `get_sellout_dashboard_kpis(p_tenant_id, p_retailer_id?, p_days)` → KPIs principales
- `get_sellout_ventas_mensuales(p_tenant_id, p_retailer_id?)` → Comparativa mensual
- `get_sellout_top_tiendas(p_tenant_id, p_retailer_id?, p_limit)` → Ranking tiendas
- `get_sellout_top_productos(p_tenant_id, p_retailer_id?, p_limit)` → Ranking productos

### 3.2 Análisis
- `get_sellout_tiendas_list(p_tenant_id, p_filters)` → Lista con filtros
- `get_sellout_productos_list(p_tenant_id, p_filters)` → Lista con filtros
- `get_sellout_ventas_por_cluster(p_tenant_id, p_retailer_id)` → Por cluster
- `get_sellout_ventas_por_ciudad(p_tenant_id, p_retailer_id)` → Por ciudad

### 3.3 Inventario y OOS
- `get_sellout_inventario_actual(p_tenant_id, p_retailer_id?)` → Estado actual
- `get_sellout_cobertura(p_tenant_id, p_retailer_id?)` → Análisis cobertura
- `detect_out_of_stock(p_tenant_id, p_dias_umbral)` → Detectar quiebres
- `get_sellout_oos_alerts(p_tenant_id)` → Alertas activas

### 3.4 Upload
- `process_sellout_upload(p_upload_id, p_data)` → Procesar carga
- `get_retailers_options(p_tenant_id)` → Lista para dropdown

---

## 4. Estructura del Frontend

### 4.1 Estructura de Carpetas

```
sellout-rushdata/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                    # Redirect a login/dashboard
│   ├── login/page.tsx
│   └── dashboard/
│       ├── layout.tsx              # Sidebar + ProtectedRoute
│       ├── page.tsx                # Dashboard principal
│       ├── tiendas/page.tsx        # Análisis tiendas
│       ├── productos/page.tsx      # Análisis productos
│       ├── inventario/page.tsx     # Estado inventario
│       ├── cobertura/page.tsx      # Análisis cobertura
│       ├── out-of-stock/page.tsx   # Alertas OOS
│       ├── upload/page.tsx         # Carga de datos
│       └── configuracion/page.tsx
│
├── components/
│   ├── ui/                         # COPIAR de portal-rushdata
│   ├── layout/                     # Sidebar adaptado
│   ├── providers/                  # COPIAR de portal-rushdata
│   └── upload/                     # NUEVO: FileDropzone, ColumnMapper
│
├── hooks/
│   ├── use-dashboard-data.ts
│   ├── use-tiendas-data.ts
│   ├── use-productos-data.ts
│   ├── use-inventario-data.ts
│   └── use-upload.ts
│
└── lib/
    ├── supabase/
    │   ├── client.ts               # Adaptar de portal-rushdata
    │   └── types.ts                # Generar con Supabase CLI
    └── utils.ts
```

### 4.2 Componentes a Reutilizar (100%)
- `components/ui/*` - Todos los componentes shadcn
- `components/providers/*` - QueryProvider, ThemeProvider
- `lib/utils.ts` - Utilidades
- `tailwind.config.ts` - Configuración
- `globals.css` - Estilos base

### 4.3 Componentes Nuevos

**RetailerSelector** - Dropdown para filtrar por retailer
**FileDropzone** - Drag & drop de archivos Excel/CSV
**ColumnMapper** - Mapeo visual de columnas
**UploadProgress** - Progreso y estadísticas de carga

---

## 5. KPIs y Métricas

### Dashboard Principal
| KPI | Descripción |
|-----|-------------|
| Ventas Totales | SUM(ventas_pesos) del período |
| Variación % | vs período anterior |
| Unidades | SUM(unidades) |
| Tiendas Activas | COUNT DISTINCT con venta |
| Productos Activos | COUNT DISTINCT con venta |
| Cobertura | tiendas_con_venta / tiendas_totales |

### Métricas de Inventario
| Métrica | Fórmula |
|---------|---------|
| Días de Inventario | inventario / venta_promedio_diaria |
| Rotación | ventas / inventario_promedio |
| Out of Stock | tiendas sin venta > N días |
| Venta Perdida | venta_promedio * días_oos |

---

## 6. Flujo de Upload de Datos

```
1. Seleccionar Retailer (HEB, Walmart, etc.)
2. Seleccionar Tipo (Ventas / Inventario)
3. Arrastrar archivo Excel/CSV
4. Preview de datos (10 filas)
5. Mapear columnas (auto-sugerencia basada en config)
6. Validar datos
7. Si errores → mostrar y permitir corregir
8. Confirmar e importar
9. Mostrar progreso y resumen final
```

---

## 7. Fases de Ejecución

### FASE 1: MVP (2-3 semanas)
**Objetivo:** Dashboard funcional con datos de HEB

**Tareas:**
1. Crear proyecto Supabase nuevo
2. Ejecutar migraciones (tablas base)
3. Crear proyecto Next.js (clonar de portal-rushdata)
4. Implementar upload de ventas para HEB
5. Crear RPCs de dashboard (KPIs, top tiendas, top productos)
6. Dashboard con KPIs y gráficas básicas

**Entregable:** Portal donde puedas subir archivo HEB y ver dashboard

---

### FASE 2: Análisis Completo (2-3 semanas)
**Tareas:**
1. Página de Tiendas (tabla, filtros, detalle)
2. Página de Productos (tabla, filtros, detalle)
3. Upload de inventario
4. Página de Inventario
5. Página de Cobertura

---

### FASE 3: Out of Stock (1-2 semanas)
**Tareas:**
1. Algoritmo de detección de OOS
2. Cálculo de venta perdida
3. Página de alertas OOS

---

### FASE 4: Multi-Retailer (2 semanas)
**Tareas:**
1. Mapeo para Walmart
2. Mapeo para Soriana
3. Dashboard comparativo entre retailers

---

## 8. Archivos Críticos a Replicar

De portal-rushdata, estos archivos son la base:

1. **`lib/supabase/client.ts`** - Patrón Proxy para SSR
2. **`hooks/use-dashboard-data.ts`** - Patrón de hooks con TanStack Query
3. **`app/dashboard/page.tsx`** - Estructura de dashboard
4. **`components/layout/app-sidebar.tsx`** - Navegación
5. **`components/ui/*`** - Todos los componentes UI

---

## 9. Configuración Inicial Supabase

### Crear Proyecto
1. Ir a supabase.com → New Project
2. Nombre: `rushdata-sellout`
3. Región: Más cercana (us-east-1 o similar)
4. Guardar URL y anon key

### Variables de Entorno
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

---

## 10. Configuración del Proyecto

### Ubicación
```
/Users/jmariopgarcia/Desktop/Cursor Local/sellout-rushdata
```

### Supabase
- El usuario creará el proyecto en supabase.com
- Proporcionará URL y anon key antes de iniciar implementación

---

## Próximo Paso

Al aprobar este plan:

1. **Usuario:** Crear proyecto en Supabase y compartir credenciales
2. **Claude:** Crear proyecto Next.js en la ubicación especificada
3. **Claude:** Copiar componentes base de portal-rushdata
4. **Claude:** Ejecutar migraciones de base de datos
5. **Claude:** Implementar sistema de upload + dashboard MVP
