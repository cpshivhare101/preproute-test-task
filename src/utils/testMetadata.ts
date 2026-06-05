import { subjectsApi, subTopicsApi, topicsApi } from '../api/services'
import { isApiSuccess } from '../api/utils'
import type { Subject, SubTopic, Test, Topic } from '../types'

export interface QuestionDropdownData {
  subjectId: string | null
  subjects: Subject[]
  topics: Topic[]
  subTopics: SubTopic[]
}

/** Resolve subject UUID and load topics — API returns subject/topics as names, not IDs */
export async function loadQuestionDropdownData(
  test: Test,
): Promise<QuestionDropdownData> {
  let subjectId: string | null = test.subject_id ?? null

  const subjectsRes = await subjectsApi.getAll()
  const subjects: Subject[] = isApiSuccess(subjectsRes.data)
    ? subjectsRes.data.data
    : []

  if (!subjectId) {
    if (typeof test.subject === 'string') {
      subjectId = subjects.find((s) => s.name === test.subject)?.id ?? null
    } else if (test.subject && typeof test.subject === 'object' && 'id' in test.subject) {
      subjectId = (test.subject as Subject).id
    }
  }

  let topics: Topic[] = []
  if (subjectId) {
    const topicsRes = await topicsApi.getBySubject(subjectId)
    if (isApiSuccess(topicsRes.data)) {
      topics = topicsRes.data.data
    }
  }

  const testTopicNames = Array.isArray(test.topics)
    ? test.topics.map((t) => (typeof t === 'string' ? t : t.name))
    : []

  const matchedTopicIds = topics
    .filter((t) => testTopicNames.includes(t.name))
    .map((t) => t.id)

  let subTopics: SubTopic[] = []
  if (matchedTopicIds.length > 0) {
    const stRes = await subTopicsApi.getByMultipleTopics(matchedTopicIds)
    if (isApiSuccess(stRes.data)) {
      subTopics = stRes.data.data
    }
  }

  return { subjectId, subjects, topics, subTopics }
}

export function resolveTopicIdByName(topics: Topic[], name?: string): string {
  if (!name) return ''
  const byId = topics.find((t) => t.id === name)
  if (byId) return byId.id
  return topics.find((t) => t.name === name)?.id ?? name
}

export function resolveSubTopicIdByName(
  subTopics: SubTopic[],
  name?: string,
): string {
  if (!name) return ''
  const byId = subTopics.find((t) => t.id === name)
  if (byId) return byId.id
  return subTopics.find((t) => t.name === name)?.id ?? name
}

/** Bulk questions API expects topic/sub_topic as names, not UUIDs */
export function topicIdToName(topics: Topic[], idOrName?: string): string {
  if (!idOrName) return ''
  const byId = topics.find((t) => t.id === idOrName)
  return byId?.name ?? idOrName
}

export function subTopicIdToName(
  subTopics: SubTopic[],
  idOrName?: string,
): string {
  if (!idOrName) return ''
  const byId = subTopics.find((t) => t.id === idOrName)
  return byId?.name ?? idOrName
}

export function subjectIdToName(
  subjects: Subject[],
  idOrName?: string,
): string {
  if (!idOrName) return ''
  const byId = subjects.find((s) => s.id === idOrName)
  return byId?.name ?? idOrName
}

export function normalizeDifficulty(
  value?: string,
): 'easy' | 'medium' | 'hard' {
  if (value === 'medium') return 'medium'
  if (value === 'hard' || value === 'difficult') return 'hard'
  return 'easy'
}

export interface TestFormDefaults {
  subjects: Subject[]
  subjectId: string
  topics: Topic[]
  subTopics: SubTopic[]
  topicIds: string[]
  subTopicIds: string[]
}

/** Resolve IDs from test API response (names) for edit form pre-fill */
export async function loadTestFormDefaults(test: Test): Promise<TestFormDefaults> {
  const meta = await loadQuestionDropdownData(test)

  const topicIds = (Array.isArray(test.topics) ? test.topics : [])
    .map((t) => {
      const name = typeof t === 'string' ? t : (t as Topic).name
      return resolveTopicIdByName(meta.topics, name)
    })
    .filter(Boolean)

  let subTopics = meta.subTopics
  if (topicIds.length > 0) {
    const stRes = await subTopicsApi.getByMultipleTopics(topicIds)
    if (isApiSuccess(stRes.data)) {
      subTopics = stRes.data.data
    }
  }

  const subTopicIds = (Array.isArray(test.sub_topics) ? test.sub_topics : [])
    .map((t) => {
      const name = typeof t === 'string' ? t : (t as SubTopic).name
      return resolveSubTopicIdByName(subTopics, name)
    })
    .filter(Boolean)

  return {
    subjects: meta.subjects,
    subjectId: meta.subjectId || '',
    topics: meta.topics,
    subTopics,
    topicIds,
    subTopicIds,
  }
}
