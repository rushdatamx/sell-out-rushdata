-- ============================================
-- RushData Sell-Out - Migración Inicial
-- ============================================
-- Ejecutar en Supabase SQL Editor en orden
-- ============================================

-- ============================================
-- 1. TABLA: tenants (Fabricantes)
-- ============================================
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre_empresa VARCHAR(255) NOT NULL,
    contacto_email VARCHAR(255) NOT NULL,
    plan VARCHAR(50) DEFAULT 'basic', -- basic, pro, enterprise
    estado VARCHAR(20) DEFAULT 'activo', -- activo, suspendido, cancelado
    config JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tenants_updated_at
    BEFORE UPDATE ON tenants
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 2. TABLA: users (Usuarios del sistema)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    nombre VARCHAR(255),
    avatar_url VARCHAR(500),
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_login TIMESTAMPTZ
);

CREATE INDEX idx_users_tenant ON users(tenant_id);

-- ============================================
-- 3. TABLA: dim_fecha (Dimensión Temporal)
-- ============================================
CREATE TABLE IF NOT EXISTS dim_fecha (
    fecha DATE PRIMARY KEY,
    anio INTEGER NOT NULL,
    mes INTEGER NOT NULL,
    dia INTEGER NOT NULL,
    dia_semana INTEGER NOT NULL, -- 1=Lunes, 7=Domingo (ISO)
    nombre_dia VARCHAR(15) NOT NULL,
    nombre_mes VARCHAR(15) NOT NULL,
    semana_anio INTEGER NOT NULL,
    trimestre INTEGER NOT NULL,
    es_fin_semana BOOLEAN NOT NULL,
    fecha_anio_anterior DATE
);

-- Función para poblar dim_fecha
CREATE OR REPLACE FUNCTION poblar_dim_fecha(fecha_inicio DATE, fecha_fin DATE)
RETURNS void AS $$
DECLARE
    fecha_actual DATE := fecha_inicio;
    nombres_dias TEXT[] := ARRAY['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    nombres_meses TEXT[] := ARRAY['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
BEGIN
    WHILE fecha_actual <= fecha_fin LOOP
        INSERT INTO dim_fecha (
            fecha,
            anio,
            mes,
            dia,
            dia_semana,
            nombre_dia,
            nombre_mes,
            semana_anio,
            trimestre,
            es_fin_semana,
            fecha_anio_anterior
        ) VALUES (
            fecha_actual,
            EXTRACT(YEAR FROM fecha_actual),
            EXTRACT(MONTH FROM fecha_actual),
            EXTRACT(DAY FROM fecha_actual),
            EXTRACT(ISODOW FROM fecha_actual),
            nombres_dias[EXTRACT(ISODOW FROM fecha_actual)::INTEGER],
            nombres_meses[EXTRACT(MONTH FROM fecha_actual)::INTEGER],
            EXTRACT(WEEK FROM fecha_actual),
            EXTRACT(QUARTER FROM fecha_actual),
            EXTRACT(ISODOW FROM fecha_actual) IN (6, 7),
            fecha_actual - INTERVAL '1 year'
        ) ON CONFLICT (fecha) DO NOTHING;

        fecha_actual := fecha_actual + INTERVAL '1 day';
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Poblar dim_fecha de 2020 a 2030
SELECT poblar_dim_fecha('2020-01-01'::DATE, '2030-12-31'::DATE);

-- ============================================
-- 4. TABLA: dim_retailers (Cadenas)
-- ============================================
CREATE TABLE IF NOT EXISTS dim_retailers (
    id SERIAL PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
    codigo VARCHAR(50) NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    color_hex VARCHAR(7) DEFAULT '#6366f1',
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, codigo)
);

CREATE INDEX idx_retailers_tenant ON dim_retailers(tenant_id);

