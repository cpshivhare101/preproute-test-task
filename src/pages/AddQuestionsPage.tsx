import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, useParams } from 'react-router-dom'
import { Check, ChevronRight, Plus } from 'lucide-react'
import toast from 'react-hot-toast'
import { QuestionFlowLayout } from '../components/layout/QuestionFlowLayout'
import { SkeletonCard, SkeletonQuestionSidebar } from '../components/ui/Skeleton'
import { TestSummaryCard } from '../components/TestSummaryCard'
import {
  DynamicOptionsEditor,
  type OptionKey,
  type OptionRow,
  optionsToQuestionFields,
  questionToOptionRows,
} from '../components/DynamicOptionsEditor'
import { QuestionFormatToolbar } from '../components/QuestionFormatToolbar'
import { questionsApi, subTopicsApi, testsApi } from '../api/services'
import type { Question, Subject, SubTopic, Topic } from '../types'
import { useTestFlowStore } from '../store/testFlowStore'
import { isApiSuccess } from '../api/utils'
import {
  loadQuestionDropdownData,
  resolveSubTopicIdByName,
  resolveTopicIdByName,
  subjectIdToName,
  subTopicIdToName,
  topicIdToName,
} from '../utils/testMetadata'

const questionSchema = z.object({
  question: z.string().min(1, 'Question text is required'),
  correct_option: z.enum(['option1', 'option2', 'option3', 'option4']),
  explanation: z.string().optional(),
  difficulty: z.string().optional(),
  topic: z.string().optional(),
  sub_topic: z.string().optional(),
  media_url: z.string().optional(),
})

type QuestionForm = z.infer<typeof questionSchema>

