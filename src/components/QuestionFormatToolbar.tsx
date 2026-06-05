import { useRef } from 'react'
import {
  Bold,
  Italic,
  Link,
  List,
  ListOrdered,
  Underline,
} from 'lucide-react'

interface QuestionFormatToolbarProps {
  value: string
  onChange: (value: string) => void
}

export function QuestionFormatToolbar({
  value,
  onChange,
}: QuestionFormatToolbarProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const applyWrap = (before: string, after: string) => {
    const el = textareaRef.current
    if (!el) return

    const start = el.selectionStart
    const end = el.selectionEnd
    const selected = value.substring(start, end)
    const next =
      value.substring(0, start) + before + selected + after + value.substring(end)
    onChange(next)

    requestAnimationFrame(() => {
      el.focus()
      const cursor = start + before.length + selected.length
      el.setSelectionRange(cursor, cursor)
    })
  }

  const tools = [
    {
      label: 'Bold',
      icon: Bold,
      action: () => applyWrap('**', '**'),
    },
    {
      label: 'Italic',
      icon: Italic,
      action: () => applyWrap('*', '*'),
    },
    {
      label: 'Underline',
      icon: Underline,
      action: () => applyWrap('<u>', '</u>'),
    },
    {
      label: 'Link',
      icon: Link,
      action: () => {
        const url = window.prompt('Enter URL')
        if (url) applyWrap(`[`, `](${url})`)
      },
    },
    {
      label: 'Bullet list',
      icon: List,
      action: () => applyWrap('\n- ', ''),
    },
    {
      label: 'Numbered list',
      icon: ListOrdered,
      action: () => applyWrap('\n1. ', ''),
    },
  ]

  return (
    <div>
      <div className="flex flex-wrap gap-1 mb-2 border-b border-gray-100 pb-2">
        {tools.map((tool) => (
          <button
            key={tool.label}
            type="button"
            title={tool.label}
            onClick={tool.action}
            className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded"
          >
            <tool.icon size={16} />
          </button>
        ))}
      </div>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        placeholder="Type here"
        className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-y focus:outline-none focus:ring-2 focus:ring-primary/30"
      />
    </div>
  )
}
