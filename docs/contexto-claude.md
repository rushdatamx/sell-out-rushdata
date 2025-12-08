# Contexto del Proyecto: RushData Sell-Out Intelligence

> **INSTRUCCIÓN PARA CLAUDE**: Este documento contiene toda la información necesaria para entender el proyecto. Léelo completamente antes de responder cualquier pregunta sobre el código, arquitectura o funcionalidades.

---

## 1. QUÉ ES ESTE PROYECTO

**RushData** es una plataforma SaaS de **análisis de sell-out retail** para fabricantes de productos de consumo. Permite monitorear ventas e inventarios en cadenas comerciales (retailers) como Soriana, HEB, Walmart, etc.

### Stack Tecnológico
- **Frontend**: Next.js 15, React 19, TypeScript
- **Backend**: Supabase (PostgreSQL + Auth + RLS)
- **UI**: Tailwind CSS + Shadcn UI
- **Gráficas**: Recharts
- **Tablas**: TanStack React Table
- **State**: React Query (TanStack Query)
- **IA**: Claude AI (Anthropic) para asistente de análisis

### Modelo de Negocio
- **Multi-tenant**: Cada fabricante (tenant) tiene sus datos aislados
- **Usuarios**: Empleados del fabricante acceden a sus propios datos
- **Datos**: Ventas e inventarios diarios por tienda y producto

---

## 2. ESTRUCTURA DE CARPETAS

```
sellout-rushdata/
├── app/                      # Páginas de Next.js (App Router)
│   ├── page.tsx              # Landing - redirecciona a /dashboard o /login
│   ├── login/                # Autenticación
│   ├── dashboard/            # Dashboard principal con KPIs
│   ├── productos/            # Análisis de productos
│   ├── inventario/           # Control de stock y OOS
│   ├── precios/              # Análisis de precios
│   ├── reabastecimiento/     # Sugerido de compra
│   ├── tiendas/              # Análisis por punto de venta
│   ├── analisis/             # Comparativo Year-over-Year
│   ├── ia/                   # Chat con IA
│   └── api/chat/             # Endpoint para Claude AI
├── components/               # Componentes React
│   ├── ui/                   # Shadcn UI components
│   ├── dashboard/            # Componentes del dashboard
│   ├── productos/            # Componentes de productos
│   ├── inventario/           # Componentes de inventario
│   ├── precios/              # Componentes de precios
│   ├── reabastecimiento/     # Componentes de reabastecimiento
│   ├── tiendas/              # Componentes de tiendas
│   ├── analisis/             # Componentes de análisis YoY
│   └── chat/                 # Componentes del chat IA
├── hooks/                    # Custom hooks para data fetching
│   ├── use-dashboard-metrics.ts
│   ├── use-productos.ts
│   ├── use-inventario.ts
│   ├── use-precios.ts
│   ├── use-reabastecimiento.ts
│   ├── use-tiendas.ts
│   ├── use-analisis.ts
│   └── use-chat.ts
├── lib/                      # Utilidades y configuración
│   ├── supabase/
│   │   ├── client.ts         # Cliente Supabase singleton
│   │   └── types.ts          # Tipos TypeScript generados
│   ├── auth/
│   │   └── auth-context.tsx  # Contexto de autenticación
│   └── utils.ts              # Utilidades generales
└── supabase/
    └── migrations/           # Migraciones SQL (23 archivos)
```

---

## 3. BASE DE DATOS - MODELO DIMENSIONAL

El proyecto usa un **modelo estrella** de Data Warehouse:

### 3.1 Tablas Dimensionales

#### `dim_fecha` (4,018 registros)
Dimensión temporal pre-poblada 2020-2030.
```sql
fecha (PK), anio, mes, dia, dia_semana, nombre_dia, nombre_mes,
semana_anio, trimestre, es_fin_semana, fecha_anio_anterior
```
**Uso**: Filtros de fecha, análisis YoY, estacionalidad.

#### `dim_retailers` (2 registros)
Cadenas comerciales (Soriana, HEB, etc.)
```sql
id (PK), tenant_id (FK), codigo, nombre, color_hex, activo
```

