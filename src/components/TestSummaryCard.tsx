import { Clock, FileText, Pencil, Target } from 'lucide-react'
import type { Test } from '../types'

import { TEST_TYPE_LABELS } from '../constants/testTypes'

interface TestSummaryCardProps {
  test: Test
  onEdit?: () => void
  showStatus?: boolean
  completedQuestions?: number
}

export function TestSummaryCard({
  test,
  onEdit,
  showStatus,
  completedQuestions,
}: TestSummaryCardProps) {
  const subjectName =
    typeof test.subject === 'string'
      ? test.subject
      : (test.subject as { name?: string })?.name || '—'

  const topics = Array.isArray(test.topics)
    ? test.topics.map((t) => (typeof t === 'string' ? t : t.name))
    : []

  const subTopics = Array.isArray(test.sub_topics)
    ? test.sub_topics.map((t) => (typeof t === 'string' ? t : (t as { name: string }).name))
    : []

  const difficulty = (test.difficulty || 'easy').toString()
  const typeKey = (test.type || 'chapterwise').toString()

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 relative">
      {onEdit && (
        <button
          type="button"
          onClick={onEdit}
          className="absolute top-5 right-5 p-2 text-primary hover:bg-primary-light rounded-lg cursor-pointer"
          aria-label="Edit test"
        >
          <Pencil size={18} />
        </button>
      )}

      {showStatus && (
        <div className="flex items-center gap-3 mb-4">
          <span className="text-sm font-medium text-gray-700">Test created</span>
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-50 text-green-700 text-xs font-medium border border-green-200">
            All {completedQuestions ?? test.total_questions ?? 0} Questions done
          </span>
        </div>
      )}

      <span className="inline-flex items-center h-6 px-4 bg-[#000A3A] text-white text-xs font-medium rounded-full">
        {TEST_TYPE_LABELS[typeKey] || typeKey}
      </span>
      <div className="flex flex-wrap items-center gap-2 mb-3 mt-2">
        <div className="flex items-center gap-2">
          <img
            src="/ar_stickers.png"
            alt="Sticker"
            className="w-5 h-5 object-contain"
          />

          <h2 className="text-xl font-bold text-gray-900">
            {test.name}
          </h2>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${difficulty === 'easy'
            ? 'bg-teal-50 text-teal-700 border border-teal-200'
            : difficulty === 'medium'
              ? 'bg-amber-50 text-amber-700 border border-amber-200'
              : difficulty === 'hard' || difficulty === 'difficult'
                ? 'bg-red-50 text-red-700 border border-red-200'
                : 'bg-gray-50 text-gray-600 border border-gray-200'
            }`}
        >
          {difficulty}
        </span>
      </div>

      {/* <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
        {test.name}
      </h2> */}

      <div className="flex flex-col gap-4 text-sm">
        <div className="flex items-center gap-2">
          <p className="text-gray-500 min-w-[80px]">Subject :</p>
          <p className="font-medium text-gray-800">{subjectName}</p>
        </div>
        <div className="flex items-center gap-2">
          <p className="text-gray-500 min-w-[80px]">Topic : </p>
          <div className="flex flex-wrap gap-1.5">
            {topics.length > 0 ? (
              topics.map((t) => (
                <span
                  key={t}
                  className="px-2 py-0.5 rounded border border-amber-300 text-amber-800 bg-amber-50 text-xs"
                >
                  {t}
                </span>
              ))
            ) : (
              <span className="text-gray-400">—</span>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <p className="text-gray-500 min-w-[80px]">Sub Topic : </p>
            <div className="flex flex-wrap gap-1.5">
              {subTopics.length > 0 ? (
                subTopics.map((t) => (
                  <span
                    key={t}
                    className="px-2 py-0.5 rounded border border-amber-300 text-amber-800 bg-amber-50 text-xs"
                  >
                    {t}
                  </span>
                ))
              ) : (
                <span className="text-gray-400">—</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-6 shrink-0">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock size={16} className="text-primary" />
              <span>{test.total_time ?? 0} Min</span>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-600">
              <FileText size={16} className="text-primary" />
              <span>{test.total_questions ?? 0} Q&apos;s</span>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Target size={16} className="text-primary" />
              <span>{test.total_marks ?? 0} Marks</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
