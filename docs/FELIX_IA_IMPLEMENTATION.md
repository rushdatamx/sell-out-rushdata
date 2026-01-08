# Implementación de Felix IA - Documentación Técnica

Este documento describe la implementación completa del asistente de IA "Felix" en RushData. Úsalo como guía para replicar esta funcionalidad en otros proyectos.

---

## Arquitectura General

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND                                  │
├─────────────────────────────────────────────────────────────────┤
│  FloatingAI          →  Botón flotante + popup contextual       │
│  ChatContainer       →  Página completa de chat (/ia)           │
│  ChatSidebar         →  Historial de conversaciones             │
│  ChatMessage         →  Renderizado de mensajes (Markdown)      │
│  ChatInput           →  Input con auto-resize                   │
│  ChatSuggested       →  Prompts sugeridos iniciales             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         HOOKS                                    │
├─────────────────────────────────────────────────────────────────┤
│  useChat             →  Manejo de mensajes y streaming          │
│  useConversations    →  CRUD de historial (React Query)         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API ROUTE (Edge)                            │
├─────────────────────────────────────────────────────────────────┤
│  /api/chat           →  Streaming con Anthropic Claude          │
│                      →  Obtiene contexto de Supabase RPC        │
│                      →  Server-Sent Events (SSE)                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       SUPABASE                                   │
├─────────────────────────────────────────────────────────────────┤
│  chat_conversations  →  Almacena conversaciones                 │
│  chat_messages       →  Almacena mensajes                       │
│  get_ia_context()    →  RPC que retorna datos de negocio        │
└─────────────────────────────────────────────────────────────────┘
```

---

## Estructura de Archivos

```
├── app/
│   ├── api/
│   │   └── chat/
│   │       └── route.ts              # API endpoint (Edge Runtime)
│   └── ia/
│       └── page.tsx                  # Página del chat completo
│
├── components/
│   ├── chat/
│   │   ├── index.ts                  # Exports
│   │   ├── chat-container.tsx        # Container principal
│   │   ├── chat-sidebar.tsx          # Sidebar con historial
│   │   ├── chat-message.tsx          # Componente de mensaje
│   │   ├── chat-input.tsx            # Input de texto
│   │   └── chat-suggested.tsx        # Prompts sugeridos
│   │
│   └── floating-ai/
│       └── floating-ai.tsx           # Botón flotante + popup
│
├── hooks/
│   ├── use-chat.ts                   # Hook principal del chat
│   └── use-conversations.ts          # Hook para historial
│
└── public/
    └── felixcircularblanco.png       # Avatar de la IA (circular, fondo transparente)
```

---

## 1. Base de Datos (Supabase)

### Tablas Requeridas

```sql
-- Tabla de conversaciones
CREATE TABLE chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla de mensajes
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX idx_chat_conversations_user ON chat_conversations(user_id);
CREATE INDEX idx_chat_conversations_tenant ON chat_conversations(tenant_id);
CREATE INDEX idx_chat_messages_conversation ON chat_messages(conversation_id);

