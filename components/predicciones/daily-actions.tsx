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

// shadcn components
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"

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
// COLORES RUSHDATA
// ============================================================================

// Paleta RushData - Solo azules y grises
const RUSHDATA_COLORS = {
  primary: "hsl(217, 91%, 50%)",      // Azul principal
  primaryLight: "hsl(217, 91%, 95%)", // Azul muy claro (bg)
  primaryMedium: "hsl(217, 91%, 60%)", // Azul medio
  grayDark: "hsl(220, 9%, 30%)",      // Gris oscuro
  grayMedium: "hsl(220, 9%, 46%)",    // Gris medio
  grayLight: "hsl(220, 9%, 60%)",     // Gris claro
  grayBg: "hsl(220, 9%, 95%)",        // Gris muy claro (bg)
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
        bg: "bg-[hsl(220,9%,92%)] border-[hsl(220,9%,80%)]",
        badge: "bg-[hsl(220,9%,85%)] text-[hsl(220,9%,20%)]",
        icon: "text-[hsl(220,9%,30%)]",
        label: "URGENTE",
      }
    case "alta":
      return {
        bg: "bg-[hsl(217,91%,97%)] border-[hsl(217,91%,85%)]",
        badge: "bg-[hsl(217,91%,90%)] text-[hsl(217,91%,40%)]",
        icon: "text-[hsl(217,91%,50%)]",
        label: "Alta prioridad",
      }
    case "media":
      return {
        bg: "bg-[hsl(220,9%,96%)] border-[hsl(220,9%,88%)]",
        badge: "bg-[hsl(220,9%,90%)] text-[hsl(220,9%,40%)]",
        icon: "text-[hsl(220,9%,46%)]",
        label: "Hoy/Mañana",
      }
    default:
      return {
        bg: "bg-[hsl(217,91%,98%)] border-[hsl(217,91%,90%)]",
        badge: "bg-[hsl(217,91%,92%)] text-[hsl(217,91%,45%)]",
        icon: "text-[hsl(217,91%,60%)]",
        label: "Próximamente",
      }
  }
}

function getConfianzaConfig(nivel: string) {
  switch (nivel.toLowerCase()) {
    case "alta":
      return { color: "text-[hsl(217,91%,50%)]", label: "Alta confianza" }
    case "media":
      return { color: "text-[hsl(220,9%,46%)]", label: "Media confianza" }
    default:
      return { color: "text-[hsl(220,9%,60%)]", label: "Baja confianza" }
  }
}

function getSegmentoConfig(segmento: string) {
  switch (segmento) {
    case "A":
      return "bg-[hsl(217,91%,95%)] text-[hsl(217,91%,45%)]"
    case "B":
      return "bg-[hsl(217,91%,92%)] text-[hsl(217,91%,50%)]"
    default:
      return "bg-[hsl(220,9%,92%)] text-[hsl(220,9%,40%)]"
  }
}

// ============================================================================
// ACTION CARD COMPONENT
// ============================================================================

