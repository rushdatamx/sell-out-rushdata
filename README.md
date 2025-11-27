# RushData - Portal de Inteligencia de Negocios

Plataforma de analytics y predicciones para retail y manufactura en Latinoamérica.

## 🚀 Stack Tecnológico

- **Framework**: Next.js 15 con App Router
- **Lenguaje**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Tremor (dashboards y charts)
- **Data Fetching**: TanStack Query (React Query)
- **Animations**: Framer Motion
- **Backend**: Supabase (PostgreSQL)
- **Validación**: Zod
- **Forms**: React Hook Form

## 📁 Estructura del Proyecto

```
portal-rushdata/
├── app/                      # Next.js App Router
│   ├── dashboard/           # Dashboard principal
│   ├── layout.tsx           # Layout raíz
│   ├── page.tsx            # Página de inicio (redirige a /dashboard)
│   └── globals.css         # Estilos globales
├── components/
│   ├── layout/             # Componentes de layout (Sidebar, Navbar)
│   ├── providers/          # Providers (TanStack Query)
│   └── ui/                 # Componentes UI reutilizables
├── lib/
│   ├── supabase/           # Configuración de Supabase
│   │   ├── client.ts       # Cliente para client components
│   │   ├── server.ts       # Cliente para server components
│   │   └── types.ts        # Tipos generados del schema
│   └── utils.ts            # Utilidades (cn, etc.)
└── .env.local              # Variables de entorno
```

## 🛠️ Instalación

1. Instalar dependencias:
```bash
npm install
```

2. Configurar variables de entorno:
El archivo `.env.local` ya está configurado con las credenciales de Supabase.

3. Ejecutar en desarrollo:
```bash
npm run dev
```

4. Abrir [http://localhost:3000](http://localhost:3000)

## 📊 Funcionalidades

### Dashboard Principal
- KPIs en tiempo real (Ventas, Clientes, Pedidos, Productos)
- Gráficos de tendencias con Tremor
- Alertas y predicciones basadas en IA
- Navegación intuitiva por módulos

### Módulos Planificados
- **Clientes**: Gestión y análisis de clientes B2B
- **Productos**: Catálogo y métricas de productos
- **Ventas**: Histórico y análisis de ventas
- **Inventario**: Control de stock y valorización
- **Producción**: Órdenes y forecast de producción
- **Predicciones**: IA predictiva para demanda y recompra

## 🗄️ Base de Datos

El proyecto está conectado a Supabase con las siguientes tablas principales:

- `tenants`: Multi-tenancy (empresas)
- `usuarios`: Usuarios por tenant
- `dim_clientes`: Clientes B2B
- `dim_productos`: Productos
- `fact_ventas`: Histórico de ventas
- `fact_inventario`: Snapshots de inventario
- `fact_ordenes_produccion`: Órdenes de producción
- `analytics_*`: Tablas de analytics pre-calculadas

## 🔧 Scripts Disponibles

```bash
npm run dev          # Servidor de desarrollo
npm run build        # Build de producción
npm run start        # Servidor de producción
npm run lint         # Linter
npm run type-check   # Verificar tipos TypeScript
```

## 🎨 Componentes UI

Este proyecto usa **Tremor** para componentes de dashboard:

- `Card`: Contenedores de contenido
- `Metric`: Métricas grandes
- `BarChart`: Gráficos de barras
- `DonutChart`: Gráficos de dona
- `ProgressBar`: Barras de progreso
- `Badge`: Etiquetas de estado

Documentación: [tremor.so](https://tremor.so)

## 🔐 Autenticación

Pendiente de implementar con Supabase Auth.

## 📝 Próximos Pasos

1. Implementar autenticación con Supabase Auth
2. Conectar dashboard con datos reales usando TanStack Query
3. Crear páginas para cada módulo (Clientes, Productos, etc.)
4. Implementar filtros de fecha y tenant
5. Agregar exportación de reportes
6. Integrar RushAI (chat conversacional)

---

Desarrollado con ❤️ para RushData