-- RLS (Row Level Security)
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own conversations"
  ON chat_conversations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own conversations"
  ON chat_conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own conversations"
  ON chat_conversations FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view messages from own conversations"
  ON chat_messages FOR SELECT
  USING (
    conversation_id IN (
      SELECT id FROM chat_conversations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert messages to own conversations"
  ON chat_messages FOR INSERT
  WITH CHECK (
    conversation_id IN (
      SELECT id FROM chat_conversations WHERE user_id = auth.uid()
    )
  );

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE chat_conversations
  SET updated_at = now()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_conversation_timestamp
  AFTER INSERT ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_timestamp();
```

### RPC para Contexto de IA

Esta función retorna datos de negocio para que Claude tenga contexto:

```sql
CREATE OR REPLACE FUNCTION get_ia_context_for_tenant(p_tenant_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  -- ADAPTAR ESTA QUERY A TU MODELO DE DATOS
  -- El objetivo es retornar KPIs, top items, alertas, etc.

  SELECT json_build_object(
    'periodo', json_build_object(
      'fecha_inicio', (CURRENT_DATE - INTERVAL '30 days')::TEXT,
      'fecha_fin', CURRENT_DATE::TEXT
    ),
    'kpis', (
      SELECT json_build_object(
        'ventas_totales', COALESCE(SUM(venta_pesos), 0),
        'unidades_totales', COALESCE(SUM(unidades), 0),
        'tiendas_activas', COUNT(DISTINCT tienda_id),
        'productos_activos', COUNT(DISTINCT producto_id)
      )
      FROM fact_ventas
      WHERE tenant_id = p_tenant_id
        AND fecha >= CURRENT_DATE - INTERVAL '30 days'
    ),
    'top_productos', (
      SELECT COALESCE(json_agg(row_to_json(t)), '[]'::JSON)
      FROM (
        SELECT
          p.nombre as producto,
          SUM(v.venta_pesos) as ventas,
          SUM(v.unidades) as unidades
        FROM fact_ventas v
        JOIN dim_productos p ON v.producto_id = p.id
        WHERE v.tenant_id = p_tenant_id
          AND v.fecha >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY p.nombre
        ORDER BY ventas DESC
        LIMIT 10
      ) t
    ),
    'top_tiendas', (
      SELECT COALESCE(json_agg(row_to_json(t)), '[]'::JSON)
      FROM (
        SELECT
          ti.nombre as tienda,
          ti.ciudad,
          SUM(v.venta_pesos) as ventas
        FROM fact_ventas v
        JOIN dim_tiendas ti ON v.tienda_id = ti.id
        WHERE v.tenant_id = p_tenant_id
          AND v.fecha >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY ti.nombre, ti.ciudad
        ORDER BY ventas DESC
        LIMIT 10
      ) t
    )
    -- Agregar más secciones según necesites:
    -- alertas_inventario, ventas_por_ciudad, productos_creciendo, etc.
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 2. API Route (`/api/chat/route.ts`)

```typescript
import { createClient } from "@supabase/supabase-js"
import Anthropic from "@anthropic-ai/sdk"

export const runtime = "edge"

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

// PERSONALIZAR: System prompt para tu caso de uso
const SYSTEM_PROMPT = `Eres el asistente de IA de [TU_EMPRESA], especializado en [TU_DOMINIO].

Tu rol es ayudar a los usuarios a:
- [Objetivo 1]
- [Objetivo 2]
- [Objetivo 3]

REGLAS IMPORTANTES:
1. SIEMPRE responde en español
2. Sé conciso pero completo
3. USA NÚMEROS ESPECÍFICOS de los datos proporcionados
4. Sugiere ACCIONES CONCRETAS
5. Si no tienes datos suficientes, indícalo claramente
6. Formatea con markdown (negritas, listas, tablas)
7. Cuando hables de dinero, usa formato $X,XXX.XX

FORMATO DE RESPUESTAS:
- Para resúmenes: usa bullets con puntos clave
- Para rankings: usa listas numeradas
- Para comparativas: usa tablas markdown
- Para alertas: destaca con **negritas** lo urgente`

export async function POST(request: Request) {
  try {
    const { message, conversationId, history = [], tenantId } = await request.json()

    if (!message) {
      return new Response(JSON.stringify({ error: "Message is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Crear cliente Supabase con service role
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Obtener contexto de datos
    let contextData = null
    if (tenantId) {
      const { data, error } = await supabase.rpc("get_ia_context_for_tenant", {
        p_tenant_id: tenantId
      })
      if (!error) contextData = data
    }

    // PERSONALIZAR: Construir contexto para Claude
    const dataContext = contextData ? `
DATOS ACTUALES DEL NEGOCIO:

**Período:** ${contextData.periodo?.fecha_inicio} al ${contextData.periodo?.fecha_fin}

**KPIs Principales:**
- Ventas totales: $${contextData.kpis?.ventas_totales?.toLocaleString() || 0}
- Unidades: ${contextData.kpis?.unidades_totales?.toLocaleString() || 0}

**Top 10 Productos:**
${contextData.top_productos?.map((p: any, i: number) =>
  `${i + 1}. ${p.producto}: $${p.ventas?.toLocaleString()}`
).join("\n") || "No hay datos"}

**Top 10 Tiendas:**
${contextData.top_tiendas?.map((t: any, i: number) =>
  `${i + 1}. ${t.tienda} (${t.ciudad}): $${t.ventas?.toLocaleString()}`
).join("\n") || "No hay datos"}
` : "No se pudo cargar el contexto de datos."

    // Construir mensajes para Claude
    const messages: Anthropic.MessageParam[] = [
      ...history.map((h: any) => ({
        role: h.role as "user" | "assistant",
        content: h.content,
      })),
      {
        role: "user",
        content: `${dataContext}\n\n---\n\nPREGUNTA DEL USUARIO:\n${message}`,
      },
    ]

    // Llamar a Claude con streaming
    const stream = await anthropic.messages.stream({
      model: "claude-sonnet-4-20250514",  // o claude-3-haiku para menor costo
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages,
    })

    // Crear stream de respuesta (SSE)
    const encoder = new TextEncoder()
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (event.type === "content_block_delta") {
              const delta = event.delta
              if ("text" in delta) {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ text: delta.text })}\n\n`)
                )
              }
            }
          }

          // Evento de finalización
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`)
          )
          controller.close()
        } catch (error) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: "Error en el stream" })}\n\n`)
          )
          controller.close()
        }
      },
    })

    return new Response(readableStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    })
  } catch (error) {
    console.error("Chat API error:", error)
    return new Response(
      JSON.stringify({ error: "Error procesando la solicitud" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}
```

---

## 3. Hook Principal (`hooks/use-chat.ts`)

```typescript
"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import { useAuth } from "@/lib/auth/auth-context"

export interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  createdAt: Date
  isStreaming?: boolean
}

export function useChat() {
  const { user } = useAuth()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [tenantId, setTenantId] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Obtener tenant_id del usuario
  useEffect(() => {
    async function fetchTenantId() {
      if (user) {
        const { data } = await supabase
          .from("users")
          .select("tenant_id")
          .eq("id", user.id)
          .single()
        if (data) setTenantId(data.tenant_id)
      }
    }
    fetchTenantId()
  }, [user])

  const sendMessage = useCallback(async (content: string) => {
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

    // Crear placeholder para respuesta
    const assistantMessageId = crypto.randomUUID()
    setMessages((prev) => [...prev, {
      id: assistantMessageId,
      role: "assistant",
      content: "",
      createdAt: new Date(),
      isStreaming: true,
    }])

    try {
      abortControllerRef.current = new AbortController()

      // Preparar historial (últimos 10 mensajes)
      const history = messages.slice(-10).map((m) => ({
        role: m.role,
        content: m.content,
      }))

      // Llamar a la API
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: content.trim(),
          conversationId,
          history,
          tenantId,
        }),
        signal: abortControllerRef.current.signal,
      })

      if (!response.ok) throw new Error("Error en la respuesta")

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
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantMessageId
                        ? { ...m, isStreaming: false }
                        : m
                    )
                  )

                  // Guardar en DB si hay usuario
                  if (user) {
                    await saveToDatabase(userMessage.content, fullContent)
                  }
                }

                if (data.error) throw new Error(data.error)
              } catch {}
            }
          }
        }
      }
    } catch (err) {
      if ((err as Error).name === "AbortError") {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMessageId
              ? { ...m, content: m.content + "\n\n*[Cancelado]*", isStreaming: false }
              : m
          )
        )
      } else {
        setError(err instanceof Error ? err.message : "Error desconocido")
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMessageId
              ? { ...m, content: "Error procesando tu solicitud.", isStreaming: false }
              : m
          )
        )
      }
    } finally {
      setIsLoading(false)
      abortControllerRef.current = null
    }
  }, [isLoading, messages, conversationId, user, tenantId])

  const saveToDatabase = async (userContent: string, assistantContent: string) => {
    // Implementar guardado en Supabase
    // Ver código completo en el archivo original
  }

  const stopGeneration = useCallback(() => {
    abortControllerRef.current?.abort()
  }, [])

  const clearMessages = useCallback(() => {
    setMessages([])
    setConversationId(null)
    setError(null)
  }, [])

  const loadConversation = useCallback(async (convId: string) => {
    // Cargar conversación existente desde Supabase
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
```

---

## 4. Hook de Conversaciones (`hooks/use-conversations.ts`)

```typescript
"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase/client"
import { useAuth } from "@/lib/auth/auth-context"

export interface Conversation {
  id: string
  title: string | null
  createdAt: Date
  updatedAt: Date
}

export function useConversations() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const { data: conversations, isLoading } = useQuery({
    queryKey: ["chat-conversations", user?.id],
    queryFn: async () => {
      if (!user) return []

      const { data, error } = await supabase
        .from("chat_conversations")
        .select("id, title, created_at, updated_at")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(50)

      if (error) throw error

      return (data || []).map((conv) => ({
        id: conv.id,
        title: conv.title,
        createdAt: new Date(conv.created_at),
        updatedAt: new Date(conv.updated_at),
      }))
    },
    enabled: !!user,
  })

  const deleteConversation = useMutation({
    mutationFn: async (conversationId: string) => {
      const { error } = await supabase
        .from("chat_conversations")
        .delete()
        .eq("id", conversationId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat-conversations"] })
    },
  })

  return {
    conversations: conversations || [],
    isLoading,
    deleteConversation: deleteConversation.mutate,
  }
}
```

---

## 5. Componentes UI

### ChatContainer (`components/chat/chat-container.tsx`)

Container principal que orquesta todos los componentes:

```typescript
"use client"

import { useRef, useEffect, useState } from "react"
import { useChat } from "@/hooks/use-chat"
import { ChatMessage } from "./chat-message"
import { ChatInput } from "./chat-input"
import { ChatSuggested } from "./chat-suggested"
import { ChatSidebar } from "./chat-sidebar"
import Image from "next/image"

export function ChatContainer({ showSidebar = true }) {
  const {
    messages,
    isLoading,
    error,
    conversationId,
    sendMessage,
    stopGeneration,
    clearMessages,
    loadConversation,
  } = useChat()

  const messagesContainerRef = useRef<HTMLDivElement>(null)

  // Auto-scroll al nuevo mensaje
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight
    }
  }, [messages])

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      {/* Sidebar */}
      {showSidebar && (
        <div className="w-64 flex-shrink-0 hidden md:block">
          <ChatSidebar
            currentConversationId={conversationId}
            onSelectConversation={loadConversation}
            onNewConversation={clearMessages}
          />
        </div>
      )}

      {/* Main chat area */}
      <div className="flex-1 flex flex-col">
        {/* Messages */}
        <div ref={messagesContainerRef} className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center px-4">
              <div className="max-w-2xl w-full text-center">
                {/* Avatar */}
                <div className="mb-6">
                  <div className="inline-flex rounded-full shadow-lg overflow-hidden">
                    <Image
                      src="/felixcircularblanco.png"  {/* PERSONALIZAR */}
                      alt="Felix"
                      width={96}
                      height={96}
                      className="w-24 h-24 object-cover"
                    />
                  </div>
                </div>

                <h1 className="text-2xl font-medium mb-2">
                  ¿En qué puedo ayudarte hoy?
                </h1>
                <p className="text-muted-foreground mb-8">
                  Soy Felix, tu asistente de análisis.
                </p>

                <ChatSuggested onSelect={sendMessage} />
              </div>
            </div>
          ) : (
            <div className="divide-y">
              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="px-4 py-2 bg-red-50 text-red-600 text-sm text-center">
            {error}
          </div>
        )}

        {/* Input */}
        <div className="border-t p-4">
          <div className="max-w-3xl mx-auto">
            <ChatInput
              onSend={sendMessage}
              onStop={stopGeneration}
              isLoading={isLoading}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
