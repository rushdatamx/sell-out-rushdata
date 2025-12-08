"use client"

import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase/client"

// ============================================================================
// TYPES - Interfaces para los datos del dashboard
// ============================================================================

interface KPIData {
  ventasMes: number
  ventasMesAnterior: number
  ventasYTD: number
  ventasYTDAnterior: number
  clientesActivos: number
  ticketPromedio: number
  productoscrticos: number
  margenPromedio: number
  fechaMaxima: string | null
}

interface MonthlySales {
  month: string
  currentYear: number
  previousYear: number
}

interface TopProduct {
  producto_id: string
  nombre: string
  total_ventas: number
  cantidad_vendida: number
}

interface TopClient {
  cliente_id: string
  nombre: string
  total_compras: number
  ultima_compra: string
}

interface Alert {
  tipo: string
  mensaje: string
  prioridad: "high" | "medium" | "low"
  producto_id?: string
  cliente_id?: string
}

interface InventoryStatus {
  categoria: string
  valor: number
  cantidad: number
}

interface LastDataMonth {
  anio: number
  mes: number
  nombre_mes: string
}

// ============================================================================
// HOOKS - Llamadas a RPC Functions (Backend)
// ============================================================================

/**
 * Hook para obtener el último mes con datos
 * Usa la fecha máxima de los KPIs
 */
export function useLastDataMonth(tenantId: string, days = 30) {
  const { data: kpis } = useKPIs(tenantId, days)

  return useQuery({
    queryKey: ["last-data-month", tenantId, days],
    queryFn: async (): Promise<LastDataMonth> => {
      if (!kpis?.fechaMaxima) {
        const now = new Date()
        return {
          anio: now.getFullYear(),
          mes: now.getMonth() + 1,
          nombre_mes: now.toLocaleDateString('es-MX', { month: 'long' })
        }
      }

      const fecha = new Date(kpis.fechaMaxima)
      return {
        anio: fecha.getFullYear(),
        mes: fecha.getMonth() + 1,
        nombre_mes: fecha.toLocaleDateString('es-MX', { month: 'long' })
      }
    },
    enabled: !!kpis,
    staleTime: 1000 * 60 * 30, // 30 minutos
  })
}

/**
 * Hook para KPIs principales del dashboard
 * Llama a la RPC function get_dashboard_kpis
 */
export function useKPIs(tenantId: string, days = 30) {
  return useQuery({
    queryKey: ["kpis", tenantId, days],
    queryFn: async (): Promise<KPIData> => {
      const { data, error } = await supabase
        .rpc('get_dashboard_kpis', {
          p_tenant_id: tenantId,
          p_days: days
        })

      if (error) {
        console.error("Error in useKPIs:", error)
        throw error
      }

      return data as unknown as KPIData
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
    retry: 2,
  })
}

/**
 * Hook para ventas mensuales comparativas
 * Llama a la RPC function get_monthly_sales_comparison
 */
export function useMonthlySalesComparison(tenantId: string) {
  return useQuery({
    queryKey: ["monthly-sales", tenantId],
    queryFn: async (): Promise<MonthlySales[]> => {
      const { data, error } = await supabase
        .rpc('get_monthly_sales_comparison', { p_tenant_id: tenantId })

      if (error) {
        console.error("Error in useMonthlySalesComparison:", error)
        throw error
      }

      // Asegurar que los valores sean números, no strings
      const salesData = (data as any[]) || []
      return salesData.map(item => ({
        month: item.month,
        currentYear: Number(item.currentYear) || 0,
        previousYear: Number(item.previousYear) || 0,
      }))
    },
    staleTime: 1000 * 60 * 10, // 10 minutos
    retry: 2,
  })
}

/**
 * Hook para Top 5 Productos
 * Llama a la RPC function get_top_products
 */
export function useTopProducts(tenantId: string, limit = 5, days = 30) {
  return useQuery({
    queryKey: ["top-products", tenantId, limit, days],
    queryFn: async (): Promise<TopProduct[]> => {
      const { data, error } = await supabase
        .rpc('get_top_products', {
          p_tenant_id: tenantId,
          p_limit: limit,
          p_days: days
        })

      if (error) {
        console.error("Error in useTopProducts:", error)
        throw error
      }

      return (data as unknown as TopProduct[]) || []
    },
    staleTime: 1000 * 60 * 10, // 10 minutos
    retry: 2,
  })
}

/**
 * Hook para Top 5 Clientes
 * Llama a la RPC function get_top_clients
 */
export function useTopClients(tenantId: string, limit = 5, days = 30) {
  return useQuery({
    queryKey: ["top-clients", tenantId, limit, days],
    queryFn: async (): Promise<TopClient[]> => {
      const { data, error } = await supabase
        .rpc('get_top_clients', {
          p_tenant_id: tenantId,
          p_limit: limit,
          p_days: days
        })

      if (error) {
        console.error("Error in useTopClients:", error)
        throw error
      }

      return (data as unknown as TopClient[]) || []
    },
    staleTime: 1000 * 60 * 10, // 10 minutos
    retry: 2,
  })
}

/**
 * Hook para Alertas y Accionables
 * Llama a la RPC function get_alerts
 */
export function useAlerts(tenantId: string, limit = 10, days = 30) {
  return useQuery({
    queryKey: ["alerts", tenantId, limit, days],
    queryFn: async (): Promise<Alert[]> => {
      const { data, error } = await supabase
        .rpc('get_alerts', {
          p_tenant_id: tenantId,
          p_limit: limit,
          p_days: days
        })

      if (error) {
        console.error("Error in useAlerts:", error)
        throw error
      }

      return (data as unknown as Alert[]) || []
    },
    staleTime: 1000 * 60 * 15, // 15 minutos
    retry: 2,
  })
}

/**
 * Hook para Estado de Inventario
 * Llama a la RPC function get_inventory_status
 */
export function useInventoryStatus(tenantId: string) {
  return useQuery({
    queryKey: ["inventory-status", tenantId],
    queryFn: async (): Promise<InventoryStatus[]> => {
      const { data, error } = await supabase
        .rpc('get_inventory_status', { p_tenant_id: tenantId })

      if (error) {
        console.error("Error in useInventoryStatus:", error)
        throw error
      }

      return (data as unknown as InventoryStatus[]) || []
    },
    staleTime: 1000 * 60 * 15, // 15 minutos
    retry: 2,
  })
}