#### `dim_tiendas` (26 registros)
Sucursales/puntos de venta.
```sql
id (PK), tenant_id (FK), retailer_id (FK), codigo_tienda, nombre,
ciudad, estado, region, cluster, formato, activo
```
**Campos clave**: `ciudad` para filtros geográficos, `cluster` para segmentación.

#### `dim_productos` (19 registros)
Catálogo de productos del fabricante.
```sql
id (PK), tenant_id (FK), upc, sku_fabricante, nombre, descripcion_corta,
categoria, subcategoria, marca, case_pack, precio_sugerido, activo
```
**Campos clave**: `upc` es el código de barras único, `case_pack` para sugerido de compra.

### 3.2 Tablas de Hechos

#### `fact_ventas` (46,370 registros)
Ventas diarias por tienda y producto.
```sql
id (PK), tenant_id, retailer_id, tienda_id, producto_id, fecha,
unidades, venta_pesos, precio_unitario, precio_calculado (GENERATED),
upload_id, created_at
```
**Campo generado**: `precio_calculado = venta_pesos / unidades`

#### `fact_inventario` (8,524 registros)
Inventario diario por tienda y producto.
```sql
id (PK), tenant_id, retailer_id, tienda_id, producto_id, fecha,
inventario_unidades, upload_id, created_at
```

### 3.3 Tablas de Configuración

#### `tenants` (1 registro)
Empresas/fabricantes.
```sql
id (PK), nombre_empresa, contacto_email, plan, estado, config (JSONB)
```

#### `users` (1 registro)
Usuarios del sistema.
```sql
id (PK, FK → auth.users), tenant_id (FK), email, nombre, avatar_url, activo, last_login
```

#### `config_retailer_mapping`
Configuración de carga de archivos por retailer.
```sql
id, tenant_id, retailer_id, tipo_archivo, column_mapping (JSONB), date_format, skip_rows
```

#### `data_uploads`
Historial de cargas de datos.
```sql
id, tenant_id, retailer_id, nombre_archivo, tipo_archivo, estado,
registros_totales, registros_insertados, registros_actualizados,
registros_con_error, errores (JSONB)
```

### 3.4 Tablas de Chat IA

#### `chat_conversations`
```sql
id (PK), tenant_id, user_id, title, created_at, updated_at
```

#### `chat_messages`
```sql
id (PK), conversation_id (FK), role ('user'|'assistant'), content, tokens_used
```

---

## 4. SEGURIDAD - ROW LEVEL SECURITY (RLS)

Todas las tablas (excepto `dim_fecha`) tienen RLS habilitado.

### Función Helper
```sql
CREATE FUNCTION get_user_tenant_id() RETURNS UUID AS $$
  SELECT tenant_id FROM users WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER;
```

### Política Universal
```sql
CREATE POLICY "tenant_isolation" ON [tabla]
FOR ALL USING (tenant_id = get_user_tenant_id());
```

**Resultado**: Cada usuario solo ve datos de su empresa automáticamente.

---

## 5. FUNCIONES RPC DE SUPABASE (60+)

### 5.1 Dashboard
| Función | Retorna |
|---------|---------|
| `get_dashboard_metrics(dias)` | KPIs: venta_total, unidades, quiebres, skus_activos |
| `get_dashboard_ventas_por_dia(dias)` | Serie temporal para sparklines |
| `get_dashboard_top_productos(dias, limit)` | Top N productos por venta |
| `get_dashboard_top_tiendas(dias, limit)` | Top N tiendas por venta |
| `get_dashboard_mix_categorias(dias)` | % participación por categoría |

### 5.2 Productos
| Función | Retorna |
|---------|---------|
| `get_productos_filtros()` | Categorías, marcas disponibles |
| `get_productos_kpis_v3(fecha_inicio, fecha_fin, ...)` | SKUs, venta total, unidades |
| `get_productos_tabla_v3(...)` | Tabla paginada con sorting |
| `get_productos_pareto_v3(...)` | Clasificación ABC (80/95) |
| `get_productos_variacion_v3(...)` | Top crecimiento y caída |

