import { useState } from 'react'
import { Loader2, AlertCircle, Bot } from 'lucide-react'
import { getAIAnalysis } from '../services/groqService.js'

export default function AIAnalysis({ inputs, recommendation }) {
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleGetAnalysis() {
    setLoading(true)
    const result = await getAIAnalysis(inputs, recommendation)
    setAnalysis(result)
    setLoading(false)
  }

  if (!analysis && !loading) {
    return (
      <div className="text-center py-6">
        <p className="text-sm text-gray-500 mb-4">
          Obtén un análisis técnico detallado generado por Grok (LLaMA 3.3) sobre esta recomendación.
        </p>
        <button
          onClick={handleGetAnalysis}
          className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-medium py-2.5 px-5 rounded-xl transition text-sm"
        >
          <Bot size={16} />
          Analizar con IA
        </button>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-3 py-8 text-gray-500">
        <Loader2 className="animate-spin" size={20} />
        <span className="text-sm">Consultando Grok (LLaMA 3.3)...</span>
      </div>
    )
  }

  if (analysis?.error) {
    return (
      <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
        <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={18} />
        <div>
          <p className="text-sm font-semibold text-red-700">Error al consultar la IA</p>
          <p className="text-xs text-red-600 mt-1">{analysis.message}</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap leading-relaxed">
        {analysis.text}
      </div>
      {analysis.tokensUsed && (
        <p className="text-xs text-gray-400 mt-4 text-right">
          Modelo: {analysis.model} · Tokens usados: {analysis.tokensUsed}
        </p>
      )}
    </div>
  )
}
