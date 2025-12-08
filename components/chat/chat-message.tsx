"use client"

import { memo } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { cn } from "@/lib/utils"
import { User } from "lucide-react"
import Image from "next/image"
import type { ChatMessage as ChatMessageType } from "@/hooks/use-chat"

interface ChatMessageProps {
  message: ChatMessageType
}

export const ChatMessage = memo(function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user"

  return (
    <div className={cn("py-6", isUser ? "bg-transparent" : "bg-transparent")}>
      <div className="max-w-3xl mx-auto px-4">
        <div className="flex gap-4">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {isUser ? (
              <div className="w-8 h-8 rounded-full bg-[#0066FF]/10 flex items-center justify-center">
                <User className="w-4 h-4 text-[#0066FF]" />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0066FF]/10 to-[#06B6D4]/10 flex items-center justify-center overflow-hidden">
                <Image
                  src="/Felix.png"
                  alt="Felix - RushData IA"
                  width={32}
                  height={32}
                  className="w-8 h-8 object-contain"
                />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 pt-0.5">
            {/* Name */}
            <p className="text-sm font-medium text-foreground mb-1">
              {isUser ? "Tú" : "Felix"}
            </p>

            {/* Message */}
            {isUser ? (
              <p className="text-[15px] text-foreground/90 leading-relaxed whitespace-pre-wrap">
                {message.content}
              </p>
            ) : (
              <div className="prose prose-neutral dark:prose-invert max-w-none">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    p: ({ children }) => (
                      <p className="mb-3 last:mb-0 text-[15px] leading-relaxed text-foreground/90">
                        {children}
                      </p>
                    ),
                    ul: ({ children }) => (
                      <ul className="mb-3 ml-1 space-y-1.5 list-none">
                        {children}
                      </ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="mb-3 ml-1 space-y-1.5 list-decimal list-inside">
                        {children}
                      </ol>
                    ),
                    li: ({ children }) => (
                      <li className="text-[15px] leading-relaxed text-foreground/90 flex items-start gap-2">
                        <span className="text-[#0066FF] mt-2 w-1.5 h-1.5 rounded-full bg-current flex-shrink-0" />
                        <span>{children}</span>
                      </li>
                    ),
                    strong: ({ children }) => (
                      <strong className="font-semibold text-foreground">
                        {children}
                      </strong>
                    ),
                    h1: ({ children }) => (
                      <h1 className="text-xl font-semibold mb-3 mt-6 first:mt-0 text-foreground">
                        {children}
                      </h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="text-lg font-semibold mb-2 mt-5 first:mt-0 text-foreground">
                        {children}
                      </h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="text-base font-semibold mb-2 mt-4 first:mt-0 text-foreground">
                        {children}
                      </h3>
                    ),
                    code: ({ children, className }) => {
                      const isInline = !className
                      return isInline ? (
                        <code className="bg-[#0066FF]/5 text-[#0066FF] px-1.5 py-0.5 rounded text-sm font-mono">
                          {children}
                        </code>
                      ) : (
                        <code className="block bg-slate-900 text-slate-50 p-4 rounded-lg text-sm font-mono overflow-x-auto my-3">
                          {children}
                        </code>
                      )
                    },
                    pre: ({ children }) => (
                      <pre className="bg-slate-900 text-slate-50 p-4 rounded-lg text-sm font-mono overflow-x-auto my-3">
                        {children}
                      </pre>
                    ),
                    table: ({ children }) => (
                      <div className="overflow-x-auto my-4 rounded-lg border border-border">
                        <table className="min-w-full text-sm">
                          {children}
                        </table>
                      </div>
                    ),
                    thead: ({ children }) => (
                      <thead className="bg-muted/50 border-b border-border">
                        {children}
                      </thead>
                    ),
                    th: ({ children }) => (
                      <th className="px-4 py-2.5 text-left font-medium text-sm text-foreground">
                        {children}
                      </th>
                    ),
                    td: ({ children }) => (
                      <td className="px-4 py-2.5 text-sm text-foreground/80 border-b border-border/50">
                        {children}
                      </td>
                    ),
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-2 border-[#0066FF]/30 pl-4 my-3 text-foreground/70 italic">
                        {children}
                      </blockquote>
                    ),
                    a: ({ children, href }) => (
                      <a
                        href={href}
                        className="text-[#0066FF] hover:underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {children}
                      </a>
                    ),
                  }}
                >
                  {message.content || "..."}
                </ReactMarkdown>
                {message.isStreaming && (
                  <span className="inline-block w-0.5 h-5 bg-[#0066FF] animate-pulse ml-0.5 align-middle" />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
})
