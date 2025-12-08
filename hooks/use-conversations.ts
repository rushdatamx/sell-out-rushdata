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

  const { data: conversations, isLoading, error } = useQuery({
    queryKey: ["chat-conversations", user?.id],
    queryFn: async () => {
      if (!user) return []

      const { data, error } = await (supabase
        .from("chat_conversations") as any)
        .select("id, title, created_at, updated_at")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(50)

      if (error) throw error

      return (data || []).map((conv: any) => ({
        id: conv.id,
        title: conv.title,
        createdAt: new Date(conv.created_at),
        updatedAt: new Date(conv.updated_at),
      })) as Conversation[]
    },
    enabled: !!user,
  })

  const deleteConversation = useMutation({
    mutationFn: async (conversationId: string) => {
      const { error } = await (supabase
        .from("chat_conversations") as any)
        .delete()
        .eq("id", conversationId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat-conversations"] })
    },
  })

  const updateConversationTitle = useMutation({
    mutationFn: async ({ id, title }: { id: string; title: string }) => {
      const { error } = await (supabase
        .from("chat_conversations") as any)
        .update({ title })
        .eq("id", id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat-conversations"] })
    },
  })

  return {
    conversations: conversations || [],
    isLoading,
    error,
    deleteConversation: deleteConversation.mutate,
    updateConversationTitle: updateConversationTitle.mutate,
    isDeleting: deleteConversation.isPending,
  }
}
