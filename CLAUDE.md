# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Project Overview

**RushData Sell-Out** es una plataforma SaaS multi-tenant de analytics para fabricantes de productos de consumo (CPG). Permite analizar datos de punto de venta (sell-out) de múltiples cadenas comerciales.

### Conceptos Clave del Negocio

| Término | Significado |
|---------|-------------|
| **Sell-out** | Ventas del retailer al consumidor final (vs sell-in = ventas B2B del fabricante al retailer) |
| **Tenant** | Empresa cliente (fabricante) que paga por ver el desempeño de sus productos en retail |
| **Retailer** | Cadena comercial (HEB, Walmart, Soriana, Merco, Farmacias del Ahorro, etc.) |
| **SKU/UPC** | Código único de producto (12-13 dígitos, SIEMPRE como texto) |
| **Plaza Operativa** | Región geográfica de FDA (equivalente a ciudad) |

### Problema que Resuelve

Los fabricantes reciben archivos de ventas de diferentes cadenas en formatos distintos:
- **HEB**: Datos diarios/semanales con calendario fiscal 4-4-5
- **FDA**: Datos mensuales con calendario gregoriano
- **Merco**: Datos mensuales
- Cada cadena tiene diferentes columnas, formatos y granularidades

RushData unifica estos datos en una sola plataforma con dashboards específicos por cadena.

---

## Retailers Configurados

### IDs y Configuración Actual

| Retailer | ID | Código URL | Granularidad | Inventario | Promociones | Módulos |
|----------|-----|------------|--------------|------------|-------------|---------|
| **HEB** | `1` | `/heb/*` | Diaria | ✅ Sí | ✅ Sí | Todos (8/8) |
| Walmart | `2` | `/walmart/*` | Diaria | ✅ Sí | ✅ Sí | Todos |
| Soriana | `3` | `/soriana/*` | Diaria | ✅ Sí | ✅ Sí | Todos |
| Merco | `4` | `/merco/*` | Mensual | ✅ Sí | ❌ No | 6/8 |
| **FDA** | `5` | `/fahorro/*` | **Mensual** | ❌ No | ❌ No | 4/8 |

### Configuración Específica por Retailer

```typescript
// lib/retailers/config.ts

// HEB - Retailer principal, datos completos
heb: {
  codigo: 'heb',
  colorPrimario: '#E31837',
  calendario: { tipo: 'fiscal_445', inicioSemana: 0 },  // Domingo
  periodos: { granularidadMinima: 'diaria' },
  modulos: {
    dashboard: true, productos: true, tiendas: true,
    inventario: true, reabastecimiento: true, precios: true, analisis: true,
    promociones: true  // Análisis de promociones (requiere datos diarios)
  }
}

// FDA - Sin inventario, datos mensuales
fahorro: {
  codigo: 'fahorro',
  colorPrimario: '#000000',
  calendario: { tipo: 'gregoriano', inicioSemana: 1 },  // Lunes
  periodos: { granularidadMinima: 'mensual' },  // ⚠️ SOLO MENSUAL
  modulos: {
    dashboard: true, productos: true, tiendas: true, analisis: true,
    inventario: false, reabastecimiento: false, precios: false,  // ❌ DESHABILITADOS
    promociones: false  // Datos mensuales no ideales para promociones
  }
}
```

---

## Tenants Actuales

| Tenant | UUID | Retailers | Productos HEB | Productos FDA |
|--------|------|-----------|---------------|---------------|
| **4BUDDIES** | `c529e450-3708-48c9-90ca-cfb2a01a57ed` | HEB, FDA | 11 | 8 |

---

## Arquitectura Multi-Retailer (Hub)

### Flujo de Navegación

```
/login → /hub (cards de retailers) → /[retailer]/dashboard
                                   → /[retailer]/productos
                                   → /[retailer]/tiendas
                                   → /[retailer]/inventario     (solo si habilitado)
                                   → /[retailer]/reabastecimiento (solo si habilitado)
                                   → /[retailer]/precios        (solo si habilitado)
                                   → /[retailer]/analisis
```

### Estructura de Rutas