-- ============================================
-- 5. TABLA: dim_tiendas (Sucursales)
-- ============================================
CREATE TABLE IF NOT EXISTS dim_tiendas (
    id SERIAL PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
    retailer_id INTEGER REFERENCES dim_retailers(id) ON DELETE CASCADE NOT NULL,
    codigo_tienda VARCHAR(100) NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    ciudad VARCHAR(100),
    estado VARCHAR(100),
    region VARCHAR(100),
    cluster VARCHAR(50),
    formato VARCHAR(50),
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, retailer_id, codigo_tienda)
);

CREATE INDEX idx_tiendas_tenant_retailer ON dim_tiendas(tenant_id, retailer_id);
CREATE INDEX idx_tiendas_cluster ON dim_tiendas(tenant_id, cluster) WHERE cluster IS NOT NULL;

CREATE TRIGGER update_tiendas_updated_at
    BEFORE UPDATE ON dim_tiendas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 6. TABLA: dim_productos (Catálogo)
-- ============================================
CREATE TABLE IF NOT EXISTS dim_productos (
    id SERIAL PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
    upc VARCHAR(20) NOT NULL,
    sku_fabricante VARCHAR(50),
    nombre VARCHAR(255) NOT NULL,
    descripcion_corta VARCHAR(100),
    categoria VARCHAR(100),
    subcategoria VARCHAR(100),
    marca VARCHAR(100),
    case_pack INTEGER, -- NULL si no se conoce
    precio_sugerido DECIMAL(12,2),
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, upc)
);

CREATE INDEX idx_productos_tenant ON dim_productos(tenant_id);
CREATE INDEX idx_productos_categoria ON dim_productos(tenant_id, categoria);
CREATE INDEX idx_productos_marca ON dim_productos(tenant_id, marca);

CREATE TRIGGER update_productos_updated_at
    BEFORE UPDATE ON dim_productos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 7. TABLA: fact_ventas (Ventas Diarias)
-- ============================================
CREATE TABLE IF NOT EXISTS fact_ventas (
    id BIGSERIAL PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
    retailer_id INTEGER REFERENCES dim_retailers(id) ON DELETE CASCADE NOT NULL,
    tienda_id INTEGER REFERENCES dim_tiendas(id) ON DELETE CASCADE NOT NULL,
    producto_id INTEGER REFERENCES dim_productos(id) ON DELETE CASCADE NOT NULL,
    fecha DATE REFERENCES dim_fecha(fecha) NOT NULL,
    unidades INTEGER NOT NULL DEFAULT 0,
    venta_pesos DECIMAL(12,2) NOT NULL DEFAULT 0,
    precio_unitario DECIMAL(12,2),
    precio_calculado DECIMAL(12,2) GENERATED ALWAYS AS (
        CASE WHEN unidades > 0 THEN ROUND(venta_pesos / unidades, 2) ELSE NULL END
    ) STORED,
    upload_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, retailer_id, tienda_id, producto_id, fecha)
);

CREATE INDEX idx_ventas_tenant_fecha ON fact_ventas(tenant_id, fecha DESC);
CREATE INDEX idx_ventas_tenant_retailer_fecha ON fact_ventas(tenant_id, retailer_id, fecha DESC);
CREATE INDEX idx_ventas_producto_fecha ON fact_ventas(tenant_id, producto_id, fecha DESC);
CREATE INDEX idx_ventas_tienda_fecha ON fact_ventas(tenant_id, tienda_id, fecha DESC);

-- ============================================
-- 8. TABLA: fact_inventario (Inventario Diario)
-- ============================================
CREATE TABLE IF NOT EXISTS fact_inventario (
    id BIGSERIAL PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
    retailer_id INTEGER REFERENCES dim_retailers(id) ON DELETE CASCADE NOT NULL,
    tienda_id INTEGER REFERENCES dim_tiendas(id) ON DELETE CASCADE NOT NULL,
    producto_id INTEGER REFERENCES dim_productos(id) ON DELETE CASCADE NOT NULL,
    fecha DATE REFERENCES dim_fecha(fecha) NOT NULL,
    inventario_unidades INTEGER NOT NULL DEFAULT 0,
    upload_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, retailer_id, tienda_id, producto_id, fecha)
);

