import { useEffect, useState } from 'react'
import { X, ChevronDown } from 'lucide-react'
import { TEST_TYPE_OPTIONS, normalizeTestType } from '../constants/testTypes'
import type { Subject, SubTopic, Test, Topic } from '../types'
import { subTopicsApi, testsApi, topicsApi } from '../api/services'
import toast from 'react-hot-toast'
import { isApiSuccess } from '../api/utils'
import {
  loadTestFormDefaults,
  normalizeDifficulty,
} from '../utils/testMetadata'
import { Skeleton } from './ui/Skeleton'

interface EditTestModalProps {
  test: Test
  open: boolean
  onClose: () => void
  onSaved: (test: Test) => void
}

const fieldClass =
  'w-full h-12 px-4 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/30 appearance-none'

export function EditTestModal({ test, open, onClose, onSaved }: EditTestModalProps) {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [topics, setTopics] = useState<Topic[]>([])
  const [subTopicsList, setSubTopicsList] = useState<SubTopic[]>([])
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  const [form, setForm] = useState({
    name: '',
    type: normalizeTestType(test.type),
    subjectId: '',
    topicId: '',
    subTopicId: '',
    difficulty: 'easy' as 'easy' | 'medium' | 'hard',
    total_time: 60,
    total_marks: 0,
    total_questions: 0,
    correct_marks: 5,
    wrong_marks: -1,
    unattempt_marks: 0,
  })

  useEffect(() => {
    if (!open) return

    setLoading(true)
    loadTestFormDefaults(test)
      .then((defaults) => {
        setSubjects(defaults.subjects)
        setTopics(defaults.topics)
        setSubTopicsList(defaults.subTopics)
        setForm({
          name: test.name || '',
          type: normalizeTestType(test.type),
          subjectId: defaults.subjectId,
          topicId: defaults.topicIds[0] || '',
          subTopicId: defaults.subTopicIds[0] || '',
          difficulty: normalizeDifficulty(test.difficulty),
          total_time: test.total_time ?? 60,
          total_marks: test.total_marks ?? 0,
          total_questions: test.total_questions ?? 0,
          correct_marks: test.correct_marks ?? 5,
          wrong_marks: test.wrong_marks ?? -1,
          unattempt_marks: test.unattempt_marks ?? 0,
        })
      })
      .catch(() => toast.error('Failed to load test details'))
      .finally(() => setLoading(false))
  }, [open, test])

  useEffect(() => {
    if (!open || !form.subjectId) return
    topicsApi.getBySubject(form.subjectId).then((r) => {
      if (isApiSuccess(r.data)) setTopics(r.data.data)
    })
  }, [form.subjectId, open])

  useEffect(() => {
    if (!open || !form.topicId) {
      if (!form.topicId) setSubTopicsList([])
      return
    }
    subTopicsApi.getByTopic(form.topicId).then((r) => {
      if (isApiSuccess(r.data)) setSubTopicsList(r.data.data)
    })
  }, [form.topicId, open])

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error('Test name is required')
      return
    }
    if (!form.subjectId) {
      toast.error('Please select a subject')
      return
    }
    if (!form.topicId) {
      toast.error('Please select a topic')
      return
    }

    setSaving(true)
    try {
      const res = await testsApi.update(test.id, {
        name: form.name,
        type: form.type,
        subject: form.subjectId,
        topics: [form.topicId],
        sub_topics: form.subTopicId ? [form.subTopicId] : [],
        difficulty: form.difficulty,
        total_time: form.total_time,
        total_marks: form.total_marks,
        total_questions: form.total_questions,
        correct_marks: form.correct_marks,
        wrong_marks: form.wrong_marks,
        unattempt_marks: form.unattempt_marks,
      })
      if (isApiSuccess(res.data)) {
        const updatedTest = {
          ...res.data.data,

          subject:
            subjects.find((s) => s.id === form.subjectId) ??
            res.data.data.subject,

          topics: topics.filter((t) => t.id === form.topicId),

          sub_topics: subTopicsList.filter(
            (st) => st.id === form.subTopicId
          ),
        }

        console.log('updatedTest', updatedTest)

        onSaved(updatedTest)
        toast.success('Test updated')
        onClose()
      }
      console.log('update response', res.data.data)
    } catch {
      toast.error('Failed to update test')
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 cursor-default"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="bg-white rounded-2xl w-full max-w-4xl max-h-[92vh] overflow-y-auto shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal
        aria-labelledby="edit-test-title"
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h2 id="edit-test-title" className="text-xl font-bold text-gray-900">
            Edit Test creation
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg cursor-pointer"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 md:p-8">
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-12" />
                <Skeleton className="h-12" />
                <Skeleton className="h-12" />
                <Skeleton className="h-12" />
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap gap-2 mb-8">
                {TEST_TYPE_OPTIONS.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, type: t.value }))}
                    className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${form.type === t.value
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Subject
                  </label>
                  <div className="relative">
                    <select
                      value={form.subjectId}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          subjectId: e.target.value,
                          topicId: '',
                          subTopicId: '',
                        }))
                      }
                      className={`${fieldClass} pr-10 cursor-pointer`}
                    >
                      <option value="">Choose from Drop-down</option>
                      {subjects.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={18}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Name of Test
                  </label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Enter name of Test"
                    className={fieldClass.replace('appearance-none', '')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Topic
                  </label>
                  <div className="relative">
                    <select
                      value={form.topicId}
                      disabled={!form.subjectId || topics.length === 0}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          topicId: e.target.value,
                          subTopicId: '',
                        }))
                      }
                      className={`${fieldClass} pr-10 cursor-pointer disabled:bg-gray-50 disabled:cursor-not-allowed`}
                    >
                      <option value="">Choose from Drop-down</option>
                      {topics.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={18}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Sub Topic
                  </label>
                  <div className="relative">
                    <select
                      value={form.subTopicId}
                      disabled={!form.topicId}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, subTopicId: e.target.value }))
                      }
                      className={`${fieldClass} pr-10 cursor-pointer disabled:bg-gray-50 disabled:cursor-not-allowed`}
                    >
                      <option value="">Choose from Drop-down</option>
                      {subTopicsList.map((st) => (
                        <option key={st.id} value={st.id}>
                          {st.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={18}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    value={form.total_time}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        total_time: Number(e.target.value) || 0,
                      }))
                    }
                    placeholder="Enter the time"
                    className={fieldClass.replace('appearance-none', '')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Test Difficulty Level
                  </label>
                  <div className="flex items-center justify-between h-12 rounded-lg px-2 gap-2">
                    {(
                      [
                        { value: 'easy' as const, label: 'Easy' },
                        { value: 'medium' as const, label: 'Medium' },
                        { value: 'hard' as const, label: 'Difficult' },
                      ] as const
                    ).map((level) => (
                      <label
                        key={level.value}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <input
                          type="radio"
                          name="edit-difficulty"
                          checked={form.difficulty === level.value}
                          onChange={() =>
                            setForm((f) => ({ ...f, difficulty: level.value }))
                          }
                          className="w-4 h-4 text-primary"
                        />
                        <span className="text-sm text-gray-700">{level.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <p className="text-sm font-semibold text-gray-800 mb-4">Marking Scheme:</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                  {(
                    [
                      ['wrong_marks', 'Wrong Answer'],
                      ['unattempt_marks', 'Unattempted'],
                      ['correct_marks', 'Correct Answer'],
                      ['total_questions', 'No of Questions'],
                      ['total_marks', 'Total Marks'],
                    ] as const
                  ).map(([key, label]) => (
                    <div key={key}>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">
                        {label}
                      </label>
                      <input
                        type="number"
                        value={form[key]}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            [key]: Number(e.target.value) || 0,
                          }))
                        }
                        className="w-full h-12 px-3 border border-gray-300 rounded-lg"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-10 pt-6 border-t border-gray-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-[120px] h-12 rounded-lg bg-gray-100 text-primary font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="w-[120px] h-12 rounded-lg bg-primary text-white font-medium disabled:opacity-60 cursor-pointer"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
