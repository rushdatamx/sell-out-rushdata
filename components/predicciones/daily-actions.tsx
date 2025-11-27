"use client"

import { useState } from "react"
import {
  Phone,
  Mail,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Calendar,
  TrendingUp,
  Package,
  User,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  useDailyActions,
  useDailyActionsSummary,
  useCompleteAction,
  DailyAction,
} from "@/hooks/use-daily-actions"

// ============================================================================
// TYPES
// ============================================================================

interface DailyActionsProps {
  tenantId: string
}

interface ActionCardProps {
  action: DailyAction
  onComplete: (resultado: string, notas?: string) => void
  isLoading: boolean
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

function getUrgencyConfig(urgencia: string) {
  switch (urgencia) {
    case "critica":
      return {
        bg: "bg-red-50 border-red-200",
        badge: "bg-red-100 text-red-800",
        icon: "text-red-600",
        label: "URGENTE",
      }
    case "alta":
      return {
        bg: "bg-orange-50 border-orange-200",
        badge: "bg-orange-100 text-orange-800",
        icon: "text-orange-600",
        label: "Alta prioridad",
      }
    case "media":
      return {
        bg: "bg-yellow-50 border-yellow-200",
        badge: "bg-yellow-100 text-yellow-800",
        icon: "text-yellow-600",
        label: "Hoy/Mañana",
      }
    default:
      return {
        bg: "bg-blue-50 border-blue-200",
        badge: "bg-blue-100 text-blue-800",
        icon: "text-blue-600",
        label: "Próximamente",
      }
  }
}

function getConfianzaConfig(nivel: string) {
  switch (nivel.toLowerCase()) {
    case "alta":
      return { color: "text-green-600", label: "Alta confianza" }
    case "media":
      return { color: "text-yellow-600", label: "Media confianza" }
    default:
      return { color: "text-gray-500", label: "Baja confianza" }
  }
}

// ============================================================================
// ACTION CARD COMPONENT
// ============================================================================

function ActionCard({ action, onComplete, isLoading }: ActionCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [showActions, setShowActions] = useState(false)

  const urgencyConfig = getUrgencyConfig(action.urgencia)
  const confianzaConfig = getConfianzaConfig(action.nivel_confianza)

  const handleWhatsApp = () => {
    if (action.telefono_contacto) {
      const phone = action.telefono_contacto.replace(/\D/g, "")
      const message = encodeURIComponent(
        `Hola! Te contactamos de parte de tu proveedor. ` +
        `Notamos que es momento de reabastecer ${action.producto_nombre}. ` +
        `¿Te gustaría hacer un pedido?`
      )
      window.open(`https://wa.me/52${phone}?text=${message}`, "_blank")
    }
  }

  const handleCall = () => {
    if (action.telefono_contacto) {
      window.location.href = `tel:${action.telefono_contacto}`
    }
  }

  const handleEmail = () => {
    if (action.email_contacto) {
      const subject = encodeURIComponent(`Reabastecimiento de ${action.producto_nombre}`)
      const body = encodeURIComponent(
        `Estimado cliente,\n\n` +
        `Notamos que es momento de reabastecer ${action.producto_nombre}.\n` +
        `¿Le gustaría hacer un pedido?\n\n` +
        `Saludos cordiales.`
      )
      window.location.href = `mailto:${action.email_contacto}?subject=${subject}&body=${body}`
    }
  }

  return (
    <div
      className={cn(
        "rounded-xl border-2 p-4 transition-all duration-200",
        urgencyConfig.bg
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Urgencia badge */}
          <div className="flex items-center gap-2 mb-2">
            <span className={cn("px-2 py-0.5 rounded-full text-xs font-bold", urgencyConfig.badge)}>
              {urgencyConfig.label}
            </span>
            {action.dias_atraso > 0 && (
              <span className="text-xs text-red-600 font-medium">
                {action.dias_atraso} días de atraso
              </span>
            )}
          </div>

          {/* Cliente y producto */}
          <h3 className="font-bold text-gray-900 truncate">
            {action.cliente_nombre}
          </h3>
          <p className="text-sm text-gray-600 flex items-center gap-1">
            <Package className="h-3.5 w-3.5" />
            {action.producto_nombre}
            <span className="text-gray-400">({action.sku})</span>
          </p>
        </div>

        {/* Valor estimado */}
        <div className="text-right shrink-0">
          <p className="text-lg font-bold text-gray-900">
            {formatCurrency(action.valor_estimado)}
          </p>
          <p className="text-xs text-gray-500">
            {action.cantidad_estimada} unidades
          </p>
        </div>
      </div>

      {/* Tip contextual */}
      {action.tip_contextual && (
        <div className="mt-3 p-2.5 bg-white/60 rounded-lg flex items-start gap-2">
          <Lightbulb className="h-4 w-4 text-yellow-500 shrink-0 mt-0.5" />
          <p className="text-sm text-gray-700">{action.tip_contextual}</p>
        </div>
      )}

      {/* Detalles expandibles */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="mt-3 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
      >
        {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        {expanded ? "Menos detalles" : "Más detalles"}
      </button>

      {expanded && (
        <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <User className="h-4 w-4 text-gray-400" />
            <span>{action.tipo_cliente}</span>
            <span className={cn(
              "px-1.5 py-0.5 rounded text-xs font-medium",
              action.segmento_abc === "A" ? "bg-green-100 text-green-700" :
              action.segmento_abc === "B" ? "bg-blue-100 text-blue-700" :
              "bg-gray-100 text-gray-700"
            )}>
              Segmento {action.segmento_abc}
            </span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <TrendingUp className="h-4 w-4 text-gray-400" />
            <span>{action.numero_compras_historicas} compras anteriores</span>
          </div>
          <div className={cn("flex items-center gap-2", confianzaConfig.color)}>
            <CheckCircle2 className="h-4 w-4" />
            <span>{confianzaConfig.label} ({action.confianza_prediccion}%)</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Package className="h-4 w-4 text-gray-400" />
            <span>{action.categoria}</span>
          </div>
        </div>
      )}

      {/* Botones de acción */}
      <div className="mt-4 flex flex-wrap gap-2">
        {/* Botones de contacto */}
        {action.telefono_contacto && (
          <>
            <button
              onClick={handleWhatsApp}
              className="flex items-center gap-1.5 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              WhatsApp
            </button>
            <button
              onClick={handleCall}
              className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Phone className="h-4 w-4" />
              Llamar
            </button>
          </>
        )}
        {action.email_contacto && (
          <button
            onClick={handleEmail}
            className="flex items-center gap-1.5 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Mail className="h-4 w-4" />
            Email
          </button>
        )}

        {/* Separador */}
        <div className="flex-1" />

        {/* Botón de resultado */}
        <div className="relative">
          <button
            onClick={() => setShowActions(!showActions)}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg text-sm font-medium transition-colors"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4 text-gray-500" />
            )}
            Marcar resultado
            <ChevronDown className="h-4 w-4" />
          </button>

          {showActions && !isLoading && (
            <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10 py-1">
              <button
                onClick={() => { onComplete("pedido_confirmado"); setShowActions(false); }}
                className="w-full px-3 py-2 text-left text-sm hover:bg-green-50 text-green-700 flex items-center gap-2"
              >
                <CheckCircle2 className="h-4 w-4" />
                Pedido confirmado
              </button>
              <button
                onClick={() => { onComplete("contactado"); setShowActions(false); }}
                className="w-full px-3 py-2 text-left text-sm hover:bg-blue-50 text-blue-700 flex items-center gap-2"
              >
                <Phone className="h-4 w-4" />
                Contactado
              </button>
              <button
                onClick={() => { onComplete("no_contesta"); setShowActions(false); }}
                className="w-full px-3 py-2 text-left text-sm hover:bg-yellow-50 text-yellow-700 flex items-center gap-2"
              >
                <Clock className="h-4 w-4" />
                No contesta
              </button>
              <button
                onClick={() => { onComplete("pospuesto"); setShowActions(false); }}
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 text-gray-700 flex items-center gap-2"
              >
                <Calendar className="h-4 w-4" />
                Posponer
              </button>
              <button
                onClick={() => { onComplete("no_interesado"); setShowActions(false); }}
                className="w-full px-3 py-2 text-left text-sm hover:bg-red-50 text-red-700 flex items-center gap-2"
              >
                <XCircle className="h-4 w-4" />
                No interesado
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// SUMMARY COMPONENT
// ============================================================================

function ActionsSummary({ tenantId }: { tenantId: string }) {
  const { data: summary, isLoading } = useDailyActionsSummary(tenantId)

  if (isLoading || !summary) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-gray-100 rounded-lg p-3 animate-pulse h-20" />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <span className="text-2xl font-bold text-red-700">{summary.acciones_criticas}</span>
        </div>
        <p className="text-xs text-red-600 mt-1">Críticas</p>
      </div>
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-orange-600" />
          <span className="text-2xl font-bold text-orange-700">{summary.acciones_alta}</span>
        </div>
        <p className="text-xs text-orange-600 mt-1">Alta prioridad</p>
      </div>
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-yellow-600" />
          <span className="text-2xl font-bold text-yellow-700">{summary.acciones_media}</span>
        </div>
        <p className="text-xs text-yellow-600 mt-1">Para hoy</p>
      </div>
      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-green-600" />
          <span className="text-lg font-bold text-green-700">
            {formatCurrency(summary.valor_total_en_riesgo)}
          </span>
        </div>
        <p className="text-xs text-green-600 mt-1">Valor en juego</p>
      </div>
    </div>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function DailyActions({ tenantId }: DailyActionsProps) {
  const { data: actions, isLoading, error } = useDailyActions(tenantId, 10)
  const completeAction = useCompleteAction()
  const [completingId, setCompletingId] = useState<number | null>(null)

  const handleComplete = async (action: DailyAction, resultado: string, notas?: string) => {
    setCompletingId(action.id_prediccion)
    try {
      await completeAction.mutateAsync({
        tenantId,
        tipoAccion: "contacto_cliente",
        idPrediccion: action.id_prediccion,
        idCliente: action.id_cliente,
        idProducto: action.id_producto,
        resultado,
        notas,
      })
    } finally {
      setCompletingId(null)
    }
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
        <p className="text-red-700">Error al cargar las acciones del día</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Clock className="h-6 w-6 text-blue-600" />
            Acciones del Día
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Estas son las acciones prioritarias que debes realizar hoy
          </p>
        </div>
      </div>

      {/* Summary */}
      <ActionsSummary tenantId={tenantId} />

      {/* Actions List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-100 rounded-xl h-40 animate-pulse" />
          ))}
        </div>
      ) : actions && actions.length > 0 ? (
        <div className="space-y-4">
          {actions.map((action, index) => (
            <div key={action.id_prediccion} className="relative">
              {/* Número de prioridad */}
              <div className="absolute -left-3 -top-2 w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-md z-10">
                {index + 1}
              </div>
              <ActionCard
                action={action}
                onComplete={(resultado, notas) => handleComplete(action, resultado, notas)}
                isLoading={completingId === action.id_prediccion}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
          <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-green-800">¡Excelente!</h3>
          <p className="text-green-600 mt-1">
            No hay acciones urgentes pendientes por hoy
          </p>
        </div>
      )}
    </div>
  )
}
