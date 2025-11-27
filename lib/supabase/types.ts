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
      acciones_seguimiento: {
        Row: {
          created_at: string | null
          fecha_accion: string | null
          fecha_recordatorio: string | null
          id: number
          id_cliente: number | null
          id_prediccion: number | null
          id_producto: number | null
          notas: string | null
          resultado: string
          tenant_id: string
          tipo_accion: string
          usuario_id: string | null
        }
        Insert: {
          created_at?: string | null
          fecha_accion?: string | null
          fecha_recordatorio?: string | null
          id?: number
          id_cliente?: number | null
          id_prediccion?: number | null
          id_producto?: number | null
          notas?: string | null
          resultado: string
          tenant_id: string
          tipo_accion: string
          usuario_id?: string | null
        }
        Update: {
          created_at?: string | null
          fecha_accion?: string | null
          fecha_recordatorio?: string | null
          id?: number
          id_cliente?: number | null
          id_prediccion?: number | null
          id_producto?: number | null
          notas?: string | null
          resultado?: string
          tenant_id?: string
          tipo_accion?: string
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "acciones_seguimiento_id_cliente_fkey"
            columns: ["id_cliente"]
            isOneToOne: false
            referencedRelation: "dim_clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acciones_seguimiento_id_prediccion_fkey"
            columns: ["id_prediccion"]
            isOneToOne: false
            referencedRelation: "analytics_predicciones_compra"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acciones_seguimiento_id_producto_fkey"
            columns: ["id_producto"]
            isOneToOne: false
            referencedRelation: "dim_productos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acciones_seguimiento_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_clientes_metricas: {
        Row: {
          calculated_at: string
          desviacion_estandar_frecuencia: number | null
          fecha_fin: string
          fecha_inicio: string
          frecuencia_compra_dias: number | null
          frequency_score: number | null
          id: number
          id_cliente: number
          monetary_score: number | null
          nivel_riesgo: string | null
          numero_pedidos: number | null
          periodo_dias: number
          probabilidad_churn: number | null
          recency_dias: number | null
          rfm_segmento: string | null
          tasa_crecimiento_mensual: number | null
          tenant_id: string
          tendencia: string | null
          ticket_promedio: number | null
          total_unidades: number | null
          total_ventas: number | null
          total_ventas_anio_anterior: number | null
          variacion_yoy_porcentaje: number | null
        }
        Insert: {
          calculated_at?: string
          desviacion_estandar_frecuencia?: number | null
          fecha_fin: string
          fecha_inicio: string
          frecuencia_compra_dias?: number | null
          frequency_score?: number | null
          id?: number
          id_cliente: number
          monetary_score?: number | null
          nivel_riesgo?: string | null
          numero_pedidos?: number | null
          periodo_dias: number
          probabilidad_churn?: number | null
          recency_dias?: number | null
          rfm_segmento?: string | null
          tasa_crecimiento_mensual?: number | null
          tenant_id: string
          tendencia?: string | null
          ticket_promedio?: number | null
          total_unidades?: number | null
          total_ventas?: number | null
          total_ventas_anio_anterior?: number | null
          variacion_yoy_porcentaje?: number | null
        }
        Update: {
          calculated_at?: string
          desviacion_estandar_frecuencia?: number | null
          fecha_fin?: string
          fecha_inicio?: string
          frecuencia_compra_dias?: number | null
          frequency_score?: number | null
          id?: number
          id_cliente?: number
          monetary_score?: number | null
          nivel_riesgo?: string | null
          numero_pedidos?: number | null
          periodo_dias?: number
          probabilidad_churn?: number | null
          recency_dias?: number | null
          rfm_segmento?: string | null
          tasa_crecimiento_mensual?: number | null
          tenant_id?: string
          tendencia?: string | null
          ticket_promedio?: number | null
          total_unidades?: number | null
          total_ventas?: number | null
          total_ventas_anio_anterior?: number | null
          variacion_yoy_porcentaje?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_clientes_metricas_id_cliente_fkey"
            columns: ["id_cliente"]
            isOneToOne: false
            referencedRelation: "dim_clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_clientes_metricas_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_forecast_produccion: {
        Row: {
          calculated_at: string
          calculated_date: string
          cantidad_a_producir: number | null
          costo_produccion_unitario: number | null
          demanda_diaria_promedio: number | null
          demanda_proyectada_30d: number | null
          demanda_proyectada_60d: number | null
          demanda_proyectada_90d: number | null
          dias_cobertura: number | null
          dias_para_stockout: number | null
          estado_stock: string | null
          fecha_entrega_estimada: string | null
          fecha_inicio_produccion_sugerida: string | null
          id: number
          id_producto: number
          ordenes_produccion_pendientes: number | null
          prioridad: string | null
          punto_reorden: number | null
          rotacion_inventario: number | null
          stock_danado: number | null
          stock_disponible: number | null
          stock_en_produccion: number | null
          stock_maximo: number | null
          stock_minimo: number | null
          stock_objetivo: number | null
          stock_reservado: number | null
          stock_total: number | null
          tenant_id: string
          tendencia_demanda: string | null
          valor_inventario_actual: number | null
          valor_produccion_sugerida: number | null
          valor_ventas_perdidas_30d: number | null
          ventas_perdidas_30d: number | null
        }
        Insert: {
          calculated_at?: string
          calculated_date?: string
          cantidad_a_producir?: number | null
          costo_produccion_unitario?: number | null
          demanda_diaria_promedio?: number | null
          demanda_proyectada_30d?: number | null
          demanda_proyectada_60d?: number | null
          demanda_proyectada_90d?: number | null
          dias_cobertura?: number | null
          dias_para_stockout?: number | null
          estado_stock?: string | null
          fecha_entrega_estimada?: string | null
          fecha_inicio_produccion_sugerida?: string | null
          id?: number
          id_producto: number
          ordenes_produccion_pendientes?: number | null
          prioridad?: string | null
          punto_reorden?: number | null
          rotacion_inventario?: number | null
          stock_danado?: number | null
          stock_disponible?: number | null
          stock_en_produccion?: number | null
          stock_maximo?: number | null
          stock_minimo?: number | null
          stock_objetivo?: number | null
          stock_reservado?: number | null
          stock_total?: number | null
          tenant_id: string
          tendencia_demanda?: string | null
          valor_inventario_actual?: number | null
          valor_produccion_sugerida?: number | null
          valor_ventas_perdidas_30d?: number | null
          ventas_perdidas_30d?: number | null
        }
        Update: {
          calculated_at?: string
          calculated_date?: string
          cantidad_a_producir?: number | null
          costo_produccion_unitario?: number | null
          demanda_diaria_promedio?: number | null
          demanda_proyectada_30d?: number | null
          demanda_proyectada_60d?: number | null
          demanda_proyectada_90d?: number | null
          dias_cobertura?: number | null
          dias_para_stockout?: number | null
          estado_stock?: string | null
          fecha_entrega_estimada?: string | null
          fecha_inicio_produccion_sugerida?: string | null
          id?: number
          id_producto?: number
          ordenes_produccion_pendientes?: number | null
          prioridad?: string | null
          punto_reorden?: number | null
          rotacion_inventario?: number | null
          stock_danado?: number | null
          stock_disponible?: number | null
          stock_en_produccion?: number | null
          stock_maximo?: number | null
          stock_minimo?: number | null
          stock_objetivo?: number | null
          stock_reservado?: number | null
          stock_total?: number | null
          tenant_id?: string
          tendencia_demanda?: string | null
          valor_inventario_actual?: number | null
          valor_produccion_sugerida?: number | null
          valor_ventas_perdidas_30d?: number | null
          ventas_perdidas_30d?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_forecast_produccion_id_producto_fkey"
            columns: ["id_producto"]
            isOneToOne: false
            referencedRelation: "dim_productos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_forecast_produccion_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_predicciones_compra: {
        Row: {
          calculated_at: string
          cantidad_estimada: number | null
          cantidad_maxima: number | null
          cantidad_minima: number | null
          cantidad_promedio: number | null
          cantidad_ultima_compra: number | null
          confianza_prediccion: number | null
          desviacion_estandar_dias: number | null
          dias_restantes: number | null
          estado_alerta: string | null
          fecha_proxima_compra_estimada: string | null
          fecha_ultima_compra: string
          frecuencia_promedio_dias: number | null
          id: number
          id_cliente: number
          id_producto: number
          nivel_confianza: string | null
          numero_compras_historicas: number | null
          precio_unitario_promedio: number | null
          tenant_id: string
          valor_estimado: number | null
        }
        Insert: {
          calculated_at?: string
          cantidad_estimada?: number | null
          cantidad_maxima?: number | null
          cantidad_minima?: number | null
          cantidad_promedio?: number | null
          cantidad_ultima_compra?: number | null
          confianza_prediccion?: number | null
          desviacion_estandar_dias?: number | null
          dias_restantes?: number | null
          estado_alerta?: string | null
          fecha_proxima_compra_estimada?: string | null
          fecha_ultima_compra: string
          frecuencia_promedio_dias?: number | null
          id?: number
          id_cliente: number
          id_producto: number
          nivel_confianza?: string | null
          numero_compras_historicas?: number | null
          precio_unitario_promedio?: number | null
          tenant_id: string
          valor_estimado?: number | null
        }
        Update: {
          calculated_at?: string
          cantidad_estimada?: number | null
          cantidad_maxima?: number | null
          cantidad_minima?: number | null
          cantidad_promedio?: number | null
          cantidad_ultima_compra?: number | null
          confianza_prediccion?: number | null
          desviacion_estandar_dias?: number | null
          dias_restantes?: number | null
          estado_alerta?: string | null
          fecha_proxima_compra_estimada?: string | null
          fecha_ultima_compra?: string
          frecuencia_promedio_dias?: number | null
          id?: number
          id_cliente?: number
          id_producto?: number
          nivel_confianza?: string | null
          numero_compras_historicas?: number | null
          precio_unitario_promedio?: number | null
          tenant_id?: string
          valor_estimado?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_predicciones_compra_id_cliente_fkey"
            columns: ["id_cliente"]
            isOneToOne: false
            referencedRelation: "dim_clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_predicciones_compra_id_producto_fkey"
            columns: ["id_producto"]
            isOneToOne: false
            referencedRelation: "dim_productos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_predicciones_compra_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      data_sources: {
        Row: {
          activo: boolean | null
          config: Json
          created_at: string
          descripcion: string | null
          estado: string
          field_mapping: Json
          frecuencia_sync_horas: number | null
          id: string
          nombre: string
          proxima_sincronizacion: string | null
          registros_sincronizados_total: number | null
          tenant_id: string
          tipo: string
          ultima_sincronizacion: string | null
          ultimo_error: string | null
          updated_at: string
        }
        Insert: {
          activo?: boolean | null
          config: Json
          created_at?: string
          descripcion?: string | null
          estado?: string
          field_mapping: Json
          frecuencia_sync_horas?: number | null
          id?: string
          nombre: string
          proxima_sincronizacion?: string | null
          registros_sincronizados_total?: number | null
          tenant_id: string
          tipo: string
          ultima_sincronizacion?: string | null
          ultimo_error?: string | null
          updated_at?: string
        }
        Update: {
          activo?: boolean | null
          config?: Json
          created_at?: string
          descripcion?: string | null
          estado?: string
          field_mapping?: Json
          frecuencia_sync_horas?: number | null
          id?: string
          nombre?: string
          proxima_sincronizacion?: string | null
          registros_sincronizados_total?: number | null
          tenant_id?: string
          tipo?: string
          ultima_sincronizacion?: string | null
          ultimo_error?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "data_sources_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      dim_clientes: {
        Row: {
          activo: boolean | null
          canal: string | null
          ciudad: string | null
          clave_cliente: string
          codigo_postal: string | null
          contacto_principal: Json | null
          created_at: string
          descuento_comercial: number | null
          dias_credito: number | null
          direccion_entrega: Json | null
          estado: string | null
          frecuencia_compra_dias: number | null
          id: number
          limite_credito: number | null
          nivel_riesgo: string | null
          nombre_comercial: string
          patron_compra: string | null
          razon_social: string | null
          region: string | null
          rfc: string | null
          segmento_abc: string | null
          tenant_id: string
          tendencia: string | null
          ticket_promedio: number | null
          tipo_cliente: string
          total_compras_12m: number | null
          ultima_compra: string | null
          updated_at: string
          zona: string | null
        }
        Insert: {
          activo?: boolean | null
          canal?: string | null
          ciudad?: string | null
          clave_cliente: string
          codigo_postal?: string | null
          contacto_principal?: Json | null
          created_at?: string
          descuento_comercial?: number | null
          dias_credito?: number | null
          direccion_entrega?: Json | null
          estado?: string | null
          frecuencia_compra_dias?: number | null
          id?: number
          limite_credito?: number | null
          nivel_riesgo?: string | null
          nombre_comercial: string
          patron_compra?: string | null
          razon_social?: string | null
          region?: string | null
          rfc?: string | null
          segmento_abc?: string | null
          tenant_id: string
          tendencia?: string | null
          ticket_promedio?: number | null
          tipo_cliente?: string
          total_compras_12m?: number | null
          ultima_compra?: string | null
          updated_at?: string
          zona?: string | null
        }
        Update: {
          activo?: boolean | null
          canal?: string | null
          ciudad?: string | null
          clave_cliente?: string
          codigo_postal?: string | null
          contacto_principal?: Json | null
          created_at?: string
          descuento_comercial?: number | null
          dias_credito?: number | null
          direccion_entrega?: Json | null
          estado?: string | null
          frecuencia_compra_dias?: number | null
          id?: number
          limite_credito?: number | null
          nivel_riesgo?: string | null
          nombre_comercial?: string
          patron_compra?: string | null
          razon_social?: string | null
          region?: string | null
          rfc?: string | null
          segmento_abc?: string | null
          tenant_id?: string
          tendencia?: string | null
          ticket_promedio?: number | null
          tipo_cliente?: string
          total_compras_12m?: number | null
          ultima_compra?: string | null
          updated_at?: string
          zona?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dim_clientes_tenant_id_fkey"
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
          dia_anio: number
          dia_mes: number
          dia_semana: number
          es_festivo: boolean | null
          es_fin_semana: boolean
          fecha: string
          fecha_anterior: string | null
          fecha_id: number
          fecha_siguiente: string | null
          mes: number
          mes_anio: string
          nombre_dia_semana: string
          nombre_dia_semana_corto: string
          nombre_festivo: string | null
          nombre_mes: string
          nombre_mes_corto: string
          primer_dia_anio: string | null
          primer_dia_mes: string | null
          primer_dia_trimestre: string | null
          semana_anio: number
          semana_anio_str: string
          trimestre: number
          trimestre_anio: string
          ultimo_dia_anio: string | null
          ultimo_dia_mes: string | null
          ultimo_dia_trimestre: string | null
        }
        Insert: {
          anio: number
          dia_anio: number
          dia_mes: number
          dia_semana: number
          es_festivo?: boolean | null
          es_fin_semana: boolean
          fecha: string
          fecha_anterior?: string | null
          fecha_id?: number
          fecha_siguiente?: string | null
          mes: number
          mes_anio: string
          nombre_dia_semana: string
          nombre_dia_semana_corto: string
          nombre_festivo?: string | null
          nombre_mes: string
          nombre_mes_corto: string
          primer_dia_anio?: string | null
          primer_dia_mes?: string | null
          primer_dia_trimestre?: string | null
          semana_anio: number
          semana_anio_str: string
          trimestre: number
          trimestre_anio: string
          ultimo_dia_anio?: string | null
          ultimo_dia_mes?: string | null
          ultimo_dia_trimestre?: string | null
        }
        Update: {
          anio?: number
          dia_anio?: number
          dia_mes?: number
          dia_semana?: number
          es_festivo?: boolean | null
          es_fin_semana?: boolean
          fecha?: string
          fecha_anterior?: string | null
          fecha_id?: number
          fecha_siguiente?: string | null
          mes?: number
          mes_anio?: string
          nombre_dia_semana?: string
          nombre_dia_semana_corto?: string
          nombre_festivo?: string | null
          nombre_mes?: string
          nombre_mes_corto?: string
          primer_dia_anio?: string | null
          primer_dia_mes?: string | null
          primer_dia_trimestre?: string | null
          semana_anio?: number
          semana_anio_str?: string
          trimestre?: number
          trimestre_anio?: string
          ultimo_dia_anio?: string | null
          ultimo_dia_mes?: string | null
          ultimo_dia_trimestre?: string | null
        }
        Relationships: []
      }
      dim_productos: {
        Row: {
          activo: boolean | null
          capacidad_produccion_diaria: number | null
          categoria: string | null
          clave_producto: string
          codigo_barras: string | null
          codigo_barras_caja: string | null
          costo_produccion: number | null
          created_at: string
          descripcion: string | null
          dias_produccion: number | null
          dias_vida_util: number | null
          id: number
          linea_producto: string | null
          lote_minimo_produccion: number | null
          marca: string | null
          margen_objetivo: number | null
          nombre: string
          perecedero: boolean | null
          peso_kg: number | null
          piezas_por_caja: number | null
          precio_venta_sugerido: number | null
          punto_reorden: number | null
          requiere_refrigeracion: boolean | null
          sku: string | null
          stock_maximo: number | null
          stock_minimo: number | null
          subcategoria: string | null
          tenant_id: string
          unidad_medida: string
          updated_at: string
          volumen_lt: number | null
        }
        Insert: {
          activo?: boolean | null
          capacidad_produccion_diaria?: number | null
          categoria?: string | null
          clave_producto: string
          codigo_barras?: string | null
          codigo_barras_caja?: string | null
          costo_produccion?: number | null
          created_at?: string
          descripcion?: string | null
          dias_produccion?: number | null
          dias_vida_util?: number | null
          id?: number
          linea_producto?: string | null
          lote_minimo_produccion?: number | null
          marca?: string | null
          margen_objetivo?: number | null
          nombre: string
          perecedero?: boolean | null
          peso_kg?: number | null
          piezas_por_caja?: number | null
          precio_venta_sugerido?: number | null
          punto_reorden?: number | null
          requiere_refrigeracion?: boolean | null
          sku?: string | null
          stock_maximo?: number | null
          stock_minimo?: number | null
          subcategoria?: string | null
          tenant_id: string
          unidad_medida?: string
          updated_at?: string
          volumen_lt?: number | null
        }
        Update: {
          activo?: boolean | null
          capacidad_produccion_diaria?: number | null
          categoria?: string | null
          clave_producto?: string
          codigo_barras?: string | null
          codigo_barras_caja?: string | null
          costo_produccion?: number | null
          created_at?: string
          descripcion?: string | null
          dias_produccion?: number | null
          dias_vida_util?: number | null
          id?: number
          linea_producto?: string | null
          lote_minimo_produccion?: number | null
          marca?: string | null
          margen_objetivo?: number | null
          nombre?: string
          perecedero?: boolean | null
          peso_kg?: number | null
          piezas_por_caja?: number | null
          precio_venta_sugerido?: number | null
          punto_reorden?: number | null
          requiere_refrigeracion?: boolean | null
          sku?: string | null
          stock_maximo?: number | null
          stock_minimo?: number | null
          subcategoria?: string | null
          tenant_id?: string
          unidad_medida?: string
          updated_at?: string
          volumen_lt?: number | null
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
      fact_inventario: {
        Row: {
          costo_unitario: number | null
          created_at: string
          fecha_id: number
          id: number
          id_producto: number
          notas: string | null
          stock_danado: number | null
          stock_disponible: number
          stock_en_produccion: number | null
          stock_reservado: number | null
          stock_total: number | null
          tenant_id: string
          tipo_registro: string | null
          valor_inventario: number | null
        }
        Insert: {
          costo_unitario?: number | null
          created_at?: string
          fecha_id: number
          id?: number
          id_producto: number
          notas?: string | null
          stock_danado?: number | null
          stock_disponible: number
          stock_en_produccion?: number | null
          stock_reservado?: number | null
          stock_total?: number | null
          tenant_id: string
          tipo_registro?: string | null
          valor_inventario?: number | null
        }
        Update: {
          costo_unitario?: number | null
          created_at?: string
          fecha_id?: number
          id?: number
          id_producto?: number
          notas?: string | null
          stock_danado?: number | null
          stock_disponible?: number
          stock_en_produccion?: number | null
          stock_reservado?: number | null
          stock_total?: number | null
          tenant_id?: string
          tipo_registro?: string | null
          valor_inventario?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fact_inventario_fecha_id_fkey"
            columns: ["fecha_id"]
            isOneToOne: false
            referencedRelation: "dim_fecha"
            referencedColumns: ["fecha_id"]
          },
          {
            foreignKeyName: "fact_inventario_id_producto_fkey"
            columns: ["id_producto"]
            isOneToOne: false
            referencedRelation: "dim_productos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fact_inventario_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      fact_ordenes_produccion: {
        Row: {
          cantidad_defectuosa: number | null
          cantidad_planeada: number
          cantidad_producida: number | null
          costo_total: number | null
          created_at: string
          estado: string
          fecha_creacion_id: number
          fecha_fin_planeada_id: number | null
          fecha_fin_real_id: number | null
          fecha_inicio_planeada_id: number | null
          fecha_inicio_real_id: number | null
          id: number
          id_producto: number
          notas: string | null
          numero_orden: string
          prioridad: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          cantidad_defectuosa?: number | null
          cantidad_planeada: number
          cantidad_producida?: number | null
          costo_total?: number | null
          created_at?: string
          estado?: string
          fecha_creacion_id: number
          fecha_fin_planeada_id?: number | null
          fecha_fin_real_id?: number | null
          fecha_inicio_planeada_id?: number | null
          fecha_inicio_real_id?: number | null
          id?: number
          id_producto: number
          notas?: string | null
          numero_orden: string
          prioridad?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          cantidad_defectuosa?: number | null
          cantidad_planeada?: number
          cantidad_producida?: number | null
          costo_total?: number | null
          created_at?: string
          estado?: string
          fecha_creacion_id?: number
          fecha_fin_planeada_id?: number | null
          fecha_fin_real_id?: number | null
          fecha_inicio_planeada_id?: number | null
          fecha_inicio_real_id?: number | null
          id?: number
          id_producto?: number
          notas?: string | null
          numero_orden?: string
          prioridad?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fact_ordenes_produccion_fecha_creacion_id_fkey"
            columns: ["fecha_creacion_id"]
            isOneToOne: false
            referencedRelation: "dim_fecha"
            referencedColumns: ["fecha_id"]
          },
          {
            foreignKeyName: "fact_ordenes_produccion_fecha_fin_planeada_id_fkey"
            columns: ["fecha_fin_planeada_id"]
            isOneToOne: false
            referencedRelation: "dim_fecha"
            referencedColumns: ["fecha_id"]
          },
          {
            foreignKeyName: "fact_ordenes_produccion_fecha_fin_real_id_fkey"
            columns: ["fecha_fin_real_id"]
            isOneToOne: false
            referencedRelation: "dim_fecha"
            referencedColumns: ["fecha_id"]
          },
          {
            foreignKeyName: "fact_ordenes_produccion_fecha_inicio_planeada_id_fkey"
            columns: ["fecha_inicio_planeada_id"]
            isOneToOne: false
            referencedRelation: "dim_fecha"
            referencedColumns: ["fecha_id"]
          },
          {
            foreignKeyName: "fact_ordenes_produccion_fecha_inicio_real_id_fkey"
            columns: ["fecha_inicio_real_id"]
            isOneToOne: false
            referencedRelation: "dim_fecha"
            referencedColumns: ["fecha_id"]
          },
          {
            foreignKeyName: "fact_ordenes_produccion_id_producto_fkey"
            columns: ["id_producto"]
            isOneToOne: false
            referencedRelation: "dim_productos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fact_ordenes_produccion_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      fact_ventas: {
        Row: {
          cantidad_entregada: number
          cantidad_perdida: number | null
          cantidad_solicitada: number
          costo_total: number | null
          costo_unitario: number | null
          created_at: string
          descuento: number | null
          estado: string | null
          fecha_id: number
          id: number
          id_cliente: number
          id_producto: number
          impuestos: number | null
          margen_porcentaje: number | null
          numero_factura: string | null
          numero_orden: string | null
          precio_unitario: number
          subtotal: number
          tenant_id: string
          tipo_venta: string | null
          total: number
          unidad_medida: string
          updated_at: string
          utilidad: number | null
        }
        Insert: {
          cantidad_entregada: number
          cantidad_perdida?: number | null
          cantidad_solicitada: number
          costo_total?: number | null
          costo_unitario?: number | null
          created_at?: string
          descuento?: number | null
          estado?: string | null
          fecha_id: number
          id?: number
          id_cliente: number
          id_producto: number
          impuestos?: number | null
          margen_porcentaje?: number | null
          numero_factura?: string | null
          numero_orden?: string | null
          precio_unitario: number
          subtotal: number
          tenant_id: string
          tipo_venta?: string | null
          total: number
          unidad_medida: string
          updated_at?: string
          utilidad?: number | null
        }
        Update: {
          cantidad_entregada?: number
          cantidad_perdida?: number | null
          cantidad_solicitada?: number
          costo_total?: number | null
          costo_unitario?: number | null
          created_at?: string
          descuento?: number | null
          estado?: string | null
          fecha_id?: number
          id?: number
          id_cliente?: number
          id_producto?: number
          impuestos?: number | null
          margen_porcentaje?: number | null
          numero_factura?: string | null
          numero_orden?: string | null
          precio_unitario?: number
          subtotal?: number
          tenant_id?: string
          tipo_venta?: string | null
          total?: number
          unidad_medida?: string
          updated_at?: string
          utilidad?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fact_ventas_fecha_id_fkey"
            columns: ["fecha_id"]
            isOneToOne: false
            referencedRelation: "dim_fecha"
            referencedColumns: ["fecha_id"]
          },
          {
            foreignKeyName: "fact_ventas_id_cliente_fkey"
            columns: ["id_cliente"]
            isOneToOne: false
            referencedRelation: "dim_clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fact_ventas_id_producto_fkey"
            columns: ["id_producto"]
            isOneToOne: false
            referencedRelation: "dim_productos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fact_ventas_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      rushai_chats: {
        Row: {
          created_at: string
          id: string
          messages: Json
          tenant_id: string
          title: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          messages?: Json
          tenant_id: string
          title?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          messages?: Json
          tenant_id?: string
          title?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rushai_chats_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rushai_chats_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      rushai_queries_log: {
        Row: {
          chat_id: string | null
          created_at: string
          duracion_ms: number | null
          estado: string
          id: number
          question: string
          rpc_function_called: string | null
          rpc_params: Json | null
          tenant_id: string
          tokens_usados: number | null
          user_id: string | null
        }
        Insert: {
          chat_id?: string | null
          created_at?: string
          duracion_ms?: number | null
          estado: string
          id?: number
          question: string
          rpc_function_called?: string | null
          rpc_params?: Json | null
          tenant_id: string
          tokens_usados?: number | null
          user_id?: string | null
        }
        Update: {
          chat_id?: string | null
          created_at?: string
          duracion_ms?: number | null
          estado?: string
          id?: number
          question?: string
          rpc_function_called?: string | null
          rpc_params?: Json | null
          tenant_id?: string
          tokens_usados?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rushai_queries_log_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "rushai_chats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rushai_queries_log_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rushai_queries_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      sync_logs: {
        Row: {
          data_source_id: string
          duracion_segundos: number | null
          errores: Json | null
          estado: string
          finalizado_at: string | null
          id: number
          iniciado_at: string
          log_detallado: string | null
          registros_actualizados: number | null
          registros_con_error: number | null
          registros_insertados: number | null
          registros_leidos: number | null
          tenant_id: string
        }
        Insert: {
          data_source_id: string
          duracion_segundos?: number | null
          errores?: Json | null
          estado: string
          finalizado_at?: string | null
          id?: number
          iniciado_at?: string
          log_detallado?: string | null
          registros_actualizados?: number | null
          registros_con_error?: number | null
          registros_insertados?: number | null
          registros_leidos?: number | null
          tenant_id: string
        }
        Update: {
          data_source_id?: string
          duracion_segundos?: number | null
          errores?: Json | null
          estado?: string
          finalizado_at?: string | null
          id?: number
          iniciado_at?: string
          log_detallado?: string | null
          registros_actualizados?: number | null
          registros_con_error?: number | null
          registros_insertados?: number | null
          registros_leidos?: number | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sync_logs_data_source_id_fkey"
            columns: ["data_source_id"]
            isOneToOne: false
            referencedRelation: "data_sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sync_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          config: Json | null
          contacto_email: string
          contacto_nombre: string | null
          contacto_telefono: string | null
          created_at: string
          deleted_at: string | null
          estado: string
          fecha_fin_trial: string | null
          fecha_inicio_suscripcion: string
          id: string
          idioma: string | null
          industria: string | null
          limite_clientes: number | null
          limite_productos: number | null
          limite_queries_rushai_mes: number | null
          limite_storage_gb: number | null
          limite_usuarios: number | null
          moneda: string | null
          nombre_empresa: string
          plan: string
          razon_social: string
          rfc: string
          timezone: string | null
          updated_at: string
        }
        Insert: {
          config?: Json | null
          contacto_email: string
          contacto_nombre?: string | null
          contacto_telefono?: string | null
          created_at?: string
          deleted_at?: string | null
          estado?: string
          fecha_fin_trial?: string | null
          fecha_inicio_suscripcion?: string
          id?: string
          idioma?: string | null
          industria?: string | null
          limite_clientes?: number | null
          limite_productos?: number | null
          limite_queries_rushai_mes?: number | null
          limite_storage_gb?: number | null
          limite_usuarios?: number | null
          moneda?: string | null
          nombre_empresa: string
          plan?: string
          razon_social: string
          rfc: string
          timezone?: string | null
          updated_at?: string
        }
        Update: {
          config?: Json | null
          contacto_email?: string
          contacto_nombre?: string | null
          contacto_telefono?: string | null
          created_at?: string
          deleted_at?: string | null
          estado?: string
          fecha_fin_trial?: string | null
          fecha_inicio_suscripcion?: string
          id?: string
          idioma?: string | null
          industria?: string | null
          limite_clientes?: number | null
          limite_productos?: number | null
          limite_queries_rushai_mes?: number | null
          limite_storage_gb?: number | null
          limite_usuarios?: number | null
          moneda?: string | null
          nombre_empresa?: string
          plan?: string
          razon_social?: string
          rfc?: string
          timezone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      usuarios: {
        Row: {
          activo: boolean | null
          created_at: string
          email: string
          id: string
          nombre_completo: string | null
          permisos: Json | null
          queries_rushai_mes: number | null
          rol: string
          tenant_id: string
          ultimo_acceso: string | null
          ultimo_reset_queries: string | null
          updated_at: string
        }
        Insert: {
          activo?: boolean | null
          created_at?: string
          email: string
          id?: string
          nombre_completo?: string | null
          permisos?: Json | null
          queries_rushai_mes?: number | null
          rol?: string
          tenant_id: string
          ultimo_acceso?: string | null
          ultimo_reset_queries?: string | null
          updated_at?: string
        }
        Update: {
          activo?: boolean | null
          created_at?: string
          email?: string
          id?: string
          nombre_completo?: string | null
          permisos?: Json | null
          queries_rushai_mes?: number | null
          rol?: string
          tenant_id?: string
          ultimo_acceso?: string | null
          ultimo_reset_queries?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "usuarios_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      mv_kpis_diarios: {
        Row: {
          clientes_activos: number | null
          fecha: string | null
          ingresos: number | null
          margen_promedio: number | null
          mes_anio: string | null
          pedidos: number | null
          tenant_id: string | null
          trimestre_anio: string | null
          unidades: number | null
          utilidad: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fact_ventas_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      mv_ventas_producto: {
        Row: {
          categoria: string | null
          clientes_distintos: number | null
          id_producto: number | null
          mes_anio: string | null
          nombre_producto: string | null
          precio_promedio: number | null
          tenant_id: string | null
          total_unidades: number | null
          total_ventas: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fact_ventas_id_producto_fkey"
            columns: ["id_producto"]
            isOneToOne: false
            referencedRelation: "dim_productos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fact_ventas_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      calculate_inventory_forecast: {
        Args: { p_tenant_id: string }
        Returns: Json
      }
      calculate_purchase_predictions: {
        Args: { p_tenant_id: string }
        Returns: undefined
      }
      complete_action: {
        Args: {
          p_fecha_recordatorio?: string
          p_id_cliente?: number
          p_id_prediccion?: number
          p_id_producto?: number
          p_notas?: string
          p_resultado?: string
          p_tenant_id: string
          p_tipo_accion: string
          p_usuario_id?: string
        }
        Returns: Json
      }
      fn_get_max_fecha_fact_ventas: {
        Args: { p_tenant_id: string }
        Returns: {
          max_fecha: string
        }[]
      }
      fn_kpis_generales: {
        Args: {
          p_fecha_fin: string
          p_fecha_inicio: string
          p_tenant_id: string
        }
        Returns: {
          fill_rate: number
          numero_clientes: number
          numero_pedidos: number
          ticket_promedio: number
          total_unidades: number
          total_ventas: number
        }[]
      }
      fn_poblar_dim_fecha: { Args: never; Returns: undefined }
      fn_refresh_all_mvs: { Args: never; Returns: undefined }
      fn_top_clientes: {
        Args: {
          p_fecha_fin: string
          p_fecha_inicio: string
          p_limit?: number
          p_tenant_id: string
        }
        Returns: {
          id_cliente: number
          nombre_cliente: string
          numero_pedidos: number
          participacion_porcentaje: number
          total_unidades: number
          total_ventas: number
        }[]
      }
      fn_top_productos: {
        Args: {
          p_fecha_fin: string
          p_fecha_inicio: string
          p_limit?: number
          p_tenant_id: string
        }
        Returns: {
          id_producto: number
          nombre_producto: string
          participacion_porcentaje: number
          total_unidades: number
          total_ventas: number
        }[]
      }
      get_alerts:
        | {
            Args: { p_days?: number; p_limit?: number; p_tenant_id: string }
            Returns: Json
          }
        | { Args: { p_limit?: number; p_tenant_id: string }; Returns: Json }
      get_client_detail: {
        Args: { p_cliente_id: number; p_tenant_id: string }
        Returns: {
          activo: boolean
          canal: string
          ciudad: string
          clave_cliente: string
          cliente_id: number
          contacto_principal: Json
          descuento_comercial: number
          dias_credito: number
          estado: string
          frecuencia_compra_dias: number
          lifetime_value: number
          limite_credito: number
          nivel_riesgo: string
          nombre: string
          patron_compra: string
          razon_social: string
          region: string
          rfc: string
          segmento_abc: string
          tendencia: string
          ticket_promedio: number
          tipo_cliente: string
          total_ordenes: number
          ultima_compra: string
          zona: string
        }[]
      }
      get_client_recent_orders: {
        Args: { p_cliente_id: number; p_limit?: number; p_tenant_id: string }
        Returns: {
          estado: string
          fecha: string
          num_productos: number
          numero_orden: string
          total_unidades: number
          total_ventas: number
        }[]
      }
      get_client_sales_history: {
        Args: { p_cliente_id: number; p_meses?: number; p_tenant_id: string }
        Returns: {
          anio: number
          mes: string
          num_ordenes: number
          total_unidades: number
          total_ventas: number
        }[]
      }
      get_client_top_products: {
        Args: { p_cliente_id: number; p_limit?: number; p_tenant_id: string }
        Returns: {
          categoria: string
          nombre_producto: string
          num_ordenes: number
          porcentaje_ventas: number
          producto_id: number
          total_unidades: number
          total_ventas: number
          ultima_compra: string
        }[]
      }
      get_clients_page_kpis: {
        Args: {
          p_fecha_fin?: string
          p_fecha_inicio?: string
          p_tenant_id: string
        }
        Returns: {
          clientes_activos_anterior: number
          clientes_en_riesgo: number
          clientes_en_riesgo_anterior: number
          clientes_nuevos_anterior: number
          clientes_nuevos_periodo: number
          revenue_promedio_anterior: number
          revenue_promedio_cliente: number
          total_clientes_activos: number
          variacion_activos_pct: number
          variacion_nuevos_pct: number
          variacion_revenue_pct: number
          variacion_riesgo_pct: number
        }[]
      }
      get_clients_page_list:
        | {
            Args: {
              p_clasificacion?: string
              p_fecha_fin?: string
              p_fecha_inicio?: string
              p_producto_ids?: number[]
              p_search?: string
              p_status?: string
              p_tenant_id: string
            }
            Returns: {
              canal: string
              clasificacion: string
              clave_cliente: string
              cliente_id: number
              dias_desde_ultima_compra: number
              lifetime_value: number
              nivel_riesgo: string
              nombre: string
              num_ordenes: number
              status: string
              tendencia: string
              ticket_promedio: number
              tipo_cliente: string
              total_unidades_periodo: number
              total_ventas_anterior: number
              total_ventas_periodo: number
              ultima_compra: string
              variacion_unidades_pct: number
              variacion_ventas_pct: number
              zona: string
            }[]
          }
        | {
            Args: {
              p_cliente_ids?: number[]
              p_fecha_fin?: string
              p_fecha_inicio?: string
              p_producto_ids?: number[]
              p_search?: string
              p_tenant_id: string
            }
            Returns: {
              canal: string
              clasificacion: string
              clave_cliente: string
              cliente_id: number
              dias_desde_ultima_compra: number
              lifetime_value: number
              nivel_riesgo: string
              nombre: string
              num_ordenes: number
              status: string
              tendencia: string
              ticket_promedio: number
              tipo_cliente: string
              total_unidades_periodo: number
              total_ventas_anterior: number
              total_ventas_periodo: number
              ultima_compra: string
              variacion_unidades_pct: number
              variacion_ventas_pct: number
              zona: string
            }[]
          }
      get_daily_actions: {
        Args: { p_limit?: number; p_tenant_id: string }
        Returns: {
          cantidad_estimada: number
          cliente_nombre: string
          confianza_prediccion: number
          contacto_email: string
          contacto_nombre: string
          contacto_telefono: string
          deficit_stock: number
          dia_preferido_compra: string
          dias_atraso: number
          dias_para_compra: number
          es_dia_preferido: boolean
          fecha_proxima_compra: string
          fecha_ultima_compra: string
          frecuencia_promedio_dias: number
          id: number
          id_cliente: number
          id_producto: number
          nivel_confianza: string
          numero_compras_historicas: number
          porcentaje_dia_preferido: number
          producto_categoria: string
          producto_nombre: string
          producto_sku: string
          razon_prioridad: string
          score_prioridad: number
          segmento_abc: string
          stock_disponible: number
          stock_necesario: number
          tipo_accion: string
          tipo_cliente: string
          urgencia: string
          valor_estimado: number
        }[]
      }
      get_daily_actions_summary: {
        Args: { p_tenant_id: string }
        Returns: {
          acciones_completadas_hoy: number
          acciones_urgentes: number
          clientes_atrasados: number
          clientes_proximos_hoy: number
          productos_con_deficit: number
          total_acciones_pendientes: number
          valor_total_en_juego: number
        }[]
      }
      get_dashboard_kpis:
        | { Args: { p_days?: number; p_tenant_id: string }; Returns: Json }
        | { Args: { p_tenant_id: string }; Returns: Json }
      get_inventory_actions: {
        Args: { p_limit?: number; p_tenant_id: string }
        Returns: {
          clientes_afectados_7d: number
          deficit_30_dias: number
          deficit_7_dias: number
          demanda_30_dias: number
          demanda_7_dias: number
          id_producto: number
          producto_categoria: string
          producto_nombre: string
          producto_sku: string
          razon: string
          stock_disponible: number
          urgencia: string
          valor_en_riesgo: number
        }[]
      }
      get_inventory_alerts: {
        Args: { p_limit?: number; p_tenant_id: string }
        Returns: {
          cantidad_a_producir: number
          categoria: string
          dias_cobertura: number
          id_producto: number
          mensaje: string
          nombre: string
          prioridad: string
          stock_disponible: number
          stock_minimo: number
          tipo_alerta: string
          valor_ventas_perdidas: number
        }[]
      }
      get_inventory_by_category: {
        Args: { p_tenant_id: string }
        Returns: {
          categoria: string
          dias_cobertura_promedio: number
          porcentaje_valor: number
          productos_bajos: number
          productos_criticos: number
          productos_exceso: number
          productos_optimos: number
          productos_sin_stock: number
          productos_total: number
          rotacion_promedio: number
          salud_categoria: string
          unidades_totales: number
          valor_inventario: number
          valor_ventas_perdidas_30d: number
          ventas_perdidas_30d: number
        }[]
      }
      get_inventory_kpis: {
        Args: { p_tenant_id: string }
        Returns: {
          dias_cobertura_promedio: number
          fecha_ultimo_calculo: string
          ordenes_produccion_pendientes: number
          productos_bajos: number
          productos_criticos: number
          productos_exceso: number
          productos_optimos: number
          productos_sin_stock: number
          productos_total: number
          rotacion_promedio: number
          valor_inventario_total: number
          valor_ventas_perdidas_total: number
          ventas_perdidas_total: number
        }[]
      }
      get_inventory_list: {
        Args: {
          p_categoria?: string
          p_estado_stock?: string
          p_limit?: number
          p_offset?: number
          p_order_by?: string
          p_order_dir?: string
          p_search?: string
          p_tenant_id: string
        }
        Returns: {
          cantidad_a_producir: number
          categoria: string
          costo_unitario: number
          demanda_diaria: number
          dias_cobertura: number
          dias_para_stockout: number
          estado_stock: string
          fecha_produccion_sugerida: string
          id_producto: number
          nombre: string
          ordenes_pendientes: number
          prioridad: string
          punto_reorden: number
          rotacion: number
          sku: string
          stock_disponible: number
          stock_en_produccion: number
          stock_maximo: number
          stock_minimo: number
          stock_reservado: number
          stock_total: number
          tendencia_demanda: string
          valor_inventario: number
          valor_ventas_perdidas_30d: number
          ventas_perdidas_30d: number
        }[]
      }
      get_inventory_production_recommendations: {
        Args: { p_limit?: number; p_tenant_id: string }
        Returns: {
          cantidad_recomendada_producir: number
          categoria: string
          costo_produccion_estimado: number
          demanda_diaria_promedio: number
          dias_cobertura: number
          dias_produccion: number
          id_producto: number
          ordenes_produccion_pendientes: number
          prioridad: string
          prioridad_orden: number
          producto_nombre: string
          punto_reorden: number
          razon_recomendacion: string
          sku: string
          stock_actual: number
          stock_minimo: number
          valor_ventas_perdidas_30d: number
          ventas_perdidas_30d: number
        }[]
      }
      get_inventory_status: { Args: { p_tenant_id: string }; Returns: Json }
      get_inventory_trends: {
        Args: {
          p_agrupacion?: string
          p_categoria?: string
          p_fecha_fin?: string
          p_fecha_inicio?: string
          p_producto_id?: number
          p_tenant_id: string
        }
        Returns: {
          dias_cobertura_promedio: number
          periodo: string
          periodo_label: string
          productos_bajos: number
          productos_criticos: number
          productos_optimos: number
          productos_sin_stock: number
          unidades_totales: number
          valor_inventario_total: number
          valor_ventas_perdidas_acumuladas: number
          ventas_perdidas_acumuladas: number
        }[]
      }
      get_monthly_sales_comparison: {
        Args: { p_tenant_id: string }
        Returns: Json
      }
      get_predictions_alerts: {
        Args: { p_limit?: number; p_tenant_id: string }
        Returns: {
          cantidad_estimada: number
          categoria: string
          cliente_nombre: string
          dias_atraso: number
          dias_restantes: number
          estado_alerta: string
          fecha_proxima_compra: string
          fecha_ultima_compra: string
          id: number
          id_cliente: number
          id_producto: number
          nivel_confianza: string
          producto_nombre: string
          tipo_cliente: string
          valor_estimado: number
        }[]
      }
      get_predictions_by_client: {
        Args: {
          p_estado_alerta?: string
          p_limit?: number
          p_offset?: number
          p_search?: string
          p_tenant_id: string
        }
        Returns: {
          cantidad_total_estimada: number
          cliente_nombre: string
          confianza_promedio: number
          dias_hasta_proxima: number
          id_cliente: number
          productos_atrasados: number
          productos_esperados: number
          proxima_compra_mas_cercana: string
          segmento_abc: string
          tipo_cliente: string
          ultima_compra_general: string
          valor_total_estimado: number
        }[]
      }
      get_predictions_by_product: {
        Args: { p_dias_horizonte?: number; p_tenant_id: string }
        Returns: {
          cantidad_esperada_30d: number
          cantidad_esperada_7d: number
          categoria: string
          clientes_esperados_30d: number
          clientes_esperados_7d: number
          deficit_30d: number
          deficit_7d: number
          id_producto: number
          producto_nombre: string
          sku: string
          stock_disponible: number
          stock_suficiente_30d: boolean
          stock_suficiente_7d: boolean
          valor_esperado_30d: number
          valor_esperado_7d: number
        }[]
      }
      get_predictions_calendar: {
        Args: {
          p_fecha_fin?: string
          p_fecha_inicio?: string
          p_tenant_id: string
        }
        Returns: {
          cantidad_total_esperada: number
          clientes_unicos: number
          fecha: string
          pedidos_alta_confianza: number
          pedidos_baja_confianza: number
          pedidos_esperados: number
          pedidos_media_confianza: number
          productos_unicos: number
          valor_total_esperado: number
        }[]
      }
      get_predictions_calendar_day_detail: {
        Args: { p_fecha: string; p_tenant_id: string }
        Returns: {
          cantidad_estimada: number
          categoria: string
          cliente_nombre: string
          frecuencia_promedio_dias: number
          id: number
          id_cliente: number
          id_producto: number
          nivel_confianza: string
          numero_compras_historicas: number
          producto_nombre: string
          sku: string
          tipo_cliente: string
          valor_estimado: number
        }[]
      }
      get_predictions_client_detail: {
        Args: { p_cliente_id: number; p_tenant_id: string }
        Returns: {
          cantidad_estimada: number
          cantidad_promedio: number
          cantidad_ultima_compra: number
          categoria: string
          dias_restantes: number
          estado_alerta: string
          fecha_proxima_compra: string
          fecha_ultima_compra: string
          frecuencia_promedio_dias: number
          id: number
          id_producto: number
          nivel_confianza: string
          numero_compras_historicas: number
          producto_nombre: string
          sku: string
          valor_estimado: number
        }[]
      }
      get_predictions_kpis: {
        Args: { p_tenant_id: string }
        Returns: {
          clientes_atrasados: number
          confianza_promedio: number
          pedidos_proximos_30d: number
          pedidos_proximos_7d: number
          total_predicciones: number
          valor_atrasados: number
          valor_proximos_30d: number
          valor_proximos_7d: number
        }[]
      }
      get_product_detail: {
        Args: { p_producto_id: number; p_tenant_id: string }
        Returns: {
          activo: boolean
          categoria: string
          codigo_barras: string
          costo_produccion: number
          descripcion: string
          dias_produccion: number
          dias_vida_util: number
          lifetime_value: number
          linea_producto: string
          marca: string
          margen_objetivo: number
          nombre: string
          perecedero: boolean
          peso_kg: number
          piezas_por_caja: number
          precio_venta_sugerido: number
          producto_id: number
          sku: string
          subcategoria: string
          total_clientes: number
          total_ordenes: number
          ultima_venta: string
          unidad_medida: string
        }[]
      }
      get_product_recent_orders: {
        Args: { p_limit?: number; p_producto_id: number; p_tenant_id: string }
        Returns: {
          cliente_nombre: string
          estado: string
          fecha: string
          numero_orden: string
          total_ventas: number
          unidades: number
        }[]
      }
      get_product_sales_history: {
        Args: { p_meses?: number; p_producto_id: number; p_tenant_id: string }
        Returns: {
          anio: number
          mes: string
          num_clientes: number
          num_ordenes: number
          total_unidades: number
          total_ventas: number
        }[]
      }
      get_product_top_clients: {
        Args: { p_limit?: number; p_producto_id: number; p_tenant_id: string }
        Returns: {
          cliente_id: number
          nombre_cliente: string
          num_ordenes: number
          porcentaje_ventas: number
          tipo_cliente: string
          total_unidades: number
          total_ventas: number
          ultima_compra: string
        }[]
      }
      get_products_page_kpis: {
        Args: {
          p_fecha_fin?: string
          p_fecha_inicio?: string
          p_tenant_id: string
        }
        Returns: {
          productos_activos_anterior: number
          productos_en_riesgo: number
          productos_en_riesgo_anterior: number
          productos_nuevos_anterior: number
          productos_nuevos_periodo: number
          revenue_promedio_anterior: number
          revenue_promedio_producto: number
          total_productos_activos: number
          variacion_activos_pct: number
          variacion_nuevos_pct: number
          variacion_revenue_pct: number
          variacion_riesgo_pct: number
        }[]
      }
      get_products_page_list: {
        Args: {
          p_categoria?: string
          p_cliente_ids?: number[]
          p_fecha_fin?: string
          p_fecha_inicio?: string
          p_search?: string
          p_tenant_id: string
        }
        Returns: {
          categoria: string
          clasificacion: string
          costo_produccion: number
          dias_desde_ultima_venta: number
          lifetime_value: number
          nombre: string
          num_clientes: number
          num_ordenes: number
          precio_venta_sugerido: number
          producto_id: number
          sku: string
          status: string
          tendencia: string
          ticket_promedio: number
          total_unidades_periodo: number
          total_ventas_anterior: number
          total_ventas_periodo: number
          ultima_venta: string
          variacion_unidades_pct: number
          variacion_ventas_pct: number
        }[]
      }
      get_top_clients:
        | { Args: { p_limit?: number; p_tenant_id: string }; Returns: Json }
        | {
            Args: { p_days?: number; p_limit?: number; p_tenant_id: string }
            Returns: Json
          }
      get_top_products:
        | { Args: { p_limit?: number; p_tenant_id: string }; Returns: Json }
        | {
            Args: { p_days?: number; p_limit?: number; p_tenant_id: string }
            Returns: Json
          }
      get_user_tenant_id: { Args: never; Returns: string }
      get_ventas_cumplimiento: {
        Args: {
          p_dimension?: string
          p_fecha_fin?: string
          p_fecha_inicio?: string
          p_limit?: number
          p_tenant_id: string
        }
        Returns: {
          categoria: string
          id: number
          nombre: string
          ordenes_completas: number
          ordenes_parciales: number
          ranking_cumplimiento: number
          tasa_cumplimiento: number
          tasa_ordenes_perfectas: number
          total_ordenes: number
          unidades_entregadas: number
          unidades_solicitadas: number
        }[]
      }
      get_ventas_descuentos: {
        Args: {
          p_dimension?: string
          p_fecha_fin?: string
          p_fecha_inicio?: string
          p_limit?: number
          p_tenant_id: string
        }
        Returns: {
          categoria: string
          id: number
          impacto_margen: number
          margen_con_descuento: number
          margen_sin_descuento: number
          nombre: string
          numero_ordenes: number
          ordenes_con_descuento: number
          porcentaje_descuento_promedio: number
          total_descuentos: number
          total_ventas: number
        }[]
      }
      get_ventas_list: {
        Args: {
          p_categoria?: string
          p_cliente_id?: number
          p_estado?: string
          p_fecha_fin?: string
          p_fecha_inicio?: string
          p_limit?: number
          p_max_fill_rate?: number
          p_min_fill_rate?: number
          p_offset?: number
          p_producto_id?: number
          p_search?: string
          p_solo_con_perdidas?: boolean
          p_tenant_id: string
        }
        Returns: {
          cantidad_entregada: number
          cantidad_perdida: number
          cantidad_solicitada: number
          categoria: string
          cliente_id: number
          cliente_nombre: string
          costo_total: number
          descuento_aplicado: number
          estado: string
          fecha: string
          margen_bruto: number
          margen_porcentaje: number
          monto_perdida: number
          monto_venta: number
          numero_orden: string
          precio_unitario: number
          producto_id: number
          producto_nombre: string
          sku: string
          tasa_cumplimiento: number
          tipo_cliente: string
          venta_id: number
        }[]
      }
      get_ventas_page_kpis: {
        Args: {
          p_fecha_fin?: string
          p_fecha_inicio?: string
          p_tenant_id: string
        }
        Returns: {
          cambio_cumplimiento_pct: number
          cambio_perdidas_pct: number
          cambio_ventas_pct: number
          numero_ordenes: number
          ordenes_con_perdidas: number
          ordenes_periodo_anterior: number
          tasa_cumplimiento_promedio: number
          total_unidades_perdidas: number
          total_unidades_vendidas: number
          total_unidades_vendidas_periodo_anterior: number
          total_ventas: number
          total_ventas_perdidas: number
          total_ventas_perdidas_periodo_anterior: number
          total_ventas_periodo_anterior: number
        }[]
      }
      get_ventas_perdidas_analysis: {
        Args: {
          p_dimension?: string
          p_fecha_fin?: string
          p_fecha_inicio?: string
          p_limit?: number
          p_tenant_id: string
        }
        Returns: {
          categoria: string
          id: number
          nombre: string
          numero_ordenes_afectadas: number
          porcentaje_del_total: number
          tasa_cumplimiento_promedio: number
          total_unidades_perdidas: number
          total_ventas_perdidas: number
        }[]
      }
      get_ventas_rentabilidad: {
        Args: {
          p_dimension?: string
          p_fecha_fin?: string
          p_fecha_inicio?: string
          p_limit?: number
          p_tenant_id: string
        }
        Returns: {
          categoria: string
          contribucion_margen_total: number
          costo_total: number
          id: number
          margen_bruto: number
          margen_porcentaje: number
          margen_promedio_por_orden: number
          nombre: string
          numero_ordenes: number
          total_ventas: number
        }[]
      }
      get_ventas_temporal: {
        Args: {
          p_agrupacion?: string
          p_fecha_fin?: string
          p_fecha_inicio?: string
          p_tenant_id: string
        }
        Returns: {
          periodo: string
          periodo_numero: number
          porcentaje_del_total: number
          tasa_cumplimiento: number
          total_ordenes: number
          total_ventas: number
          unidades_vendidas: number
          venta_promedio: number
        }[]
      }
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
