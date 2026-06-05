import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { DashboardLayout } from '../components/layout/DashboardLayout'
import { SkeletonTable } from '../components/ui/Skeleton'
import { testsApi } from '../api/services'
import { extractTestsList } from '../api/utils'
import type { Test } from '../types'
import { useTestFlowStore } from '../store/testFlowStore'

export function TestTrackingPage() {
  const navigate = useNavigate()
  const resetFlow = useTestFlowStore((s) => s.reset)
  const [tests, setTests] = useState<Test[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchTests = async () => {
    setLoading(true)
    try {
      const res = await testsApi.getAll()
      setTests(extractTestsList(res.data))
    } catch {
      toast.error('Failed to load tests')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTests()
  }, [])

  const filteredTests = useMemo(() => {
    if (!search.trim()) return tests
    const q = search.toLowerCase()
    return tests.filter(
      (t) =>
        t.name?.toLowerCase().includes(q) ||
        (typeof t.subject === 'string'
          ? t.subject.toLowerCase().includes(q)
          : false) ||
        t.status?.toLowerCase().includes(q),
    )
  }, [tests, search])

  const formatDate = (date?: string) => {
    if (!date) return '—'
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  const getSubjectName = (test: Test) => {
    if (typeof test.subject === 'string') return test.subject
    return (test.subject as { name?: string })?.name || '—'
  }

  return (
    <DashboardLayout breadcrumbs={['Test Tracking']}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Test Tracking</h1>
          <p className="text-sm text-gray-500 mt-1">
            View, edit, and manage all your tests
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            resetFlow()
            navigate('/tests/create')
          }}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#7489FF] text-white font-semibold rounded-lg hover:bg-primary-dark transition-colors cursor-pointer"
        >
          <Plus size={18} />
          Create New Test
        </button>
      </div>

      <div className="mb-4 relative max-w-md">
        <Search
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
        />
        <input
          type="text"
          placeholder="Search by name, subject, or status..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
        />
      </div>

      {loading ? (
        <SkeletonTable rows={6} />
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          {filteredTests.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-500 mb-4">No tests found</p>
              <button
                type="button"
                onClick={() => {
                  resetFlow()
                  navigate('/tests/create')
                }}
                className="text-primary font-medium hover:underline cursor-pointer"
              >
                Create your first test
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-left">
                    <th className="px-6 py-4 font-semibold text-gray-600">Name</th>
                    <th className="px-6 py-4 font-semibold text-gray-600">Subject</th>
                    <th className="px-6 py-4 font-semibold text-gray-600">Status</th>
                    <th className="px-6 py-4 font-semibold text-gray-600">Created</th>
                    <th className="px-6 py-4 font-semibold text-gray-600 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTests.map((test) => (
                    <tr
                      key={test.id}
                      className="border-b border-gray-100 hover:bg-gray-50/50"
                    >
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {test.name}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {getSubjectName(test)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium capitalize ${
                            test.status === 'live'
                              ? 'bg-green-50 text-green-700 border border-green-200'
                              : 'bg-gray-100 text-gray-600 border border-gray-200'
                          }`}
                        >
                          {test.status || 'draft'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {formatDate(test.created_at)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => navigate(`/tests/${test.id}/preview`)}
                            className="p-2 text-gray-500 hover:text-primary hover:bg-primary-light rounded-lg cursor-pointer"
                            title="View"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => navigate(`/tests/${test.id}/edit`)}
                            className="p-2 text-gray-500 hover:text-primary hover:bg-primary-light rounded-lg cursor-pointer"
                            title="Edit"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              if (!confirm('Delete this test?')) return
                              setDeletingId(test.id)
                              try {
                                await testsApi.delete(test.id)
                                toast.success('Test deleted')
                                setTests((prev) =>
                                  prev.filter((t) => t.id !== test.id),
                                )
                              } catch {
                                toast.error('Failed to delete test')
                              } finally {
                                setDeletingId(null)
                              }
                            }}
                            disabled={deletingId === test.id}
                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50 cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  )
}
