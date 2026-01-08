-- =====================================================
-- Migración 006: RPCs para Análisis de Promociones
-- =====================================================
-- Funciones para análisis de promociones en tiempo real
-- Solo para HEB inicialmente (retailer_id = 1)
-- =====================================================

-- =====================================================
-- 1. RPC: get_promocion_filtros
-- Obtiene las opciones disponibles para el wizard
-- =====================================================
CREATE OR REPLACE FUNCTION get_promocion_filtros(
  p_retailer_id INTEGER DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tenant_id UUID;
  v_result JSON;
BEGIN
  -- Obtener tenant del usuario actual
  SELECT tenant_id INTO v_tenant_id
  FROM users WHERE id = auth.uid();

  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no tiene tenant asignado';
  END IF;

  SELECT json_build_object(
    'productos', (
      SELECT COALESCE(json_agg(json_build_object(
        'id', p.id,
        'nombre', p.nombre,
        'upc', p.upc,
        'categoria', p.categoria,
        'marca', p.marca
      ) ORDER BY p.nombre), '[]'::json)
      FROM dim_productos p
      WHERE p.tenant_id = v_tenant_id
        AND p.activo = true
        AND (p_retailer_id IS NULL OR EXISTS(
          SELECT 1 FROM fact_ventas v
          WHERE v.producto_id = p.id
            AND v.retailer_id = p_retailer_id
            AND v.tenant_id = v_tenant_id
          LIMIT 1
        ))
    ),
    'categorias', (
      SELECT COALESCE(json_agg(DISTINCT p.categoria ORDER BY p.categoria), '[]'::json)
      FROM dim_productos p
      WHERE p.tenant_id = v_tenant_id
        AND p.activo = true
        AND p.categoria IS NOT NULL
    ),
    'tiendas', (
      SELECT COALESCE(json_agg(json_build_object(
        'id', t.id,
        'nombre', t.nombre,
        'ciudad', t.ciudad,
        'codigo', t.codigo_tienda
      ) ORDER BY t.nombre), '[]'::json)
      FROM dim_tiendas t
      WHERE t.tenant_id = v_tenant_id
        AND t.activo = true
        AND (p_retailer_id IS NULL OR t.retailer_id = p_retailer_id)
    ),
    'ciudades', (
      SELECT COALESCE(json_agg(DISTINCT t.ciudad ORDER BY t.ciudad), '[]'::json)
      FROM dim_tiendas t
      WHERE t.tenant_id = v_tenant_id
        AND t.activo = true
        AND t.ciudad IS NOT NULL
        AND (p_retailer_id IS NULL OR t.retailer_id = p_retailer_id)
    ),
    'fecha_min', (
      SELECT MIN(fecha)::text
      FROM fact_ventas
      WHERE tenant_id = v_tenant_id
        AND (p_retailer_id IS NULL OR retailer_id = p_retailer_id)
    ),
    'fecha_max', (
      SELECT MAX(fecha)::text
      FROM fact_ventas
      WHERE tenant_id = v_tenant_id
        AND (p_retailer_id IS NULL OR retailer_id = p_retailer_id)
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- =====================================================
-- 2. RPC: get_promocion_ventas_periodo
-- Obtiene ventas detalladas para un período específico
-- =====================================================
CREATE OR REPLACE FUNCTION get_promocion_ventas_periodo(
  p_producto_ids INTEGER[],
  p_fecha_inicio DATE,
  p_fecha_fin DATE,
  p_tienda_ids INTEGER[] DEFAULT NULL,
  p_ciudades TEXT[] DEFAULT NULL,
  p_retailer_id INTEGER DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tenant_id UUID;
BEGIN
  -- Obtener tenant del usuario actual
  SELECT tenant_id INTO v_tenant_id
  FROM users WHERE id = auth.uid();

  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no tiene tenant asignado';
  END IF;

  RETURN json_build_object(
    'totales', (
      SELECT json_build_object(
        'venta_total', COALESCE(SUM(v.venta_pesos), 0),
        'unidades_total', COALESCE(SUM(v.unidades), 0),
        'transacciones', COUNT(*),
        'precio_promedio', CASE
          WHEN SUM(v.unidades) > 0 THEN ROUND((SUM(v.venta_pesos) / SUM(v.unidades))::numeric, 2)
          ELSE NULL
        END,
        'tiendas_con_venta', COUNT(DISTINCT v.tienda_id),
        'dias_con_venta', COUNT(DISTINCT v.fecha)
      )
      FROM fact_ventas v
      JOIN dim_tiendas t ON t.id = v.tienda_id
      WHERE v.tenant_id = v_tenant_id
        AND v.producto_id = ANY(p_producto_ids)
        AND v.fecha BETWEEN p_fecha_inicio AND p_fecha_fin
        AND (p_retailer_id IS NULL OR v.retailer_id = p_retailer_id)
        AND (p_tienda_ids IS NULL OR v.tienda_id = ANY(p_tienda_ids))
        AND (p_ciudades IS NULL OR t.ciudad = ANY(p_ciudades))
    ),
    'por_producto', (
      SELECT COALESCE(json_agg(row_to_json(prod) ORDER BY prod.venta DESC), '[]'::json)
      FROM (
        SELECT
          p.id AS producto_id,
          p.nombre AS producto_nombre,
          p.upc,
          p.categoria,
          COALESCE(SUM(v.venta_pesos), 0)::numeric AS venta,
          COALESCE(SUM(v.unidades), 0)::integer AS unidades,
          CASE
            WHEN SUM(v.unidades) > 0 THEN ROUND((SUM(v.venta_pesos) / SUM(v.unidades))::numeric, 2)
            ELSE NULL
          END AS precio_promedio,
          COUNT(DISTINCT v.tienda_id)::integer AS tiendas,
          COUNT(DISTINCT v.fecha)::integer AS dias_venta
        FROM dim_productos p
        LEFT JOIN fact_ventas v ON v.producto_id = p.id
          AND v.tenant_id = v_tenant_id
          AND v.fecha BETWEEN p_fecha_inicio AND p_fecha_fin
          AND (p_retailer_id IS NULL OR v.retailer_id = p_retailer_id)
          AND (p_tienda_ids IS NULL OR v.tienda_id = ANY(p_tienda_ids))
        LEFT JOIN dim_tiendas t ON t.id = v.tienda_id
          AND (p_ciudades IS NULL OR t.ciudad = ANY(p_ciudades))
        WHERE p.id = ANY(p_producto_ids)
          AND p.tenant_id = v_tenant_id
        GROUP BY p.id, p.nombre, p.upc, p.categoria
      ) prod
    ),
    'serie_diaria', (
      SELECT COALESCE(json_agg(row_to_json(dia) ORDER BY dia.fecha), '[]'::json)
      FROM (
        SELECT
          v.fecha::text,
          SUM(v.venta_pesos)::numeric AS venta,
          SUM(v.unidades)::integer AS unidades,
          CASE
            WHEN SUM(v.unidades) > 0 THEN ROUND((SUM(v.venta_pesos) / SUM(v.unidades))::numeric, 2)
            ELSE NULL
          END AS precio_promedio
        FROM fact_ventas v
        JOIN dim_tiendas t ON t.id = v.tienda_id
        WHERE v.tenant_id = v_tenant_id
          AND v.producto_id = ANY(p_producto_ids)
          AND v.fecha BETWEEN p_fecha_inicio AND p_fecha_fin
          AND (p_retailer_id IS NULL OR v.retailer_id = p_retailer_id)
          AND (p_tienda_ids IS NULL OR v.tienda_id = ANY(p_tienda_ids))
          AND (p_ciudades IS NULL OR t.ciudad = ANY(p_ciudades))
        GROUP BY v.fecha
      ) dia
    )
  );
END;
$$;

-- =====================================================
-- 3. RPC: get_promocion_canibalizacion
-- Analiza el impacto en otros productos de la misma categoría
-- =====================================================
CREATE OR REPLACE FUNCTION get_promocion_canibalizacion(
  p_producto_ids INTEGER[],
  p_categoria TEXT,
  p_fecha_inicio_promo DATE,
  p_fecha_fin_promo DATE,
  p_fecha_inicio_baseline DATE,
  p_fecha_fin_baseline DATE,
  p_retailer_id INTEGER DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tenant_id UUID;
BEGIN
  -- Obtener tenant del usuario actual
  SELECT tenant_id INTO v_tenant_id
  FROM users WHERE id = auth.uid();

  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no tiene tenant asignado';
  END IF;

  RETURN (
    SELECT COALESCE(json_agg(row_to_json(prod) ORDER BY prod.variacion_pct ASC), '[]'::json)
    FROM (
      SELECT
        p.id AS producto_id,
        p.nombre AS producto_nombre,
        p.upc,
        p.categoria,
        COALESCE(promo_ventas.venta, 0)::numeric AS venta_periodo_promo,
        COALESCE(baseline_ventas.venta, 0)::numeric AS venta_baseline,
        CASE
          WHEN COALESCE(baseline_ventas.venta, 0) = 0 THEN 0
          ELSE ROUND(
            ((COALESCE(promo_ventas.venta, 0) - COALESCE(baseline_ventas.venta, 0))
             / baseline_ventas.venta * 100)::numeric,
            1
          )
        END AS variacion_pct
      FROM dim_productos p
      -- Ventas durante período de promoción
      LEFT JOIN LATERAL (
        SELECT SUM(v.venta_pesos) AS venta
        FROM fact_ventas v
        WHERE v.producto_id = p.id
          AND v.tenant_id = v_tenant_id
          AND v.fecha BETWEEN p_fecha_inicio_promo AND p_fecha_fin_promo
          AND (p_retailer_id IS NULL OR v.retailer_id = p_retailer_id)
      ) promo_ventas ON true
      -- Ventas durante período baseline
      LEFT JOIN LATERAL (
        SELECT SUM(v.venta_pesos) AS venta
        FROM fact_ventas v
        WHERE v.producto_id = p.id
          AND v.tenant_id = v_tenant_id
          AND v.fecha BETWEEN p_fecha_inicio_baseline AND p_fecha_fin_baseline
          AND (p_retailer_id IS NULL OR v.retailer_id = p_retailer_id)
      ) baseline_ventas ON true
      WHERE p.tenant_id = v_tenant_id
        AND p.activo = true
        AND p.categoria = p_categoria
        AND NOT (p.id = ANY(p_producto_ids))  -- Excluir productos en promoción
        AND (COALESCE(promo_ventas.venta, 0) > 0 OR COALESCE(baseline_ventas.venta, 0) > 0)
      ORDER BY variacion_pct ASC
      LIMIT 20
    ) prod
  );
END;
$$;

-- =====================================================
-- Grants para las funciones
-- =====================================================
GRANT EXECUTE ON FUNCTION get_promocion_filtros(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_promocion_ventas_periodo(INTEGER[], DATE, DATE, INTEGER[], TEXT[], INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_promocion_canibalizacion(INTEGER[], TEXT, DATE, DATE, DATE, DATE, INTEGER) TO authenticated;

-- =====================================================
-- Comentarios de documentación
-- =====================================================
COMMENT ON FUNCTION get_promocion_filtros IS
'Obtiene las opciones de filtros disponibles para el wizard de análisis de promociones.
Retorna productos, categorías, tiendas, ciudades y rango de fechas.';

COMMENT ON FUNCTION get_promocion_ventas_periodo IS
'Obtiene las ventas detalladas para un período específico.
Incluye totales, desglose por producto y serie diaria para gráficas.';

COMMENT ON FUNCTION get_promocion_canibalizacion IS
'Analiza el impacto de la promoción en otros productos de la misma categoría.
Compara ventas durante la promoción vs baseline para detectar canibalización.';
