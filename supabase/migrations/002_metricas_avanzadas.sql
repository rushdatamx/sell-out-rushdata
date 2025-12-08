-- ============================================
-- Actualizar Vista Materializada con Métricas Completas
-- ============================================

-- Eliminar vista existente
DROP MATERIALIZED VIEW IF EXISTS mv_metricas_producto_tienda;

-- Recrear con todas las métricas
CREATE MATERIALIZED VIEW mv_metricas_producto_tienda AS
SELECT
    v.tenant_id,
    v.retailer_id,
    v.tienda_id,
    v.producto_id,

    -- === MÉTRICAS DE VENTA (ya existían) ===
    COALESCE(SUM(v.unidades) FILTER (WHERE v.fecha > CURRENT_DATE - 7), 0) AS unidades_7d,
    COALESCE(SUM(v.venta_pesos) FILTER (WHERE v.fecha > CURRENT_DATE - 7), 0) AS venta_7d,

    COALESCE(SUM(v.unidades) FILTER (WHERE v.fecha > CURRENT_DATE - 30), 0) AS unidades_30d,
    COALESCE(SUM(v.venta_pesos) FILTER (WHERE v.fecha > CURRENT_DATE - 30), 0) AS venta_30d,
    COUNT(*) FILTER (WHERE v.fecha > CURRENT_DATE - 30 AND v.unidades > 0) AS dias_con_venta_30d,

    -- Venta promedio diaria (últimos 30 días)
    ROUND(
        COALESCE(SUM(v.unidades) FILTER (WHERE v.fecha > CURRENT_DATE - 30), 0)::NUMERIC /
        NULLIF(COUNT(*) FILTER (WHERE v.fecha > CURRENT_DATE - 30 AND v.unidades > 0), 0),
        2
    ) AS venta_promedio_diaria,

    ROUND(
        COALESCE(SUM(v.venta_pesos) FILTER (WHERE v.fecha > CURRENT_DATE - 30), 0)::NUMERIC /
        NULLIF(COUNT(*) FILTER (WHERE v.fecha > CURRENT_DATE - 30 AND v.unidades > 0), 0),
        2
    ) AS venta_promedio_pesos,

    -- === MÉTRICAS DE INVENTARIO ===
    (
        SELECT i.inventario_unidades
        FROM fact_inventario i
        WHERE i.tenant_id = v.tenant_id
          AND i.tienda_id = v.tienda_id
          AND i.producto_id = v.producto_id
        ORDER BY i.fecha DESC
        LIMIT 1
    ) AS inventario_actual,

    (
        SELECT i.fecha
        FROM fact_inventario i
        WHERE i.tenant_id = v.tenant_id
          AND i.tienda_id = v.tienda_id
          AND i.producto_id = v.producto_id
        ORDER BY i.fecha DESC
        LIMIT 1
    ) AS fecha_inventario,

    -- === MÉTRICAS NUEVAS ===

    -- Última venta
    MAX(v.fecha) FILTER (WHERE v.unidades > 0) AS ultima_venta,

    -- Días sin venta (últimos 15 días)
    CASE
        WHEN MAX(v.fecha) FILTER (WHERE v.fecha > CURRENT_DATE - 15 AND v.unidades > 0) IS NULL
        THEN 15
        ELSE CURRENT_DATE - MAX(v.fecha) FILTER (WHERE v.fecha > CURRENT_DATE - 15 AND v.unidades > 0)
    END AS dias_sin_venta_15d,

    -- Días de inventario
    ROUND(
        (
            SELECT i.inventario_unidades
            FROM fact_inventario i
            WHERE i.tenant_id = v.tenant_id
              AND i.tienda_id = v.tienda_id
              AND i.producto_id = v.producto_id
            ORDER BY i.fecha DESC
            LIMIT 1
        )::NUMERIC /
        NULLIF(
            ROUND(
                COALESCE(SUM(v.unidades) FILTER (WHERE v.fecha > CURRENT_DATE - 30), 0)::NUMERIC /
                NULLIF(COUNT(*) FILTER (WHERE v.fecha > CURRENT_DATE - 30 AND v.unidades > 0), 0),
                2
            ),
            0
        ),
        1
    ) AS dias_inventario,

    -- Inventario ideal (14 días de cobertura)
    ROUND(
        14 * ROUND(
            COALESCE(SUM(v.unidades) FILTER (WHERE v.fecha > CURRENT_DATE - 30), 0)::NUMERIC /
            NULLIF(COUNT(*) FILTER (WHERE v.fecha > CURRENT_DATE - 30 AND v.unidades > 0), 0),
            2
        ),
        0
    ) AS inventario_ideal,

    -- Sugerido de compra (unidades)
    GREATEST(
        0,
        ROUND(
            (14 * ROUND(
                COALESCE(SUM(v.unidades) FILTER (WHERE v.fecha > CURRENT_DATE - 30), 0)::NUMERIC /
                NULLIF(COUNT(*) FILTER (WHERE v.fecha > CURRENT_DATE - 30 AND v.unidades > 0), 0),
                2
            )) - COALESCE((
                SELECT i.inventario_unidades
                FROM fact_inventario i
                WHERE i.tenant_id = v.tenant_id
                  AND i.tienda_id = v.tienda_id
                  AND i.producto_id = v.producto_id
                ORDER BY i.fecha DESC
                LIMIT 1
            ), 0),
            0
        )
    ) AS sugerido_compra_unidades,

    -- Sugerido de compra (cajas) - requiere case_pack del producto
    CASE
        WHEN (SELECT p.case_pack FROM dim_productos p WHERE p.id = v.producto_id) IS NOT NULL
        THEN CEIL(
            GREATEST(
                0,
                ROUND(
                    (14 * ROUND(
                        COALESCE(SUM(v.unidades) FILTER (WHERE v.fecha > CURRENT_DATE - 30), 0)::NUMERIC /
                        NULLIF(COUNT(*) FILTER (WHERE v.fecha > CURRENT_DATE - 30 AND v.unidades > 0), 0),
                        2
                    )) - COALESCE((
                        SELECT i.inventario_unidades
                        FROM fact_inventario i
                        WHERE i.tenant_id = v.tenant_id
                          AND i.tienda_id = v.tienda_id
                          AND i.producto_id = v.producto_id
                        ORDER BY i.fecha DESC
                        LIMIT 1
                    ), 0),
                    0
                )
            )::NUMERIC / (SELECT p.case_pack FROM dim_productos p WHERE p.id = v.producto_id)
        )
        ELSE NULL
    END AS sugerido_compra_cajas,

    -- Sugerido final (redondeado a case_pack)
    CASE
        WHEN (SELECT p.case_pack FROM dim_productos p WHERE p.id = v.producto_id) IS NOT NULL
        THEN CEIL(
            GREATEST(
                0,
                ROUND(
                    (14 * ROUND(
                        COALESCE(SUM(v.unidades) FILTER (WHERE v.fecha > CURRENT_DATE - 30), 0)::NUMERIC /
                        NULLIF(COUNT(*) FILTER (WHERE v.fecha > CURRENT_DATE - 30 AND v.unidades > 0), 0),
                        2
                    )) - COALESCE((
                        SELECT i.inventario_unidades
                        FROM fact_inventario i
                        WHERE i.tenant_id = v.tenant_id
                          AND i.tienda_id = v.tienda_id
                          AND i.producto_id = v.producto_id
                        ORDER BY i.fecha DESC
                        LIMIT 1
                    ), 0),
                    0
                )
            )::NUMERIC / (SELECT p.case_pack FROM dim_productos p WHERE p.id = v.producto_id)
        ) * (SELECT p.case_pack FROM dim_productos p WHERE p.id = v.producto_id)
        ELSE GREATEST(
            0,
            ROUND(
                (14 * ROUND(
                    COALESCE(SUM(v.unidades) FILTER (WHERE v.fecha > CURRENT_DATE - 30), 0)::NUMERIC /
                    NULLIF(COUNT(*) FILTER (WHERE v.fecha > CURRENT_DATE - 30 AND v.unidades > 0), 0),
                    2
                )) - COALESCE((
                    SELECT i.inventario_unidades
                    FROM fact_inventario i
                    WHERE i.tenant_id = v.tenant_id
                      AND i.tienda_id = v.tienda_id
                      AND i.producto_id = v.producto_id
                    ORDER BY i.fecha DESC
                    LIMIT 1
                ), 0),
                0
            )
        )
    END AS sugerido_compra_final,

    -- % Inventario
    ROUND(
        COALESCE((
            SELECT i.inventario_unidades
            FROM fact_inventario i
            WHERE i.tenant_id = v.tenant_id
              AND i.tienda_id = v.tienda_id
              AND i.producto_id = v.producto_id
            ORDER BY i.fecha DESC
            LIMIT 1
        ), 0)::NUMERIC /
        NULLIF(
            ROUND(
                14 * ROUND(
                    COALESCE(SUM(v.unidades) FILTER (WHERE v.fecha > CURRENT_DATE - 30), 0)::NUMERIC /
                    NULLIF(COUNT(*) FILTER (WHERE v.fecha > CURRENT_DATE - 30 AND v.unidades > 0), 0),
                    2
                ),
                0
            ),
            0
        ) * 100,
        1
    ) AS pct_inventario,

    -- Fill Rate (nivel de servicio)
    ROUND(
        COUNT(*) FILTER (WHERE v.fecha > CURRENT_DATE - 30 AND v.unidades > 0)::NUMERIC / 30 * 100,
        1
    ) AS fill_rate,

    -- Desempeño (clasificación)
    CASE
        -- Quiebre
        WHEN COALESCE((
            SELECT i.inventario_unidades
            FROM fact_inventario i
            WHERE i.tenant_id = v.tenant_id
              AND i.tienda_id = v.tienda_id
              AND i.producto_id = v.producto_id
            ORDER BY i.fecha DESC
            LIMIT 1
        ), 0) = 0 THEN 'QUIEBRE'

        -- Venta Cero (15 días sin venta pero con inventario)
        WHEN MAX(v.fecha) FILTER (WHERE v.fecha > CURRENT_DATE - 15 AND v.unidades > 0) IS NULL
             AND COALESCE((
                SELECT i.inventario_unidades
                FROM fact_inventario i
                WHERE i.tenant_id = v.tenant_id
                  AND i.tienda_id = v.tienda_id
                  AND i.producto_id = v.producto_id
                ORDER BY i.fecha DESC
                LIMIT 1
            ), 0) > 0
        THEN 'VENTA_CERO'

        -- Resurtir Urgente (< 7 días de inventario)
        WHEN ROUND(
            COALESCE((
                SELECT i.inventario_unidades
                FROM fact_inventario i
                WHERE i.tenant_id = v.tenant_id
                  AND i.tienda_id = v.tienda_id
                  AND i.producto_id = v.producto_id
                ORDER BY i.fecha DESC
                LIMIT 1
            ), 0)::NUMERIC /
            NULLIF(
                ROUND(
                    COALESCE(SUM(v.unidades) FILTER (WHERE v.fecha > CURRENT_DATE - 30), 0)::NUMERIC /
                    NULLIF(COUNT(*) FILTER (WHERE v.fecha > CURRENT_DATE - 30 AND v.unidades > 0), 0),
                    2
                ),
                0
            ),
            1
        ) < 7 THEN 'RESURTIR_URGENTE'

        -- Inventario Sano (7-14 días)
        WHEN ROUND(
            COALESCE((
                SELECT i.inventario_unidades
                FROM fact_inventario i
                WHERE i.tenant_id = v.tenant_id
                  AND i.tienda_id = v.tienda_id
                  AND i.producto_id = v.producto_id
                ORDER BY i.fecha DESC
                LIMIT 1
            ), 0)::NUMERIC /
            NULLIF(
                ROUND(
                    COALESCE(SUM(v.unidades) FILTER (WHERE v.fecha > CURRENT_DATE - 30), 0)::NUMERIC /
                    NULLIF(COUNT(*) FILTER (WHERE v.fecha > CURRENT_DATE - 30 AND v.unidades > 0), 0),
                    2
                ),
                0
            ),
            1
        ) BETWEEN 7 AND 14 THEN 'INVENTARIO_SANO'

        -- Sobre Stock (15-30 días)
        WHEN ROUND(
            COALESCE((
                SELECT i.inventario_unidades
                FROM fact_inventario i
                WHERE i.tenant_id = v.tenant_id
                  AND i.tienda_id = v.tienda_id
                  AND i.producto_id = v.producto_id
                ORDER BY i.fecha DESC
                LIMIT 1
            ), 0)::NUMERIC /
            NULLIF(
                ROUND(
                    COALESCE(SUM(v.unidades) FILTER (WHERE v.fecha > CURRENT_DATE - 30), 0)::NUMERIC /
                    NULLIF(COUNT(*) FILTER (WHERE v.fecha > CURRENT_DATE - 30 AND v.unidades > 0), 0),
                    2
                ),
                0
            ),
            1
        ) BETWEEN 15 AND 30 THEN 'SOBRE_STOCK'

        -- Sobre Stock Crítico (> 30 días)
        WHEN ROUND(
            COALESCE((
                SELECT i.inventario_unidades
                FROM fact_inventario i
                WHERE i.tenant_id = v.tenant_id
                  AND i.tienda_id = v.tienda_id
                  AND i.producto_id = v.producto_id
                ORDER BY i.fecha DESC
                LIMIT 1
            ), 0)::NUMERIC /
            NULLIF(
                ROUND(
                    COALESCE(SUM(v.unidades) FILTER (WHERE v.fecha > CURRENT_DATE - 30), 0)::NUMERIC /
                    NULLIF(COUNT(*) FILTER (WHERE v.fecha > CURRENT_DATE - 30 AND v.unidades > 0), 0),
                    2
                ),
                0
            ),
            1
        ) > 30 THEN 'SOBRE_STOCK_CRITICO'

        ELSE 'SIN_DATOS'
    END AS desempeno,

    -- Timestamp de actualización
    NOW() AS updated_at

FROM fact_ventas v
WHERE v.fecha > CURRENT_DATE - 90
GROUP BY v.tenant_id, v.retailer_id, v.tienda_id, v.producto_id;

-- Índice único
CREATE UNIQUE INDEX idx_mv_metricas_unico
ON mv_metricas_producto_tienda(tenant_id, retailer_id, tienda_id, producto_id);

-- Índices adicionales para queries
CREATE INDEX idx_mv_metricas_desempeno ON mv_metricas_producto_tienda(tenant_id, desempeno);
CREATE INDEX idx_mv_metricas_dias_inv ON mv_metricas_producto_tienda(tenant_id, dias_inventario);

-- Refrescar la vista
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_metricas_producto_tienda;