```
app/
├── page.tsx                    # Redirect: auth? → /hub : /login
├── hub/
│   ├── layout.tsx              # HubSidebar (navegación mínima)
│   └── page.tsx                # Grid de RetailerCards
├── [retailer]/                 # Rutas dinámicas por retailer
│   ├── layout.tsx              # RetailerProvider + RetailerSidebar
│   ├── page.tsx                # Redirect → /[retailer]/dashboard
│   ├── dashboard/page.tsx      # Dashboard principal del retailer
│   ├── productos/page.tsx      # Análisis de productos
│   ├── tiendas/page.tsx        # Análisis de tiendas
│   ├── inventario/page.tsx     # Niveles de inventario (HEB only)
│   ├── reabastecimiento/       # Sugerencias de reorden (HEB only)
│   ├── precios/page.tsx        # Monitoreo de precios (HEB only)
│   ├── promociones/page.tsx    # Análisis de promociones (HEB only, datos diarios)
│   └── analisis/page.tsx       # Análisis avanzado YoY
├── ia/page.tsx                 # Asistente IA global
└── login/page.tsx              # Autenticación
```

---

## Tech Stack

| Categoría | Tecnología |
|-----------|------------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Database | Supabase (PostgreSQL + RLS) |
| UI | shadcn/ui + Tailwind CSS v4 + Radix |
| State | TanStack React Query |
| Auth | Supabase Auth con aislamiento por tenant |
| AI | Anthropic Claude API (streaming) |
| Charts | Recharts |

---

## Data Model (Star Schema)

### Diagrama de Relaciones

```
                         ┌─────────────────┐
                         │    tenants      │
                         │  (empresas)     │
                         └────────┬────────┘
                                  │ tenant_id (UUID)
          ┌───────────────────────┼───────────────────────┐
          │                       │                       │
          ▼                       ▼                       ▼
┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐
│  dim_productos   │   │   dim_tiendas    │   │  dim_retailers   │
│  (por tenant)    │   │  (por tenant)    │   │    (global)      │
└────────┬─────────┘   └────────┬─────────┘   └────────┬─────────┘
         │                      │                      │
         │ producto_id          │ tienda_id            │ retailer_id
         │                      │                      │
         └──────────────────────┼──────────────────────┘
                                │
                ┌───────────────┴───────────────┐
                │                               │
                ▼                               ▼
     ┌──────────────────┐            ┌──────────────────┐
     │   fact_ventas    │            │  fact_inventario │
     │ (tenant+retailer)│            │ (tenant+retailer)│
     └──────────────────┘            │  ⚠️ Solo HEB     │
                                     └──────────────────┘
```

### Estructura de Tablas Principales

#### `dim_retailers` (Global - SIN tenant_id)
```sql
id              INTEGER PRIMARY KEY  -- 1=HEB, 5=FDA
codigo          VARCHAR NOT NULL     -- 'heb', 'fahorro'
nombre          VARCHAR NOT NULL     -- 'H-E-B', 'Farmacias del Ahorro'
color_hex       VARCHAR              -- '#e31837', '#000000'
activo          BOOLEAN DEFAULT true
```

#### `dim_tiendas` (Por Tenant)
```sql
id              INTEGER PRIMARY KEY
tenant_id       UUID NOT NULL        -- FK a tenants
retailer_id     INTEGER NOT NULL     -- 1=HEB, 5=FDA
codigo_tienda   VARCHAR NOT NULL     -- '2913' (HEB) o 'ACGP GRAN PLAZA' (FDA)
nombre          VARCHAR NOT NULL     -- Nombre de la tienda
ciudad          VARCHAR              -- Ciudad o Plaza Operativa (FDA)
estado          VARCHAR              -- Estado (puede ser NULL en FDA)
region          VARCHAR              -- Región (puede ser NULL)
cluster         VARCHAR              -- Cluster (solo HEB)
formato         VARCHAR              -- Formato de tienda (solo HEB)
activo          BOOLEAN DEFAULT true
```

#### `dim_productos` (Por Tenant)
```sql
id              INTEGER PRIMARY KEY
tenant_id       UUID NOT NULL        -- FK a tenants
upc             VARCHAR NOT NULL     -- '7500462417819' (SIEMPRE TEXTO, 13 dígitos)
nombre          VARCHAR NOT NULL     -- 'PALOMITAS CHEDDAR JALAPENO 25G'
categoria       VARCHAR              -- 'BOTANAS' o '760-126 BOTANAS' (FDA)
subcategoria    VARCHAR              -- 'PALOMITAS' o '760-126-523 PALOMITA'
marca           VARCHAR              -- '4BUDDIES'
activo          BOOLEAN DEFAULT true
```

