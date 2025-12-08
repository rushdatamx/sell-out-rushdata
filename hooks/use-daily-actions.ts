"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase/client"

// ============================================================================
// TYPES
// ============================================================================

export interface DailyAction {
  id_prediccion: number
  id_cliente: number
  cliente_nombre: string
  tipo_cliente: string
  segmento_abc: string
  telefono_contacto: string | null
  email_contacto: string | null
  id_producto: number
  producto_nombre: string
  sku: string
  categoria: string
  dias_atraso: number
  dias_restantes: number
  cantidad_estimada: number
  valor_estimado: number
  nivel_confianza: string
  confianza_prediccion: number
  numero_compras_historicas: number
  dia_preferido_compra: string | null
  porcentaje_dia_preferido: number | null
  tip_contextual: string | null
  urgencia: string
  priority_score: number
}

export interface DailyActionsSummary {
  acciones_criticas: number
  acciones_alta: number
  acciones_media: number
  acciones_normales: number
  valor_total_en_riesgo: number
  clientes_unicos: number
}

export interface InventoryAction {
  id_producto: number
  producto_nombre: string
  sku: string
  categoria: string
  stock_actual: number
  stock_minimo: number
  punto_reorden: number
  dias_cobertura: number
  demanda_diaria: number
  cantidad_a_producir: number
  prioridad: string
  razon: string
  clientes_esperando: number
  valor_demanda_pendiente: number
  priority_score: number
}

export interface CompleteActionParams {
  tenantId: string
  tipoAccion: string
  idPrediccion?: number
  idCliente?: number
  idProducto?: number
  resultado: string
  notas?: string
  fechaRecordatorio?: string
}

export interface CompleteActionResult {
  success: boolean
  action_id: number
  message: string
}

// ============================================================================
// HOOKS
// ============================================================================

export function useDailyActions(tenantId: string, limit: number = 10) {
  return useQuery({
    queryKey: ["daily-actions", tenantId, limit],
    queryFn: async (): Promise<DailyAction[]> => {
      const { data, error } = await supabase.rpc("get_daily_actions", {
        p_tenant_id: tenantId,
        p_limit: limit,
      })

      if (error) {
        console.error("Error in useDailyActions:", error)
        throw error
      }

      return (data as unknown as DailyAction[]) || []
    },
    staleTime: 1000 * 60 * 2, // 2 minutos
  })
}

export function useDailyActionsSummary(tenantId: string) {
  return useQuery({
    queryKey: ["daily-actions-summary", tenantId],
    queryFn: async (): Promise<DailyActionsSummary | null> => {
      const { data, error } = await supabase.rpc("get_daily_actions_summary", {
        p_tenant_id: tenantId,
      })

      if (error) {
        console.error("Error in useDailyActionsSummary:", error)
        throw error
      }

      return (data as unknown as DailyActionsSummary[])?.[0] || null
    },
    staleTime: 1000 * 60 * 2,
  })
}

export function useInventoryActions(tenantId: string, limit: number = 10) {
  return useQuery({
    queryKey: ["inventory-actions", tenantId, limit],
    queryFn: async (): Promise<InventoryAction[]> => {
      const { data, error } = await supabase.rpc("get_inventory_actions", {
        p_tenant_id: tenantId,
        p_limit: limit,
      })

      if (error) {
        console.error("Error in useInventoryActions:", error)
        throw error
      }

      return (data as unknown as InventoryAction[]) || []
    },
    staleTime: 1000 * 60 * 5,
  })
}

export function useCompleteAction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: CompleteActionParams): Promise<CompleteActionResult> => {
      const { data, error } = await supabase.rpc("complete_action", {
        p_tenant_id: params.tenantId,
        p_tipo_accion: params.tipoAccion,
        p_id_prediccion: params.idPrediccion,
        p_id_cliente: params.idCliente,
        p_id_producto: params.idProducto,
        p_resultado: params.resultado,
        p_notas: params.notas,
        p_fecha_recordatorio: params.fechaRecordatorio,
      })

      if (error) {
        console.error("Error in useCompleteAction:", error)
        throw error
      }

      return data as unknown as CompleteActionResult
    },
    onSuccess: (_, variables) => {
      // Invalidar queries relacionadas para refrescar los datos
      queryClient.invalidateQueries({ queryKey: ["daily-actions", variables.tenantId] })
      queryClient.invalidateQueries({ queryKey: ["daily-actions-summary", variables.tenantId] })
      queryClient.invalidateQueries({ queryKey: ["inventory-actions", variables.tenantId] })
    },
  })
}
