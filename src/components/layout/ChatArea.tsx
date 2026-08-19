'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Hash,
  Plus,
  Smile,
  AtSign,
  Paperclip,
  Send,
  MoreHorizontal,
  Reply,
  Edit2,
  Trash2,
  Pin,
  Copy,
  SmilePlus,
} from 'lucide-react'
import { cn, formatDate } from '@/lib/utils'
import { Avatar, Tooltip, Markdown } from '@/components/ui'
import type { Message, User, Reaction } from '@/types'

interface ChatAreaProps {
  channelName: string
  messages: Message[]
  currentUserId?: string
  onSendMessage: (content: string) => void | Promise<void>
  onEditMessage: (messageId: string, content: string) => void
  onDeleteMessage: (messageId: string) => void
  onReact: (messageId: string, emoji: string) => void
  onReply: (message: Message) => void
  typingUsers?: string[]
}

export function ChatArea({
  channelName,
  messages,
  currentUserId,
  onSendMessage,
  onEditMessage,
  onDeleteMessage,
  onReact,
  onReply,
  typingUsers = [],
}: ChatAreaProps) {
  const [message, setMessage] = useState('')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (message.trim()) {
      onSendMessage(message.trim())
      setMessage('')
    }
  }

  return (
    <div className="flex-1 flex flex-col bg-discord-bg">
      {/* Header - Discord style */}
      <div className="h-12 px-4 flex items-center justify-between gap-3 border-b border-black/20 shrink-0 shadow-sm">
        <div className="flex items-center gap-3 min-w-0">
          <Hash className="w-5 h-5 text-gray-400 shrink-0" />
          <span className="font-semibold text-white truncate">
            {channelName}
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        <WelcomeMessage channelName={channelName} />
        {messages.map((msg) => (
          <MessageItem
            key={msg.id}
            message={msg}
            isOwnMessage={msg.authorId === currentUserId}
            onEdit={(content) => onEditMessage(msg.id, content)}
            onDelete={() => onDeleteMessage(msg.id)}
            onReact={(emoji) => onReact(msg.id, emoji)}
            onReply={() => onReply(msg)}
          />
        ))}

        {/* Typing indicator */}
        <AnimatePresence>
          {typingUsers.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="flex items-center gap-2 px-4 py-1 text-sm text-gray-400"
            >
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-gray-400 typing-dot" />
                <span className="w-2 h-2 rounded-full bg-gray-400 typing-dot" />
                <span className="w-2 h-2 rounded-full bg-gray-400 typing-dot" />
              </div>
              <span>
                {typingUsers.length === 1
                  ? `${typingUsers[0]} está digitando`
                  : `${typingUsers.length} pessoas digitando`}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Input */}
      <ChatInput
        value={message}
        onChange={setMessage}
        onSubmit={handleSubmit}
        showEmojiPicker={showEmojiPicker}
        onToggleEmoji={() => setShowEmojiPicker(!showEmojiPicker)}
      />
    </div>
  )
}

function ChatHeader({ channelName }: { channelName: string }) {
  return (
    <div className="h-12 px-4 flex items-center justify-between gap-3 border-b border-black/20 shrink-0 shadow-sm">
      <div className="flex items-center gap-3 min-w-0">
        <Hash className="w-5 h-5 text-gray-400 shrink-0" />
        <span className="font-semibold text-white truncate">
          {channelName}
        </span>
      </div>
    </div>
  )
}

function WelcomeMessage({ channelName }: { channelName: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-4 py-4 px-4 mb-2"
    >
      <div className="w-16 h-16 rounded-full bg-discord-blurple flex items-center justify-center shrink-0">
        <Hash className="w-8 h-8 text-white" />
      </div>
      <div>
        <h2 className="text-2xl font-bold text-white">
          Bem-vindo ao #{channelName}!
        </h2>
        <p className="text-discord-text-muted text-sm mt-1">
          Este é o começo do canal #{channelName}.
        </p>
      </div>
    </motion.div>
  )
}

interface MessageItemProps {
  message: Message
  isOwnMessage: boolean
  onEdit: (content: string) => void
  onDelete: () => void
  onReact: (emoji: string) => void
  onReply: () => void
}

