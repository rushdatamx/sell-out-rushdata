export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      chat_conversations: {
        Row: {
          id: string
          tenant_id: string
          user_id: string
          title: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          user_id: string
          title?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          user_id?: string
          title?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      chat_messages: {
        Row: {
          id: string
          conversation_id: string
          role: string
          content: string
          tokens_used: number | null
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          role: string
          content: string
          tokens_used?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          role?: string
          content?: string
          tokens_used?: number | null
          created_at?: string
        }
      }
      tenants: {
        Row: {
          id: string
          nombre_empresa: string
          contacto_email: string
          plan: string
          estado: string
          config: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nombre_empresa: string
          contacto_email: string
          plan?: string
          estado?: string
          config?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nombre_empresa?: string
          contacto_email?: string
          plan?: string
          estado?: string
          config?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          tenant_id: string
          email: string
          nombre: string | null
          avatar_url: string | null
          activo: boolean
          created_at: string
          last_login: string | null
        }
        Insert: {
          id: string
          tenant_id: string
          email: string
          nombre?: string | null
          avatar_url?: string | null
          activo?: boolean
          created_at?: string
          last_login?: string | null
        }
        Update: {
          id?: string
          tenant_id?: string
          email?: string
          nombre?: string | null
          avatar_url?: string | null
          activo?: boolean
          created_at?: string
          last_login?: string | null
        }
      }
      dim_fecha: {
        Row: {
          fecha: string
          anio: number
          mes: number
          dia: number
          dia_semana: number
          nombre_dia: string
          nombre_mes: string
          semana_anio: number
          trimestre: number
          es_fin_semana: boolean
          fecha_anio_anterior: string | null
        }
        Insert: {
          fecha: string
          anio: number
          mes: number
          dia: number
          dia_semana: number
          nombre_dia: string
          nombre_mes: string
          semana_anio: number
          trimestre: number
          es_fin_semana: boolean
          fecha_anio_anterior?: string | null
        }
        Update: {
          fecha?: string
          anio?: number
          mes?: number
          dia?: number
          dia_semana?: number
          nombre_dia?: string
          nombre_mes?: string
          semana_anio?: number
          trimestre?: number
          es_fin_semana?: boolean
          fecha_anio_anterior?: string | null
        }
      }
      dim_retailers: {
        Row: {
          id: number
          tenant_id: string
          codigo: string
          nombre: string
          color_hex: string | null
          activo: boolean
          created_at: string
        }
        Insert: {
          id?: number
          tenant_id: string
          codigo: string
          nombre: string
          color_hex?: string | null
          activo?: boolean
          created_at?: string
        }
        Update: {
          id?: number
          tenant_id?: string
          codigo?: string
          nombre?: string
          color_hex?: string | null
          activo?: boolean
          created_at?: string
        }
      }
      dim_tiendas: {
        Row: {
          id: number
          tenant_id: string
          retailer_id: number
          codigo_tienda: string
          nombre: string
          ciudad: string | null
          estado: string | null
          region: string | null
          cluster: string | null
          formato: string | null
          activo: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          tenant_id: string
          retailer_id: number
          codigo_tienda: string
          nombre: string
          ciudad?: string | null
          estado?: string | null
          region?: string | null
          cluster?: string | null
          formato?: string | null
          activo?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          tenant_id?: string
          retailer_id?: number
          codigo_tienda?: string
          nombre?: string
          ciudad?: string | null
          estado?: string | null
          region?: string | null
          cluster?: string | null
          formato?: string | null
          activo?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      dim_productos: {
        Row: {
          id: number
          tenant_id: string
          upc: string
          sku_fabricante: string | null
          nombre: string
          descripcion_corta: string | null
          categoria: string | null
          subcategoria: string | null
          marca: string | null
          case_pack: number | null
          precio_sugerido: number | null
          activo: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          tenant_id: string
          upc: string
          sku_fabricante?: string | null
          nombre: string
          descripcion_corta?: string | null
          categoria?: string | null
          subcategoria?: string | null
          marca?: string | null
          case_pack?: number | null
          precio_sugerido?: number | null
          activo?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          tenant_id?: string
          upc?: string
          sku_fabricante?: string | null
          nombre?: string
          descripcion_corta?: string | null
          categoria?: string | null
          subcategoria?: string | null
          marca?: string | null
          case_pack?: number | null
          precio_sugerido?: number | null
          activo?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      fact_ventas: {
        Row: {
          id: number
          tenant_id: string
          retailer_id: number
          tienda_id: number
          producto_id: number
          fecha: string
          unidades: number
          venta_pesos: number
          precio_unitario: number | null
          precio_calculado: number | null
          upload_id: string | null
          created_at: string
        }
        Insert: {
          id?: number
          tenant_id: string
          retailer_id: number
          tienda_id: number
          producto_id: number
          fecha: string
          unidades: number
          venta_pesos: number
          precio_unitario?: number | null
          upload_id?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          tenant_id?: string
          retailer_id?: number
          tienda_id?: number
          producto_id?: number
          fecha?: string
          unidades?: number
          venta_pesos?: number
          precio_unitario?: number | null
          upload_id?: string | null
          created_at?: string
        }
      }
      fact_inventario: {
        Row: {
          id: number
          tenant_id: string
          retailer_id: number
          tienda_id: number
          producto_id: number
          fecha: string
          inventario_unidades: number
          upload_id: string | null
          created_at: string
        }
        Insert: {
          id?: number
          tenant_id: string
          retailer_id: number
          tienda_id: number
          producto_id: number
          fecha: string
          inventario_unidades: number
          upload_id?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          tenant_id?: string
          retailer_id?: number
          tienda_id?: number
          producto_id?: number
          fecha?: string
          inventario_unidades?: number
          upload_id?: string | null
          created_at?: string
        }
      }
      config_retailer_mapping: {
        Row: {
          id: number
          tenant_id: string
          retailer_id: number
          tipo_archivo: string
          column_mapping: Json
          date_format: string
          skip_rows: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          tenant_id: string
          retailer_id: number
          tipo_archivo: string
          column_mapping: Json
          date_format?: string
          skip_rows?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          tenant_id?: string
          retailer_id?: number
          tipo_archivo?: string
          column_mapping?: Json
          date_format?: string
          skip_rows?: number
          created_at?: string
          updated_at?: string
        }
      }
      data_uploads: {
        Row: {
          id: string
          tenant_id: string
          retailer_id: number
          nombre_archivo: string
          tipo_archivo: string
          estado: string
          registros_totales: number
          registros_insertados: number
          registros_actualizados: number
          registros_con_error: number
          errores: Json | null
          fecha_inicio: string | null
          fecha_fin: string | null
          created_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          tenant_id: string
          retailer_id: number
          nombre_archivo: string
          tipo_archivo: string
          estado?: string
          registros_totales?: number
          registros_insertados?: number
          registros_actualizados?: number
          registros_con_error?: number
          errores?: Json | null
          fecha_inicio?: string | null
          fecha_fin?: string | null
          created_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          tenant_id?: string
          retailer_id?: number
          nombre_archivo?: string
          tipo_archivo?: string
          estado?: string
          registros_totales?: number
          registros_insertados?: number
          registros_actualizados?: number
          registros_con_error?: number
          errores?: Json | null
          fecha_inicio?: string | null
          fecha_fin?: string | null
          created_at?: string
          completed_at?: string | null
        }
      }
    }
    Views: {
      mv_metricas_producto_tienda: {
        Row: {
          tenant_id: string
          retailer_id: number
          tienda_id: number
          producto_id: number
          unidades_7d: number
          venta_7d: number
          unidades_30d: number
          venta_30d: number
          dias_con_venta_30d: number
          venta_promedio_diaria: number | null
          venta_promedio_pesos: number | null
          inventario_actual: number | null
          fecha_inventario: string | null
          ultima_venta: string | null
          dias_sin_venta_15d: number | null
          dias_inventario: number | null
          inventario_ideal: number | null
          sugerido_compra_unidades: number | null
          sugerido_compra_cajas: number | null
          sugerido_compra_final: number | null
          pct_inventario: number | null
          fill_rate: number | null
          desempeno: string | null
          updated_at: string
        }
      }
    }
    Functions: {
      get_user_tenant_id: {
        Args: Record<string, never>
        Returns: string
      }
      get_ia_context: {
        Args: Record<string, never>
        Returns: Json
      }
      cleanup_old_conversations: {
        Args: Record<string, never>
        Returns: void
      }
      get_dashboard_metrics: {
        Args: { dias_periodo?: number }
        Returns: Json
      }
      get_top_productos: {
        Args: { dias_periodo?: number }
        Returns: Json
      }
      get_top_tiendas: {
        Args: { dias_periodo?: number }
        Returns: Json
      }
      get_mix_categorias: {
        Args: { dias_periodo?: number }
        Returns: Json
      }
      get_analisis_kpis_yoy: {
        Args: {
          p_anio?: number | null
          p_ciudades?: string[] | null
          p_producto_ids?: number[] | null
        }
        Returns: Json
      }
      get_analisis_ventas_mensuales_yoy: {
        Args: {
          p_anio?: number | null
          p_ciudades?: string[] | null
          p_producto_ids?: number[] | null
        }
        Returns: Json
      }
      get_analisis_productos_yoy: {
        Args: {
          p_anio?: number | null
          p_ciudades?: string[] | null
          p_tipo?: string | null
          p_limit?: number | null
        }
        Returns: Json
      }
      get_analisis_tiendas_yoy: {
        Args: {
          p_anio?: number | null
          p_ciudades?: string[] | null
          p_tipo?: string | null
          p_limit?: number | null
        }
        Returns: Json
      }
      get_analisis_estacionalidad_semanal: {
        Args: {
          p_fecha_inicio?: string | null
          p_fecha_fin?: string | null
          p_ciudades?: string[] | null
        }
        Returns: Json
      }
      get_analisis_ciudades_yoy: {
        Args: {
          p_anio?: number | null
          p_producto_ids?: number[] | null
        }
        Returns: Json
      }
      get_inventario_kpis: {
        Args: {
          p_fecha_inicio?: string | null
          p_fecha_fin?: string | null
          p_ciudades?: string[] | null
          p_tienda_ids?: number[] | null
          p_producto_ids?: number[] | null
        }
        Returns: Json
      }
      get_productos_filtros: {
        Args: Record<string, never>
        Returns: Json
      }
      get_productos_kpis_v3: {
        Args: {
          p_fecha_inicio?: string | null
          p_fecha_fin?: string | null
          p_tienda_ids?: number[] | null
          p_producto_ids?: number[] | null
          p_categorias?: string[] | null
        }
        Returns: Json
      }
      get_productos_tabla_v3: {
        Args: {
          p_fecha_inicio?: string | null
          p_fecha_fin?: string | null
          p_tienda_ids?: number[] | null
          p_producto_ids?: number[] | null
          p_categorias?: string[] | null
          p_busqueda?: string | null
          p_order_by?: string | null
          p_order_dir?: string | null
          p_limit?: number | null
          p_offset?: number | null
        }
        Returns: Json
      }
      get_productos_pareto_v3: {
        Args: {
          p_fecha_inicio?: string | null
          p_fecha_fin?: string | null
          p_tienda_ids?: number[] | null
          p_producto_ids?: number[] | null
          p_categorias?: string[] | null
        }
        Returns: Json
      }
      get_productos_variacion_v3: {
        Args: {
          p_fecha_inicio?: string | null
          p_fecha_fin?: string | null
          p_tienda_ids?: number[] | null
          p_producto_ids?: number[] | null
          p_categorias?: string[] | null
          p_tipo?: string | null
        }
        Returns: Json
      }
      get_tiendas_filtros: {
        Args: Record<string, never>
        Returns: Json
      }
      get_tiendas_kpis: {
        Args: {
          p_fecha_inicio?: string | null
          p_fecha_fin?: string | null
          p_ciudades?: string[] | null
          p_clusters?: string[] | null
          p_producto_ids?: number[] | null
          p_categorias?: string[] | null
        }
        Returns: Json
      }
      get_tiendas_tabla: {
        Args: {
          p_fecha_inicio?: string | null
          p_fecha_fin?: string | null
          p_ciudades?: string[] | null
          p_clusters?: string[] | null
          p_producto_ids?: number[] | null
          p_categorias?: string[] | null
          p_busqueda?: string | null
          p_order_by?: string | null
          p_order_dir?: string | null
          p_limit?: number | null
          p_offset?: number | null
        }
        Returns: Json
      }
      get_tiendas_ranking: {
        Args: {
          p_fecha_inicio?: string | null
          p_fecha_fin?: string | null
          p_ciudades?: string[] | null
          p_clusters?: string[] | null
          p_producto_ids?: number[] | null
          p_categorias?: string[] | null
          p_tipo?: string | null
          p_limit?: number | null
        }
        Returns: Json
      }
      get_tiendas_por_ciudad: {
        Args: {
          p_fecha_inicio?: string | null
          p_fecha_fin?: string | null
          p_ciudades?: string[] | null
          p_clusters?: string[] | null
          p_producto_ids?: number[] | null
          p_categorias?: string[] | null
        }
        Returns: Json
      }
      get_tiendas_cobertura_skus: {
        Args: {
          p_fecha_inicio?: string | null
          p_fecha_fin?: string | null
          p_ciudades?: string[] | null
          p_clusters?: string[] | null
          p_categorias?: string[] | null
        }
        Returns: Json
      }
      get_inventario_filtros: {
        Args: Record<string, never>
        Returns: Json
      }
      get_inventario_tabla: {
        Args: {
          p_fecha_inicio?: string | null
          p_fecha_fin?: string | null
          p_ciudades?: string[] | null
          p_tienda_ids?: number[] | null
          p_producto_ids?: number[] | null
          p_estado?: string | null
          p_busqueda?: string | null
          p_order_by?: string | null
          p_order_dir?: string | null
          p_limit?: number | null
          p_offset?: number | null
        }
        Returns: Json
      }
      get_inventario_heatmap: {
        Args: {
          p_fecha_inicio?: string | null
          p_fecha_fin?: string | null
          p_ciudades?: string[] | null
          p_producto_ids?: number[] | null
        }
        Returns: Json
      }
      get_inventario_evolucion: {
        Args: {
          p_fecha_inicio?: string | null
          p_fecha_fin?: string | null
          p_tienda_id?: number | null
          p_producto_id?: number | null
        }
        Returns: Json
      }
      get_inventario_top_venta_perdida: {
        Args: {
          p_fecha_inicio?: string | null
          p_fecha_fin?: string | null
          p_ciudades?: string[] | null
          p_limit?: number | null
        }
        Returns: Json
      }
      get_inventario_alertas: {
        Args: {
          p_fecha_inicio?: string | null
          p_fecha_fin?: string | null
          p_limit?: number | null
        }
        Returns: Json
      }
      get_reabastecimiento_filtros: {
        Args: Record<string, never>
        Returns: Json
      }
      get_reabastecimiento_kpis: {
        Args: {
          p_fecha_inicio?: string | null
          p_fecha_fin?: string | null
          p_ciudades?: string[] | null
          p_producto_ids?: number[] | null
        }
        Returns: Json
      }
      get_reabastecimiento_tabla: {
        Args: {
          p_fecha_inicio?: string | null
          p_fecha_fin?: string | null
          p_ciudades?: string[] | null
          p_producto_ids?: number[] | null
          p_clasificacion?: string | null
          p_prioridad?: string | null
          p_busqueda?: string | null
          p_order_by?: string | null
          p_order_dir?: string | null
          p_limit?: number | null
          p_offset?: number | null
        }
        Returns: Json
      }
      get_reabastecimiento_abc: {
        Args: {
          p_fecha_inicio?: string | null
          p_fecha_fin?: string | null
          p_ciudades?: string[] | null
        }
        Returns: Json
      }
      get_reabastecimiento_fill_rate: {
        Args: {
          p_fecha_inicio?: string | null
          p_fecha_fin?: string | null
          p_ciudades?: string[] | null
          p_limit?: number | null
        }
        Returns: Json
      }
      get_reabastecimiento_tendencia: {
        Args: {
          p_ciudades?: string[] | null
          p_limit?: number | null
        }
        Returns: Json
      }
      get_reabastecimiento_alertas_clase_a: {
        Args: {
          p_fecha_inicio?: string | null
          p_fecha_fin?: string | null
          p_limit?: number | null
        }
        Returns: Json
      }
      get_precios_filtros: {
        Args: Record<string, never>
        Returns: Json
      }
      get_precios_kpis: {
        Args: {
          p_fecha_inicio?: string | null
          p_fecha_fin?: string | null
          p_ciudades?: string[] | null
          p_producto_ids?: number[] | null
        }
        Returns: Json
      }
      get_precios_por_producto: {
        Args: {
          p_fecha_inicio?: string | null
          p_fecha_fin?: string | null
          p_ciudades?: string[] | null
          p_producto_ids?: number[] | null
          p_busqueda?: string | null
          p_order_by?: string | null
          p_order_dir?: string | null
          p_limit?: number | null
          p_offset?: number | null
        }
        Returns: Json
      }
      get_precios_detalle: {
        Args: {
          p_fecha_inicio?: string | null
          p_fecha_fin?: string | null
          p_ciudades?: string[] | null
          p_producto_ids?: number[] | null
          p_tienda_ids?: number[] | null
          p_busqueda?: string | null
          p_order_by?: string | null
          p_order_dir?: string | null
          p_limit?: number | null
          p_offset?: number | null
        }
        Returns: Json
      }
      get_precios_evolucion: {
        Args: {
          p_fecha_inicio?: string | null
          p_fecha_fin?: string | null
          p_ciudades?: string[] | null
          p_producto_ids?: number[] | null
        }
        Returns: Json
      }
      get_precios_por_ciudad: {
        Args: {
          p_fecha_inicio?: string | null
          p_fecha_fin?: string | null
          p_producto_ids?: number[] | null
        }
        Returns: Json
      }
      get_precios_dispersion: {
        Args: {
          p_fecha_inicio?: string | null
          p_fecha_fin?: string | null
          p_ciudades?: string[] | null
        }
        Returns: Json
      }
      get_precios_alta_variabilidad: {
        Args: {
          p_fecha_inicio?: string | null
          p_fecha_fin?: string | null
          p_ciudades?: string[] | null
          p_limit?: number | null
        }
        Returns: Json
      }
      get_precios_alertas: {
        Args: {
          p_fecha_inicio?: string | null
          p_fecha_fin?: string | null
          p_limit?: number | null
        }
        Returns: Json
      }
      get_precios_por_tienda: {
        Args: {
          p_fecha_inicio?: string | null
          p_fecha_fin?: string | null
          p_producto_id: number
        }
        Returns: Json
      }
      poblar_dim_fecha: {
        Args: {
          fecha_inicio: string
          fecha_fin: string
        }
        Returns: void
      }
      refresh_mv_metricas: {
        Args: Record<string, never>
        Returns: void
      }
      // RPCs para dashboard (se agregarán después)
      get_sellout_dashboard_kpis: {
        Args: {
          p_tenant_id: string
          p_retailer_id?: number | null
          p_days?: number
        }
        Returns: {
          ventas_periodo: number
          ventas_anterior: number
          variacion_pct: number
          unidades_periodo: number
          tiendas_activas: number
          productos_activos: number
          ticket_promedio: number
        }[]
      }
      get_sellout_ventas_mensuales: {
        Args: {
          p_tenant_id: string
          p_retailer_id?: number | null
        }
        Returns: {
          mes: string
          anio: number
          mes_num: number
          ventas: number
          unidades: number
        }[]
      }
      get_sellout_top_tiendas: {
        Args: {
          p_tenant_id: string
          p_retailer_id?: number | null
          p_limit?: number
          p_days?: number
        }
        Returns: {
          tienda_id: number
          nombre: string
          ciudad: string
          cluster: string
          ventas: number
          unidades: number
        }[]
      }
      get_sellout_top_productos: {
        Args: {
          p_tenant_id: string
          p_retailer_id?: number | null
          p_limit?: number
          p_days?: number
        }
        Returns: {
          producto_id: number
          nombre: string
          upc: string
          ventas: number
          unidades: number
          tiendas_con_venta: number
        }[]
      }
      get_retailers_options: {
        Args: {
          p_tenant_id: string
        }
        Returns: {
          id: number
          codigo: string
          nombre: string
          color_hex: string
        }[]
      }
      get_sellout_resumen_inventario: {
        Args: {
          p_tenant_id: string
          p_retailer_id?: number | null
        }
        Returns: {
          total_skus: number
          total_tiendas: number
          productos_quiebre: number
          productos_venta_cero: number
          productos_resurtir_urgente: number
          productos_inventario_sano: number
          productos_sobre_stock: number
          productos_sobre_stock_critico: number
          productos_sin_datos: number
          valor_inventario_total: number
          sugerido_compra_total: number
        }[]
      }
      get_sellout_productos_detalle: {
        Args: {
          p_tenant_id: string
          p_retailer_id?: number | null
          p_tienda_id?: number | null
          p_producto_id?: number | null
          p_desempeno?: string | null
          p_limit?: number
          p_offset?: number
        }
        Returns: {
          producto_id: number
          producto_nombre: string
          producto_upc: string
          producto_sku: string
          tienda_id: number
          tienda_nombre: string
          tienda_ciudad: string
          tienda_cluster: string
          inventario_actual: number
          fecha_inventario: string
          venta_7d: number
          venta_30d: number
          venta_prom_diaria: number
          ultima_venta: string
          dias_sin_venta: number
          dias_inventario: number
          inventario_ideal: number
          sugerido_compra_unidades: number
          sugerido_compra_cajas: number
          sugerido_compra_final: number
          pct_inventario: number
          fill_rate: number
          desempeno: string
        }[]
      }
      get_sellout_alertas: {
        Args: {
          p_tenant_id: string
          p_retailer_id?: number | null
        }
        Returns: {
          producto_id: number
          producto_nombre: string
          producto_upc: string
          tienda_id: number
          tienda_nombre: string
          tienda_ciudad: string
          desempeno: string
          inventario_actual: number
          dias_inventario: number
          sugerido_compra_final: number
          venta_prom_diaria: number
        }[]
      }
      get_sellout_growth: {
        Args: {
          p_tenant_id: string
          p_retailer_id?: number | null
          p_days?: number
        }
        Returns: {
          producto_id: number
          producto_nombre: string
          producto_upc: string
          venta_periodo_actual: number
          venta_periodo_anterior: number
          crecimiento_pct: number
          unidades_periodo_actual: number
          unidades_periodo_anterior: number
          crecimiento_unidades_pct: number
          tendencia: string
        }[]
      }
      get_sellout_abc_productos: {
        Args: {
          p_tenant_id: string
          p_retailer_id?: number | null
          p_days?: number
        }
        Returns: {
          producto_id: number
          producto_nombre: string
          producto_upc: string
          venta_total: number
          unidades_total: number
          contribucion_venta: number
          contribucion_acumulada: number
          clasificacion: string
          ranking: number
        }[]
      }
      get_sellout_abc_tiendas: {
        Args: {
          p_tenant_id: string
          p_retailer_id?: number | null
          p_days?: number
        }
        Returns: {
          tienda_id: number
          tienda_nombre: string
          tienda_ciudad: string
          tienda_cluster: string
          venta_total: number
          unidades_total: number
          contribucion_venta: number
          contribucion_acumulada: number
          clasificacion: string
          ranking: number
        }[]
      }
      get_sellout_analisis_precios: {
        Args: {
          p_tenant_id: string
          p_retailer_id?: number | null
          p_days?: number
        }
        Returns: {
          producto_id: number
          producto_nombre: string
          producto_upc: string
          precio_sugerido: number
          precio_promedio_actual: number
          precio_min: number
          precio_max: number
          variacion_vs_sugerido: number
          tiendas_fuera_rango: number
          tiendas_totales: number
        }[]
      }
      get_sellout_distribution_numeric: {
        Args: {
          p_tenant_id: string
          p_retailer_id?: number | null
        }
        Returns: {
          producto_id: number
          producto_nombre: string
          producto_upc: string
          tiendas_con_stock: number
          tiendas_totales: number
          dn_pct: number
          tiendas_con_venta_30d: number
          oportunidad_expansion: number
          venta_promedio_tienda: number
          potencial_venta_expansion: number
        }[]
      }
      get_sellout_venta_perdida_oos: {
        Args: {
          p_tenant_id: string
          p_retailer_id?: number | null
          p_days?: number
        }
        Returns: {
          producto_id: number
          producto_nombre: string
          producto_upc: string
          tienda_id: number
          tienda_nombre: string
          tienda_ciudad: string
          dias_en_oos: number
          venta_promedio_diaria: number
          venta_perdida_unidades: number
          precio_promedio: number
          venta_perdida_pesos: number
          ultima_fecha_con_stock: string
          dias_consecutivos_oos: number
        }[]
      }
      get_sellout_oos_rate: {
        Args: {
          p_tenant_id: string
          p_retailer_id?: number | null
          p_days?: number
        }
        Returns: {
          producto_id: number
          producto_nombre: string
          producto_upc: string
          tienda_id: number
          tienda_nombre: string
          tienda_ciudad: string
          dias_totales: number
          dias_en_oos: number
          dias_con_stock: number
          oos_rate_pct: number
          disponibilidad_pct: number
          estado: string
          inventario_actual: number
        }[]
      }
      get_sellout_oos_resumen: {
        Args: {
          p_tenant_id: string
          p_retailer_id?: number | null
          p_days?: number
        }
        Returns: {
          total_producto_tiendas: number
          productos_en_quiebre_hoy: number
          venta_perdida_total_pesos: number
          venta_perdida_total_unidades: number
          oos_rate_promedio: number
          disponibilidad_promedio: number
          productos_criticos: number
          productos_atencion: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Helper types
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']
export type Views<T extends keyof Database['public']['Views']> = Database['public']['Views'][T]['Row']

// Convenient type aliases
export type Tenant = Tables<'tenants'>
export type User = Tables<'users'>
export type Retailer = Tables<'dim_retailers'>
export type Tienda = Tables<'dim_tiendas'>
export type Producto = Tables<'dim_productos'>
export type Fecha = Tables<'dim_fecha'>
export type Venta = Tables<'fact_ventas'>
export type Inventario = Tables<'fact_inventario'>
export type RetailerMapping = Tables<'config_retailer_mapping'>
export type DataUpload = Tables<'data_uploads'>
export type MetricasProductoTienda = Views<'mv_metricas_producto_tienda'>
