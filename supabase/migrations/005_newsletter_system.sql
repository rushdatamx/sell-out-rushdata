-- ============================================================================
-- Migración 005: Sistema de Newsletter Semanal
-- ============================================================================
-- Implementa tablas y funciones para newsletters automatizados estilo
-- "Spotify Wrapped" con generación de contenido por IA
-- ============================================================================

-- ============================================================================
-- 1. TABLAS
-- ============================================================================

-- Tabla de suscripciones a newsletter
CREATE TABLE IF NOT EXISTS newsletter_subscriptions (
    id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    nombre VARCHAR(255),
    tipo VARCHAR(20) DEFAULT 'ejecutivo',     -- 'ejecutivo', 'operativo'
    frecuencia VARCHAR(20) DEFAULT 'semanal', -- 'semanal', 'mensual'
    retailers JSONB DEFAULT '[]',             -- [1, 5] = retailers específicos, [] = todos
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, email)
);

-- Tabla de newsletters generados
CREATE TABLE IF NOT EXISTS newsletters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    periodo_inicio DATE NOT NULL,
    periodo_fin DATE NOT NULL,
    tipo VARCHAR(20) DEFAULT 'semanal',
    contenido_markdown TEXT NOT NULL,
    contenido_html TEXT,
    metricas_json JSONB,                      -- Datos crudos usados para generar
    generado_con VARCHAR(50),                 -- 'claude-sonnet-4'
    estado VARCHAR(20) DEFAULT 'generado',    -- 'generado', 'enviado', 'fallido'
    enviado_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de envíos individuales (para tracking)