CREATE INDEX idx_inventario_tenant_fecha ON fact_inventario(tenant_id, fecha DESC);
CREATE INDEX idx_inventario_producto_fecha ON fact_inventario(tenant_id, producto_id, fecha DESC);
CREATE INDEX idx_inventario_tienda_fecha ON fact_inventario(tenant_id, tienda_id, fecha DESC);

-- ============================================
-- 9. TABLA: config_retailer_mapping
-- ============================================
CREATE TABLE IF NOT EXISTS config_retailer_mapping (
    id SERIAL PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
    retailer_id INTEGER REFERENCES dim_retailers(id) ON DELETE CASCADE NOT NULL,
    tipo_archivo VARCHAR(20) NOT NULL, -- 'ventas', 'inventario'
    column_mapping JSONB NOT NULL,
    date_format VARCHAR(50) DEFAULT 'YYYY-MM-DD',
    skip_rows INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, retailer_id, tipo_archivo)
);

CREATE TRIGGER update_mapping_updated_at
    BEFORE UPDATE ON config_retailer_mapping
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 10. TABLA: data_uploads (Historial de Cargas)
-- ============================================
CREATE TABLE IF NOT EXISTS data_uploads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
    retailer_id INTEGER REFERENCES dim_retailers(id) ON DELETE CASCADE NOT NULL,
    nombre_archivo VARCHAR(255) NOT NULL,
    tipo_archivo VARCHAR(20) NOT NULL, -- 'ventas', 'inventario'
    estado VARCHAR(20) DEFAULT 'pendiente', -- pendiente, procesando, completado, error
    registros_totales INTEGER DEFAULT 0,
    registros_insertados INTEGER DEFAULT 0,
    registros_actualizados INTEGER DEFAULT 0,
    registros_con_error INTEGER DEFAULT 0,
    errores JSONB,
    fecha_inicio DATE,
    fecha_fin DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX idx_uploads_tenant ON data_uploads(tenant_id, created_at DESC);
CREATE INDEX idx_uploads_estado ON data_uploads(tenant_id, estado);

-- ============================================
-- 11. VISTA MATERIALIZADA: mv_metricas_producto_tienda
-- ============================================
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_metricas_producto_tienda AS
SELECT
    v.tenant_id,
    v.retailer_id,
    v.tienda_id,
    v.producto_id,

    -- Últimos 7 días
    COALESCE(SUM(v.unidades) FILTER (WHERE v.fecha > CURRENT_DATE - 7), 0) AS unidades_7d,
    COALESCE(SUM(v.venta_pesos) FILTER (WHERE v.fecha > CURRENT_DATE - 7), 0) AS venta_7d,

    -- Últimos 30 días
    COALESCE(SUM(v.unidades) FILTER (WHERE v.fecha > CURRENT_DATE - 30), 0) AS unidades_30d,
    COALESCE(SUM(v.venta_pesos) FILTER (WHERE v.fecha > CURRENT_DATE - 30), 0) AS venta_30d,
    COUNT(*) FILTER (WHERE v.fecha > CURRENT_DATE - 30 AND v.unidades > 0) AS dias_con_venta_30d,

    -- Venta promedio diaria
    ROUND(
        COALESCE(SUM(v.unidades) FILTER (WHERE v.fecha > CURRENT_DATE - 30), 0)::NUMERIC /
        NULLIF(COUNT(*) FILTER (WHERE v.fecha > CURRENT_DATE - 30 AND v.unidades > 0), 0),
        2
    ) AS venta_promedio_diaria,

    -- Último inventario conocido (subconsulta)
    (
        SELECT i.inventario_unidades
        FROM fact_inventario i
        WHERE i.tenant_id = v.tenant_id
          AND i.tienda_id = v.tienda_id
          AND i.producto_id = v.producto_id
        ORDER BY i.fecha DESC
        LIMIT 1
    ) AS inventario_actual,

    -- Fecha del último inventario
    (
        SELECT i.fecha
        FROM fact_inventario i
        WHERE i.tenant_id = v.tenant_id
          AND i.tienda_id = v.tienda_id
          AND i.producto_id = v.producto_id
        ORDER BY i.fecha DESC
        LIMIT 1
    ) AS fecha_inventario,

    -- Última fecha con venta
    MAX(v.fecha) FILTER (WHERE v.unidades > 0) AS ultima_venta,

    -- Timestamp de actualización
    NOW() AS updated_at

