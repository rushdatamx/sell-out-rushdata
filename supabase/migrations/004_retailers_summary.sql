-- ============================================
-- RushData Sell-Out - Migración 004
-- RPC: get_retailers_summary
-- ============================================
-- Obtiene resumen de métricas por retailer para el Hub

CREATE OR REPLACE FUNCTION get_retailers_summary()
RETURNS TABLE (
  retailer_id INTEGER,
  codigo VARCHAR,
  nombre VARCHAR,
  color_hex VARCHAR,
  ventas_30d NUMERIC,
  variacion_pct NUMERIC,
  tiendas_activas BIGINT,
  skus_activos BIGINT,
  ultima_fecha DATE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tenant_id UUID;
BEGIN
  -- Obtener tenant_id del usuario actual
  SELECT get_user_tenant_id() INTO v_tenant_id;

  IF v_tenant_id IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  WITH periodo_actual AS (
    SELECT
      v.retailer_id,
      SUM(v.venta_pesos) as ventas
    FROM fact_ventas v
    WHERE v.tenant_id = v_tenant_id
      AND v.fecha > CURRENT_DATE - 30
    GROUP BY v.retailer_id
  ),
  periodo_anterior AS (
    SELECT
      v.retailer_id,
      SUM(v.venta_pesos) as ventas
    FROM fact_ventas v
    WHERE v.tenant_id = v_tenant_id
      AND v.fecha BETWEEN CURRENT_DATE - 60 AND CURRENT_DATE - 31
    GROUP BY v.retailer_id
  ),
  tiendas_count AS (
    SELECT
      v.retailer_id,
      COUNT(DISTINCT v.tienda_id) as count
    FROM fact_ventas v
    WHERE v.tenant_id = v_tenant_id
      AND v.fecha > CURRENT_DATE - 30
    GROUP BY v.retailer_id
  ),
  skus_count AS (
    SELECT
      v.retailer_id,
      COUNT(DISTINCT v.producto_id) as count
    FROM fact_ventas v
    WHERE v.tenant_id = v_tenant_id
      AND v.fecha > CURRENT_DATE - 30
    GROUP BY v.retailer_id
  ),
  ultima_fecha_cte AS (
    SELECT
      v.retailer_id,
      MAX(v.fecha) as fecha
    FROM fact_ventas v
    WHERE v.tenant_id = v_tenant_id
    GROUP BY v.retailer_id
  )
  SELECT
    r.id::INTEGER,
    r.codigo::VARCHAR,
    r.nombre::VARCHAR,
    r.color_hex::VARCHAR,
    COALESCE(pa.ventas, 0)::NUMERIC,
    CASE
      WHEN COALESCE(pb.ventas, 0) > 0 THEN
        ROUND(((COALESCE(pa.ventas, 0) - pb.ventas) / pb.ventas * 100)::NUMERIC, 1)
      ELSE 0::NUMERIC
    END,
    COALESCE(tc.count, 0)::BIGINT,
    COALESCE(sc.count, 0)::BIGINT,
    uf.fecha
  FROM dim_retailers r
  LEFT JOIN periodo_actual pa ON r.id = pa.retailer_id
  LEFT JOIN periodo_anterior pb ON r.id = pb.retailer_id
  LEFT JOIN tiendas_count tc ON r.id = tc.retailer_id
  LEFT JOIN skus_count sc ON r.id = sc.retailer_id
  LEFT JOIN ultima_fecha_cte uf ON r.id = uf.retailer_id
  WHERE r.tenant_id = v_tenant_id
    AND r.activo = true
  ORDER BY r.nombre;
END;
$$;

-- Grant para usuarios autenticados
GRANT EXECUTE ON FUNCTION get_retailers_summary() TO authenticated;

-- ============================================
-- FIN DE MIGRACIÓN 004
-- ============================================
