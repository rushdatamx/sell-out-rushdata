"use client"

import { cn } from "@/lib/utils"
import {
  Presentation,
  TrendingUp,
  AlertTriangle,
  BarChart3,
} from "lucide-react"

interface ChatSuggestedProps {
  onSelect: (prompt: string) => void
}

const SUGGESTED_PROMPTS = [
  {
    icon: Presentation,
    label: "Resumen ejecutivo para mi junta",
    prompt: "Prepárame un resumen ejecutivo para mi junta con el comprador",
  },
  {
    icon: TrendingUp,
    label: "Oportunidades de crecimiento",
    prompt: "¿Dónde tengo oportunidad de aumentar mi orden de compra?",
  },
  {
    icon: AlertTriangle,
    label: "Productos en quiebre de stock",
    prompt: "¿Qué productos están en quiebre de stock y cuánta venta estoy perdiendo?",
  },
  {
    icon: BarChart3,
    label: "Comparativa con mes anterior",
    prompt: "¿Cómo me fue comparado con el mes anterior? Dame los principales cambios",
  },
]

export function ChatSuggested({ onSelect }: ChatSuggestedProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl mx-auto">
      {SUGGESTED_PROMPTS.map((item, index) => (
        <button
          key={index}
          onClick={() => onSelect(item.prompt)}
          className={cn(
            "flex items-start gap-3 p-4 rounded-xl text-left",
            "bg-[#F7F7F5] dark:bg-[#1a1a1a]",
            "border border-transparent",
            "hover:border-border hover:bg-[#EFEFE9] dark:hover:bg-[#252525]",
            "transition-all duration-200"
          )}
        >
          <div className="p-2 rounded-lg bg-white dark:bg-[#2a2a2a] shadow-sm">
            <item.icon className="w-4 h-4 text-[#0066FF]" />
          </div>
          <span className="text-sm text-foreground/80 leading-relaxed pt-1">
            {item.label}
          </span>
        </button>
      ))}
    </div>
  )
}