#### `fact_ventas` (Por Tenant + Retailer)
```sql
id              BIGINT PRIMARY KEY
tenant_id       UUID NOT NULL
retailer_id     INTEGER NOT NULL     -- 1=HEB, 5=FDA
tienda_id       INTEGER NOT NULL     -- FK a dim_tiendas
producto_id     INTEGER NOT NULL     -- FK a dim_productos
fecha           DATE NOT NULL        -- Diaria (HEB) o último día mes (FDA)
unidades        INTEGER NOT NULL     -- Cantidad vendida
venta_pesos     NUMERIC NOT NULL     -- Monto en MXN
precio_unitario NUMERIC              -- Precio promedio

-- UNIQUE CONSTRAINT (para upserts):
UNIQUE (tenant_id, retailer_id, tienda_id, producto_id, fecha)
```

#### `fact_inventario` (Solo HEB - Por Tenant + Retailer)
```sql
id                  BIGINT PRIMARY KEY
tenant_id           UUID NOT NULL
retailer_id         INTEGER NOT NULL     -- 1=HEB (FDA NO tiene inventario)
tienda_id           INTEGER NOT NULL
producto_id         INTEGER NOT NULL
fecha               DATE NOT NULL
inventario_unidades INTEGER NOT NULL

-- UNIQUE CONSTRAINT:
UNIQUE (tenant_id, retailer_id, tienda_id, producto_id, fecha)
```

### Tablas Staging (Carga de Datos)

#### HEB Staging
```sql
-- heb_staging_ventas
tenant_id, periodo, fecha, tienda_codigo, upc, venta_sin_iva, unidades, precio_promedio

-- heb_staging_inventario
tenant_id, fecha, tienda_codigo, upc, inventario_unidades, inventario_costo, inventario_precio
```

#### FDA Staging
```sql
-- fda_staging_ventas
fecha, sucursal, producto (UPC), unidades, costo

-- fda_staging_sucursales
sucursal, plaza_operativa
```

---

## RPC Functions (Supabase)

### Patrón Común: Todas reciben `p_retailer_id`

```sql
-- Ejemplo de firma de función
CREATE FUNCTION get_dashboard_metrics(
  dias_periodo INTEGER DEFAULT 30,
  p_retailer_id INTEGER DEFAULT NULL  -- ⚠️ SIEMPRE incluir este parámetro
) RETURNS json
```

### Lista de RPCs por Módulo

| Módulo | Función | Parámetros Clave |
|--------|---------|------------------|
| **Dashboard** | `get_dashboard_metrics` | `dias_periodo`, `p_retailer_id` |
| **Dashboard** | `get_retailers_summary` | (para Hub cards) |
| **Productos** | `get_productos_filtros` | `p_retailer_id` |
| **Productos** | `get_productos_kpis_v3` | `fecha_inicio`, `fecha_fin`, `p_retailer_id` |
| **Productos** | `get_productos_tabla_v3` | filtros + `p_retailer_id` |
| **Productos** | `get_productos_pareto_v3` | `p_retailer_id` |
| **Productos** | `get_productos_variacion_v3` | `p_retailer_id` |
| **Tiendas** | `get_tiendas_filtros` | `p_retailer_id` |
| **Tiendas** | `get_tiendas_kpis` | `p_retailer_id` |
| **Tiendas** | `get_tiendas_tabla` | `p_retailer_id` |
| **Tiendas** | `get_tiendas_ranking` | `p_retailer_id` |
| **Inventario** | `get_inventario_*` | `p_retailer_id` (solo HEB) |
| **Reabastecimiento** | `get_reabastecimiento_*` | `p_retailer_id` (solo HEB) |
| **Precios** | `get_precios_*` | `p_retailer_id` (solo HEB) |
| **Promociones** | `get_promociones_filtros` | `p_retailer_id` (solo HEB) |
| **Promociones** | `get_ventas_periodo_promocion` | fechas + filtros + `p_retailer_id` |
| **Promociones** | `get_canibalizacion_promocion` | producto + fechas + `p_retailer_id` |
| **Análisis** | `get_analisis_*_yoy` | `p_retailer_id` |

