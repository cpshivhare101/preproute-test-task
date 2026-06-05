import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ClipboardList, FileText, Pencil, Plus, Radio } from 'lucide-react'
import toast from 'react-hot-toast'
import { DashboardLayout } from '../components/layout/DashboardLayout'
import { SkeletonStats, SkeletonTable } from '../components/ui/Skeleton'
import { testsApi } from '../api/services'
import { extractTestsList } from '../api/utils'
import type { Test } from '../types'
import { useTestFlowStore } from '../store/testFlowStore'

export function DashboardOverviewPage() {
  const navigate = useNavigate()
  const resetFlow = useTestFlowStore((s) => s.reset)
  const [tests, setTests] = useState<Test[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    setLoading(true)
    setLoadError(false)
    testsApi
      .getAll()
      .then((res) => {
        const list = extractTestsList(res.data)
        setTests(list)
        if (list.length === 0 && res.data?.status !== 'success') {
          setLoadError(true)
        }
      })
      .catch(() => {
        setLoadError(true)
        toast.error('Failed to load overview')
      })
      .finally(() => setLoading(false))
  }, [])

  const stats = useMemo(() => {
    const total = tests.length
    const live = tests.filter((t) => t.status === 'live').length
    const draft = tests.filter((t) => t.status === 'draft').length
    const scheduled = tests.filter((t) => t.status === 'scheduled').length
    const totalQuestions = tests.reduce(
      (sum, t) => sum + (t.total_questions || 0),
      0,
    )
    return { total, live, draft, scheduled, totalQuestions }
  }, [tests])

  const recentTests = useMemo(
    () =>
      [...tests]
        .sort(
          (a, b) =>
            new Date(b.created_at || 0).getTime() -
            new Date(a.created_at || 0).getTime(),
        )
        .slice(0, 5),
    [tests],
  )

  const getSubjectName = (test: Test) => {
    if (typeof test.subject === 'string') return test.subject
    return (test.subject as { name?: string })?.name || '—'
  }

  return (
    <DashboardLayout breadcrumbs={['Dashboard']}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            Overview of your test management activity
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            resetFlow()
            navigate('/tests/create')
          }}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark transition-colors cursor-pointer"
        >
          <Plus size={18} />
          Create New Test
        </button>
      </div>

      {loading ? (
        <>
          <SkeletonStats />
          <div className="mt-8">
            <SkeletonTable rows={4} />
          </div>
        </>
      ) : loadError && tests.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-10 text-center">
          <p className="text-gray-600 mb-4">Could not load dashboard data. Please refresh or log in again.</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium cursor-pointer"
          >
            Refresh
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { label: 'Total Tests', value: stats.total, icon: FileText, color: 'text-primary bg-primary-light' },
              { label: 'Live Tests', value: stats.live, icon: Radio, color: 'text-green-700 bg-green-50' },
              { label: 'Draft Tests', value: stats.draft, icon: Pencil, color: 'text-amber-700 bg-amber-50' },
              { label: 'Scheduled', value: stats.scheduled, icon: ClipboardList, color: 'text-blue-700 bg-blue-50' },
              { label: 'Total Questions', value: stats.totalQuestions, icon: FileText, color: 'text-purple-700 bg-purple-50' },
            ].map((item) => (
              <div
                key={item.label}
                className="bg-white border border-gray-200 rounded-xl p-5 flex items-start gap-4"
              >
                <div className={`p-2.5 rounded-lg ${item.color}`}>
                  <item.icon size={20} />
                </div>
                <div>
                  <p className="text-sm text-gray-500">{item.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{item.value}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Recent Tests</h2>
              <button
                type="button"
                onClick={() => navigate('/tests/tracking')}
                className="text-sm text-primary font-medium hover:underline cursor-pointer"
              >
                View all
              </button>
            </div>
            {recentTests.length === 0 ? (
              <p className="p-8 text-center text-gray-500 text-sm">No tests yet</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {recentTests.map((test) => (
                  <li key={test.id}>
                    <button
                      type="button"
                      onClick={() => navigate(`/tests/${test.id}/preview`)}
                      className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 text-left cursor-pointer"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{test.name}</p>
                        <p className="text-sm text-gray-500">{getSubjectName(test)}</p>
                      </div>
                      <span className="text-xs font-medium capitalize px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
                        {test.status || 'draft'}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => navigate('/tests/tracking')}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer"
            >
              Go to Test Tracking
            </button>
            <button
              type="button"
              onClick={() => {
                resetFlow()
                navigate('/tests/create')
              }}
              className="px-4 py-2 bg-primary-light text-primary rounded-lg text-sm font-medium hover:bg-primary/10 cursor-pointer"
            >
              Create Test
            </button>
          </div>
        </>
      )}
    </DashboardLayout>
  )
}