FROM fact_ventas v
WHERE v.fecha > CURRENT_DATE - 90
GROUP BY v.tenant_id, v.retailer_id, v.tienda_id, v.producto_id;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_metricas
ON mv_metricas_producto_tienda(tenant_id, retailer_id, tienda_id, producto_id);

-- Función para refrescar la vista materializada
CREATE OR REPLACE FUNCTION refresh_mv_metricas()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_metricas_producto_tienda;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 12. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Habilitar RLS
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE dim_retailers ENABLE ROW LEVEL SECURITY;
ALTER TABLE dim_tiendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE dim_productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE fact_ventas ENABLE ROW LEVEL SECURITY;
ALTER TABLE fact_inventario ENABLE ROW LEVEL SECURITY;
ALTER TABLE config_retailer_mapping ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_uploads ENABLE ROW LEVEL SECURITY;

-- Función helper para obtener tenant_id del usuario actual
CREATE OR REPLACE FUNCTION get_user_tenant_id()
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT tenant_id
        FROM users
        WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Políticas para tenants (solo su propio tenant)
CREATE POLICY "Users can view their own tenant" ON tenants
    FOR SELECT USING (id = get_user_tenant_id());

-- Políticas para users
CREATE POLICY "Users can view users in their tenant" ON users
    FOR SELECT USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (id = auth.uid());

-- Políticas para dim_retailers
CREATE POLICY "Tenant isolation on retailers" ON dim_retailers
    FOR ALL USING (tenant_id = get_user_tenant_id());

-- Políticas para dim_tiendas
CREATE POLICY "Tenant isolation on tiendas" ON dim_tiendas
    FOR ALL USING (tenant_id = get_user_tenant_id());

-- Políticas para dim_productos
CREATE POLICY "Tenant isolation on productos" ON dim_productos
    FOR ALL USING (tenant_id = get_user_tenant_id());

-- Políticas para fact_ventas
CREATE POLICY "Tenant isolation on ventas" ON fact_ventas
    FOR ALL USING (tenant_id = get_user_tenant_id());

-- Políticas para fact_inventario
CREATE POLICY "Tenant isolation on inventario" ON fact_inventario
    FOR ALL USING (tenant_id = get_user_tenant_id());

-- Políticas para config_retailer_mapping
CREATE POLICY "Tenant isolation on mapping" ON config_retailer_mapping
    FOR ALL USING (tenant_id = get_user_tenant_id());

-- Políticas para data_uploads
CREATE POLICY "Tenant isolation on uploads" ON data_uploads
    FOR ALL USING (tenant_id = get_user_tenant_id());

-- ============================================
-- 13. GRANTS (Permisos para el rol anon y authenticated)
-- ============================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON dim_fecha TO anon, authenticated;
GRANT ALL ON tenants TO authenticated;
GRANT ALL ON users TO authenticated;
GRANT ALL ON dim_retailers TO authenticated;
GRANT ALL ON dim_tiendas TO authenticated;
GRANT ALL ON dim_productos TO authenticated;
GRANT ALL ON fact_ventas TO authenticated;
GRANT ALL ON fact_inventario TO authenticated;
GRANT ALL ON config_retailer_mapping TO authenticated;
GRANT ALL ON data_uploads TO authenticated;
GRANT SELECT ON mv_metricas_producto_tienda TO authenticated;

-- Grants para sequences
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ============================================
-- FIN DE MIGRACIÓN INICIAL
-- ============================================