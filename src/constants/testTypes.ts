import type { TestType } from '../types'

export const TEST_TYPE_OPTIONS: { value: TestType; label: string }[] = [
  { value: 'chapterwise', label: 'Chapter Wise' },
  { value: 'pyq', label: 'PYQ' },
  { value: 'mock', label: 'Mock Test' },
]

export const TEST_TYPE_LABELS: Record<string, string> = {
  chapterwise: 'Chapter Wise',
  chapter_wise: 'Chapter Wise',
  pyq: 'PYQ',
  mock: 'Mock Test',
  mock_test: 'Mock Test',
  practice: 'Chapter Wise',
}

export function normalizeTestType(type?: string): TestType {
  const map: Record<string, TestType> = {
    chapterwise: 'chapterwise',
    chapter_wise: 'chapterwise',
    practice: 'chapterwise',
    pyq: 'pyq',
    mock: 'mock',
    mock_test: 'mock',
  }
  return map[type ?? ''] ?? 'chapterwise'
}
