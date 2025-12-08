"use client"

import { useState, useCallback, useRef } from "react"
import { supabase } from "@/lib/supabase/client"
import { useAuth } from "@/lib/auth/auth-context"

export interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  createdAt: Date
  isStreaming?: boolean
}

export interface UseChatOptions {
  conversationId?: string | null
  onError?: (error: Error) => void
}

export function useChat(options: UseChatOptions = {}) {
  const { user } = useAuth()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [conversationId, setConversationId] = useState<string | null>(
    options.conversationId || null
  )
  const abortControllerRef = useRef<AbortController | null>(null)

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading) return

      setIsLoading(true)
      setError(null)

      // Agregar mensaje del usuario
      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: content.trim(),
        createdAt: new Date(),
      }

      setMessages((prev) => [...prev, userMessage])

      // Crear mensaje placeholder para la respuesta
      const assistantMessageId = crypto.randomUUID()
      const assistantMessage: ChatMessage = {
        id: assistantMessageId,
        role: "assistant",
        content: "",
        createdAt: new Date(),
        isStreaming: true,
      }

      setMessages((prev) => [...prev, assistantMessage])

      try {
        // Crear AbortController para poder cancelar
        abortControllerRef.current = new AbortController()

        // Preparar historial para contexto (últimos 10 mensajes)
        const history = messages.slice(-10).map((m) => ({
          role: m.role,
          content: m.content,
        }))

        // Llamar a la API
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: content.trim(),
            conversationId,
            history,
          }),
          signal: abortControllerRef.current.signal,
        })

        if (!response.ok) {
          throw new Error("Error en la respuesta del servidor")
        }

        // Procesar stream
        const reader = response.body?.getReader()
        const decoder = new TextDecoder()
        let fullContent = ""

        if (reader) {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const chunk = decoder.decode(value)
            const lines = chunk.split("\n")

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                try {
                  const data = JSON.parse(line.slice(6))

                  if (data.text) {
                    fullContent += data.text
                    setMessages((prev) =>
                      prev.map((m) =>
                        m.id === assistantMessageId
                          ? { ...m, content: fullContent }
                          : m
                      )
                    )
                  }

                  if (data.done) {
                    // Marcar como completado
                    setMessages((prev) =>
                      prev.map((m) =>
                        m.id === assistantMessageId
                          ? { ...m, isStreaming: false }
                          : m
                      )
                    )

                    // Guardar en base de datos si hay usuario
                    if (user) {
                      await saveToDatabase(
                        userMessage.content,
                        fullContent,
                        conversationId
                      )
                    }
                  }

                  if (data.error) {
                    throw new Error(data.error)
                  }
                } catch (e) {
                  // Ignorar errores de parsing de líneas vacías
                }
              }
            }
          }
        }
      } catch (err) {
        if ((err as Error).name === "AbortError") {
          // Cancelado por el usuario
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMessageId
                ? { ...m, content: m.content + "\n\n*[Cancelado]*", isStreaming: false }
                : m
            )
          )
        } else {
          const errorMessage = err instanceof Error ? err.message : "Error desconocido"
          setError(errorMessage)
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMessageId
                ? {
                    ...m,
                    content: "Lo siento, hubo un error procesando tu solicitud. Por favor intenta de nuevo.",
                    isStreaming: false,
                  }
                : m
            )
          )
          options.onError?.(err as Error)
        }
      } finally {
        setIsLoading(false)
        abortControllerRef.current = null
      }
    },
    [isLoading, messages, conversationId, user, options]
  )

  const saveToDatabase = async (
    userContent: string,
    assistantContent: string,
    convId: string | null
  ) => {
    try {
      let currentConvId = convId

      // Crear conversación si no existe
      if (!currentConvId && user) {
        // Obtener tenant_id del usuario
        const { data: userData } = await (supabase
          .from("users") as any)
          .select("tenant_id")
          .eq("id", user.id)
          .single()

        if (userData) {
          const { data: newConv, error: convError } = await (supabase
            .from("chat_conversations") as any)
            .insert({
              tenant_id: (userData as any).tenant_id,
              user_id: user.id,
              title: userContent.substring(0, 100),
            })
            .select()
            .single()

          if (convError) {
            console.error("Error creating conversation:", convError)
            return
          }

          currentConvId = newConv.id
          setConversationId(currentConvId)
        }
      }

      if (currentConvId) {
        // Guardar mensajes
        await (supabase.from("chat_messages") as any).insert([
          {
            conversation_id: currentConvId,
            role: "user",
            content: userContent,
          },
          {
            conversation_id: currentConvId,
            role: "assistant",
            content: assistantContent,
          },
        ])
      }
    } catch (error) {
      console.error("Error saving to database:", error)
    }
  }

  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
  }, [])

  const clearMessages = useCallback(() => {
    setMessages([])
    setConversationId(null)
    setError(null)
  }, [])

  const loadConversation = useCallback(async (convId: string) => {
    try {
      setIsLoading(true)
      setConversationId(convId)

      const { data: messagesData, error: messagesError } = await (supabase
        .from("chat_messages") as any)
        .select("*")
        .eq("conversation_id", convId)
        .order("created_at", { ascending: true })

      if (messagesError) throw messagesError

      const loadedMessages: ChatMessage[] =
        messagesData?.map((m: any) => ({
          id: m.id,
          role: m.role as "user" | "assistant",
          content: m.content,
          createdAt: new Date(m.created_at),
        })) || []

      setMessages(loadedMessages)
    } catch (error) {
      console.error("Error loading conversation:", error)
      setError("Error al cargar la conversación")
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    messages,
    isLoading,
    error,
    conversationId,
    sendMessage,
    stopGeneration,
    clearMessages,
    loadConversation,
  }
}