export function AddQuestionsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { currentTest, questions, setCurrentTest, setQuestions } = useTestFlowStore()

  const [activeIndex, setActiveIndex] = useState(0)
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [topics, setTopics] = useState<Topic[]>([])
  const [subTopics, setSubTopics] = useState<SubTopic[]>([])
  const [allSubTopics, setAllSubTopics] = useState<SubTopic[]>([])
  const [subjectId, setSubjectId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [optionRows, setOptionRows] = useState<OptionRow[]>([
    { key: 'option1', value: '' },
    { key: 'option2', value: '' },
    { key: 'option3', value: '' },
    { key: 'option4', value: '' },
  ])
  const [optionErrors, setOptionErrors] = useState<Partial<Record<OptionKey, string>>>(
    {},
  )

  const totalSlots = currentTest?.total_questions || 8

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<QuestionForm>({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      question: '',
      correct_option: 'option1',
      explanation: '',
      difficulty: '',
      topic: '',
      sub_topic: '',
      media_url: '',
    },
  })

  const questionText = watch('question')
  const correctOption = watch('correct_option')
  const selectedTopic = watch('topic')

  useEffect(() => {
    if (!id) return
    const load = async () => {
      try {
        const res = await testsApi.getById(id)
        if (isApiSuccess(res.data)) {
          const test = res.data.data
          setCurrentTest(test)

          const qIds = Array.isArray(test.questions)
            ? test.questions.map((q) => (typeof q === 'string' ? q : q.id)).filter(Boolean)
            : []

          if (qIds.length > 0) {
            const qRes = await questionsApi.fetchBulk(qIds as string[])
            if (isApiSuccess(qRes.data)) {
              setQuestions(qRes.data.data)
            }
          }

          const meta = await loadQuestionDropdownData(test)
          setSubjectId(meta.subjectId)
          setSubjects(meta.subjects)
          setTopics(meta.topics)
          setAllSubTopics(meta.subTopics)

          const defaultTopicId = resolveTopicIdByName(
            meta.topics,
            typeof test.topics?.[0] === 'string' ? test.topics[0] : undefined,
          )

          if (defaultTopicId) {
            const stRes = await subTopicsApi.getByTopic(defaultTopicId)
            if (isApiSuccess(stRes.data)) {
              setSubTopics(stRes.data.data)
              setAllSubTopics((prev) => {
                const map = new Map(prev.map((s) => [s.id, s]))
                stRes.data.data.forEach((s) => map.set(s.id, s))
                return [...map.values()]
              })
            }
          } else {
            setSubTopics(meta.subTopics)
          }
        }
      } catch {
        toast.error('Failed to load test')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id, setCurrentTest, setQuestions])

  useEffect(() => {
    if (!selectedTopic) {
      return
    }
    subTopicsApi.getByTopic(selectedTopic).then((r) => {
      if (isApiSuccess(r.data)) {
        setSubTopics(r.data.data)
        setAllSubTopics((prev) => {
          const map = new Map(prev.map((s) => [s.id, s]))
          r.data.data.forEach((s) => map.set(s.id, s))
          return [...map.values()]
        })
      }
    })
  }, [selectedTopic])

  useEffect(() => {
    const q = questions[activeIndex]
    if (q) {
      reset({
        question: q.question || '',
        correct_option: q.correct_option || 'option1',
        explanation: q.explanation || '',
        difficulty: q.difficulty || '',
        topic: resolveTopicIdByName(topics, q.topic) || q.topic || '',
        sub_topic: resolveSubTopicIdByName(subTopics, q.sub_topic) || q.sub_topic || '',
        media_url: q.media_url || '',
      })
      setOptionRows(questionToOptionRows(q))
    } else {
      const defaultTopic = topics[0]?.id ?? ''
      reset({
        question: '',
        correct_option: 'option1',
        explanation: '',
        difficulty: currentTest?.difficulty?.toString() || '',
        topic: defaultTopic,
        sub_topic: '',
        media_url: '',
      })
      setOptionRows([
        { key: 'option1', value: '' },
        { key: 'option2', value: '' },
        { key: 'option3', value: '' },
        { key: 'option4', value: '' },
      ])
    }
    setOptionErrors({})
  }, [activeIndex, questions, reset, topics, subTopics, currentTest?.difficulty])

  const { addQuestion, updateQuestion } = useTestFlowStore()

  const validateOptions = (): boolean => {
    const errs: Partial<Record<OptionKey, string>> = {}
    let valid = true
    for (const row of optionRows) {
      if (!row.value.trim()) {
        errs[row.key] = 'Option is required'
        valid = false
      }
    }
    if (optionRows.length < 2) {
      toast.error('At least 2 options are required')
      return false
    }
    if (!optionRows.some((r) => r.key === correctOption && r.value.trim())) {
      toast.error('Correct answer must be one of the filled options')
      return false
    }
    setOptionErrors(errs)
    return valid
  }

  const onSaveQuestion = (data: QuestionForm) => {
    if (!validateOptions()) return

    if (!subjectId) {
      toast.error('Subject not found for this test. Please edit the test and save again.')
      return
    }

    if (!data.topic) {
      toast.error('Please select a Topic')
      return
    }

    const optionFields = optionsToQuestionFields(optionRows)
    const q: Question = {
      ...data,
      ...optionFields,
      type: 'mcq',
      test_id: id,
      subject: subjectId,
      topic: data.topic,
      sub_topic: data.sub_topic || undefined,
    }

    if (questions[activeIndex]) {
      updateQuestion(activeIndex, { ...questions[activeIndex], ...q })
    } else {
      addQuestion(q)
    }
    toast.success(`Question ${activeIndex + 1} saved`)
    if (activeIndex < totalSlots - 1) {
      setActiveIndex(activeIndex + 1)
    }
  }

  const handleSaveAndContinue = async () => {
    if (questions.length < 1) {
      toast.error('Add at least one question')
      return
    }

    if (!subjectId) {
      toast.error('Subject not found for this test')
      return
    }

    setSaving(true)
    try {
      const subjectName =
        subjectIdToName(subjects, subjectId) ||
        (typeof currentTest?.subject === 'string' ? currentTest.subject : '')

      const payload = questions.map((q) => {
        const topicId = q.topic || topics[0]?.id || ''
        const topicName = topicIdToName(topics, topicId)
        const subTopicName = q.sub_topic
          ? subTopicIdToName(allSubTopics, q.sub_topic)
          : undefined

        return {
          type: 'mcq' as const,
          question: q.question,
          option1: q.option1 ?? '',
          option2: q.option2 ?? '',
          option3: q.option3 ?? '',
          option4: q.option4 ?? '',
          correct_option: q.correct_option,
          explanation: q.explanation,
          difficulty: q.difficulty || currentTest?.difficulty || 'easy',
          subject: subjectName,
          topic: topicName,
          ...(subTopicName ? { sub_topic: subTopicName } : {}),
          test_id: id!,
        }
      })

      const missingTopic = payload.some((p) => !p.topic)
      if (missingTopic) {
        toast.error('Each question must have a Topic selected')
        setSaving(false)
        return
      }

      const res = await questionsApi.bulkCreate(payload)
      if (isApiSuccess(res.data)) {
        const createdIds = res.data.data.map((q) => q.id!).filter(Boolean)
        await testsApi.update(id!, {
          questions: createdIds,
          total_questions: createdIds.length,
        })
        toast.success('Questions saved')
        navigate(`/tests/${id}/preview`)
      }
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || 'Failed to save questions'
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  const handleCorrectChange = (key: OptionKey) => {
    setValue('correct_option', key)
  }

  const sidebar = (
      <aside className="w-56 bg-white border-r border-gray-200 shrink-0 flex flex-col">
        <div className="p-4 border-b border-gray-100">
          <p className="text-sm font-semibold text-gray-800">Question creation</p>
          <p className="text-xs text-gray-500 mt-1">Total Questions · {totalSlots}</p>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {Array.from({ length: totalSlots }, (_, i) => {
            const done = i < questions.length
            const active = i === activeIndex
            return (
              <button
                key={i}
                type="button"
                onClick={() => setActiveIndex(i)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer select-none ${
                  active
                    ? 'bg-primary-light text-primary hover:bg-primary/10'
                    : done
                      ? 'text-green-700 bg-green-50 hover:bg-green-100'
                      : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                <span className="flex items-center gap-2">
                  {done && <Check size={14} className="text-green-600" />}
                  Question {i + 1}
                </span>
                <ChevronRight size={14} />
              </button>
            )
          })}
        </div>
      </aside>
  )

  if (loading || !currentTest) {
    return (
      <QuestionFlowLayout sidebar={<SkeletonQuestionSidebar />}>
        <SkeletonCard />
        <div className="mt-6">
          <SkeletonCard />
        </div>
      </QuestionFlowLayout>
    )
  }

  return (
    <QuestionFlowLayout
      sidebar={sidebar}
      headerAction={
        <button
          type="button"
          onClick={() => navigate(`/tests/${id}/preview`)}
          className="px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg cursor-pointer"
        >
          Publish
        </button>
      }
      footer={
        <div className="flex w-full items-center justify-between">
          <button
            type="button"
            onClick={() => navigate('/tests/tracking')}
            className="text-sm font-semibold text-red-500 hover:text-red-600 cursor-pointer"
          >
            Exit Test Creation
          </button>
          <button
            type="button"
            onClick={handleSaveAndContinue}
            disabled={saving}
            className="px-6 py-2.5 bg-primary text-white font-semibold rounded-lg disabled:opacity-60 cursor-pointer"
          >
            {saving ? 'Saving...' : 'Next'}
          </button>
        </div>
      }
    >
          <TestSummaryCard test={currentTest} />

          <div className="mt-6 bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                Question {activeIndex + 1}
              </h3>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg"
                >
                  <Plus size={14} /> MCQ
                </button>
                <button
                  type="button"
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg"
                >
                  CSV
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSaveQuestion)}>
              <div className="mb-4">
                <QuestionFormatToolbar
                  value={questionText}
                  onChange={(v) => setValue('question', v, { shouldValidate: true })}
                />
                {errors.question && (
                  <p className="mt-1 text-sm text-red-500">{errors.question.message}</p>
                )}
              </div>

              <p className="text-sm text-gray-600 mb-3">Type the options below</p>
              <div className="mb-6">
                <DynamicOptionsEditor
                  options={optionRows}
                  correctOption={correctOption}
                  onOptionsChange={(next) => {
                    setOptionRows(next)
                    if (!next.some((o) => o.key === correctOption)) {
                      setValue('correct_option', next[0]?.key ?? 'option1')
                    }
                  }}
                  onCorrectChange={handleCorrectChange}
                  errors={optionErrors}
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Add Solution
                </label>
                <textarea
                  {...register('explanation')}
                  rows={3}
                  placeholder="Type here"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-y"
                />
              </div>

              <div className="border-t border-gray-100 pt-6">
                <p className="text-sm font-semibold text-gray-800 mb-4">
                  Question settings
                </p>
                {topics.length === 0 && (
                  <p className="text-sm text-amber-600 mb-3">
                    Topics could not be loaded. Check that this test has a valid subject.
                  </p>
                )}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Level of Difficulty
                    </label>
                    <select
                      {...register('difficulty')}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="">Select from Drop down</option>
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Difficult</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Topic</label>
                    <select
                      value={selectedTopic}
                      onChange={(e) => {
                        setValue('topic', e.target.value)
                        setValue('sub_topic', '')
                      }}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="">Select from Drop down</option>
                      {topics.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Sub-topic</label>
                    <select
                      {...register('sub_topic')}
                      disabled={!selectedTopic}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm disabled:bg-gray-50"
                    >
                      <option value="">Select from Drop down</option>
                      {subTopics.map((st) => (
                        <option key={st.id} value={st.id}>
                          {st.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-4">
                <button
                  type="submit"
                  className="px-4 py-2 text-sm text-primary font-medium border border-primary rounded-lg hover:bg-primary-light"
                >
                  Save Question
                </button>
              </div>
            </form>
          </div>

          {questions.length > 0 && (
            <div className="mt-4 bg-white border border-gray-200 rounded-xl p-4">
              <p className="text-sm font-semibold text-gray-800 mb-3">
                Added Questions ({questions.length})
              </p>
              <ul className="space-y-2">
                {questions.map((q, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded-lg"
                  >
                    <span className="truncate flex-1">
                      Q{i + 1}: {q.question.slice(0, 60)}
                      {q.question.length > 60 ? '...' : ''}
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveIndex(i)}
                      className="text-primary text-xs font-semibold ml-2 cursor-pointer hover:underline"
                    >
                      Edit
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
    </QuestionFlowLayout>
  )
}