CREATE TABLE IF NOT EXISTS newsletter_sends (
    id SERIAL PRIMARY KEY,
    newsletter_id UUID NOT NULL REFERENCES newsletters(id) ON DELETE CASCADE,
    subscription_id INTEGER NOT NULL REFERENCES newsletter_subscriptions(id),
    email VARCHAR(255) NOT NULL,
    estado VARCHAR(20) DEFAULT 'pendiente',   -- 'pendiente', 'enviado', 'fallido'
    enviado_at TIMESTAMPTZ,
    error_mensaje TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 2. ÍNDICES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_newsletter_subs_tenant
    ON newsletter_subscriptions(tenant_id, activo);

CREATE INDEX IF NOT EXISTS idx_newsletter_subs_frecuencia
    ON newsletter_subscriptions(frecuencia, activo);

CREATE INDEX IF NOT EXISTS idx_newsletters_tenant
    ON newsletters(tenant_id, periodo_fin DESC);

CREATE INDEX IF NOT EXISTS idx_newsletters_estado
    ON newsletters(estado, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_newsletter_sends_estado
    ON newsletter_sends(estado, newsletter_id);

CREATE INDEX IF NOT EXISTS idx_newsletter_sends_newsletter
    ON newsletter_sends(newsletter_id);

-- ============================================================================
-- 3. ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE newsletter_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletters ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_sends ENABLE ROW LEVEL SECURITY;

-- Policies para newsletter_subscriptions
CREATE POLICY "newsletter_subs_tenant_isolation" ON newsletter_subscriptions
    FOR ALL USING (tenant_id = get_user_tenant_id());

-- Policies para newsletters
CREATE POLICY "newsletters_tenant_isolation" ON newsletters
    FOR ALL USING (tenant_id = get_user_tenant_id());

-- Policies para newsletter_sends (acceso via newsletter)
CREATE POLICY "newsletter_sends_tenant_isolation" ON newsletter_sends
    FOR ALL USING (
        newsletter_id IN (
            SELECT id FROM newsletters WHERE tenant_id = get_user_tenant_id()
        )
    );

-- ============================================================================
-- 4. RPC: get_newsletter_metrics
-- ============================================================================
-- Obtiene todas las métricas necesarias para generar un newsletter semanal
-- Retorna JSONB con: resumen global, por retailer, top productos,
-- productos creciendo/cayendo, top tiendas, y alertas de inventario
-- ============================================================================

CREATE OR REPLACE FUNCTION get_newsletter_metrics(
    p_tenant_id UUID,
    p_dias INTEGER DEFAULT 7
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSONB;
    v_fecha_fin DATE := CURRENT_DATE;
    v_fecha_inicio DATE := CURRENT_DATE - p_dias;
    v_fecha_anterior_inicio DATE := v_fecha_inicio - p_dias;
    v_fecha_anterior_fin DATE := v_fecha_inicio - 1;
    v_tenant_nombre TEXT;
BEGIN
    -- Obtener nombre del tenant
    SELECT nombre_empresa INTO v_tenant_nombre
    FROM tenants WHERE id = p_tenant_id;

    SELECT jsonb_build_object(
        'tenant', jsonb_build_object(
            'id', p_tenant_id,
            'nombre', v_tenant_nombre
        ),
        'periodo', jsonb_build_object(
            'inicio', v_fecha_inicio,
            'fin', v_fecha_fin,
            'dias', p_dias
        ),
        'resumen_global', (
            SELECT jsonb_build_object(
                'venta_total', COALESCE(SUM(venta_pesos), 0),
                'unidades_total', COALESCE(SUM(unidades), 0),
                'tiendas_activas', COUNT(DISTINCT tienda_id),
                'productos_activos', COUNT(DISTINCT producto_id),
                'venta_anterior', (
                    SELECT COALESCE(SUM(venta_pesos), 0)
                    FROM fact_ventas
                    WHERE tenant_id = p_tenant_id
                    AND fecha BETWEEN v_fecha_anterior_inicio AND v_fecha_anterior_fin
                ),
                'variacion_pct', ROUND(
                    CASE
                        WHEN (SELECT SUM(venta_pesos) FROM fact_ventas
                              WHERE tenant_id = p_tenant_id
                              AND fecha BETWEEN v_fecha_anterior_inicio AND v_fecha_anterior_fin) > 0
                        THEN ((COALESCE(SUM(venta_pesos), 0) -
                               COALESCE((SELECT SUM(venta_pesos) FROM fact_ventas
                                         WHERE tenant_id = p_tenant_id
                                         AND fecha BETWEEN v_fecha_anterior_inicio AND v_fecha_anterior_fin), 0))
                              / (SELECT SUM(venta_pesos) FROM fact_ventas
                                 WHERE tenant_id = p_tenant_id
                                 AND fecha BETWEEN v_fecha_anterior_inicio AND v_fecha_anterior_fin) * 100)
                        ELSE NULL
                    END::NUMERIC, 1
                )
            )
            FROM fact_ventas
            WHERE tenant_id = p_tenant_id
            AND fecha BETWEEN v_fecha_inicio AND v_fecha_fin
        ),
        'por_retailer', (
            SELECT COALESCE(jsonb_agg(r ORDER BY venta_total DESC), '[]'::jsonb)
            FROM (
                SELECT
                    dr.id as retailer_id,
                    dr.nombre as retailer_nombre,
                    dr.codigo as retailer_codigo,
                    COALESCE(SUM(fv.venta_pesos), 0) as venta_total,
                    COALESCE(SUM(fv.unidades), 0) as unidades_total,
                    COUNT(DISTINCT fv.tienda_id) as tiendas_activas,
                    COUNT(DISTINCT fv.producto_id) as productos_activos
                FROM dim_retailers dr
                LEFT JOIN fact_ventas fv ON fv.retailer_id = dr.id
                    AND fv.tenant_id = p_tenant_id
                    AND fv.fecha BETWEEN v_fecha_inicio AND v_fecha_fin
                WHERE dr.activo = true
                GROUP BY dr.id, dr.nombre, dr.codigo
                HAVING COALESCE(SUM(fv.venta_pesos), 0) > 0
            ) r
        ),
        'top_productos', (
            SELECT COALESCE(jsonb_agg(p), '[]'::jsonb)
            FROM (
                SELECT
                    dp.nombre as producto_nombre,
                    dp.upc,
                    dp.categoria,
                    SUM(fv.venta_pesos) as venta_total,
                    SUM(fv.unidades) as unidades_total,
                    COUNT(DISTINCT fv.tienda_id) as tiendas,
                    ROUND((SUM(fv.venta_pesos) / NULLIF(
                        (SELECT SUM(venta_pesos) FROM fact_ventas
                         WHERE tenant_id = p_tenant_id
                         AND fecha BETWEEN v_fecha_inicio AND v_fecha_fin), 0
                    ) * 100)::NUMERIC, 1) as pct_total
                FROM fact_ventas fv
                JOIN dim_productos dp ON dp.id = fv.producto_id
                WHERE fv.tenant_id = p_tenant_id
                AND fv.fecha BETWEEN v_fecha_inicio AND v_fecha_fin
                GROUP BY dp.id, dp.nombre, dp.upc, dp.categoria
                ORDER BY SUM(fv.venta_pesos) DESC
                LIMIT 5
            ) p
        ),
        'productos_creciendo', (
            SELECT COALESCE(jsonb_agg(p), '[]'::jsonb)
            FROM (
                SELECT
                    dp.nombre as producto_nombre,
                    actual.venta as venta_actual,
                    anterior.venta as venta_anterior,
                    ROUND(((actual.venta - COALESCE(anterior.venta, 0))
                           / NULLIF(anterior.venta, 0) * 100)::NUMERIC, 1) as crecimiento_pct
                FROM (
                    SELECT producto_id, SUM(venta_pesos) as venta
                    FROM fact_ventas
                    WHERE tenant_id = p_tenant_id
                    AND fecha BETWEEN v_fecha_inicio AND v_fecha_fin
                    GROUP BY producto_id
                ) actual
                LEFT JOIN (
                    SELECT producto_id, SUM(venta_pesos) as venta
                    FROM fact_ventas
                    WHERE tenant_id = p_tenant_id
                    AND fecha BETWEEN v_fecha_anterior_inicio AND v_fecha_anterior_fin
                    GROUP BY producto_id
                ) anterior ON actual.producto_id = anterior.producto_id
                JOIN dim_productos dp ON dp.id = actual.producto_id
                WHERE anterior.venta > 0
                AND actual.venta > anterior.venta
                ORDER BY (actual.venta - anterior.venta) / anterior.venta DESC
                LIMIT 3
            ) p
        ),
        'productos_cayendo', (
            SELECT COALESCE(jsonb_agg(p), '[]'::jsonb)
            FROM (
                SELECT
                    dp.nombre as producto_nombre,
                    actual.venta as venta_actual,
                    anterior.venta as venta_anterior,
                    ROUND(((anterior.venta - actual.venta)
                           / NULLIF(anterior.venta, 0) * 100)::NUMERIC, 1) as caida_pct
                FROM (
                    SELECT producto_id, SUM(venta_pesos) as venta
                    FROM fact_ventas
                    WHERE tenant_id = p_tenant_id
                    AND fecha BETWEEN v_fecha_inicio AND v_fecha_fin
                    GROUP BY producto_id
                ) actual
                LEFT JOIN (
                    SELECT producto_id, SUM(venta_pesos) as venta
                    FROM fact_ventas
                    WHERE tenant_id = p_tenant_id
                    AND fecha BETWEEN v_fecha_anterior_inicio AND v_fecha_anterior_fin
                    GROUP BY producto_id
                ) anterior ON actual.producto_id = anterior.producto_id
                JOIN dim_productos dp ON dp.id = actual.producto_id
                WHERE anterior.venta > 0
                AND actual.venta < anterior.venta
                ORDER BY (anterior.venta - actual.venta) / anterior.venta DESC
                LIMIT 3
            ) p
        ),
        'top_tiendas', (
            SELECT COALESCE(jsonb_agg(t), '[]'::jsonb)
            FROM (
                SELECT
                    dt.nombre as tienda_nombre,
                    dt.ciudad,
                    dr.nombre as retailer,
                    SUM(fv.venta_pesos) as venta_total,
                    SUM(fv.unidades) as unidades_total,
                    COUNT(DISTINCT fv.producto_id) as productos_vendidos
                FROM fact_ventas fv
                JOIN dim_tiendas dt ON dt.id = fv.tienda_id
                JOIN dim_retailers dr ON dr.id = fv.retailer_id
                WHERE fv.tenant_id = p_tenant_id
                AND fv.fecha BETWEEN v_fecha_inicio AND v_fecha_fin
                GROUP BY dt.id, dt.nombre, dt.ciudad, dr.nombre
                ORDER BY SUM(fv.venta_pesos) DESC
                LIMIT 5
            ) t
        ),
        'alertas_inventario', (
            SELECT COALESCE(jsonb_agg(a), '[]'::jsonb)
            FROM (
                SELECT
                    dp.nombre as producto_nombre,
                    fi.inventario_unidades as inventario_actual,
                    ROUND(venta_30d.venta_diaria::NUMERIC, 1) as venta_diaria_prom,
                    CASE
                        WHEN venta_30d.venta_diaria > 0
                        THEN ROUND((fi.inventario_unidades / venta_30d.venta_diaria)::NUMERIC, 0)
                        ELSE 999
                    END as dias_cobertura,
                    CASE
                        WHEN fi.inventario_unidades = 0 THEN 'SIN_STOCK'
                        WHEN venta_30d.venta_diaria > 0
                             AND fi.inventario_unidades / venta_30d.venta_diaria < 7 THEN 'CRITICO'
                        WHEN venta_30d.venta_diaria > 0
                             AND fi.inventario_unidades / venta_30d.venta_diaria < 15 THEN 'BAJO'
                        ELSE 'OK'
                    END as alerta,
                    CASE
                        WHEN venta_30d.venta_diaria > 0
                             AND fi.inventario_unidades / venta_30d.venta_diaria < 15
                        THEN ROUND((venta_30d.venta_diaria * 15 - fi.inventario_unidades)::NUMERIC, 0)
                        ELSE 0
                    END as sugerido_reorden
                FROM (
                    SELECT DISTINCT ON (producto_id)
                        producto_id,
                        inventario_unidades,
                        fecha
                    FROM fact_inventario
                    WHERE tenant_id = p_tenant_id
                    ORDER BY producto_id, fecha DESC
                ) fi
                JOIN dim_productos dp ON dp.id = fi.producto_id
                LEFT JOIN (
                    SELECT
                        producto_id,
                        SUM(unidades)::FLOAT / 30 as venta_diaria
                    FROM fact_ventas
                    WHERE tenant_id = p_tenant_id
                    AND fecha >= CURRENT_DATE - 30
                    GROUP BY producto_id
                ) venta_30d ON venta_30d.producto_id = fi.producto_id
                WHERE fi.inventario_unidades = 0
                   OR (venta_30d.venta_diaria > 0
                       AND fi.inventario_unidades / venta_30d.venta_diaria < 15)
                ORDER BY
                    CASE
                        WHEN fi.inventario_unidades = 0 THEN 0
                        ELSE fi.inventario_unidades / NULLIF(venta_30d.venta_diaria, 0)
                    END
                LIMIT 5
            ) a
        )
    ) INTO result;

    RETURN result;
END;
$$;

-- ============================================================================
-- 5. COMENTARIOS DE DOCUMENTACIÓN
-- ============================================================================

COMMENT ON TABLE newsletter_subscriptions IS
'Lista de suscriptores de newsletter por tenant. Permite configurar frecuencia y retailers específicos.';

COMMENT ON TABLE newsletters IS
'Newsletters generados por IA. Almacena contenido markdown y HTML junto con métricas usadas.';

COMMENT ON TABLE newsletter_sends IS
'Registro de envíos individuales para tracking de entregas y errores.';

COMMENT ON FUNCTION get_newsletter_metrics IS
'Obtiene métricas completas para generar newsletter semanal: KPIs globales, por retailer, productos top/creciendo/cayendo, tiendas top, y alertas de inventario.';

-- ============================================================================
-- FIN DE MIGRACIÓN 005
-- ============================================================================
