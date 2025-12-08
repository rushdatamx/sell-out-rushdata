"use client"

import { useRef, useEffect, useState } from "react"
import { useChat } from "@/hooks/use-chat"
import { ChatMessage } from "./chat-message"
import { ChatInput } from "./chat-input"
import { ChatSuggested } from "./chat-suggested"
import { ChatSidebar } from "./chat-sidebar"
import Image from "next/image"

interface ChatContainerProps {
  showSidebar?: boolean
}

export function ChatContainer({ showSidebar = true }: ChatContainerProps) {
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

  const scrollRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const [initialPromptSent, setInitialPromptSent] = useState(false)

  // Verificar si hay un prompt inicial desde el FloatingAI
  useEffect(() => {
    if (!initialPromptSent && messages.length === 0) {
      const initialPrompt = sessionStorage.getItem("felix_initial_prompt")
      if (initialPrompt) {
        sessionStorage.removeItem("felix_initial_prompt")
        setInitialPromptSent(true)
        // Pequeño delay para asegurar que el componente está montado
        setTimeout(() => {
          sendMessage(initialPrompt)
        }, 100)
      }
    }
  }, [initialPromptSent, messages.length, sendMessage])

  // Auto-scroll al nuevo mensaje
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
    }
  }, [messages])

  const handleNewConversation = () => {
    clearMessages()
  }

  const handleSelectConversation = (id: string) => {
    loadConversation(id)
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] bg-[#F7F7F5] dark:bg-[#1a1a1a]">
      {/* Sidebar */}
      {showSidebar && (
        <div className="w-64 flex-shrink-0 hidden md:block">
          <ChatSidebar
            currentConversationId={conversationId}
            onSelectConversation={handleSelectConversation}
            onNewConversation={handleNewConversation}
          />
        </div>
      )}

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-[#0d0d0d]">
        {/* Messages area */}
        <div
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto"
        >
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center px-4">
              <div className="max-w-2xl w-full text-center">
                {/* Felix Avatar */}
                <div className="mb-6">
                  <div className="inline-flex p-4 rounded-full bg-gradient-to-br from-[#0066FF]/5 to-[#06B6D4]/5">
                    <Image
                      src="/Felix.png"
                      alt="Felix - RushData IA"
                      width={80}
                      height={80}
                      className="w-20 h-20 object-contain"
                    />
                  </div>
                </div>

                {/* Welcome text */}
                <h1 className="text-2xl font-medium text-foreground mb-2">
                  ¿En qué puedo ayudarte hoy?
                </h1>
                <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                  Soy Felix, tu asistente de análisis de sell-out. Puedo ayudarte a analizar tus datos y preparar presentaciones.
                </p>

                {/* Suggested prompts */}
                <ChatSuggested onSelect={sendMessage} />
              </div>
            </div>
          ) : (
            <div className="divide-y divide-border/40">
              {messages.map((message, index) => (
                <ChatMessage key={message.id} message={message} />
              ))}
              {isLoading && messages[messages.length - 1]?.role === "user" && (
                <div className="py-6">
                  <div className="max-w-3xl mx-auto px-4">
                    <div className="flex gap-4">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0066FF]/10 to-[#06B6D4]/10 flex items-center justify-center overflow-hidden">
                        <Image
                          src="/Felix.png"
                          alt="Felix"
                          width={32}
                          height={32}
                          className="w-8 h-8 object-contain"
                        />
                      </div>
                      <div className="pt-0.5">
                        <p className="text-sm font-medium text-foreground mb-1">Felix</p>
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-[#0066FF] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                          <div className="w-2 h-2 bg-[#0066FF] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                          <div className="w-2 h-2 bg-[#0066FF] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={scrollRef} />
            </div>
          )}
        </div>

        {/* Error message */}
        {error && (
          <div className="px-4 py-2 bg-red-50 dark:bg-red-950/20 border-t border-red-200 dark:border-red-800">
            <p className="text-sm text-red-600 dark:text-red-400 text-center">{error}</p>
          </div>
        )}

        {/* Input area */}
        <div className="border-t border-border/40 bg-white dark:bg-[#0d0d0d] p-4">
          <div className="max-w-3xl mx-auto">
            <ChatInput
              onSend={sendMessage}
              onStop={stopGeneration}
              isLoading={isLoading}
              placeholder="Envía un mensaje a Felix..."
            />
            <p className="text-[11px] text-muted-foreground/60 text-center mt-3">
              Felix puede cometer errores. Verifica la información importante.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
