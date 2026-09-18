const API_URL = import.meta.env.VITE_API_URL ?? '/api'

export class ApiError extends Error {
  constructor(status, message) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export async function http({ path, method = 'GET', body }) {
  const response = await fetch(`${API_URL}${path}`, { method, body })
  const data = await response.json().catch(() => null)
  if (!response.ok) {
    const detail =
      typeof data?.detail === 'string' ? data.detail : `Error ${response.status}`
    throw new ApiError(response.status, detail)
  }
  return data
}