---

## Key Patterns

### 1. Supabase Client (Proxy Pattern for SSR)

```typescript
// lib/supabase/client.ts
export const supabase = new Proxy({} as SupabaseClient<Database>, {
  get(_, prop) {
    const client = getSupabaseClient()
    return Reflect.get(client, prop)
  },
})
```

### 2. Data Fetching con React Query + retailerId

```typescript
// hooks/use-dashboard-metrics.ts
export function useDashboardMetrics(dias: number = 30, retailerId?: number) {
  return useQuery({
    queryKey: ["dashboard-metrics", dias, retailerId],  // ⚠️ Incluir retailerId
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_dashboard_metrics", {
        dias_periodo: dias,
        p_retailer_id: retailerId || null  // ⚠️ Pasar a la RPC
      })
      if (error) throw error
      return data
    },
    staleTime: 60 * 1000,
  })
}
```

### 3. Multi-tenant Security (RLS)

```sql
-- Todas las tablas tienen tenant_id con RLS
CREATE POLICY "tenant_isolation" ON fact_ventas
  FOR ALL USING (tenant_id = get_user_tenant_id());

-- Función helper
CREATE FUNCTION get_user_tenant_id() RETURNS UUID AS $$
  SELECT tenant_id FROM users WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER;
```

### 4. RetailerContext Pattern

```typescript
// En cualquier página dentro de /[retailer]/*
export default function ProductosPage() {
  const { retailer, config, isLoading } = useActiveRetailer()

  if (isLoading) return <Loading />

  // retailer.id para filtrar datos en hooks
  // config.modulos para habilitar/deshabilitar features
  // config.calendario para formatear fechas

  const { data } = useProductosTabla({ retailerId: retailer.id })
}
```

---

## Directory Structure

```
app/                          # Next.js App Router pages
components/
├── ui/                       # shadcn/ui components
├── charts/                   # Recharts components (con retailerId)
├── chat/                     # AI chat interface
├── floating-ai/              # Floating AI widget
├── layout/
│   ├── hub-sidebar.tsx       # Sidebar para /hub
│   └── retailer-sidebar.tsx  # Sidebar para /[retailer]/* (filtra por módulos)
├── retailer/
│   ├── retailer-context.tsx  # Context provider (useActiveRetailer)
│   ├── retailer-card.tsx     # Card para Hub
│   └── retailer-hub.tsx      # Grid de cards
├── providers/                # React Query, Theme, Auth
hooks/
├── use-retailers.ts          # Lista de retailers del tenant
├── use-retailer-summary.ts   # Métricas para Hub cards
├── use-dashboard-metrics.ts  # KPIs del dashboard (con retailerId)
├── use-productos.ts          # Hooks de productos (con retailerId)
├── use-tiendas.ts            # Hooks de tiendas (con retailerId)
├── use-inventario.ts         # Datos de inventario (con retailerId)
├── use-reabastecimiento.ts   # Hooks de reabastecimiento
├── use-precios.ts            # Hooks de precios
├── use-promociones.ts        # Hooks de análisis de promociones
├── use-analisis.ts           # Hooks de análisis YoY
lib/
├── supabase/
│   ├── client.ts             # Supabase client (Proxy pattern)
│   └── types.ts              # Auto-generated DB types
├── auth/                     # Auth context
├── retailers/
│   ├── types.ts              # Tipos para retailers
│   └── config.ts             # Configuración por retailer
├── promociones/              # Lógica de análisis de promociones
│   ├── types.ts              # Tipos para promociones
│   ├── constants.ts          # Tipos de promoción, umbrales
│   └── calculations.ts       # Cálculos de KPIs (Uplift, ROI, etc.)
scripts/                      # Data loading scripts (Node.js)
├── load-heb-ventas.js        # Carga ventas HEB
├── load-heb-dimensions.js    # Carga dimensiones HEB
supabase/migrations/          # SQL migrations
docs/
├── MANUAL_CARGA_HEB.md       # Manual completo para HEB
├── MANUAL_CARGA_FDA.md       # Manual completo para FDA
```

---

## Development Commands

```bash
npm run dev      # Start development server (localhost:3000)
npm run build    # Production build (SIEMPRE ejecutar para validar)
npm run lint     # Run ESLint
npm run start    # Start production server
```