function MessageItem({ message, isOwnMessage, onEdit, onDelete, onReact, onReply }: MessageItemProps) {
  const [showActions, setShowActions] = useState(false)
  const [showReactionPicker, setShowReactionPicker] = useState(false)

  const reactions = ['👍', '❤️', '😂', '🎉', '😮', '😢']

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => {
        setShowActions(false)
        setShowReactionPicker(false)
      }}
      className="group relative flex gap-4 px-4 py-1 hover:bg-discord-hover/30 transition-colors"
    >
      {/* Avatar */}
      <Avatar
        src={message.author?.avatarUrl}
        alt={message.author?.displayName || 'User'}
        size="lg"
        shape="circle"
        className="mt-0.5 shrink-0"
      />

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-baseline gap-2">
          <span className="font-medium text-white hover:underline cursor-pointer">
            {message.author?.displayName}
          </span>
          {message.author?.role && (
            <span
              className="px-1.5 py-0.5 rounded text-xs font-medium"
              style={{
                backgroundColor: `${message.author.role.color}20`,
                color: message.author.role.color,
              }}
            >
              {message.author.role.name}
            </span>
          )}
          <span className="text-xs text-discord-text-dim" suppressHydrationWarning>
            {formatDate(message.createdAt, 'time')}
          </span>
          {message.editedAt && (
            <span className="text-xs text-discord-text-dim">(editado)</span>
          )}
        </div>

        {/* Message content */}
        <div className="text-discord-text-muted text-sm leading-relaxed">
          <Markdown>{message.content}</Markdown>
        </div>

        {/* Reactions */}
        {message.reactions.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {message.reactions.map((reaction) => (
              <motion.button
                key={reaction.emoji}
                whileHover={{ scale: 1.05 }}
                onClick={() => onReact(reaction.emoji)}
                className={cn(
                  'inline-flex items-center gap-1 px-2 py-0.5 rounded text-sm transition-colors border',
                  reaction.reacted
                    ? 'bg-discord-blurple/20 border-discord-blurple/50 text-white'
                    : 'bg-discord-surface border-transparent hover:border-discord-hover text-discord-text-muted'
                )}
              >
                <span>{reaction.emoji}</span>
                <span className="text-xs font-medium">{reaction.count}</span>
              </motion.button>
            ))}
          </div>
        )}
      </div>

      {/* Actions - posicionadas absoluto canto direito (estilo Discord) */}
      <AnimatePresence>
        {showActions && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.95 }}
            className="absolute -top-3 right-4 flex items-center gap-0.5 shrink-0 bg-discord-surface border border-black/40 rounded-md px-1 shadow-md"
          >
            {/* Reaction button */}
            <div className="relative">
              <Tooltip content="Adicionar reação">
                <button
                  onClick={() => setShowReactionPicker(!showReactionPicker)}
                  className="p-1.5 rounded hover:bg-discord-hover text-discord-text-muted hover:text-white transition-colors"
                >
                  <SmilePlus className="w-4 h-4" />
                </button>
              </Tooltip>

              <AnimatePresence>
                {showReactionPicker && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute bottom-full left-0 mb-2 p-2 grid grid-cols-6 gap-1 bg-discord-surface border border-black/40 rounded-lg shadow-2xl z-50"
                  >
                    {reactions.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => {
                          onReact(emoji)
                          setShowReactionPicker(false)
                        }}
                        className="p-1.5 rounded hover:bg-discord-hover text-lg transition-colors"
                      >
                        {emoji}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Reply */}
            <Tooltip content="Responder">
              <button
                onClick={onReply}
                className="p-1.5 rounded hover:bg-discord-hover text-discord-text-muted hover:text-white transition-colors"
              >
                <Reply className="w-4 h-4" />
              </button>
            </Tooltip>

            {/* More actions */}
            <div className="relative group/menu">
              <button className="p-1.5 rounded hover:bg-discord-hover text-discord-text-muted hover:text-white transition-colors">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

interface ChatInputProps {
  value: string
  onChange: (value: string) => void
  onSubmit: (e: React.FormEvent) => void
  showEmojiPicker: boolean
  onToggleEmoji: () => void
  placeholder?: string
}

function ChatInput({
  value,
  onChange,
  onSubmit,
  showEmojiPicker,
  onToggleEmoji,
  placeholder = 'Enviar uma mensagem...',
}: ChatInputProps) {
  return (
    <div className="p-4 pt-2">
      <form onSubmit={onSubmit} className="relative">
        <div className="flex items-end gap-2 px-4 py-3 bg-discord-surface2 rounded-lg">
          {/* Emoji button */}
          <button
            type="button"
            onClick={onToggleEmoji}
            className="p-1.5 rounded hover:bg-discord-hover text-gray-400 hover:text-white transition-colors"
          >
            <Smile className="w-5 h-5" />
          </button>

          {/* Input */}
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="flex-1 bg-transparent text-white placeholder:text-gray-400 outline-none text-sm"
          />

          {/* Attachments */}
          <button
            type="button"
            className="p-1.5 rounded hover:bg-discord-hover text-gray-400 hover:text-white transition-colors"
          >
            <Paperclip className="w-5 h-5" />
          </button>

          {/* Mention */}
          <button
            type="button"
            className="p-1.5 rounded hover:bg-discord-hover text-gray-400 hover:text-white transition-colors"
          >
            <AtSign className="w-5 h-5" />
          </button>

          {/* Send button */}
          <button
            type="submit"
            disabled={!value.trim()}
            className={cn(
              'p-1.5 rounded transition-colors',
              value.trim()
                ? 'bg-discord-blurple text-white hover:bg-discord-blurple-hover'
                : 'text-gray-500'
            )}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  )
}
