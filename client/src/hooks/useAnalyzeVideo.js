import { useState } from 'react'
import { analyzeVideo } from '../api'

export function useAnalyzeVideo() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  function clear() {
    setResult(null)
    setError(null)
  }

  async function analyze(file) {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const data = await analyzeVideo(file)
      setResult(data)
      return data
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return { analyze, loading, result, error, clear }
}