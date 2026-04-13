import { useState } from 'react'
import axios from 'axios'

export default function App() {
  const [file, setFile] = useState(null)
  const [level, setLevel] = useState('fresher')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleAnalyze = async () => {
    if (!file) return
    setLoading(true)
    setError(null)
    setResult(null)

    const formData = new FormData()
    formData.append('resume', file)
    formData.append('level', level)

    try {
      const res = await axios.post('http://localhost:3001/upload-and-analyze', formData)
      setResult(res.data)
    } catch (err) {
      setError('Analysis failed. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-xl bg-white rounded-xl shadow-sm border border-gray-200 p-8">

        {/* Header */}
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">HireMinds</h1>
        <p className="text-gray-500 text-sm mb-8">
          Resume analysis built for freshers — not senior engineers.
        </p>

        {/* Level selector */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            I am a
          </label>
          <div className="flex gap-3">
            {['fresher', 'intermediate', 'experienced'].map(l => (
              <button
                key={l}
                onClick={() => setLevel(l)}
                className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all
                  ${level === l
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* File upload */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload your resume (PDF)
          </label>
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 transition-colors"
            onClick={() => document.getElementById('file-input').click()}
          >
            {file ? (
              <p className="text-sm text-blue-600 font-medium">{file.name}</p>
            ) : (
              <p className="text-sm text-gray-400">Click to upload PDF</p>
            )}
            <input
              id="file-input"
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={e => setFile(e.target.files[0])}
            />
          </div>
        </div>

        {/* Analyze button */}
        <button
          onClick={handleAnalyze}
          disabled={!file || loading}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium
            hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {loading ? 'Analyzing...' : 'Analyze Resume'}
        </button>

        {error && (
          <p className="mt-4 text-red-500 text-sm text-center">{error}</p>
        )}
      </div>

      {/* Results */}
      {result && (
        <div className="w-full max-w-xl mt-6 space-y-4">

          {/* Overall score */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <p className="text-sm text-gray-500 mb-1">Overall ATS Score</p>
            <div className="flex items-end gap-2">
              <span className={`text-5xl font-bold
                ${result.overall_score >= 80 ? 'text-green-600' :
                  result.overall_score >= 50 ? 'text-amber-500' : 'text-red-500'}`}>
                {result.overall_score}
              </span>
              <span className="text-gray-400 text-lg mb-1">/100</span>
            </div>
            <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700
                  ${result.overall_score >= 80 ? 'bg-green-500' :
                    result.overall_score >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                style={{ width: `${result.overall_score}%` }}
              />
            </div>
          </div>

          {/* Breakdown */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <p className="text-sm font-medium text-gray-700 mb-4">Section Breakdown</p>
            {Object.entries(result.breakdown).map(([key, val]) => (
              <div key={key} className="mb-3">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600 capitalize">{key}</span>
                  <span className="font-medium text-gray-900">{val}/100</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${val}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Strengths */}
          {result.strengths?.length > 0 && (
            <div className="bg-green-50 rounded-xl border border-green-200 p-6">
              <p className="text-sm font-medium text-green-800 mb-3">What's working</p>
              {result.strengths.map((s, i) => (
                <p key={i} className="text-sm text-green-700 mb-1">✓ {s}</p>
              ))}
            </div>
          )}

          {/* Feedback */}
          {result.feedback?.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <p className="text-sm font-medium text-gray-700 mb-3">What to improve</p>
              {result.feedback.map((f, i) => (
                <p key={i} className="text-sm text-gray-600 mb-2">→ {f}</p>
              ))}
            </div>
          )}

          {/* Missing keywords */}
          {result.missing_keywords?.length > 0 && (
            <div className="bg-amber-50 rounded-xl border border-amber-200 p-6">
              <p className="text-sm font-medium text-amber-800 mb-3">Missing keywords</p>
              <div className="flex flex-wrap gap-2">
                {result.missing_keywords.map((k, i) => (
                  <span key={i} className="px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded-md">
                    {k}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}