"use client"

import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Lightbulb,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { INTERPRETACIONES } from "@/lib/promociones/constants"
import type { PromocionResultado, PromocionInsight } from "@/lib/promociones/types"

interface PromocionInsightsCardProps {
  resultado: PromocionResultado
}

function getEvaluacionIcon(evaluacion: PromocionResultado["evaluacionGeneral"]) {
  switch (evaluacion) {
    case "exitosa":
      return <TrendingUp className="h-6 w-6 text-green-500" />
    case "negativa":
      return <TrendingDown className="h-6 w-6 text-red-500" />
    default:
      return <Minus className="h-6 w-6 text-amber-500" />
  }
}

function getEvaluacionColor(evaluacion: PromocionResultado["evaluacionGeneral"]) {
  switch (evaluacion) {
    case "exitosa":
      return "bg-green-500/10 border-green-500/30"
    case "negativa":
      return "bg-red-500/10 border-red-500/30"
    default:
      return "bg-amber-500/10 border-amber-500/30"
  }
}

function getEvaluacionBadge(evaluacion: PromocionResultado["evaluacionGeneral"]) {
  switch (evaluacion) {
    case "exitosa":
      return (
        <Badge className="bg-green-500/20 text-green-700 border-green-500/30">
          Exitosa
        </Badge>
      )
    case "negativa":
      return (
        <Badge className="bg-red-500/20 text-red-700 border-red-500/30">
          Negativa
        </Badge>
      )
    default:
      return (
        <Badge className="bg-amber-500/20 text-amber-700 border-amber-500/30">
          Neutral
        </Badge>
      )
  }
}

function InsightItem({ insight }: { insight: PromocionInsight }) {
  const IconComponent =
    insight.tipo === "positivo"
      ? CheckCircle2
      : insight.tipo === "negativo"
        ? XCircle
        : AlertCircle

  const colorClass =
    insight.tipo === "positivo"
      ? "text-green-500"
      : insight.tipo === "negativo"
        ? "text-red-500"
        : "text-amber-500"

  return (
    <div className="flex items-start gap-3 py-2">
      <IconComponent className={cn("h-5 w-5 mt-0.5 shrink-0", colorClass)} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-sm">{insight.titulo}</span>
          {insight.valor && (
            <Badge variant="secondary" className="text-xs">
              {insight.metrica}: {insight.valor}
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          {insight.descripcion}
        </p>
      </div>
    </div>
  )
}

export function PromocionInsightsCard({ resultado }: PromocionInsightsCardProps) {
  const { evaluacionGeneral, insights } = resultado

  return (
    <Card
      className={cn(
        "rounded-2xl border-2",
        getEvaluacionColor(evaluacionGeneral)
      )}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "p-2 rounded-full",
                evaluacionGeneral === "exitosa"
                  ? "bg-green-500/20"
                  : evaluacionGeneral === "negativa"
                    ? "bg-red-500/20"
                    : "bg-amber-500/20"
              )}
            >
              {getEvaluacionIcon(evaluacionGeneral)}
            </div>
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-primary" />
                Análisis de Resultados
              </CardTitle>
            </div>
          </div>
          {getEvaluacionBadge(evaluacionGeneral)}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          {INTERPRETACIONES.general[evaluacionGeneral]}
        </p>

        <div className="divide-y">
          {insights.map((insight, index) => (
            <InsightItem key={index} insight={insight} />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
