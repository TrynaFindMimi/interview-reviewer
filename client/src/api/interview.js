import { http } from './http'

export function getHealth() {
  return http({ path: '/health' })
}

export function analyzeVideo(file) {
  const body = new FormData()
  body.append('video', file)
  return http({ path: '/analyze', method: 'POST', body })
}