```

### ChatMessage (`components/chat/chat-message.tsx`)

Renderiza mensajes con Markdown:

```typescript
"use client"

import { memo } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { User } from "lucide-react"
import Image from "next/image"
import type { ChatMessage as ChatMessageType } from "@/hooks/use-chat"

export const ChatMessage = memo(function ChatMessage({
  message
}: {
  message: ChatMessageType
}) {
  const isUser = message.role === "user"

  return (
    <div className="py-6">
      <div className="max-w-3xl mx-auto px-4">
        <div className="flex gap-4">
          {/* Avatar */}
          {isUser ? (
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
              <User className="w-4 h-4 text-blue-600" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full shadow-sm overflow-hidden">
              <Image
                src="/felixcircularblanco.png"
                alt="Felix"
                width={32}
                height={32}
                className="w-8 h-8 object-cover"
              />
            </div>
          )}

          {/* Content */}
          <div className="flex-1 pt-0.5">
            <p className="text-sm font-medium mb-1">
              {isUser ? "Tú" : "Felix"}
            </p>

            {isUser ? (
              <p className="text-foreground/90 whitespace-pre-wrap">
                {message.content}
              </p>
            ) : (
              <div className="prose prose-neutral dark:prose-invert max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {message.content || "..."}
                </ReactMarkdown>
                {message.isStreaming && (
                  <span className="inline-block w-0.5 h-5 bg-blue-500 animate-pulse ml-0.5" />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
})
```

### ChatInput (`components/chat/chat-input.tsx`)

Input con auto-resize y botón enviar/detener:

```typescript
"use client"

import { useState, useRef, useEffect, KeyboardEvent } from "react"
import { ArrowUp, Square } from "lucide-react"
import { cn } from "@/lib/utils"

interface ChatInputProps {
  onSend: (message: string) => void
  onStop?: () => void
  isLoading?: boolean
  placeholder?: string
}

export function ChatInput({
  onSend,
  onStop,
  isLoading = false,
  placeholder = "Envía un mensaje...",
}: ChatInputProps) {
  const [value, setValue] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height =
        `${Math.min(textareaRef.current.scrollHeight, 200)}px`
    }
  }, [value])

  const handleSubmit = () => {
    if (value.trim() && !isLoading) {
      onSend(value.trim())
      setValue("")
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="relative flex items-end bg-gray-100 rounded-2xl border">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={isLoading}
        className="flex-1 resize-none bg-transparent px-4 py-3.5 pr-14 focus:outline-none min-h-[52px] max-h-[200px]"
        rows={1}
      />

      <div className="absolute right-2 bottom-2">
        {isLoading ? (
          <button
            onClick={onStop}
            className="w-8 h-8 rounded-lg bg-blue-500 text-white flex items-center justify-center"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={!value.trim()}
            className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center",
              value.trim()
                ? "bg-blue-500 text-white"
                : "bg-gray-300 text-gray-500"
            )}
          >
            <ArrowUp className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}
```

### FloatingAI (`components/floating-ai/floating-ai.tsx`)

Botón flotante con popup contextual por página:

```typescript
"use client"

import { useState, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { X, FileText, TrendingUp, AlertTriangle, Lightbulb, MessageSquare } from "lucide-react"
import Image from "next/image"

// PERSONALIZAR: Configuración de prompts por página
const PAGE_CONFIGS: Record<string, { title: string; description: string; prompts: any[] }> = {
  "/dashboard": {
    title: "Dashboard",
    description: "Analiza tu resumen ejecutivo",
    prompts: [
      { icon: FileText, label: "Resume el dashboard", prompt: "Analiza mi dashboard..." },
      { icon: TrendingUp, label: "Tendencias", prompt: "¿Cuáles son las tendencias...?" },
      // ...más prompts
    ],
  },
  // ...más páginas
}

const DEFAULT_CONFIG = {
  title: "Felix IA",
  description: "Tu asistente de análisis",
  prompts: [
    { icon: FileText, label: "Resumen general", prompt: "Dame un resumen general..." },
    // ...
  ],
}

export function FloatingAI() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  // No mostrar en ciertas páginas
  const hiddenPaths = ["/ia", "/login"]
  if (hiddenPaths.some(path => pathname.startsWith(path))) return null

  const config = PAGE_CONFIGS[pathname] || DEFAULT_CONFIG

  const handlePromptClick = (prompt: string) => {
    sessionStorage.setItem("felix_initial_prompt", prompt)
    router.push("/ia")
  }

  return (
    <>
      {/* Overlay */}
      {isOpen && <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />}

      <div className="fixed bottom-6 right-6 z-50">
        {/* Popup */}
        {isOpen && (
          <div className="absolute bottom-16 right-0 w-80 bg-white rounded-2xl shadow-2xl border">
            {/* Header con avatar */}
            <div className="p-4 border-b flex items-center gap-3">
              <div className="w-10 h-10 rounded-full shadow-md overflow-hidden">
                <Image src="/felixcircularblanco.png" alt="Felix" width={40} height={40} />
              </div>
              <div>
                <h3 className="font-semibold text-sm">{config.title}</h3>
                <p className="text-xs text-gray-500">{config.description}</p>
              </div>
              <button onClick={() => setIsOpen(false)} className="ml-auto">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Prompts sugeridos */}
            <div className="p-2">
              {config.prompts.map((item, i) => (
                <button
                  key={i}
                  onClick={() => handlePromptClick(item.prompt)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50"
                >
                  <item.icon className="w-4 h-4 text-blue-500" />
                  <span className="text-sm">{item.label}</span>
                </button>
              ))}
            </div>

            {/* Footer */}
            <div className="p-3 border-t">
              <button
                onClick={() => router.push("/ia")}
                className="w-full p-2.5 rounded-xl bg-blue-500 text-white text-sm font-medium"
              >
                <MessageSquare className="w-4 h-4 inline mr-2" />
                Abrir chat completo
              </button>
            </div>
          </div>
        )}

        {/* Floating Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-14 h-14 rounded-full shadow-lg overflow-hidden hover:scale-105 transition-transform"
        >
          <Image src="/felixcircularblanco.png" alt="Felix" width={56} height={56} />
        </button>
      </div>
    </>
  )
}
```

---

## 6. Integración en Layout

Agregar `FloatingAI` al layout principal:

```typescript
// app/layout.tsx o similar
import { FloatingAI } from "@/components/floating-ai/floating-ai"

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <FloatingAI />  {/* Agregar aquí */}
      </body>
    </html>
  )
}
```

---

## 7. Variables de Entorno

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...   # Para API routes
ANTHROPIC_API_KEY=sk-ant-...       # API key de Anthropic
```

---

## 8. Dependencias Requeridas

```bash
npm install @anthropic-ai/sdk @supabase/supabase-js @tanstack/react-query react-markdown remark-gfm lucide-react
```

---

## 9. Checklist de Implementación

- [ ] Crear tablas en Supabase (`chat_conversations`, `chat_messages`)
- [ ] Crear RPC `get_ia_context_for_tenant` con tu lógica de datos
- [ ] Configurar RLS en las tablas
- [ ] Crear `/api/chat/route.ts` con tu SYSTEM_PROMPT personalizado
- [ ] Crear hooks (`use-chat.ts`, `use-conversations.ts`)
- [ ] Crear componentes de chat
- [ ] Crear componente FloatingAI con prompts por página
- [ ] Agregar avatar de la IA en `/public/`
- [ ] Agregar FloatingAI al layout
- [ ] Configurar variables de entorno
- [ ] Probar streaming y persistencia

---

## 10. Personalización Clave

| Elemento | Archivo | Qué Cambiar |
|----------|---------|-------------|
| **Nombre de la IA** | Todos los componentes | "Felix" → tu nombre |
| **Avatar** | `/public/` | Tu imagen circular PNG |
| **System Prompt** | `api/chat/route.ts` | Instrucciones para Claude |
| **Contexto de datos** | `api/chat/route.ts` | Query a tu RPC |
| **Prompts sugeridos** | `floating-ai.tsx` | Prompts por página |
| **Colores** | Componentes | Tu paleta de colores |

---

## Notas Finales

- El streaming usa Server-Sent Events (SSE) para respuestas en tiempo real
- El historial se limita a 10 mensajes para no exceder tokens
- Las conversaciones se guardan automáticamente en Supabase
- El FloatingAI muestra prompts contextuales según la página actual
- El avatar debe ser circular con fondo transparente (PNG 200x200)
