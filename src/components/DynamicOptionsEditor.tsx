import { Image, Plus, Trash2 } from 'lucide-react'

export type OptionKey = 'option1' | 'option2' | 'option3' | 'option4'

export interface OptionRow {
  key: OptionKey
  value: string
}

const ALL_KEYS: OptionKey[] = ['option1', 'option2', 'option3', 'option4']

interface DynamicOptionsEditorProps {
  options: OptionRow[]
  correctOption: OptionKey
  onOptionsChange: (options: OptionRow[]) => void
  onCorrectChange: (key: OptionKey) => void
  errors?: Partial<Record<OptionKey, string>>
}

export function DynamicOptionsEditor({
  options,
  correctOption,
  onOptionsChange,
  onCorrectChange,
  errors,
}: DynamicOptionsEditorProps) {
  const removeOption = (key: OptionKey) => {
    if (options.length <= 2) return
    const next = options.filter((o) => o.key !== key)
    if (correctOption === key && next.length > 0) {
      onCorrectChange(next[0].key)
    }
    onOptionsChange(next)
  }

  const addOption = () => {
    const used = new Set(options.map((o) => o.key))
    const nextKey = ALL_KEYS.find((k) => !used.has(k))
    if (!nextKey) return
    onOptionsChange([...options, { key: nextKey, value: '' }])
  }

  const updateValue = (key: OptionKey, value: string) => {
    onOptionsChange(options.map((o) => (o.key === key ? { ...o, value } : o)))
  }

  const canAdd = options.length < 4

  return (
    <div className="space-y-3">
      {options.map((opt, index) => (
        <div key={opt.key} className="flex items-center gap-3">
          <input
            type="radio"
            name="correct_option"
            checked={correctOption === opt.key}
            onChange={() => onCorrectChange(opt.key)}
            className="w-4 h-4 text-primary shrink-0"
          />
          <input
            value={opt.value}
            onChange={(e) => updateValue(opt.key, e.target.value)}
            placeholder={`Type Option ${index + 1} here`}
            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg"
          />
          <button
            type="button"
            className="p-2 text-gray-400 hover:text-gray-600"
            aria-label="Add image to option"
          >
            <Image size={18} />
          </button>
          <button
            type="button"
            onClick={() => removeOption(opt.key)}
            disabled={options.length <= 2}
            className="p-2 text-red-400 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label={`Remove option ${index + 1}`}
          >
            <Trash2 size={18} />
          </button>
          {errors?.[opt.key] && (
            <p className="text-xs text-red-500 w-full">{errors[opt.key]}</p>
          )}
        </div>
      ))}
      {canAdd && (
        <button
          type="button"
          onClick={addOption}
          className="inline-flex items-center gap-1.5 text-sm text-primary font-medium hover:underline"
        >
          <Plus size={16} />
          Add option
        </button>
      )}
    </div>
  )
}

export function optionsToQuestionFields(
  options: OptionRow[],
): Pick<
  import('../types').Question,
  'option1' | 'option2' | 'option3' | 'option4'
> {
  const map = Object.fromEntries(options.map((o) => [o.key, o.value])) as Record<
    OptionKey,
    string
  >
  return {
    option1: map.option1 ?? '',
    option2: map.option2 ?? '',
    option3: map.option3 ?? '',
    option4: map.option4 ?? '',
  }
}

export function questionToOptionRows(
  q: Partial<import('../types').Question>,
): OptionRow[] {
  const rows: OptionRow[] = []
  for (const key of ALL_KEYS) {
    const val = q[key]
    if (val !== undefined && String(val).trim() !== '') {
      rows.push({ key, value: val })
    }
  }
  if (rows.length === 0) {
    return [
      { key: 'option1', value: '' },
      { key: 'option2', value: '' },
    ]
  }
  if (rows.length === 1) {
    rows.push({ key: 'option2', value: '' })
  }
  return rows
}
