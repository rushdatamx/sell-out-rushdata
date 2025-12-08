"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Sparkles, X } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export function ChatFloatingButton() {
  const pathname = usePathname()
  const [isHovered, setIsHovered] = useState(false)

  // No mostrar en la página de IA ni en login
  if (pathname === "/ia" || pathname === "/login" || pathname === "/") {
    return null
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link href="/ia">
            <Button
              size="lg"
              className={cn(
                "fixed bottom-6 right-6 z-50",
                "h-14 w-14 rounded-full shadow-lg",
                "bg-gradient-to-r from-[#0066FF] to-[#06B6D4]",
                "hover:shadow-xl hover:scale-105 transition-all duration-300",
                "group"
              )}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              <Sparkles
                className={cn(
                  "h-6 w-6 transition-transform duration-300",
                  isHovered && "scale-110"
                )}
              />
              <span className="sr-only">Abrir RushData IA</span>
            </Button>
          </Link>
        </TooltipTrigger>
        <TooltipContent side="left" className="font-medium">
          Pregúntale a la IA
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
