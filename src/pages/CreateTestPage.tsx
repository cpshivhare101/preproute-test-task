import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { DashboardLayout } from '../components/layout/DashboardLayout'
import { SkeletonCard } from '../components/ui/Skeleton'
import {
  subjectsApi,
  subTopicsApi,
  testsApi,
  topicsApi,
} from '../api/services'
import { ChevronDown } from 'lucide-react'
import { TEST_TYPE_OPTIONS, normalizeTestType } from '../constants/testTypes'
import { loadTestFormDefaults, normalizeDifficulty } from '../utils/testMetadata'
import type { CreateTestPayload, Subject, SubTopic, Topic } from '../types'
import { useTestFlowStore } from '../store/testFlowStore'
import { isApiSuccess } from '../api/utils'

const testSchema = z.object({
  name: z.string().min(1, 'Test name is required'),
  subjectId: z.string().min(1, 'Subject is required'),
  topicIds: z.array(z.string()).min(1, 'Select at least one topic'),
  subTopicIds: z.array(z.string()).optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  total_time: z.number().min(1, 'Duration is required'),
  total_questions: z.number().min(1, 'Number of questions is required'),
  total_marks: z.number().min(1, 'Total marks is required'),
  correct_marks: z.number(),
  wrong_marks: z.number(),
  unattempt_marks: z.number(),
})

type TestFormData = z.infer<typeof testSchema>

