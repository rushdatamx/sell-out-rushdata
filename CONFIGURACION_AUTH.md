# Configuración de Autenticación Multi-Tenant

## Sistema Implementado

Se ha configurado un sistema de autenticación ESCALABLE multi-tenant usando:
- ✅ Supabase Auth para autenticación
- ✅ Row Level Security (RLS) para aislamiento de datos por tenant
- ✅ Políticas RLS en todas las tablas
- ✅ Función helper `get_user_tenant_id()` para obtener el tenant del usuario autenticado

## Cómo Funciona

1. **Usuario se autentica** con Supabase Auth (email/password)
2. **auth.uid()** retorna el ID del usuario autenticado
3. **get_user_tenant_id()** busca el `tenant_id` del usuario en la tabla `usuarios`
4. **Políticas RLS** filtran automáticamente todos los datos por `tenant_id`

## Crear Usuario en Supabase Auth

Para que el dashboard funcione, necesitas crear un usuario en Supabase Auth con el mismo ID que existe en la tabla `usuarios`.

### Opción 1: Crear desde Supabase Dashboard (Recomendado)

1. Ve a tu proyecto en Supabase Dashboard
2. Navega a **Authentication > Users**
3. Click en **Add User > Create new user**
4. Ingresa:
   - **Email**: `demo@galletasdelnorte.mx`
   - **Password**: (elige una contraseña segura, ej: `Demo123456!`)
   - **Auto Confirm User**: ✅ (activar)
5. Click en **Create User**

### Opción 2: Vincular usuario existente con ID específico

Si ya creaste un usuario y necesitas vincularlo con el registro en la tabla `usuarios`:

```sql
-- 1. Obtener el UUID del usuario creado en Auth
SELECT id, email FROM auth.users WHERE email = 'demo@galletasdelnorte.mx';

-- 2. Actualizar la tabla usuarios con ese UUID
UPDATE public.usuarios
SET id = '<UUID_DEL_USUARIO_AUTH>'
WHERE email = 'demo@galletasdelnorte.mx';
```

### Opción 3: Crear usuario con SQL (para desarrollo)

```sql
-- NOTA: Este método solo funciona con service_role key, NO desde el frontend

-- 1. Crear usuario en Auth
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_user_meta_data,
  raw_app_meta_data,
  aud,
  role
) VALUES (
  '550e8400-e29b-41d4-a716-446655440000', -- ID que ya existe en usuarios table
  'demo@galletasdelnorte.mx',
  crypt('Demo123456!', gen_salt('bf')), -- Reemplaza con tu contraseña
  NOW(),
  NOW(),
  NOW(),
  '{}',
  '{}',
  'authenticated',
  'authenticated'
);
```

## Credenciales de Demostración

Una vez configurado, puedes usar:
- **Email**: `demo@galletasdelnorte.mx`
- **Password**: La que configuraste
- **Tenant**: Galletas del Norte (automático)

## Verificar que funciona

1. Inicia sesión en `/login`
2. Deberías ser redirigido a `/dashboard`
3. Los datos deberían aparecer (ventas, productos, clientes, etc.)
4. Solo verás datos del tenant "Galletas del Norte"

## Arquitectura de Seguridad

### Tablas con RLS habilitado:
- ✅ dim_clientes
- ✅ dim_productos
- ✅ fact_ventas
- ✅ fact_inventario
- ✅ fact_ordenes_produccion
- ✅ analytics_clientes_metricas
- ✅ analytics_predicciones_compra
- ✅ analytics_forecast_produccion
- ✅ data_sources
- ✅ sync_logs
- ✅ rushai_chats
- ✅ rushai_queries_log

### Tablas sin RLS (compartidas):
- dim_fecha (compartida entre todos los tenants)
- tenants (información pública de empresas)
- usuarios (manejado por políticas específicas)

## Políticas RLS Creadas

Cada tabla con RLS tiene 4 políticas:
1. **SELECT**: `Users can view their tenant's [resource]`
2. **INSERT**: `Users can insert [resource] for their tenant`
3. **UPDATE**: `Users can update their tenant's [resource]`
4. **DELETE**: `Users can delete their tenant's [resource]`

Todas usan la función `public.get_user_tenant_id()` para verificar el tenant.

## Agregar Nuevos Usuarios

Para agregar más usuarios a un tenant:

```sql
-- Opción A: Crear en Supabase Auth Dashboard primero, luego:
INSERT INTO public.usuarios (
  id, -- UUID del usuario de Auth
  tenant_id,
  email,
  nombre_completo,
  rol,
  activo
) VALUES (
  '<UUID_USUARIO_AUTH>',
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', -- Galletas del Norte
  'nuevo@galletasdelnorte.mx',
  'Nombre del Usuario',
  'analyst', -- owner, admin, analyst, viewer
  true
);
```

## Agregar Nuevos Tenants

Para agregar una nueva empresa (tenant):

```sql
-- 1. Crear tenant
INSERT INTO public.tenants (
  nombre_empresa,
  razon_social,
  rfc,
  contacto_email,
  plan,
  estado
) VALUES (
  'Nueva Empresa',
  'Nueva Empresa S.A. de C.V.',
  'NEE123456ABC',
  'contacto@nuevaempresa.mx',
  'growth',
  'trial'
) RETURNING id;

-- 2. Crear usuario owner en Auth (desde Dashboard)
-- 3. Vincular usuario con el nuevo tenant
INSERT INTO public.usuarios (
  id, -- UUID del usuario de Auth
  tenant_id, -- ID del tenant creado en paso 1
  email,
  nombre_completo,
  rol,
  activo
) VALUES (
  '<UUID_USUARIO_AUTH>',
  '<TENANT_ID>',
  'owner@nuevaempresa.mx',
  'Owner de Nueva Empresa',
  'owner',
  true
);
```

## Solución de Problemas

### "No aparecen datos en el dashboard"
- Verifica que el usuario esté autenticado (sesión activa)
- Verifica que el usuario exista en la tabla `usuarios` con el tenant_id correcto
- Verifica que el tenant tenga datos en las tablas fact_*

### "Permission denied" al hacer queries
- Verifica que RLS esté habilitado en la tabla
- Verifica que existan las políticas RLS
- Verifica que `get_user_tenant_id()` retorne un UUID válido

### Probar la función helper
```sql
-- Desde una sesión autenticada:
SELECT public.get_user_tenant_id();
-- Debe retornar el UUID del tenant

-- Ver qué usuario está autenticado:
SELECT auth.uid();
-- Debe retornar el UUID del usuario
```

## Próximos Pasos

1. ✅ Crear usuario en Supabase Auth
2. ✅ Iniciar sesión en `/login`
3. ✅ Verificar que el dashboard muestre datos
4. 🔄 Crear páginas adicionales (Clientes, Productos, Ventas, etc.)
5. 🔄 Implementar signup para auto-registro de nuevos tenants
6. 🔄 Implementar roles y permisos granulares

## Recursos

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Multi-Tenant Best Practices](https://supabase.com/docs/guides/auth/row-level-security#multi-tenancy)