function ActionCard({ action, onComplete, isLoading }: ActionCardProps) {
  const [expanded, setExpanded] = useState(false)

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
    <Card
      className={cn(
        "border-2 transition-all duration-200",
        urgencyConfig.bg
      )}
    >
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {/* Urgencia badge */}
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary" className={cn("text-xs font-bold", urgencyConfig.badge)}>
                {urgencyConfig.label}
              </Badge>
              {action.dias_atraso > 0 && (
                <span className="text-xs text-[hsl(220,9%,30%)] font-medium">
                  {action.dias_atraso} días de atraso
                </span>
              )}
            </div>

            {/* Cliente y producto */}
            <h3 className="font-bold text-foreground truncate">
              {action.cliente_nombre}
            </h3>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Package className="h-3.5 w-3.5" />
              {action.producto_nombre}
              <span className="text-[hsl(220,9%,60%)]">({action.sku})</span>
            </p>
          </div>

          {/* Valor estimado */}
          <div className="text-right shrink-0">
            <p className="text-lg font-bold text-foreground">
              {formatCurrency(action.valor_estimado)}
            </p>
            <p className="text-xs text-muted-foreground">
              {action.cantidad_estimada} unidades
            </p>
          </div>
        </div>

        {/* Tip contextual */}
        {action.tip_contextual && (
          <div className="mt-3 p-2.5 bg-[hsl(217,91%,97%)] rounded-lg flex items-start gap-2 border border-[hsl(217,91%,90%)]">
            <Lightbulb className="h-4 w-4 text-[hsl(217,91%,50%)] shrink-0 mt-0.5" />
            <p className="text-sm text-foreground">{action.tip_contextual}</p>
          </div>
        )}

        {/* Detalles expandibles */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded(!expanded)}
          className="mt-3 h-auto p-0 text-muted-foreground hover:text-foreground"
        >
          {expanded ? <ChevronUp className="h-4 w-4 mr-1" /> : <ChevronDown className="h-4 w-4 mr-1" />}
          {expanded ? "Menos detalles" : "Más detalles"}
        </Button>

        {expanded && (
          <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="h-4 w-4 text-[hsl(220,9%,60%)]" />
              <span>{action.tipo_cliente}</span>
              <Badge variant="secondary" className={cn("text-xs font-medium", getSegmentoConfig(action.segmento_abc))}>
                Segmento {action.segmento_abc}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <TrendingUp className="h-4 w-4 text-[hsl(220,9%,60%)]" />
              <span>{action.numero_compras_historicas} compras anteriores</span>
            </div>
            <div className={cn("flex items-center gap-2", confianzaConfig.color)}>
              <CheckCircle2 className="h-4 w-4" />
              <span>{confianzaConfig.label} ({action.confianza_prediccion}%)</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Package className="h-4 w-4 text-[hsl(220,9%,60%)]" />
              <span>{action.categoria}</span>
            </div>
          </div>
        )}

        {/* Botones de acción */}
        <div className="mt-4 flex flex-wrap gap-2">
          {/* Botones de contacto */}
          {action.telefono_contacto && (
            <>
              <Button
                onClick={handleWhatsApp}
                size="sm"
                className="bg-[hsl(217,91%,50%)] hover:bg-[hsl(217,91%,45%)] text-white"
              >
                <svg className="h-4 w-4 mr-1.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                WhatsApp
              </Button>
              <Button
                onClick={handleCall}
                size="sm"
                className="bg-[hsl(217,91%,60%)] hover:bg-[hsl(217,91%,55%)] text-white"
              >
                <Phone className="h-4 w-4 mr-1.5" />
                Llamar
              </Button>
            </>
          )}
          {action.email_contacto && (
            <Button
              onClick={handleEmail}
              size="sm"
              variant="secondary"
              className="bg-[hsl(220,9%,46%)] hover:bg-[hsl(220,9%,40%)] text-white"
            >
              <Mail className="h-4 w-4 mr-1.5" />
              Email
            </Button>
          )}

          {/* Separador */}
          <div className="flex-1" />

          {/* Botón de resultado */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={isLoading}
                className="border-border"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground mr-1.5" />
                )}
                Marcar resultado
                <ChevronDown className="h-4 w-4 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                onClick={() => onComplete("pedido_confirmado")}
                className="text-[hsl(217,91%,50%)]"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Pedido confirmado
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onComplete("contactado")}
                className="text-[hsl(217,91%,60%)]"
              >
                <Phone className="h-4 w-4 mr-2" />
                Contactado
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onComplete("no_contesta")}
                className="text-[hsl(220,9%,46%)]"
              >
                <Clock className="h-4 w-4 mr-2" />
                No contesta
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onComplete("pospuesto")}
                className="text-[hsl(220,9%,50%)]"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Posponer
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onComplete("no_interesado")}
                className="text-[hsl(220,9%,30%)]"
              >
                <XCircle className="h-4 w-4 mr-2" />
                No interesado
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
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
          <Skeleton key={i} className="h-20 rounded-lg" />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <Card className="border border-[hsl(220,9%,85%)] bg-[hsl(220,9%,96%)]">
        <CardContent className="p-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-[hsl(220,9%,30%)]" />
            <span className="text-2xl font-bold text-[hsl(220,9%,20%)]">{summary.acciones_criticas}</span>
          </div>
          <p className="text-xs text-[hsl(220,9%,40%)] mt-1">Críticas</p>
        </CardContent>
      </Card>
      <Card className="border border-[hsl(217,91%,85%)] bg-[hsl(217,91%,97%)]">
        <CardContent className="p-3">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-[hsl(217,91%,50%)]" />
            <span className="text-2xl font-bold text-[hsl(217,91%,40%)]">{summary.acciones_alta}</span>
          </div>
          <p className="text-xs text-[hsl(217,91%,50%)] mt-1">Alta prioridad</p>
        </CardContent>
      </Card>
      <Card className="border border-[hsl(220,9%,88%)] bg-[hsl(220,9%,97%)]">
        <CardContent className="p-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-[hsl(220,9%,46%)]" />
            <span className="text-2xl font-bold text-[hsl(220,9%,35%)]">{summary.acciones_media}</span>
          </div>
          <p className="text-xs text-[hsl(220,9%,50%)] mt-1">Para hoy</p>
        </CardContent>
      </Card>
      <Card className="border border-[hsl(217,91%,88%)] bg-[hsl(217,91%,98%)]">
        <CardContent className="p-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-[hsl(217,91%,50%)]" />
            <span className="text-lg font-bold text-[hsl(217,91%,40%)]">
              {formatCurrency(summary.valor_total_en_riesgo)}
            </span>
          </div>
          <p className="text-xs text-[hsl(217,91%,55%)] mt-1">Valor en juego</p>
        </CardContent>
      </Card>
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
      <Card className="border border-[hsl(220,9%,85%)] bg-[hsl(220,9%,96%)]">
        <CardContent className="p-6 text-center">
          <AlertTriangle className="h-8 w-8 text-[hsl(220,9%,40%)] mx-auto mb-2" />
          <p className="text-[hsl(220,9%,30%)]">Error al cargar las acciones del día</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Clock className="h-6 w-6 text-[hsl(217,91%,50%)]" />
            Acciones del Día
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
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
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      ) : actions && actions.length > 0 ? (
        <div className="space-y-4">
          {actions.map((action, index) => (
            <div key={`action-${action.id_prediccion ?? index}`} className="relative">
              {/* Número de prioridad */}
              <div className="absolute -left-3 -top-2 w-7 h-7 bg-[hsl(217,91%,50%)] text-white rounded-full flex items-center justify-center text-sm font-bold shadow-md z-10">
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
        <Card className="border border-[hsl(217,91%,85%)] bg-[hsl(217,91%,97%)]">
          <CardContent className="p-8 text-center">
            <CheckCircle2 className="h-12 w-12 text-[hsl(217,91%,50%)] mx-auto mb-3" />
            <h3 className="text-lg font-bold text-[hsl(217,91%,40%)]">¡Excelente!</h3>
            <p className="text-[hsl(217,91%,50%)] mt-1">
              No hay acciones urgentes pendientes por hoy
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