### 5.3 Inventario
| Función | Retorna |
|---------|---------|
| `get_inventario_filtros()` | Ciudades, tiendas, productos |
| `get_inventario_kpis(...)` | % OOS, venta perdida, SKUs críticos |
| `get_inventario_tabla(...)` | Detalle con estado (OK/Bajo/OOS) |
| `get_inventario_heatmap(...)` | Matriz producto × tienda |
| `get_inventario_evolucion(...)` | Serie temporal |
| `get_inventario_alertas(...)` | Top problemas de stock |
| `get_inventario_top_venta_perdida(...)` | Mayor venta perdida por OOS |

### 5.4 Precios
| Función | Retorna |
|---------|---------|
| `get_precios_filtros()` | Opciones de filtro |
| `get_precios_kpis(...)` | Precio promedio, dispersión, anomalías |
| `get_precios_detalle(...)` | Precio por producto-tienda |
| `get_precios_evolucion(...)` | Serie temporal |
| `get_precios_por_ciudad(...)` | Análisis geográfico |
| `get_precios_dispersion(...)` | Distribución de CV% |
| `get_precios_alertas(...)` | Precios anómalos |

### 5.5 Reabastecimiento
| Función | Retorna |
|---------|---------|
| `get_reabastecimiento_filtros()` | Opciones de filtro |
| `get_reabastecimiento_kpis(...)` | Fill rate, cobertura, días inventario |
| `get_reabastecimiento_tabla(...)` | Sugerido de compra con prioridad |
| `get_reabastecimiento_abc(...)` | Clasificación Pareto |
| `get_reabastecimiento_fill_rate(...)` | Por producto |
| `get_reabastecimiento_alertas_clase_a(...)` | Productos A con OOS |

### 5.6 Tiendas
| Función | Retorna |
|---------|---------|
| `get_tiendas_filtros()` | Ciudades, clusters |
| `get_tiendas_kpis(...)` | Tiendas activas, venta total, promedio |
| `get_tiendas_tabla(...)` | Ranking de tiendas |
| `get_tiendas_ranking(...)` | Top y Bottom tiendas |
| `get_tiendas_por_ciudad(...)` | Ventas por geografía |

### 5.7 Análisis YoY
| Función | Retorna |
|---------|---------|
| `get_analisis_kpis_yoy(anio, ciudades)` | Actual vs año anterior |
| `get_analisis_ventas_mensuales_yoy(...)` | Por mes comparativo |
| `get_analisis_productos_yoy(...)` | Productos YoY |
| `get_analisis_tiendas_yoy(...)` | Tiendas YoY |
| `get_analisis_ciudades_yoy(...)` | Ciudades YoY |
| `get_analisis_estacionalidad_semanal(...)` | Patrón por día de semana |

### 5.8 IA
| Función | Retorna |
|---------|---------|
| `get_ia_context()` | Contexto completo para Claude (KPIs, tops, alertas) |

---

## 6. HOOKS DE REACT (Patrón de Data Fetching)

Todos los hooks usan **React Query** para caché y revalidación.

### Patrón Estándar
```typescript
const useInventarioKpis = (fechaInicio, fechaFin, ciudades, tiendas, productos) => {
  return useQuery({
    queryKey: ['inventario-kpis', fechaInicio, fechaFin, ciudades, tiendas, productos],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_inventario_kpis', {
        p_fecha_inicio: fechaInicio,
        p_fecha_fin: fechaFin,
        p_ciudades: ciudades,
        p_tienda_ids: tiendas,
        p_producto_ids: productos
      })
      if (error) throw error
      return data
    },
    staleTime: 5 * 60 * 1000 // 5 minutos
  })
}
```

### Hooks por Módulo

