import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Check, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'
import { QuestionFlowLayout } from '../components/layout/QuestionFlowLayout'
import { SkeletonCard, SkeletonQuestionSidebar } from '../components/ui/Skeleton'
import { TestSummaryCard } from '../components/TestSummaryCard'
import { EditTestModal } from '../components/EditTestModal'
import { questionsApi, testsApi } from '../api/services'
import type { Question, Test } from '../types'
import { useTestFlowStore } from '../store/testFlowStore'
import { isApiSuccess } from '../api/utils'

type PublishMode = 'now' | 'schedule'
type LiveUntil =
  | 'always'
  | '1week'
  | '2weeks'
  | '3weeks'
  | '1month'
  | 'custom'

export function PreviewPublishPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const resetFlow = useTestFlowStore((s) => s.reset)

  const [test, setTest] = useState<Test | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [publishing, setPublishing] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [publishMode, setPublishMode] = useState<PublishMode>('now')
  const [liveUntil, setLiveUntil] = useState<LiveUntil>('custom')
  const [scheduleDate, setScheduleDate] = useState('')
  const [scheduleTime, setScheduleTime] = useState('')
  const [endDate, setEndDate] = useState('')
  const [endTime, setEndTime] = useState('')

  useEffect(() => {
    if (!id) return
    const load = async () => {
      try {
        const res = await testsApi.getById(id)
        if (isApiSuccess(res.data)) {
          setTest(res.data.data)
          const qIds = Array.isArray(res.data.data.questions)
            ? res.data.data.questions
              .map((q) => (typeof q === 'string' ? q : (q as Question).id))
              .filter(Boolean) as string[]
            : []
          if (qIds.length > 0) {
            const qRes = await questionsApi.fetchBulk(qIds)
            if (isApiSuccess(qRes.data)) setQuestions(qRes.data.data)
          }
        }
      } catch {
        toast.error('Failed to load test preview')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const handlePublish = async () => {
    if (!id) return
    setPublishing(true)
    try {
      if (publishMode === 'schedule' && scheduleDate) {
        await testsApi.update(id, {
          status: 'scheduled',
          scheduled_at: `${scheduleDate}T${scheduleTime || '00:00'}`,
        })
      } else {
        await testsApi.publish(id)
      }
      toast.success('Test published successfully!')
      resetFlow()
      navigate('/tests/tracking')
    } catch {
      toast.error('Failed to publish test')
    } finally {
      setPublishing(false)
    }
  }

  const totalSlots = test?.total_questions || questions.length || 50

  const questionSidebar = (
    <aside className="w-56 bg-white border-r border-gray-200 shrink-0 flex flex-col">
      <div className="p-4 border-b border-gray-100">
        <p className="text-sm font-semibold text-gray-800">Question creation</p>
        <p className="text-xs text-gray-500 mt-1">Total Questions · {totalSlots}</p>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        {loading
          ? Array.from({ length: Math.min(totalSlots, 8) }).map((_, i) => (
            <div key={i} className="h-9 rounded-lg bg-gray-100 animate-pulse" />
          ))
          : Array.from({ length: Math.max(questions.length, totalSlots) }, (_, i) => (
            <div
              key={i}
              className="flex items-center justify-between px-3 py-2 rounded-lg bg-green-50 text-green-700 text-sm font-medium"
            >
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-[#0C9D61] flex items-center justify-center">
                  <Check size={12} className="text-white stroke-[3]" />
                </span>
                Question {i + 1}
              </span>
              <ChevronRight size={14} />
            </div>
          )).slice(0, totalSlots)}
      </div>
    </aside>
  )

  if (!loading && !test) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB]">
        <p className="text-gray-500">Test not found</p>
      </div>
    )
  }

  return (
    <>
      <QuestionFlowLayout
        sidebar={loading ? <SkeletonQuestionSidebar /> : questionSidebar}
        footer={
          <div className="flex w-full items-center justify-end gap-3 ml-auto">
            <button
              type="button"
              onClick={() => navigate('/tests/tracking')}
              className="px-6 py-2.5 rounded-lg bg-gray-100 text-primary font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handlePublish}
              disabled={publishing || loading || !test}
              className="px-6 py-2.5 rounded-lg bg-[#7489FF] text-white font-semibold disabled:opacity-60 cursor-pointer"
            >
              {publishing ? 'Publishing...' : 'Confirm'}
            </button>
          </div>
        }
      >
        <p className="text-sm text-gray-500 mb-2">Test creation</p>

        {loading || !test ? (
          <SkeletonCard />
        ) : (
          <TestSummaryCard
            test={test}
            showStatus
            completedQuestions={questions.length || test.total_questions}
            onEdit={() => setEditOpen(true)}
          />
        )}

        <div className={`mt-8 bg-white border border-gray-200 rounded-xl p-6 ${loading ? 'opacity-60 pointer-events-none' : ''}`}>
          <div className="flex gap-3 mb-8">
            <button
              type="button"
              onClick={() => setPublishMode('now')}
              className={`px-5 py-2.5 rounded-lg text-sm font-semibold border-2 transition-colors cursor-pointer ${publishMode === 'now'
                ? 'border-primary bg-primary-light text-primary'
                : 'border-gray-200 text-gray-600'
                }`}
            >
              Publish Now
            </button>
            <button
              type="button"
              onClick={() => setPublishMode('schedule')}
              className={`px-5 py-2.5 rounded-lg text-sm font-semibold border-2 transition-colors cursor-pointer ${publishMode === 'schedule'
                ? 'border-primary bg-primary-light text-primary'
                : 'border-gray-200 text-gray-600'
                }`}
            >
              Schedule Publish
            </button>
          </div>

          {publishMode === 'schedule' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Select Date
                </label>
                <input
                  type="date"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Select Time
                </label>
                <input
                  type="time"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
          )}

          <div>
            <h3 className="text-base font-bold text-gray-900 mb-1">Live Until</h3>
            <p className="text-sm text-gray-500 mb-4">
              Choose how long this test should remain available on the platform.
            </p>
            <div className="grid grid-cols-2 gap-x-20 gap-y-6 mb-6 max-w-7xl">
              {(
                [
                  ['always', 'Always Available'],
                  ['3weeks', '3 Weeks'],
                  ['1week', '1 Week'],
                  ['1month', '1 Month'],
                  ['2weeks', '2 Weeks'],
                  ['custom', 'Custom Duration'],
                ] as [LiveUntil, string][]
              ).map(([value, label]) => (
                <label
                  key={value}
                  className="flex items-center gap-2 cursor-pointer text-sm text-gray-700"
                >
                  <input
                    type="radio"
                    name="liveUntil"
                    value={value}
                    checked={liveUntil === value}
                    onChange={() => setLiveUntil(value)}
                    className="w-4 h-4 text-primary"
                  />
                  {label}
                </label>
              ))}
            </div>

            {liveUntil === 'custom' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Select End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Select End Time
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {questions.length > 0 && (
          <div className="mt-6 bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Questions Preview</h3>
            <div className="space-y-6 max-h-96 overflow-y-auto">
              {questions.map((q, i) => (
                <div key={q.id || i} className="border-b border-gray-100 pb-4 last:border-0">
                  <p className="font-medium text-gray-800 mb-2">
                    Q{i + 1}. {q.question}
                  </p>
                  <ul className="space-y-1 text-sm text-gray-600 ml-4">
                    {[q.option1, q.option2, q.option3, q.option4].map((opt, j) => (
                      <li
                        key={j}
                        className={
                          q.correct_option === `option${j + 1}`
                            ? 'text-green-700 font-medium'
                            : ''
                        }
                      >
                        {String.fromCharCode(65 + j)}. {opt}
                        {q.correct_option === `option${j + 1}` && ' ✓'}
                      </li>
                    ))}
                  </ul>
                  {q.explanation && (
                    <p className="text-xs text-gray-500 mt-2 italic">
                      Solution: {q.explanation}
                    </p>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => navigate(`/tests/${id}/questions`)}
              className="mt-4 text-sm text-primary font-medium hover:underline cursor-pointer"
            >
              Edit questions
            </button>
          </div>
        )}
      </QuestionFlowLayout>
      {test && (
        <EditTestModal
          test={test}
          open={editOpen}
          onClose={() => setEditOpen(false)}
          onSaved={(updated) => setTest(updated)}
        />
      )}
    </>
  )
}
