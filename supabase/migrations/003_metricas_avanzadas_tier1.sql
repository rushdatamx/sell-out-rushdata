-- ============================================
-- MÉTRICAS AVANZADAS TIER 1
-- Requiere inventario histórico de 30 días
-- ============================================

-- ==================================================
-- 1. GROWTH / TENDENCIAS (vs período anterior)
-- ==================================================
CREATE OR REPLACE FUNCTION get_sellout_growth(
  p_tenant_id UUID,
  p_retailer_id INTEGER DEFAULT NULL,
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  -- Por producto
  producto_id INTEGER,
  producto_nombre TEXT,
  producto_upc TEXT,
  venta_periodo_actual NUMERIC,
  venta_periodo_anterior NUMERIC,
  crecimiento_pct NUMERIC,
  unidades_periodo_actual NUMERIC,
  unidades_periodo_anterior NUMERIC,
  crecimiento_unidades_pct NUMERIC,
  tendencia TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id AS producto_id,
    p.nombre AS producto_nombre,
    p.upc AS producto_upc,

    -- Período actual
    COALESCE(SUM(v.venta_pesos) FILTER (WHERE v.fecha > CURRENT_DATE - p_days), 0) AS venta_periodo_actual,

    -- Período anterior
    COALESCE(SUM(v.venta_pesos) FILTER (WHERE v.fecha > CURRENT_DATE - (p_days * 2) AND v.fecha <= CURRENT_DATE - p_days), 0) AS venta_periodo_anterior,

    -- Crecimiento en pesos
    ROUND(
      CASE
        WHEN SUM(v.venta_pesos) FILTER (WHERE v.fecha > CURRENT_DATE - (p_days * 2) AND v.fecha <= CURRENT_DATE - p_days) > 0
        THEN (
          (SUM(v.venta_pesos) FILTER (WHERE v.fecha > CURRENT_DATE - p_days) -
           SUM(v.venta_pesos) FILTER (WHERE v.fecha > CURRENT_DATE - (p_days * 2) AND v.fecha <= CURRENT_DATE - p_days))
          / SUM(v.venta_pesos) FILTER (WHERE v.fecha > CURRENT_DATE - (p_days * 2) AND v.fecha <= CURRENT_DATE - p_days) * 100
        )
        ELSE 0
      END,
      1
    ) AS crecimiento_pct,

    -- Unidades período actual
    COALESCE(SUM(v.unidades) FILTER (WHERE v.fecha > CURRENT_DATE - p_days), 0) AS unidades_periodo_actual,

    -- Unidades período anterior
    COALESCE(SUM(v.unidades) FILTER (WHERE v.fecha > CURRENT_DATE - (p_days * 2) AND v.fecha <= CURRENT_DATE - p_days), 0) AS unidades_periodo_anterior,

    -- Crecimiento en unidades
    ROUND(
      CASE
        WHEN SUM(v.unidades) FILTER (WHERE v.fecha > CURRENT_DATE - (p_days * 2) AND v.fecha <= CURRENT_DATE - p_days) > 0
        THEN (
          (SUM(v.unidades) FILTER (WHERE v.fecha > CURRENT_DATE - p_days) -
           SUM(v.unidades) FILTER (WHERE v.fecha > CURRENT_DATE - (p_days * 2) AND v.fecha <= CURRENT_DATE - p_days))
          / SUM(v.unidades) FILTER (WHERE v.fecha > CURRENT_DATE - (p_days * 2) AND v.fecha <= CURRENT_DATE - p_days) * 100
        )
        ELSE 0
      END,
      1
    ) AS crecimiento_unidades_pct,

    -- Tendencia
    CASE
      WHEN SUM(v.venta_pesos) FILTER (WHERE v.fecha > CURRENT_DATE - (p_days * 2) AND v.fecha <= CURRENT_DATE - p_days) = 0
      THEN 'NUEVO'
      WHEN (
        (SUM(v.venta_pesos) FILTER (WHERE v.fecha > CURRENT_DATE - p_days) -
         SUM(v.venta_pesos) FILTER (WHERE v.fecha > CURRENT_DATE - (p_days * 2) AND v.fecha <= CURRENT_DATE - p_days))
        / SUM(v.venta_pesos) FILTER (WHERE v.fecha > CURRENT_DATE - (p_days * 2) AND v.fecha <= CURRENT_DATE - p_days) * 100
      ) > 10 THEN 'CRECIENDO'
      WHEN (
        (SUM(v.venta_pesos) FILTER (WHERE v.fecha > CURRENT_DATE - p_days) -
         SUM(v.venta_pesos) FILTER (WHERE v.fecha > CURRENT_DATE - (p_days * 2) AND v.fecha <= CURRENT_DATE - p_days))
        / SUM(v.venta_pesos) FILTER (WHERE v.fecha > CURRENT_DATE - (p_days * 2) AND v.fecha <= CURRENT_DATE - p_days) * 100
      ) < -10 THEN 'DECLINANDO'
      ELSE 'ESTABLE'
    END AS tendencia

  FROM dim_productos p
  LEFT JOIN fact_ventas v ON v.producto_id = p.id
    AND v.tenant_id = p_tenant_id
    AND (p_retailer_id IS NULL OR v.retailer_id = p_retailer_id)
    AND v.fecha > CURRENT_DATE - (p_days * 2)
  WHERE p.tenant_id = p_tenant_id
    AND p.activo = true
  GROUP BY p.id, p.nombre, p.upc
  HAVING SUM(v.venta_pesos) FILTER (WHERE v.fecha > CURRENT_DATE - p_days) > 0  -- Solo productos con venta en período actual
  ORDER BY venta_periodo_actual DESC;
END;
$$ LANGUAGE plpgsql;

-- ==================================================
-- 2. ABC DE PRODUCTOS (Clasificación por contribución)
-- ==================================================
CREATE OR REPLACE FUNCTION get_sellout_abc_productos(
  p_tenant_id UUID,
  p_retailer_id INTEGER DEFAULT NULL,
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  producto_id INTEGER,
  producto_nombre TEXT,
  producto_upc TEXT,
  venta_total NUMERIC,
  unidades_total NUMERIC,
  contribucion_venta NUMERIC,
  contribucion_acumulada NUMERIC,
  clasificacion TEXT,
  ranking INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH ventas_productos AS (
    SELECT
      p.id,
      p.nombre,
      p.upc,
      COALESCE(SUM(v.venta_pesos), 0) AS venta,
      COALESCE(SUM(v.unidades), 0) AS unidades
    FROM dim_productos p
    LEFT JOIN fact_ventas v ON v.producto_id = p.id
      AND v.tenant_id = p_tenant_id
      AND (p_retailer_id IS NULL OR v.retailer_id = p_retailer_id)
      AND v.fecha > CURRENT_DATE - p_days
    WHERE p.tenant_id = p_tenant_id
      AND p.activo = true
    GROUP BY p.id, p.nombre, p.upc
  ),
  ventas_con_contribucion AS (
    SELECT
      id,
      nombre,
      upc,
      venta,
      unidades,
      ROUND(venta / NULLIF(SUM(venta) OVER (), 0) * 100, 2) AS contribucion,
      ROUND(SUM(venta) OVER (ORDER BY venta DESC ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) / NULLIF(SUM(venta) OVER (), 0) * 100, 2) AS contribucion_acum,
      ROW_NUMBER() OVER (ORDER BY venta DESC) AS rank
    FROM ventas_productos
    WHERE venta > 0
  )
  SELECT
    id AS producto_id,
    nombre AS producto_nombre,
    upc AS producto_upc,
    venta AS venta_total,
    unidades AS unidades_total,
    contribucion AS contribucion_venta,
    contribucion_acum AS contribucion_acumulada,
    CASE
      WHEN contribucion_acum <= 80 THEN 'A'
      WHEN contribucion_acum <= 95 THEN 'B'
      ELSE 'C'
    END AS clasificacion,
    rank::INTEGER AS ranking
  FROM ventas_con_contribucion
  ORDER BY rank;
END;
$$ LANGUAGE plpgsql;

-- ==================================================
-- 3. ABC DE TIENDAS (Clasificación por contribución)
-- ==================================================
CREATE OR REPLACE FUNCTION get_sellout_abc_tiendas(
  p_tenant_id UUID,
  p_retailer_id INTEGER DEFAULT NULL,
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  tienda_id INTEGER,
  tienda_nombre TEXT,
  tienda_ciudad TEXT,
  tienda_cluster TEXT,
  venta_total NUMERIC,
  unidades_total NUMERIC,
  contribucion_venta NUMERIC,
  contribucion_acumulada NUMERIC,
  clasificacion TEXT,
  ranking INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH ventas_tiendas AS (
    SELECT
      t.id,
      t.nombre,
      t.ciudad,
      t.cluster,
      COALESCE(SUM(v.venta_pesos), 0) AS venta,
      COALESCE(SUM(v.unidades), 0) AS unidades
    FROM dim_tiendas t
    LEFT JOIN fact_ventas v ON v.tienda_id = t.id
      AND v.tenant_id = p_tenant_id
      AND (p_retailer_id IS NULL OR v.retailer_id = p_retailer_id)
      AND v.fecha > CURRENT_DATE - p_days
    WHERE t.tenant_id = p_tenant_id
      AND (p_retailer_id IS NULL OR t.retailer_id = p_retailer_id)
      AND t.activo = true
    GROUP BY t.id, t.nombre, t.ciudad, t.cluster
  ),
  ventas_con_contribucion AS (
    SELECT
      id,
      nombre,
      ciudad,
      cluster,
      venta,
      unidades,
      ROUND(venta / NULLIF(SUM(venta) OVER (), 0) * 100, 2) AS contribucion,
      ROUND(SUM(venta) OVER (ORDER BY venta DESC ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) / NULLIF(SUM(venta) OVER (), 0) * 100, 2) AS contribucion_acum,
      ROW_NUMBER() OVER (ORDER BY venta DESC) AS rank
    FROM ventas_tiendas
    WHERE venta > 0
  )
  SELECT
    id AS tienda_id,
    nombre AS tienda_nombre,
    ciudad AS tienda_ciudad,
    cluster AS tienda_cluster,
    venta AS venta_total,
    unidades AS unidades_total,
    contribucion AS contribucion_venta,
    contribucion_acum AS contribucion_acumulada,
    CASE
      WHEN contribucion_acum <= 70 THEN 'A'
      WHEN contribucion_acum <= 90 THEN 'B'
      ELSE 'C'
    END AS clasificacion,
    rank::INTEGER AS ranking
  FROM ventas_con_contribucion
  ORDER BY rank;
END;
$$ LANGUAGE plpgsql;

-- ==================================================
-- 4. PRECIO PROMEDIO VS SUGERIDO
-- ==================================================
CREATE OR REPLACE FUNCTION get_sellout_analisis_precios(
  p_tenant_id UUID,
  p_retailer_id INTEGER DEFAULT NULL,
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  producto_id INTEGER,
  producto_nombre TEXT,
  producto_upc TEXT,
  precio_sugerido NUMERIC,
  precio_promedio_actual NUMERIC,
  precio_min NUMERIC,
  precio_max NUMERIC,
  variacion_vs_sugerido NUMERIC,
  tiendas_fuera_rango INTEGER,
  tiendas_totales INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id AS producto_id,
    p.nombre AS producto_nombre,
    p.upc AS producto_upc,
    p.precio_sugerido AS precio_sugerido,

    -- Precio promedio actual
    ROUND(
      AVG(v.precio_unitario) FILTER (WHERE v.fecha > CURRENT_DATE - p_days AND v.precio_unitario IS NOT NULL),
      2
    ) AS precio_promedio_actual,

    -- Rango de precios
    ROUND(
      MIN(v.precio_unitario) FILTER (WHERE v.fecha > CURRENT_DATE - p_days AND v.precio_unitario IS NOT NULL),
      2
    ) AS precio_min,

    ROUND(
      MAX(v.precio_unitario) FILTER (WHERE v.fecha > CURRENT_DATE - p_days AND v.precio_unitario IS NOT NULL),
      2
    ) AS precio_max,

    -- Variación vs sugerido
    ROUND(
      CASE
        WHEN p.precio_sugerido IS NOT NULL AND p.precio_sugerido > 0
        THEN (
          (AVG(v.precio_unitario) FILTER (WHERE v.fecha > CURRENT_DATE - p_days AND v.precio_unitario IS NOT NULL) - p.precio_sugerido)
          / p.precio_sugerido * 100
        )
        ELSE NULL
      END,
      1
    ) AS variacion_vs_sugerido,

    -- Tiendas fuera de rango (±5% del precio sugerido)
    COUNT(DISTINCT v.tienda_id) FILTER (
      WHERE v.fecha > CURRENT_DATE - p_days
        AND v.precio_unitario IS NOT NULL
        AND p.precio_sugerido IS NOT NULL
        AND (v.precio_unitario < p.precio_sugerido * 0.95 OR v.precio_unitario > p.precio_sugerido * 1.05)
    )::INTEGER AS tiendas_fuera_rango,

    COUNT(DISTINCT v.tienda_id) FILTER (WHERE v.fecha > CURRENT_DATE - p_days)::INTEGER AS tiendas_totales

  FROM dim_productos p
  LEFT JOIN fact_ventas v ON v.producto_id = p.id
    AND v.tenant_id = p_tenant_id
    AND (p_retailer_id IS NULL OR v.retailer_id = p_retailer_id)
    AND v.fecha > CURRENT_DATE - p_days
  WHERE p.tenant_id = p_tenant_id
    AND p.activo = true
  GROUP BY p.id, p.nombre, p.upc, p.precio_sugerido
  HAVING COUNT(*) FILTER (WHERE v.fecha > CURRENT_DATE - p_days) > 0
  ORDER BY p.nombre;
END;
$$ LANGUAGE plpgsql;

-- ==================================================
-- 5. DISTRIBUTION NUMERIC (DN) - Cobertura
-- ==================================================
CREATE OR REPLACE FUNCTION get_sellout_distribution_numeric(
  p_tenant_id UUID,
  p_retailer_id INTEGER DEFAULT NULL
)
RETURNS TABLE (
  producto_id INTEGER,
  producto_nombre TEXT,
  producto_upc TEXT,
  tiendas_con_stock INTEGER,
  tiendas_totales INTEGER,
  dn_pct NUMERIC,
  tiendas_con_venta_30d INTEGER,
  oportunidad_expansion INTEGER,
  venta_promedio_tienda NUMERIC,
  potencial_venta_expansion NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH tiendas_activas AS (
    SELECT COUNT(*) AS total
    FROM dim_tiendas
    WHERE tenant_id = p_tenant_id
      AND (p_retailer_id IS NULL OR retailer_id = p_retailer_id)
      AND activo = true
  ),
  inventario_actual AS (
    SELECT DISTINCT ON (producto_id, tienda_id)
      producto_id,
      tienda_id,
      inventario_unidades,
      fecha
    FROM fact_inventario
    WHERE tenant_id = p_tenant_id
      AND (p_retailer_id IS NULL OR retailer_id = p_retailer_id)
    ORDER BY producto_id, tienda_id, fecha DESC
  )
  SELECT
    p.id AS producto_id,
    p.nombre AS producto_nombre,
    p.upc AS producto_upc,

    -- Tiendas con stock actual
    COUNT(DISTINCT i.tienda_id) FILTER (WHERE i.inventario_unidades > 0)::INTEGER AS tiendas_con_stock,

    (SELECT total FROM tiendas_activas)::INTEGER AS tiendas_totales,

    -- % DN
    ROUND(
      COUNT(DISTINCT i.tienda_id) FILTER (WHERE i.inventario_unidades > 0)::NUMERIC /
      (SELECT total FROM tiendas_activas) * 100,
      1
    ) AS dn_pct,

    -- Tiendas con venta en últimos 30 días
    COUNT(DISTINCT v.tienda_id) FILTER (WHERE v.fecha > CURRENT_DATE - 30)::INTEGER AS tiendas_con_venta_30d,

    -- Oportunidad de expansión (tiendas sin el producto pero con capacidad)
    ((SELECT total FROM tiendas_activas) - COUNT(DISTINCT i.tienda_id) FILTER (WHERE i.inventario_unidades > 0))::INTEGER AS oportunidad_expansion,

    -- Venta promedio por tienda (en tiendas donde se vende)
    ROUND(
      COALESCE(SUM(v.venta_pesos) FILTER (WHERE v.fecha > CURRENT_DATE - 30), 0) /
      NULLIF(COUNT(DISTINCT v.tienda_id) FILTER (WHERE v.fecha > CURRENT_DATE - 30), 0),
      2
    ) AS venta_promedio_tienda,

    -- Potencial si expandiera a todas las tiendas
    ROUND(
      (COALESCE(SUM(v.venta_pesos) FILTER (WHERE v.fecha > CURRENT_DATE - 30), 0) /
       NULLIF(COUNT(DISTINCT v.tienda_id) FILTER (WHERE v.fecha > CURRENT_DATE - 30), 0)) *
      ((SELECT total FROM tiendas_activas) - COUNT(DISTINCT i.tienda_id) FILTER (WHERE i.inventario_unidades > 0)),
      2
    ) AS potencial_venta_expansion

  FROM dim_productos p
  LEFT JOIN inventario_actual i ON i.producto_id = p.id
  LEFT JOIN fact_ventas v ON v.producto_id = p.id
    AND v.tenant_id = p_tenant_id
    AND (p_retailer_id IS NULL OR v.retailer_id = p_retailer_id)
    AND v.fecha > CURRENT_DATE - 30
  WHERE p.tenant_id = p_tenant_id
    AND p.activo = true
  GROUP BY p.id, p.nombre, p.upc
  ORDER BY dn_pct DESC, venta_promedio_tienda DESC;
END;
$$ LANGUAGE plpgsql;