---

## Path Aliases

El proyecto usa path aliases para imports más limpios:

```typescript
// tsconfig.json: "@/*" → "./*"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase/client"
import { useDashboardMetrics } from "@/hooks/use-dashboard-metrics"
```

---

## Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=     # Para API routes y scripts

# AI
ANTHROPIC_API_KEY=             # Para chat con Claude
```

---

## Convenciones Importantes

| Aspecto | Convención |
|---------|------------|
| Idioma | Español en toda la UI y respuestas de IA |
| Moneda | `NUMERIC(12,2)`, formato `$X,XXX.XX` |
| Fechas | Tipo `DATE`, formato `YYYY-MM-DD`, locale español |
| UPC | **SIEMPRE como TEXTO** (nunca número, evita 7.5E+12) |
| React Query | staleTime = 1 minuto, incluir `retailerId` en queryKey |
| Upserts | UNIQUE constraints: `(tenant_id, retailer_id, tienda_id, producto_id, fecha)` |
| Colores | Cada retailer tiene `color_hex` en `dim_retailers` |
| RPCs | TODAS deben recibir `p_retailer_id` para aislamiento |

---

## Manuales de Referencia

Para operaciones de carga de datos, consultar:

| Manual | Ubicación | Contenido |
|--------|-----------|-----------|
| **HEB** | `docs/MANUAL_CARGA_HEB.md` | Carga diaria, staging, transformación |
| **FDA** | `docs/MANUAL_CARGA_FDA.md` | Carga mensual, sin inventario |

Cada manual tiene 3 secciones:
1. **Contexto Técnico** - Para que Claude entienda la arquitectura
2. **Onboarding** - Qué información pedir a nuevos clientes
3. **Carga Manual** - Paso a paso con SQLs listos

---

## Troubleshooting Común

| Problema | Causa | Solución |
|----------|-------|----------|
| "No retailers found" | RLS no permite acceso | Verificar `tenant_id` del usuario en `users` |
| Datos no aparecen | Falta `retailer_id` en query | Agregar `p_retailer_id` al RPC |
| Datos mezclados entre cadenas | RPC sin filtro retailer | Verificar que RPC filtre por `retailer_id` |
| UPC en notación científica | Excel convirtió a número | Formatear columna como TEXTO antes de pegar |
| Inventario vacío en FDA | FDA no tiene inventario | Verificar `config.modulos.inventario = false` |
| Build falla | Error TypeScript | Ejecutar `npm run build` para ver errores |
| Sidebar incorrecto | Layout equivocado | Verificar que use `RetailerSidebar` en `/[retailer]/*` |

---

## Estadísticas Actuales (Enero 2026)

### HEB (retailer_id = 1)
- Registros ventas: ~125,632
- Registros inventario: ~15,505
- Productos: 11
- Tiendas: 62
- Rango fechas: 2024-01-01 → 2025-12-22

### FDA (retailer_id = 5)
- Registros ventas: ~27,724
- Registros inventario: ❌ N/A
- Productos: 8
- Tiendas: 972
- Plazas: 111
- Rango fechas: 2024-01-01 → 2025-11-11
- Granularidad: **Mensual** (1 registro por mes)

---

## AI Chat Integration

El endpoint `/api/chat`:
1. Extrae `tenant_id` del token de auth
2. Llama a `get_ia_context_for_tenant` RPC para contexto de negocio
3. Streaming de respuesta desde Claude API
4. Respuestas en español con expertise en sell-out/retail
5. **IMPORTANTE**: La IA debe filtrar respuestas por retailer si el usuario está en `/[retailer]/*`

---

## Checklist para Nuevas Features

Cuando agregues una nueva feature:

1. [ ] ¿El hook recibe `retailerId` como parámetro?
2. [ ] ¿El `queryKey` incluye `retailerId`?
3. [ ] ¿La RPC tiene `p_retailer_id` y filtra por él?
4. [ ] ¿El componente usa `useActiveRetailer()` para obtener el retailer?
5. [ ] ¿La feature está habilitada en `config.modulos` para el retailer?
6. [ ] ¿Funciona tanto para HEB (diario) como FDA (mensual)?
7. [ ] ¿Los imports usan el path alias `@/`?
8. [ ] ¿El build pasa sin errores? (`npm run build`)
