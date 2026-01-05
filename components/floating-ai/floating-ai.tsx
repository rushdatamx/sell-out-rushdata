"use client"

import { useState, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { X, FileText, TrendingUp, AlertTriangle, Lightbulb, MessageSquare } from "lucide-react"
import Image from "next/image"

interface ContextualPrompt {
  icon: React.ElementType
  label: string
  prompt: string
}

interface PageConfig {
  title: string
  description: string
  prompts: ContextualPrompt[]
}

// Configuración de prompts por página
const PAGE_CONFIGS: Record<string, PageConfig> = {
  "/dashboard": {
    title: "Dashboard",
    description: "Analiza tu resumen ejecutivo",
    prompts: [
      {
        icon: FileText,
        label: "Resume el dashboard",
        prompt: "Analiza mi dashboard actual y dame un resumen ejecutivo de los KPIs más importantes",
      },
      {
        icon: TrendingUp,
        label: "Tendencias principales",
        prompt: "¿Cuáles son las tendencias más importantes que veo en mi dashboard?",
      },
      {
        icon: AlertTriangle,
        label: "Alertas críticas",
        prompt: "¿Hay alguna métrica en el dashboard que requiera atención urgente?",
      },
      {
        icon: Lightbulb,
        label: "Recomendaciones",
        prompt: "Basándote en los datos del dashboard, ¿qué acciones me recomiendas tomar?",
      },
    ],
  },
  "/productos": {
    title: "Productos",
    description: "Analiza el rendimiento de tus productos",
    prompts: [
      {
        icon: FileText,
        label: "Resume esta página",
        prompt: "Dame un resumen del rendimiento general de mis productos",
      },
      {
        icon: TrendingUp,
        label: "Top productos",
        prompt: "¿Cuáles son mis productos con mejor desempeño y por qué?",
      },
      {
        icon: AlertTriangle,
        label: "Productos en riesgo",
        prompt: "¿Qué productos tienen bajo rendimiento o están en riesgo?",
      },
      {
        icon: Lightbulb,
        label: "Oportunidades",
        prompt: "¿Dónde tengo oportunidades de mejorar las ventas de mis productos?",
      },
    ],
  },
  "/tiendas": {
    title: "Tiendas",
    description: "Analiza el rendimiento por tienda",
    prompts: [
      {
        icon: FileText,
        label: "Resume esta página",
        prompt: "Dame un resumen del rendimiento general de mis tiendas",
      },
      {
        icon: TrendingUp,
        label: "Mejores tiendas",
        prompt: "¿Cuáles son mis tiendas con mejor desempeño?",
      },
      {
        icon: AlertTriangle,
        label: "Tiendas con problemas",
        prompt: "¿Qué tiendas tienen bajo rendimiento o necesitan atención?",
      },
      {
        icon: Lightbulb,
        label: "Comparativa",
        prompt: "Compara el rendimiento entre mis tiendas y dame insights",
      },
    ],
  },
  "/inventario": {
    title: "Inventario",
    description: "Analiza tu inventario actual",
    prompts: [
      {
        icon: FileText,
        label: "Resume el inventario",
        prompt: "Dame un resumen del estado actual de mi inventario",
      },
      {
        icon: TrendingUp,
        label: "Rotación de inventario",
        prompt: "¿Cómo está la rotación de mi inventario? ¿Qué productos se mueven más rápido?",
      },
      {
        icon: AlertTriangle,
        label: "Quiebres de stock",
        prompt: "¿Qué productos están en quiebre de stock o próximos a agotarse?",
      },
      {
        icon: Lightbulb,
        label: "Optimización",
        prompt: "¿Cómo puedo optimizar mis niveles de inventario?",
      },
    ],
  },
  "/reabastecimiento": {
    title: "Reabastecimiento",
    description: "Analiza las sugerencias de compra",
    prompts: [
      {
        icon: FileText,
        label: "Resume sugerencias",
        prompt: "Dame un resumen de las sugerencias de reabastecimiento actuales",
      },
      {
        icon: TrendingUp,
        label: "Prioridades de compra",
        prompt: "¿Cuáles son las prioridades más urgentes de reabastecimiento?",
      },
      {
        icon: AlertTriangle,
        label: "Productos urgentes",
        prompt: "¿Qué productos necesito reabastecer con urgencia para evitar ventas perdidas?",
      },
      {
        icon: Lightbulb,
        label: "Optimizar orden",
        prompt: "Ayúdame a optimizar mi próxima orden de compra",
      },
    ],
  },
  "/precios": {
    title: "Precios",
    description: "Analiza tu estrategia de precios",
    prompts: [
      {
        icon: FileText,
        label: "Resume precios",
        prompt: "Dame un análisis de mi estrategia de precios actual",
      },
      {
        icon: TrendingUp,
        label: "Competitividad",
        prompt: "¿Cómo están mis precios comparados con el mercado?",
      },
      {
        icon: AlertTriangle,
        label: "Márgenes bajos",
        prompt: "¿Qué productos tienen márgenes preocupantes?",
      },
      {
        icon: Lightbulb,
        label: "Oportunidades de precio",
        prompt: "¿Dónde tengo oportunidad de ajustar precios para mejorar ventas o márgenes?",
      },
    ],
  },
  "/analisis": {
    title: "Análisis",
    description: "Profundiza en tus datos",
    prompts: [
      {
        icon: FileText,
        label: "Resume análisis",
        prompt: "Dame un resumen de los análisis más importantes",
      },
      {
        icon: TrendingUp,
        label: "Tendencias clave",
        prompt: "¿Cuáles son las tendencias más importantes en mis datos?",
      },
      {
        icon: AlertTriangle,
        label: "Anomalías",
        prompt: "¿Hay alguna anomalía o patrón inusual en los datos?",
      },
      {
        icon: Lightbulb,
        label: "Insights profundos",
        prompt: "Dame insights profundos basados en el análisis de mis datos",
      },
    ],
  },
}

// Config por defecto para páginas no mapeadas
const DEFAULT_CONFIG: PageConfig = {
  title: "Felix IA",
  description: "Tu asistente de análisis",
  prompts: [
    {
      icon: FileText,
      label: "Resumen general",
      prompt: "Dame un resumen general de mis datos de sell-out",
    },
    {
      icon: TrendingUp,
      label: "Tendencias",
      prompt: "¿Cuáles son las principales tendencias en mis ventas?",
    },
    {
      icon: AlertTriangle,
      label: "Alertas",
      prompt: "¿Hay algún problema o alerta que deba atender?",
    },
    {
      icon: Lightbulb,
      label: "Recomendaciones",
      prompt: "¿Qué acciones me recomiendas para mejorar mis resultados?",
    },
  ],
}

export function FloatingAI() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  // No mostrar en la página de IA ni en login
  const hiddenPaths = ["/ia", "/login"]
  const shouldHide = hiddenPaths.some(path => pathname.startsWith(path))

  // Cerrar popup al cambiar de página
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  // Cerrar con Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false)
    }
    window.addEventListener("keydown", handleEscape)
    return () => window.removeEventListener("keydown", handleEscape)
  }, [])

  if (shouldHide) return null

  const config = PAGE_CONFIGS[pathname] || DEFAULT_CONFIG

  const handlePromptClick = (prompt: string) => {
    // Guardar el prompt en sessionStorage para que la página de IA lo reciba
    sessionStorage.setItem("felix_initial_prompt", prompt)
    router.push("/ia")
  }

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Floating container */}
      <div className="fixed bottom-6 right-6 z-50">
        {/* Popup */}
        {isOpen && (
          <div
            className={cn(
              "absolute bottom-16 right-0 w-80",
              "bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-2xl",
              "border border-border/50",
              "animate-in fade-in slide-in-from-bottom-4 duration-200"
            )}
          >
            {/* Header */}
            <div className="p-4 border-b border-border/40">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full shadow-md overflow-hidden">
                    <Image
                      src="/felixcircularblanco.png"
                      alt="Felix"
                      width={40}
                      height={40}
                      className="w-10 h-10 object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground text-sm">
                      {config.title}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {config.description}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Prompts */}
            <div className="p-2">
              {config.prompts.map((item, index) => (
                <button
                  key={index}
                  onClick={() => handlePromptClick(item.prompt)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-xl text-left",
                    "hover:bg-muted/50 transition-colors"
                  )}
                >
                  <div className="p-2 rounded-lg bg-[#0066FF]/5">
                    <item.icon className="w-4 h-4 text-[#0066FF]" />
                  </div>
                  <span className="text-sm text-foreground/80">
                    {item.label}
                  </span>
                </button>
              ))}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-border/40">
              <button
                onClick={() => router.push("/ia")}
                className={cn(
                  "w-full flex items-center justify-center gap-2 p-2.5 rounded-xl",
                  "bg-gradient-to-r from-[#0066FF] to-[#06B6D4]",
                  "text-white text-sm font-medium",
                  "hover:opacity-90 transition-opacity"
                )}
              >
                <MessageSquare className="w-4 h-4" />
                Abrir chat completo
              </button>
            </div>
          </div>
        )}

        {/* Floating Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "w-14 h-14 rounded-full",
            "shadow-lg hover:shadow-xl",
            "overflow-hidden",
            "transition-all duration-200",
            "hover:scale-105",
            isOpen && "scale-95"
          )}
          aria-label="Abrir Felix IA"
        >
          <Image
            src="/felixcircularblanco.png"
            alt="Felix"
            width={56}
            height={56}
            className="w-14 h-14 object-cover"
          />
        </button>
      </div>
    </>
  )
}
