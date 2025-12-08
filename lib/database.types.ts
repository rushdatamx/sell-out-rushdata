export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      chat_conversations: {
        Row: {
          created_at: string | null
          id: string
          tenant_id: string
          title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          tenant_id: string
          title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          tenant_id?: string
          title?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_conversations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string | null
          id: string
          role: string
          tokens_used: number | null
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string | null
          id?: string
          role: string
          tokens_used?: number | null
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          role?: string
          tokens_used?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      config_retailer_mapping: {
        Row: {
          column_mapping: Json
          created_at: string | null
          date_format: string | null
          id: number
          retailer_id: number
          skip_rows: number | null
          tenant_id: string
          tipo_archivo: string
          updated_at: string | null
        }
        Insert: {
          column_mapping: Json
          created_at?: string | null
          date_format?: string | null
          id?: number
          retailer_id: number
          skip_rows?: number | null
          tenant_id: string
          tipo_archivo: string
          updated_at?: string | null
        }
        Update: {
          column_mapping?: Json
          created_at?: string | null
          date_format?: string | null
          id?: number
          retailer_id?: number
          skip_rows?: number | null
          tenant_id?: string
          tipo_archivo?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "config_retailer_mapping_retailer_id_fkey"
            columns: ["retailer_id"]
            isOneToOne: false
            referencedRelation: "dim_retailers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "config_retailer_mapping_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      data_uploads: {
        Row: {
          completed_at: string | null
          created_at: string | null
          errores: Json | null
          estado: string | null
          fecha_fin: string | null
          fecha_inicio: string | null
          id: string
          nombre_archivo: string
          registros_actualizados: number | null
          registros_con_error: number | null
          registros_insertados: number | null
          registros_totales: number | null
          retailer_id: number
          tenant_id: string
          tipo_archivo: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          errores?: Json | null
          estado?: string | null
          fecha_fin?: string | null
          fecha_inicio?: string | null
          id?: string
          nombre_archivo: string
          registros_actualizados?: number | null
          registros_con_error?: number | null
          registros_insertados?: number | null
          registros_totales?: number | null
          retailer_id: number
          tenant_id: string
          tipo_archivo: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          errores?: Json | null
          estado?: string | null
          fecha_fin?: string | null
          fecha_inicio?: string | null
          id?: string
          nombre_archivo?: string
          registros_actualizados?: number | null
          registros_con_error?: number | null
          registros_insertados?: number | null
          registros_totales?: number | null
          retailer_id?: number
          tenant_id?: string
          tipo_archivo?: string
        }
        Relationships: [
          {
            foreignKeyName: "data_uploads_retailer_id_fkey"
            columns: ["retailer_id"]
            isOneToOne: false
            referencedRelation: "dim_retailers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "data_uploads_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      dim_fecha: {
        Row: {
          anio: number
          dia: number
          dia_semana: number
          es_fin_semana: boolean
          fecha: string
          fecha_anio_anterior: string | null
          mes: number
          nombre_dia: string
          nombre_mes: string
          semana_anio: number
          trimestre: number
        }
        Insert: {
          anio: number
          dia: number
          dia_semana: number
          es_fin_semana: boolean
          fecha: string
          fecha_anio_anterior?: string | null
          mes: number
          nombre_dia: string
          nombre_mes: string
          semana_anio: number
          trimestre: number
        }
        Update: {
          anio?: number
          dia?: number
          dia_semana?: number
          es_fin_semana?: boolean
          fecha?: string
          fecha_anio_anterior?: string | null
          mes?: number
          nombre_dia?: string
          nombre_mes?: string
          semana_anio?: number
          trimestre?: number
        }
        Relationships: []
      }
      dim_productos: {
        Row: {
          activo: boolean | null
          case_pack: number | null
          categoria: string | null
          created_at: string | null
          descripcion_corta: string | null
          id: number
          marca: string | null
          nombre: string
          precio_sugerido: number | null
          sku_fabricante: string | null
          subcategoria: string | null
          tenant_id: string
          upc: string
          updated_at: string | null
        }
        Insert: {
          activo?: boolean | null
          case_pack?: number | null
          categoria?: string | null
          created_at?: string | null
          descripcion_corta?: string | null
          id?: number
          marca?: string | null
          nombre: string
          precio_sugerido?: number | null
          sku_fabricante?: string | null
          subcategoria?: string | null
          tenant_id: string
          upc: string
          updated_at?: string | null
        }
        Update: {
          activo?: boolean | null
          case_pack?: number | null
          categoria?: string | null
          created_at?: string | null
          descripcion_corta?: string | null
          id?: number
          marca?: string | null
          nombre?: string
          precio_sugerido?: number | null
          sku_fabricante?: string | null
          subcategoria?: string | null
          tenant_id?: string
          upc?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dim_productos_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      dim_retailers: {
        Row: {
          activo: boolean | null
          codigo: string
          color_hex: string | null
          created_at: string | null
          id: number
          nombre: string
          tenant_id: string
        }
        Insert: {
          activo?: boolean | null
          codigo: string
          color_hex?: string | null
          created_at?: string | null
          id?: number
          nombre: string
          tenant_id: string
        }
        Update: {
          activo?: boolean | null
          codigo?: string
          color_hex?: string | null
          created_at?: string | null
          id?: number
          nombre?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dim_retailers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      dim_tiendas: {
        Row: {
          activo: boolean | null
          ciudad: string | null
          cluster: string | null
          codigo_tienda: string
          created_at: string | null
          estado: string | null
          formato: string | null
          id: number
          nombre: string
          region: string | null
          retailer_id: number
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          activo?: boolean | null
          ciudad?: string | null
          cluster?: string | null
          codigo_tienda: string
          created_at?: string | null
          estado?: string | null
          formato?: string | null
          id?: number
          nombre: string
          region?: string | null
          retailer_id: number
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          activo?: boolean | null
          ciudad?: string | null
          cluster?: string | null
          codigo_tienda?: string
          created_at?: string | null
          estado?: string | null
          formato?: string | null
          id?: number
          nombre?: string
          region?: string | null
          retailer_id?: number
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dim_tiendas_retailer_id_fkey"
            columns: ["retailer_id"]
            isOneToOne: false
            referencedRelation: "dim_retailers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dim_tiendas_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      fact_inventario: {
        Row: {
          created_at: string | null
          fecha: string
          id: number
          inventario_unidades: number
          producto_id: number
          retailer_id: number
          tenant_id: string
          tienda_id: number
          upload_id: string | null
        }
        Insert: {
          created_at?: string | null
          fecha: string
          id?: number
          inventario_unidades?: number
          producto_id: number
          retailer_id: number
          tenant_id: string
          tienda_id: number
          upload_id?: string | null
        }
        Update: {
          created_at?: string | null
          fecha?: string
          id?: number
          inventario_unidades?: number
          producto_id?: number
          retailer_id?: number
          tenant_id?: string
          tienda_id?: number
          upload_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fact_inventario_fecha_fkey"
            columns: ["fecha"]
            isOneToOne: false
            referencedRelation: "dim_fecha"
            referencedColumns: ["fecha"]
          },
          {
            foreignKeyName: "fact_inventario_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "dim_productos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fact_inventario_retailer_id_fkey"
            columns: ["retailer_id"]
            isOneToOne: false
            referencedRelation: "dim_retailers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fact_inventario_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fact_inventario_tienda_id_fkey"
            columns: ["tienda_id"]
            isOneToOne: false
            referencedRelation: "dim_tiendas"
            referencedColumns: ["id"]
          },
        ]
      }
      fact_ventas: {
        Row: {
          created_at: string | null
          fecha: string
          id: number
          precio_calculado: number | null
          precio_unitario: number | null
          producto_id: number
          retailer_id: number
          tenant_id: string
          tienda_id: number
          unidades: number
          upload_id: string | null
          venta_pesos: number
        }
        Insert: {
          created_at?: string | null
          fecha: string
          id?: number
          precio_calculado?: number | null
          precio_unitario?: number | null
          producto_id: number
          retailer_id: number
          tenant_id: string
          tienda_id: number
          unidades?: number
          upload_id?: string | null
          venta_pesos?: number
        }
        Update: {
          created_at?: string | null
          fecha?: string
          id?: number
          precio_calculado?: number | null
          precio_unitario?: number | null
          producto_id?: number
          retailer_id?: number
          tenant_id?: string
          tienda_id?: number
          unidades?: number
          upload_id?: string | null
          venta_pesos?: number
        }
        Relationships: [
          {
            foreignKeyName: "fact_ventas_fecha_fkey"
            columns: ["fecha"]
            isOneToOne: false
            referencedRelation: "dim_fecha"
            referencedColumns: ["fecha"]
          },
          {
            foreignKeyName: "fact_ventas_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "dim_productos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fact_ventas_retailer_id_fkey"
            columns: ["retailer_id"]
            isOneToOne: false
            referencedRelation: "dim_retailers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fact_ventas_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fact_ventas_tienda_id_fkey"
            columns: ["tienda_id"]
            isOneToOne: false
            referencedRelation: "dim_tiendas"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          config: Json | null
          contacto_email: string
          created_at: string | null
          estado: string | null
          id: string
          nombre_empresa: string
          plan: string | null
          updated_at: string | null
        }
        Insert: {
          config?: Json | null
          contacto_email: string
          created_at?: string | null
          estado?: string | null
          id?: string
          nombre_empresa: string
          plan?: string | null
          updated_at?: string | null
        }
        Update: {
          config?: Json | null
          contacto_email?: string
          created_at?: string | null
          estado?: string | null
          id?: string
          nombre_empresa?: string
          plan?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          activo: boolean | null
          avatar_url: string | null
          created_at: string | null
          email: string
          id: string
          last_login: string | null
          nombre: string | null
          tenant_id: string
        }
        Insert: {
          activo?: boolean | null
          avatar_url?: string | null
          created_at?: string | null
          email: string
          id: string
          last_login?: string | null
          nombre?: string | null
          tenant_id: string
        }
        Update: {
          activo?: boolean | null
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          id?: string
          last_login?: string | null
          nombre?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      mv_metricas_producto_tienda: {
        Row: {
          desempeno: string | null
          dias_con_venta_30d: number | null
          dias_inventario: number | null
          dias_sin_venta_15d: number | null
          fecha_inventario: string | null
          fill_rate: number | null
          inventario_actual: number | null
          inventario_ideal: number | null
          pct_inventario: number | null
          producto_id: number | null
          retailer_id: number | null
          sugerido_compra_cajas: number | null
          sugerido_compra_final: number | null
          sugerido_compra_unidades: number | null
          tenant_id: string | null
          tienda_id: number | null
          ultima_venta: string | null
          unidades_30d: number | null
          unidades_7d: number | null
          updated_at: string | null
          venta_30d: number | null
          venta_7d: number | null
          venta_promedio_diaria: number | null
          venta_promedio_pesos: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fact_ventas_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "dim_productos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fact_ventas_retailer_id_fkey"
            columns: ["retailer_id"]
            isOneToOne: false
            referencedRelation: "dim_retailers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fact_ventas_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fact_ventas_tienda_id_fkey"
            columns: ["tienda_id"]
            isOneToOne: false
            referencedRelation: "dim_tiendas"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      cleanup_old_conversations: { Args: Record<PropertyKey, never>; Returns: undefined }
      get_analisis_ciudades_yoy: {
        Args: { p_anio?: number; p_producto_ids?: number[] }
        Returns: Json
      }
      get_analisis_estacionalidad_semanal: {
        Args: {
          p_ciudades?: string[]
          p_fecha_fin?: string
          p_fecha_inicio?: string
        }
        Returns: Json
      }
      get_analisis_kpis_yoy: {
        Args: {
          p_anio?: number
          p_ciudades?: string[]
          p_producto_ids?: number[]
        }
        Returns: Json
      }
      get_analisis_productos_yoy: {
        Args: {
          p_anio?: number
          p_ciudades?: string[]
          p_limit?: number
          p_tipo?: string
        }
        Returns: Json
      }
      get_analisis_tiendas_yoy: {
        Args: {
          p_anio?: number
          p_ciudades?: string[]
          p_limit?: number
          p_tipo?: string
        }
        Returns: Json
      }
      get_analisis_ventas_mensuales_yoy: {
        Args: {
          p_anio?: number
          p_ciudades?: string[]
          p_producto_ids?: number[]
        }
        Returns: Json
      }
      get_dashboard_metrics: { Args: { dias_periodo?: number }; Returns: Json }
      get_ia_context: { Args: Record<PropertyKey, never>; Returns: Json }
      get_inventario_alertas: {
        Args: {
          p_fecha_fin?: string
          p_fecha_inicio?: string
          p_limit?: number
        }
        Returns: Json
      }
      get_inventario_evolucion: {
        Args: {
          p_fecha_fin?: string
          p_fecha_inicio?: string
          p_producto_id?: number
          p_tienda_id?: number
        }
        Returns: Json
      }
      get_inventario_filtros: { Args: Record<PropertyKey, never>; Returns: Json }
      get_inventario_heatmap: {
        Args: {
          p_ciudades?: string[]
          p_fecha_fin?: string
          p_fecha_inicio?: string
          p_producto_ids?: number[]
        }
        Returns: Json
      }
      get_inventario_kpis: {
        Args: {
          p_ciudades?: string[]
          p_fecha_fin?: string
          p_fecha_inicio?: string
          p_producto_ids?: number[]
          p_tienda_ids?: number[]
        }
        Returns: Json
      }
      get_inventario_tabla: {
        Args: {
          p_busqueda?: string
          p_ciudades?: string[]
          p_estado?: string
          p_fecha_fin?: string
          p_fecha_inicio?: string
          p_limit?: number
          p_offset?: number
          p_order_by?: string
          p_order_dir?: string
          p_producto_ids?: number[]
          p_tienda_ids?: number[]
        }
        Returns: Json
      }
      get_inventario_top_venta_perdida: {
        Args: {
          p_ciudades?: string[]
          p_fecha_fin?: string
          p_fecha_inicio?: string
          p_limit?: number
        }
        Returns: Json
      }
      get_mix_categorias: { Args: { dias_periodo?: number }; Returns: Json }
      get_precios_alertas: {
        Args: {
          p_fecha_fin?: string
          p_fecha_inicio?: string
          p_limit?: number
        }
        Returns: Json
      }
      get_precios_alta_variabilidad: {
        Args: {
          p_ciudades?: string[]
          p_fecha_fin?: string
          p_fecha_inicio?: string
          p_limit?: number
        }
        Returns: Json
      }
      get_precios_detalle: {
        Args: {
          p_busqueda?: string
          p_ciudades?: string[]
          p_fecha_fin?: string
          p_fecha_inicio?: string
          p_limit?: number
          p_offset?: number
          p_order_by?: string
          p_order_dir?: string
          p_producto_ids?: number[]
          p_tienda_ids?: number[]
        }
        Returns: Json
      }
      get_precios_dispersion:
        | {
            Args: {
              p_ciudades?: string[]
              p_fecha_fin?: string
              p_fecha_inicio?: string
              p_producto_id: number
            }
            Returns: Json
          }
        | {
            Args: {
              p_ciudades?: string[]
              p_fecha_fin?: string
              p_fecha_inicio?: string
            }
            Returns: Json
          }
      get_precios_evolucion:
        | {
            Args: {
              p_ciudades?: string[]
              p_fecha_fin?: string
              p_fecha_inicio?: string
              p_producto_ids?: number[]
            }
            Returns: Json
          }
        | {
            Args: {
              p_ciudades?: string[]
              p_fecha_fin?: string
              p_fecha_inicio?: string
              p_producto_id?: number
            }
            Returns: Json
          }
      get_precios_filtros: { Args: Record<PropertyKey, never>; Returns: Json }
      get_precios_kpis: {
        Args: {
          p_ciudades?: string[]
          p_fecha_fin?: string
          p_fecha_inicio?: string
          p_producto_ids?: number[]
        }
        Returns: Json
      }
      get_precios_por_ciudad: {
        Args: {
          p_fecha_fin?: string
          p_fecha_inicio?: string
          p_producto_ids?: number[]
        }
        Returns: Json
      }
      get_precios_por_producto:
        | {
            Args: {
              p_busqueda?: string
              p_ciudades?: string[]
              p_fecha_fin?: string
              p_fecha_inicio?: string
              p_limit?: number
              p_offset?: number
              p_order_by?: string
              p_order_dir?: string
              p_producto_ids?: number[]
            }
            Returns: Json
          }
        | {
            Args: {
              p_ciudades?: string[]
              p_fecha_fin?: string
              p_fecha_inicio?: string
              p_producto_ids?: number[]
            }
            Returns: Json
          }
      get_precios_por_tienda: {
        Args: {
          p_fecha_fin?: string
          p_fecha_inicio?: string
          p_producto_id: number
        }
        Returns: Json
      }
      get_productos_con_ventas: {
        Args: {
          dias_periodo?: number
          p_busqueda?: string
          p_categoria?: string
          p_marca?: string
          p_retailer_id?: number
        }
        Returns: {
          categoria: string
          marca: string
          nombre: string
          num_tiendas: number
          participacion: number
          precio_promedio: number
          producto_id: number
          unidades: number
          upc: string
          variacion_porcentual: number
          ventas: number
        }[]
      }
      get_productos_filtros: { Args: Record<PropertyKey, never>; Returns: Json }
      get_productos_kpis_v2: {
        Args: {
          p_categoria?: string
          p_fecha_fin?: string
          p_fecha_inicio?: string
          p_tienda_id?: number
        }
        Returns: Json
      }
      get_productos_kpis_v3: {
        Args: {
          p_categorias?: string[]
          p_fecha_fin?: string
          p_fecha_inicio?: string
          p_producto_ids?: number[]
          p_tienda_ids?: number[]
        }
        Returns: Json
      }
      get_productos_pareto_v2: {
        Args: {
          p_categoria?: string
          p_fecha_fin?: string
          p_fecha_inicio?: string
          p_tienda_id?: number
        }
        Returns: Json
      }
      get_productos_pareto_v3: {
        Args: {
          p_categorias?: string[]
          p_fecha_fin?: string
          p_fecha_inicio?: string
          p_producto_ids?: number[]
          p_tienda_ids?: number[]
        }
        Returns: Json
      }
      get_productos_tabla_v2: {
        Args: {
          p_busqueda?: string
          p_categoria?: string
          p_fecha_fin?: string
          p_fecha_inicio?: string
          p_limit?: number
          p_offset?: number
          p_order_by?: string
          p_order_dir?: string
          p_tienda_id?: number
        }
        Returns: Json
      }
      get_productos_tabla_v3: {
        Args: {
          p_busqueda?: string
          p_categorias?: string[]
          p_fecha_fin?: string
          p_fecha_inicio?: string
          p_limit?: number
          p_offset?: number
          p_order_by?: string
          p_order_dir?: string
          p_producto_ids?: number[]
          p_tienda_ids?: number[]
        }
        Returns: Json
      }
      get_productos_top_caida: {
        Args: { dias_periodo?: number; limite?: number }
        Returns: {
          categoria: string
          nombre: string
          producto_id: number
          variacion_porcentual: number
          ventas_actual: number
          ventas_anterior: number
        }[]
      }
      get_productos_top_crecimiento: {
        Args: { dias_periodo?: number; limite?: number }
        Returns: {
          categoria: string
          nombre: string
          producto_id: number
          variacion_porcentual: number
          ventas_actual: number
          ventas_anterior: number
        }[]
      }
      get_productos_variacion_v2: {
        Args: {
          p_categoria?: string
          p_fecha_fin?: string
          p_fecha_inicio?: string
          p_tienda_id?: number
          p_tipo?: string
        }
        Returns: Json
      }
      get_productos_variacion_v3: {
        Args: {
          p_categorias?: string[]
          p_fecha_fin?: string
          p_fecha_inicio?: string
          p_producto_ids?: number[]
          p_tienda_ids?: number[]
          p_tipo?: string
        }
        Returns: Json
      }
      get_reabastecimiento_abc: {
        Args: {
          p_ciudades?: string[]
          p_fecha_fin?: string
          p_fecha_inicio?: string
        }
        Returns: Json
      }
      get_reabastecimiento_alertas_clase_a: {
        Args: {
          p_fecha_fin?: string
          p_fecha_inicio?: string
          p_limit?: number
        }
        Returns: Json
      }
      get_reabastecimiento_fill_rate: {
        Args: {
          p_ciudades?: string[]
          p_fecha_fin?: string
          p_fecha_inicio?: string
          p_limit?: number
        }
        Returns: Json
      }
      get_reabastecimiento_filtros: { Args: Record<PropertyKey, never>; Returns: Json }
      get_reabastecimiento_kpis: {
        Args: {
          p_ciudades?: string[]
          p_fecha_fin?: string
          p_fecha_inicio?: string
          p_producto_ids?: number[]
        }
        Returns: Json
      }
      get_reabastecimiento_tabla: {
        Args: {
          p_busqueda?: string
          p_ciudades?: string[]
          p_clasificacion?: string
          p_fecha_fin?: string
          p_fecha_inicio?: string
          p_limit?: number
          p_offset?: number
          p_order_by?: string
          p_order_dir?: string
          p_prioridad?: string
          p_producto_ids?: number[]
        }
        Returns: Json
      }
      get_reabastecimiento_tendencia: {
        Args: { p_ciudades?: string[]; p_limit?: number }
        Returns: Json
      }
      get_sellout_abc_productos: {
        Args: { p_days?: number; p_retailer_id?: number; p_tenant_id: string }
        Returns: {
          clasificacion: string
          contribucion_acumulada: number
          contribucion_venta: number
          producto_id: number
          producto_nombre: string
          producto_upc: string
          ranking: number
          unidades_total: number
          venta_total: number
        }[]
      }
      get_sellout_abc_tiendas: {
        Args: { p_days?: number; p_retailer_id?: number; p_tenant_id: string }
        Returns: {
          clasificacion: string
          contribucion_acumulada: number
          contribucion_venta: number
          ranking: number
          tienda_ciudad: string
          tienda_cluster: string
          tienda_id: number
          tienda_nombre: string
          unidades_total: number
          venta_total: number
        }[]
      }
      get_sellout_alertas: {
        Args: { p_retailer_id?: number; p_tenant_id: string }
        Returns: {
          dias_inventario: number
          inventario_actual: number
          producto_id: number
          producto_nombre: string
          sugerido_compra_final: number
          tienda_id: number
          tienda_nombre: string
          tipo_alerta: string
          venta_promedio_diaria: number
        }[]
      }
      get_sellout_analisis_precios: {
        Args: { p_days?: number; p_retailer_id?: number; p_tenant_id: string }
        Returns: {
          precio_max: number
          precio_min: number
          precio_promedio_actual: number
          precio_sugerido: number
          producto_id: number
          producto_nombre: string
          producto_upc: string
          tiendas_fuera_rango: number
          tiendas_totales: number
          variacion_vs_sugerido: number
        }[]
      }
      get_sellout_distribution_numeric: {
        Args: { p_retailer_id?: number; p_tenant_id: string }
        Returns: {
          dn_pct: number
          oportunidad_expansion: number
          potencial_venta_expansion: number
          producto_id: number
          producto_nombre: string
          producto_upc: string
          tiendas_con_stock: number
          tiendas_con_venta_30d: number
          tiendas_totales: number
          venta_promedio_tienda: number
        }[]
      }
      get_sellout_growth: {
        Args: { p_days?: number; p_retailer_id?: number; p_tenant_id: string }
        Returns: {
          crecimiento_pct: number
          crecimiento_unidades_pct: number
          producto_id: number
          producto_nombre: string
          producto_upc: string
          tendencia: string
          unidades_periodo_actual: number
          unidades_periodo_anterior: number
          venta_periodo_actual: number
          venta_periodo_anterior: number
        }[]
      }
      get_sellout_oos_rate: {
        Args: { p_days?: number; p_retailer_id?: number; p_tenant_id: string }
        Returns: {
          dias_con_stock: number
          dias_en_oos: number
          dias_totales: number
          disponibilidad_pct: number
          estado: string
          inventario_actual: number
          oos_rate_pct: number
          producto_id: number
          producto_nombre: string
          producto_upc: string
          tienda_ciudad: string
          tienda_id: number
          tienda_nombre: string
        }[]
      }
      get_sellout_oos_resumen: {
        Args: { p_days?: number; p_retailer_id?: number; p_tenant_id: string }
        Returns: {
          disponibilidad_promedio: number
          oos_rate_promedio: number
          productos_atencion: number
          productos_criticos: number
          productos_en_quiebre_hoy: number
          total_producto_tiendas: number
          venta_perdida_total_pesos: number
          venta_perdida_total_unidades: number
        }[]
      }
      get_sellout_productos_detalle: {
        Args: {
          p_desempeno?: string
          p_limit?: number
          p_retailer_id?: number
          p_tenant_id: string
        }
        Returns: {
          case_pack: number
          ciudad: string
          cluster: string
          desempeno: string
          dias_inventario: number
          dias_sin_venta: number
          fill_rate: number
          inventario_actual: number
          inventario_ideal: number
          pct_inventario: number
          producto_id: number
          producto_nombre: string
          producto_upc: string
          sugerido_compra_cajas: number
          sugerido_compra_final: number
          sugerido_compra_unidades: number
          tienda_id: number
          tienda_nombre: string
          venta_30d: number
          venta_promedio_diaria: number
        }[]
      }
      get_sellout_resumen_inventario: {
        Args: { p_retailer_id?: number; p_tenant_id: string }
        Returns: {
          inventario_total: number
          skus_inventario_sano: number
          skus_quiebre: number
          skus_resurtir_urgente: number
          skus_sobre_stock: number
          skus_venta_cero: number
          sugerido_total: number
          total_skus: number
          total_tiendas: number
          venta_total_30d: number
        }[]
      }
      get_sellout_top_productos: {
        Args: { p_limit?: number; p_retailer_id?: number; p_tenant_id: string }
        Returns: {
          inventario_total: number
          producto_id: number
          producto_nombre: string
          sugerido_total: number
          tiendas_con_stock: number
          tiendas_con_venta: number
          unidades_total: number
          venta_total: number
        }[]
      }
      get_sellout_top_tiendas: {
        Args: { p_limit?: number; p_retailer_id?: number; p_tenant_id: string }
        Returns: {
          ciudad: string
          cluster: string
          inventario_total: number
          skus_activos: number
          skus_quiebre: number
          sugerido_total: number
          tienda_id: number
          tienda_nombre: string
          venta_total: number
        }[]
      }
      get_sellout_venta_perdida_oos: {
        Args: { p_days?: number; p_retailer_id?: number; p_tenant_id: string }
        Returns: {
          dias_consecutivos_oos: number
          dias_en_oos: number
          precio_promedio: number
          producto_id: number
          producto_nombre: string
          producto_upc: string
          tienda_ciudad: string
          tienda_id: number
          tienda_nombre: string
          ultima_fecha_con_stock: string
          venta_perdida_pesos: number
          venta_perdida_unidades: number
          venta_promedio_diaria: number
        }[]
      }
      get_tiendas_cobertura_skus: {
        Args: {
          p_categorias?: string[]
          p_ciudades?: string[]
          p_clusters?: string[]
          p_fecha_fin?: string
          p_fecha_inicio?: string
        }
        Returns: Json
      }
      get_tiendas_filtros: { Args: Record<PropertyKey, never>; Returns: Json }
      get_tiendas_kpis: {
        Args: {
          p_categorias?: string[]
          p_ciudades?: string[]
          p_clusters?: string[]
          p_fecha_fin?: string
          p_fecha_inicio?: string
          p_producto_ids?: number[]
        }
        Returns: Json
      }
      get_tiendas_por_ciudad: {
        Args: {
          p_categorias?: string[]
          p_ciudades?: string[]
          p_clusters?: string[]
          p_fecha_fin?: string
          p_fecha_inicio?: string
          p_producto_ids?: number[]
        }
        Returns: Json
      }
      get_tiendas_ranking: {
        Args: {
          p_categorias?: string[]
          p_ciudades?: string[]
          p_clusters?: string[]
          p_fecha_fin?: string
          p_fecha_inicio?: string
          p_limit?: number
          p_producto_ids?: number[]
          p_tipo?: string
        }
        Returns: Json
      }
      get_tiendas_tabla: {
        Args: {
          p_busqueda?: string
          p_categorias?: string[]
          p_ciudades?: string[]
          p_clusters?: string[]
          p_fecha_fin?: string
          p_fecha_inicio?: string
          p_limit?: number
          p_offset?: number
          p_order_by?: string
          p_order_dir?: string
          p_producto_ids?: number[]
        }
        Returns: Json
      }
      get_top_productos: { Args: { dias_periodo?: number }; Returns: Json }
      get_top_tiendas: { Args: { dias_periodo?: number }; Returns: Json }
      get_user_tenant_id: { Args: Record<PropertyKey, never>; Returns: string }
      get_ventas_mensuales_yoy: { Args: Record<PropertyKey, never>; Returns: Json }
      poblar_dim_fecha: {
        Args: { fecha_fin: string; fecha_inicio: string }
        Returns: undefined
      }
      refresh_mv_metricas: { Args: Record<PropertyKey, never>; Returns: undefined }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