| Archivo | Hooks |
|---------|-------|
| `use-dashboard-metrics.ts` | useDashboardMetrics |
| `use-productos.ts` | useProductosFiltros, useProductosKpis, useProductosTabla, useProductosPareto, useProductosVariacion |
| `use-inventario.ts` | useInventarioFiltros, useInventarioKpis, useInventarioTabla, useInventarioHeatmap, useInventarioEvolucion, useInventarioAlertas, useInventarioTopVentaPerdida |
| `use-precios.ts` | usePreciosFiltros, usePreciosKpis, usePreciosDetalle, usePreciosEvolucion, usePreciosPorCiudad, usePreciosDispersion, usePreciosAlertas |
| `use-reabastecimiento.ts` | useReabastecimientoFiltros, useReabastecimientoKpis, useReabastecimientoTabla, useReabastecimientoABC, useReabastecimientoFillRate, useReabastecimientoAlertasClaseA |
| `use-tiendas.ts` | useTiendasFiltros, useTiendasKpis, useTiendasTabla, useTiendasRanking, useTiendasPorCiudad |
| `use-analisis.ts` | useAnalisisKpisYoY, useAnalisisVentasMensualesYoY, useAnalisisProductosYoY, useAnalisisTiendasYoY, useAnalisisEstacionalidadSemanal, useAnalisisCiudadesYoY |
| `use-chat.ts` | useChat (sendMessage, stopGeneration, loadConversation) |

---

## 7. PÁGINAS Y SU CONEXIÓN CON DATOS

### `/login`
- **Función**: Autenticación email/password
- **Hook**: useAuth().signIn()
- **Redirecciona a**: /dashboard

### `/dashboard`
- **Función**: Vista ejecutiva con KPIs principales
- **Hook**: useDashboardMetrics(dias)
- **Componentes**: KPI Cards (4), TopProductosChart, TopTiendasChart, MixCategoriasChart
- **Filtros**: Rango de días (30/60/90)

### `/productos`
- **Función**: Análisis de rendimiento de SKUs
- **Hooks**: useProductosFiltros, useProductosKpis, useProductosTabla, useProductosPareto, useProductosVariacion
- **Componentes**: KPI Cards, Tabla paginada, Gráfica Pareto, Top Crecimiento/Caída
- **Filtros**: Fecha, Categoría, Tienda, Producto, Búsqueda

### `/inventario`
- **Función**: Control de stock y quiebres (OOS)
- **Hooks**: useInventarioFiltros, useInventarioKpis, useInventarioTabla, useInventarioAlertas, useInventarioEvolucion
- **Componentes**: KPI Cards, Tabla con estados, Alertas, Evolución temporal
- **Filtros**: Fecha, Ciudad, Tienda, Producto, Estado (OK/Bajo/OOS)
- **Estados de Stock**:
  - `OOS` (rojo): inventario = 0
  - `Bajo` (amarillo): < 7 días de cobertura
  - `OK` (verde): >= 7 días de cobertura

### `/precios`
- **Función**: Monitoreo de consistencia de precios
- **Hooks**: usePreciosFiltros, usePreciosKpis, usePreciosDetalle, usePreciosDispersion, usePreciosEvolucion
- **Componentes**: KPI Cards (6), Tabla detalle, Dispersión, Evolución, Alertas
- **Filtros**: Fecha, Ciudad, Producto, Tienda
- **Métricas clave**: Coeficiente de Variación (CV%), precio vs sugerido

### `/reabastecimiento`
- **Función**: Sugerido de compra automatizado
- **Hooks**: useReabastecimientoFiltros, useReabastecimientoKpis, useReabastecimientoTabla, useReabastecimientoABC
- **Componentes**: KPI Cards, Tabla de sugerido, Clasificación ABC, Fill Rate
- **Filtros**: Fecha, Ciudad, Producto, Prioridad, Clasificación ABC
- **Prioridades**:
  - `URGENTE` (rojo): OOS o < 3 días
  - `PRONTO` (amarillo): 3-7 días
  - `OK` (verde): > 7 días

### `/tiendas`
- **Función**: Análisis por punto de venta
- **Hooks**: useTiendasFiltros, useTiendasKpis, useTiendasTabla, useTiendasRanking
- **Componentes**: KPI Cards, Tabla ranking, Top/Bottom tiendas, Ventas por ciudad
- **Filtros**: Fecha, Ciudad, Cluster, Categoría, Producto

