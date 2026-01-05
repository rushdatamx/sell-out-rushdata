"use client"

import { useState } from "react"
import { useConversations, Conversation } from "@/hooks/use-conversations"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  PenSquare,
  MessageSquare,
  Trash2,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import Image from "next/image"

interface ChatSidebarProps {
  currentConversationId: string | null
  onSelectConversation: (id: string) => void
  onNewConversation: () => void
}

export function ChatSidebar({
  currentConversationId,
  onSelectConversation,
  onNewConversation,
}: ChatSidebarProps) {
  const { conversations, isLoading, deleteConversation } = useConversations()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    setDeletingId(id)
    deleteConversation(id, {
      onSettled: () => setDeletingId(null),
    })
  }

  return (
    <div className="flex flex-col h-full bg-[#F7F7F5] dark:bg-[#171717]">
      {/* Header with logo */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full shadow-sm overflow-hidden">
            <Image
              src="/felixcircularblanco.png"
              alt="Felix"
              width={32}
              height={32}
              className="w-8 h-8 object-cover"
            />
          </div>
          <span className="font-semibold text-foreground">Felix</span>
        </div>
        <button
          onClick={onNewConversation}
          className={cn(
            "p-2 rounded-lg transition-colors",
            "hover:bg-black/5 dark:hover:bg-white/5",
            "text-muted-foreground hover:text-foreground"
          )}
          aria-label="Nueva conversación"
        >
          <PenSquare className="w-5 h-5" />
        </button>
      </div>

      {/* Conversations list */}
      <ScrollArea className="flex-1 px-2">
        <div className="space-y-0.5 pb-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-12 px-4">
              <div className="w-12 h-12 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center mx-auto mb-3">
                <MessageSquare className="h-5 w-5 text-muted-foreground/60" />
              </div>
              <p className="text-sm text-muted-foreground">
                Sin conversaciones
              </p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                Haz clic en el ícono + para comenzar
              </p>
            </div>
          ) : (
            <>
              <p className="text-xs font-medium text-muted-foreground/70 px-3 py-2 uppercase tracking-wider">
                Recientes
              </p>
              {conversations.map((conv) => (
                <ConversationItem
                  key={conv.id}
                  conversation={conv}
                  isActive={conv.id === currentConversationId}
                  isDeleting={deletingId === conv.id}
                  onClick={() => onSelectConversation(conv.id)}
                  onDelete={(e) => handleDelete(e, conv.id)}
                />
              ))}
            </>
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-3 border-t border-border/40">
        <p className="text-[10px] text-muted-foreground/50 text-center">
          Powered by RushData
        </p>
      </div>
    </div>
  )
}

interface ConversationItemProps {
  conversation: Conversation
  isActive: boolean
  isDeleting: boolean
  onClick: () => void
  onDelete: (e: React.MouseEvent) => void
}

function ConversationItem({
  conversation,
  isActive,
  isDeleting,
  onClick,
  onDelete,
}: ConversationItemProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
      className={cn(
        "w-full text-left px-3 py-2.5 rounded-lg transition-colors group cursor-pointer",
        "hover:bg-black/5 dark:hover:bg-white/5",
        isActive && "bg-black/5 dark:bg-white/5"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className={cn(
          "text-sm truncate flex-1",
          isActive ? "text-foreground font-medium" : "text-foreground/80"
        )}>
          {conversation.title || "Nueva conversación"}
        </p>
        <button
          className={cn(
            "p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity",
            "hover:bg-black/10 dark:hover:bg-white/10",
            "text-muted-foreground hover:text-destructive"
          )}
          onClick={onDelete}
          disabled={isDeleting}
          aria-label="Eliminar conversación"
        >
          {isDeleting ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Trash2 className="h-3.5 w-3.5" />
          )}
        </button>
      </div>
      <p className="text-[11px] text-muted-foreground/60 mt-0.5">
        {formatDistanceToNow(conversation.updatedAt, {
          addSuffix: true,
          locale: es,
        })}
      </p>
    </div>
  )
}