export function CreateTestPage() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const { testType, setTestType, setCurrentTest } = useTestFlowStore()

  const [subjects, setSubjects] = useState<Subject[]>([])
  const [topics, setTopics] = useState<Topic[]>([])
  const [subTopicsList, setSubTopicsList] = useState<SubTopic[]>([])
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(isEdit)
  const fieldClass =
    "w-full h-12 px-4 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/30"
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<TestFormData>({
    resolver: zodResolver(testSchema),
    defaultValues: {
      name: '',
      subjectId: '',
      topicIds: [],
      subTopicIds: [],
      difficulty: 'easy',
      total_time: 60,
      total_questions: undefined,
      total_marks: undefined,
      correct_marks: 5,
      wrong_marks: -1,
      unattempt_marks: 0,
    },
  })

  const subjectId = watch('subjectId')
  const topicIds = watch('topicIds')
  const subTopicIds = watch('subTopicIds')

  useEffect(() => {
    subjectsApi.getAll().then((r) => {
      if (isApiSuccess(r.data)) setSubjects(r.data.data)
    })
  }, [])

  useEffect(() => {
    if (!subjectId) {
      setTopics([])
      setValue('topicIds', [])
      setValue('subTopicIds', [])
      return
    }
    topicsApi.getBySubject(subjectId).then((r) => {
      if (isApiSuccess(r.data)) setTopics(r.data.data)
    })
  }, [subjectId, setValue])

  useEffect(() => {
    if (!topicIds?.length) {
      setSubTopicsList([])
      setValue('subTopicIds', [])
      return
    }
    subTopicsApi.getByMultipleTopics(topicIds).then((r) => {
      if (isApiSuccess(r.data)) setSubTopicsList(r.data.data)
    })
  }, [topicIds, setValue])

  useEffect(() => {
    if (!isEdit || !id) return
    testsApi
      .getById(id)
      .then((r) => {
        if (isApiSuccess(r.data)) {
          const test = r.data.data
          setCurrentTest(test)
          setTestType(normalizeTestType(test.type))
          loadTestFormDefaults(test).then((defaults) => {
            setSubjects(defaults.subjects)
            setTopics(defaults.topics)
            setSubTopicsList(defaults.subTopics)
            reset({
            name: test.name,
            subjectId: defaults.subjectId,
            topicIds: defaults.topicIds,
            subTopicIds: defaults.subTopicIds,
            difficulty: normalizeDifficulty(test.difficulty),
            total_time: test.total_time ?? 60,
            total_questions: test.total_questions ?? 50,
            total_marks: test.total_marks ?? 250,
            correct_marks: test.correct_marks ?? 5,
            wrong_marks: test.wrong_marks ?? -1,
            unattempt_marks: test.unattempt_marks ?? 0,
          })
          })
        }
      })
      .catch(() => toast.error('Failed to load test'))
      .finally(() => setInitialLoading(false))
  }, [id, isEdit, reset, setCurrentTest, setTestType])

  const saveTest = async (data: TestFormData, asDraft: boolean) => {
    setLoading(true)
    const payload: CreateTestPayload = {
      name: data.name,
      type: testType,
      subject: data.subjectId,
      topics: data.topicIds,
      sub_topics: data.subTopicIds || [],
      correct_marks: data.correct_marks,
      wrong_marks: data.wrong_marks,
      unattempt_marks: data.unattempt_marks,
      difficulty: data.difficulty,
      total_time: data.total_time,
      total_marks: data.total_marks,
      total_questions: data.total_questions,
      // API rejects null; valid values: live | unpublished | scheduled | expired | draft
      ...(!isEdit || asDraft ? { status: 'draft' as const } : {}),
    }

    try {
      if (isEdit && id) {
        const res = await testsApi.update(id, payload)
        if (isApiSuccess(res.data)) {
          setCurrentTest(res.data.data)
          toast.success(asDraft ? 'Saved as draft' : 'Test updated')
          if (!asDraft) navigate(`/tests/${id}/questions`)
        }
      } else {
        const res = await testsApi.create(payload)
        if (isApiSuccess(res.data)) {
          setCurrentTest(res.data.data)
          toast.success(asDraft ? 'Saved as draft' : 'Test created')
          if (!asDraft) navigate(`/tests/${res.data.data.id}/questions`)
          else navigate('/dashboard')
        }
      }
    } catch {
      toast.error('Failed to save test')
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = (data: TestFormData) => saveTest(data, false)
  const onSaveDraft = () => {
    handleSubmit((data) => saveTest(data, true))()
  }

  const breadcrumbs = [
    'Test Creation',
    isEdit ? 'Edit Test' : 'Create Test',
    TEST_TYPE_OPTIONS.find((t) => t.value === testType)?.label || 'Chapter Wise',
  ]

  if (initialLoading) {
    return (
      <DashboardLayout breadcrumbs={breadcrumbs}>
        <SkeletonCard />
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout breadcrumbs={breadcrumbs}>
      <div className="bg-white border border-gray-200 rounded-xl p-6 md:p-8">
        <div className="flex flex-wrap gap-2 mb-8">
          {TEST_TYPE_OPTIONS.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setTestType(t.value)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${testType === t.value
                ? 'bg-[#7489FF] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Subject
              </label>
              <div className="relative">
                <select
                  {...register('subjectId')}
                  className={`${fieldClass} appearance-none pr-10 cursor-pointer`}
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
              {errors.subjectId && (
                <p className="mt-1 text-sm text-red-500">{errors.subjectId.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Name of Test
              </label>
              <input
                {...register('name')}
                placeholder="Enter name of Test"
                className={fieldClass}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Topic
              </label>

              <div className="relative">
                <select
                  value={topicIds[0] || ''}
                  disabled={!subjectId}
                  onChange={(e) => {
                    const id = e.target.value
                    setValue('topicIds', id ? [id] : [], { shouldValidate: true })
                    setValue('subTopicIds', [])
                  }}
                  className={`${fieldClass} appearance-none pr-10 cursor-pointer disabled:bg-gray-50 disabled:cursor-not-allowed`}
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

              {errors.topicIds && (
                <p className="mt-1 text-sm text-red-500">{errors.topicIds.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Sub Topic
              </label>

              <div className="relative">
                <select
                  value={subTopicIds?.[0] || ''}
                  disabled={!topicIds?.length}
                  onChange={(e) => {
                    const id = e.target.value
                    setValue('subTopicIds', id ? [id] : [])
                  }}
                  className={`${fieldClass} appearance-none pr-10 cursor-pointer disabled:bg-gray-50 disabled:cursor-not-allowed`}
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
                {...register('total_time', { valueAsNumber: true })}
                placeholder="Enter the time"
                className={fieldClass}
              />
              {errors.total_time && (
                <p className="mt-1 text-sm text-red-500">{errors.total_time.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Test Difficulty Level
              </label>
              <div className="flex items-center justify-between h-12 rounded-lg px-4">
                {(
                  [
                    { value: 'easy', label: 'Easy' },
                    { value: 'medium', label: 'Medium' },
                    { value: 'hard', label: 'Difficult' },
                  ] as const
                ).map((level) => (
                  <label key={level.value} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value={level.value}
                      {...register('difficulty')}
                      className="w-4 h-4 text-primary border-gray-300 focus:ring-primary"
                    />
                    <span className="text-sm text-gray-700">{level.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8">
            <p className="text-sm font-semibold text-gray-800 mb-4">Marking Scheme:</p>
            <div className="grid grid-cols-5 gap-6">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Wrong Answer</label>
                <input
                  type="number"
                  {...register('wrong_marks', { valueAsNumber: true })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Unattempted</label>
                <input
                  type="number"
                  {...register('unattempt_marks', { valueAsNumber: true })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Correct Answer</label>
                <input
                  type="number"
                  {...register('correct_marks', { valueAsNumber: true })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  No of Questions
                </label>
                <input
                  type="number"
                  {...register('total_questions', { valueAsNumber: true })}
                  placeholder="Ex: 50"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
                {errors.total_questions && (
                  <p className="mt-1 text-sm text-red-500">
                    {errors.total_questions.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Total Marks
                </label>
                <input
                  type="number"
                  {...register('total_marks', { valueAsNumber: true })}
                  placeholder="Ex: 250 Marks"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
                {errors.total_marks && (
                  <p className="mt-1 text-sm text-red-500">{errors.total_marks.message}</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-10 pt-6 border-t border-gray-100">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="w-[120px] h-12 rounded-lg bg-gray-100 text-primary font-medium"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onSaveDraft}
              disabled={loading}
              className="px-6 py-2.5 rounded-lg border border-primary text-primary font-semibold hover:bg-primary-light disabled:opacity-60"
            >
              Save as Draft
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-[120px] h-12 rounded-lg bg-[#7489FF] text-white font-medium"
            >
              {loading ? 'Saving...' : 'Next'}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}
