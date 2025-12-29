/**
 * Convierte Markdown a HTML para newsletters
 * Soporta: headers, bold, italic, listas, links, emojis
 */
export function markdownToHtml(markdown: string): string {
  if (!markdown) return ''

  let html = markdown

  // Escape HTML entities first (except for our own tags)
  html = html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  // Headers
  html = html.replace(/^### (.*$)/gim, '<h3 style="color: #1a1a1a; font-size: 18px; margin: 16px 0 8px 0;">$1</h3>')
  html = html.replace(/^## (.*$)/gim, '<h2 style="color: #1a1a1a; font-size: 22px; margin: 24px 0 12px 0;">$1</h2>')
  html = html.replace(/^# (.*$)/gim, '<h1 style="color: #1a1a1a; font-size: 28px; margin: 0 0 16px 0;">$1</h1>')

  // Horizontal rules
  html = html.replace(/^---$/gim, '<hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">')

  // Bold and italic
  html = html.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong style="color: #111827;">$1</strong>')
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>')

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color: #2563eb; text-decoration: underline;">$1</a>')

  // Unordered lists
  html = html.replace(/^\s*[-*]\s+(.*)$/gim, '<li style="margin: 4px 0; color: #374151;">$1</li>')

  // Ordered lists (numbered)
  html = html.replace(/^\s*(\d+)\.\s+(.*)$/gim, '<li style="margin: 4px 0; color: #374151;">$2</li>')

  // Wrap consecutive <li> in <ul>
  html = html.replace(/(<li[^>]*>.*<\/li>\n?)+/g, (match) => {
    return `<ul style="list-style: disc; padding-left: 20px; margin: 12px 0;">${match}</ul>`
  })

  // Tables (simple support)
  const tableRegex = /\|(.+)\|\n\|[-:| ]+\|\n((?:\|.+\|\n?)+)/g
  html = html.replace(tableRegex, (match, header, body) => {
    const headers = header.split('|').filter((h: string) => h.trim())
    const headerHtml = headers.map((h: string) =>
      `<th style="padding: 8px 12px; text-align: left; border-bottom: 2px solid #e5e7eb; font-weight: 600; color: #374151;">${h.trim()}</th>`
    ).join('')

    const rows = body.trim().split('\n')
    const bodyHtml = rows.map((row: string) => {
      const cells = row.split('|').filter((c: string) => c.trim())
      const cellsHtml = cells.map((c: string) =>
        `<td style="padding: 8px 12px; border-bottom: 1px solid #f3f4f6; color: #4b5563;">${c.trim()}</td>`
      ).join('')
      return `<tr>${cellsHtml}</tr>`
    }).join('')

    return `<table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px;">
      <thead><tr>${headerHtml}</tr></thead>
      <tbody>${bodyHtml}</tbody>
    </table>`
  })

  // Paragraphs (lines that aren't already HTML)
  html = html.split('\n').map(line => {
    const trimmed = line.trim()
    if (!trimmed) return ''
    if (trimmed.startsWith('<')) return line
    return `<p style="margin: 8px 0; color: #374151; line-height: 1.6;">${line}</p>`
  }).join('\n')

  // Clean up empty paragraphs
  html = html.replace(/<p[^>]*>\s*<\/p>/g, '')

  // Wrap in container
  html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #ffffff;">
      ${html}
      <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb; text-align: center; color: #9ca3af; font-size: 12px;">
        <p style="margin: 4px 0;">Newsletter generado por RushData IA</p>
        <p style="margin: 4px 0;">
          <a href="https://rushdata.mx" style="color: #6b7280; text-decoration: none;">rushdata.mx</a>
        </p>
      </div>
    </div>
  `

  return html
}

/**
 * Formatea un número como moneda MXN
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value)
}

/**
 * Formatea un porcentaje con signo
 */
export function formatPercent(value: number | null): string {
  if (value === null || value === undefined) return 'N/A'
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(1)}%`
}