### `/analisis`
- **Función**: Comparativo Year-over-Year
- **Hooks**: useAnalisisKpisYoY, useAnalisisVentasMensualesYoY, useAnalisisProductosYoY, useAnalisisTiendasYoY
- **Componentes**: KPI Cards comparativos, Gráfica mensual YoY, Top productos/tiendas YoY
- **Filtros**: Año, Ciudad

### `/ia`
- **Función**: Chat con asistente de IA
- **Hook**: useChat
- **Endpoint**: POST /api/chat
- **Modelo**: Claude (Anthropic)
- **Contexto**: get_ia_context() proporciona KPIs, tops, alertas actuales

---

## 8. API ROUTE - Chat con IA

**Archivo**: `app/api/chat/route.ts`

```typescript
// POST /api/chat
// Body: { message, conversationId, history }
// Response: Server-Sent Events (SSE) con streaming

// Flujo:
// 1. Obtiene contexto de datos con supabase.rpc('get_ia_context')
// 2. Construye prompt con datos actuales (últimos 30 días)
// 3. Llama a Claude con streaming
// 4. Retorna texto parcial como SSE
```

---

## 9. AUTENTICACIÓN

**Archivo**: `lib/auth/auth-context.tsx`

- Usa Supabase Auth (email/password)
- Provee contexto: `user`, `session`, `loading`
- Métodos: `signIn(email, password)`, `signOut()`
- Maneja refresh de tokens automáticamente

---

## 10. CLIENTE SUPABASE

**Archivo**: `lib/supabase/client.ts`

- Patrón Singleton con Proxy
- Configuración:
  - `autoRefreshToken: true`
  - `persistSession: true`
  - `detectSessionInUrl: true`

---

## 11. VARIABLES DE ENTORNO

```env
NEXT_PUBLIC_SUPABASE_URL=https://[project-id].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
ANTHROPIC_API_KEY=sk-ant-...
```

---

## 12. CONCEPTOS CLAVE DEL NEGOCIO

### Sell-Out
Ventas del retailer al consumidor final (vs Sell-In que es del fabricante al retailer).

### OOS (Out of Stock)
Quiebre de inventario. Producto sin stock en tienda = venta perdida.

### Fill Rate
% de días con disponibilidad de producto. Meta: > 95%.

### Clasificación ABC (Pareto)
- **A**: Top 80% de ventas (productos estrella)
- **B**: Siguiente 15% (productos importantes)
- **C**: Último 5% (cola larga)

### Coeficiente de Variación (CV%)
Desviación estándar / Promedio × 100. Mide dispersión de precios.

### DN% (Distribución Numérica)
% de tiendas donde el producto tiene presencia.

### Días de Inventario
Cobertura en días = Inventario actual / Venta promedio diaria.

---

## 13. RESUMEN RÁPIDO

| Aspecto | Valor |
|---------|-------|
| Tablas | 12 |
| Funciones RPC | 60+ |
| Hooks React | 35+ |
| Páginas | 9 |
| Registros de ventas | 46,370 |
| Registros de inventario | 8,524 |
| Productos | 19 |
| Tiendas | 26 |
| Retailers | 2 |

---

## 14. CÓMO MODIFICAR EL PROYECTO

### Agregar nueva función RPC
1. Crear migración en `supabase/migrations/`
2. Agregar tipos en `lib/supabase/types.ts`
3. Crear hook en `hooks/use-[modulo].ts`
4. Usar hook en componente

### Agregar nueva página
1. Crear carpeta en `app/[nombre]/`
2. Crear `page.tsx` con layout
3. Crear hooks necesarios
4. Crear componentes en `components/[nombre]/`

### Modificar tabla existente
1. Crear migración con ALTER TABLE
2. Regenerar tipos con `supabase gen types typescript`
3. Actualizar hooks afectados

---

> **NOTA FINAL**: Este documento debe mantenerse actualizado cuando se agreguen nuevas funcionalidades. Es la fuente de verdad para entender el proyecto.
