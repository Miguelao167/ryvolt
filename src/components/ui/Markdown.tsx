'use client'

import { cn } from '@/lib/utils'

interface MarkdownProps {
  /** Conteúdo em markdown. Se vazio, renderiza nada. */
  children: string
  /** Quando true, é uma menção de notificação (fundo mais escuro, texto maior). */
  emphasized?: boolean
  className?: string
}

/**
 * Parser de markdown custom estilo Discord — sem dependências externas.
 * Suporta:
 * - **negrito**, *itálico*, ~~tachado~~
 * - `código inline` e ```blocos de código```
 * - [links](url) — abrem em nova aba
 * - listas (- e 1.)
 * - > citações
 * - # cabeçalhos
 * - Quebras de linha preservadas
 *
 * Atenção a XSS: links são escapados, só href é permitido.
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function parseMarkdown(text: string): string {
  let html = escapeHtml(text)

  // Blocos de código: ```...``` e ~~~...~~~
  html = html.replace(/```([\s\S]*?)```/g, (_m, code) => {
    return `<pre class="block bg-discord-bg border border-discord-deep rounded-md p-3 my-2 text-xs font-mono overflow-x-auto leading-relaxed"><code>${code.trim()}</code></pre>`
  })

  // Código inline: `...`
  html = html.replace(/`([^`]+)`/g, (_m, code) => {
    return `<code class="bg-discord-bg border border-discord-deep rounded px-1.5 py-0.5 text-[0.85em] font-mono text-discord-blurple">${code}</code>`
  })

  // Negrito: **...** ou __...__
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong class="font-bold"><em>$1</em></strong>')
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold text-white">$1</strong>')
  html = html.replace(/__(.+?)__/g, '<strong class="font-bold">$1</strong>')

  // Itálico: *...* ou _..._
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>')
  html = html.replace(/_(.+?)_/g, '<em>$1</em>')

  // Tachado: ~~...~~
  html = html.replace(/~~(.+?)~~/g, '<del class="opacity-60">$1</del>')

  // Links: [text](url)
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, text, href) => {
    // Basic sanitization — only allow http/https
    const safe = href.startsWith('http://') || href.startsWith('https://') ? href : '#'
    return `<a href="${safe}" target="_blank" rel="noopener noreferrer" class="text-discord-blurple hover:underline">${text}</a>`
  })

  // Citações: > linha
  html = html.replace(/^&gt; (.+)$/gm, '<blockquote class="border-l-4 border-discord-deep pl-3 my-1 text-discord-text-muted italic">$1</blockquote>')

  // Cabeçalhos
  html = html.replace(/^### (.+)$/gm, '<h3 class="text-lg font-bold mt-2 mb-1">$1</h3>')
  html = html.replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold mt-3 mb-1">$1</h2>')
  html = html.replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold mt-3 mb-1">$1</h1>')

  // Listas não-ordenadas: - item
  html = html.replace(/^- (.+)$/gm, '<li class="leading-relaxed ml-4 list-disc">$1</li>')
  // Consolida <li> adjacentes em <ul>
  html = html.replace(/(<li class="leading-relaxed ml-4 list-disc">.+<\/li>\n?)+/g, (match) => {
    return `<ul class="list-disc pl-5 my-1 space-y-0.5">${match}</ul>`
  })

  // Listas ordenadas: 1. item
  html = html.replace(/^\d+\. (.+)$/gm, '<li class="leading-relaxed ml-4 list-decimal">$1</li>')
  html = html.replace(/(<li class="leading-relaxed ml-4 list-decimal">.+<\/li>\n?)+/g, (match) => {
    return `<ol class="list-decimal pl-5 my-1 space-y-0.5">${match}</ol>`
  })

  // Linha horizontal
  html = html.replace(/^---$/gm, '<hr class="border-t border-discord-deep my-2" />')

  // Negrito dentro de outros — processar novamente
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold text-white">$1</strong>')

  return html
}

function renderLines(text: string): React.ReactNode[] {
  const html = parseMarkdown(text)
  // Split by newlines, wrap each line in a div
  return html.split('\n').map((line, i) => (
    <div
      key={i}
      className={line.startsWith('<') ? undefined : 'text-white whitespace-pre-wrap break-words'}
      dangerouslySetInnerHTML={line.startsWith('<') ? { __html: line } : undefined}
    >
      {!line.startsWith('<') && line}
    </div>
  ))
}

export function Markdown({ children, emphasized = false, className }: MarkdownProps) {
  if (!children) return null

  return (
    <div
      className={cn(
        emphasized ? 'text-[15px]' : 'text-sm leading-relaxed',
        className
      )}
    >
      {renderLines(children)}
    </div>
  )
}
