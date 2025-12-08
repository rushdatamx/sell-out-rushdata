"use client"

import { useState, useRef, useEffect, KeyboardEvent } from "react"
import { ArrowUp, Square } from "lucide-react"
import { cn } from "@/lib/utils"

interface ChatInputProps {
  onSend: (message: string) => void
  onStop?: () => void
  isLoading?: boolean
  disabled?: boolean
  placeholder?: string
}

export function ChatInput({
  onSend,
  onStop,
  isLoading = false,
  disabled = false,
  placeholder = "Envía un mensaje a Felix...",
}: ChatInputProps) {
  const [value, setValue] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
    }
  }, [value])

  // Focus on mount
  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  const handleSubmit = () => {
    if (value.trim() && !isLoading && !disabled) {
      onSend(value.trim())
      setValue("")
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto"
      }
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const canSend = value.trim() && !isLoading && !disabled

  return (
    <div className="relative">
      <div className="relative flex items-end bg-[#F7F7F5] dark:bg-[#2a2a2a] rounded-2xl border border-border/50 shadow-sm transition-shadow focus-within:shadow-md focus-within:border-border">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || isLoading}
          className={cn(
            "flex-1 resize-none bg-transparent px-4 py-3.5 pr-14",
            "text-[15px] text-foreground placeholder:text-muted-foreground/60",
            "focus:outline-none",
            "min-h-[52px] max-h-[200px]",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
          rows={1}
        />

        {/* Send/Stop button */}
        <div className="absolute right-2 bottom-2">
          {isLoading ? (
            <button
              type="button"
              onClick={onStop}
              className={cn(
                "flex items-center justify-center",
                "w-8 h-8 rounded-lg",
                "bg-[#0066FF] hover:bg-[#0052cc]",
                "text-white transition-colors"
              )}
              aria-label="Detener generación"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSend}
              className={cn(
                "flex items-center justify-center",
                "w-8 h-8 rounded-lg",
                "transition-all duration-200",
                canSend
                  ? "bg-[#0066FF] hover:bg-[#0052cc] text-white"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              )}
              aria-label="Enviar mensaje"
            >
              <ArrowUp className="w-4 h-4" strokeWidth={2.5} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
