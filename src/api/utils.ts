import type { ApiResponse, Test } from '../types'

export function isApiSuccess<T>(
  response: ApiResponse<T> | undefined | null,
): response is ApiResponse<T> & { status: 'success'; data: T } {
  return response?.status === 'success'
}

export function getApiData<T>(response: ApiResponse<T> | undefined | null): T | null {
  if (isApiSuccess(response)) {
    return response.data ?? null
  }
  return null
}

/** Parse tests list from axios response body (handles API shape variations) */
export function extractTestsList(responseBody: unknown): Test[] {
  if (!responseBody || typeof responseBody !== 'object') return []
  const body = responseBody as Record<string, unknown>
  if (body.status === 'success' && Array.isArray(body.data)) {
    return body.data as Test[]
  }
  if (Array.isArray(body.data)) return body.data as Test[]
  if (Array.isArray(body.tests)) return body.tests as Test[]
  return []
}
