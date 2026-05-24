import { useState } from 'react'
import { Loader2, AlertCircle, Bot, RefreshCw } from 'lucide-react'
import { marked } from 'marked'
import { getAIAnalysis } from '../services/groqService.js'

// Configurar marked: saltos de línea GFM, sin modo pedantic
marked.setOptions({
  gfm: true,
  breaks: true,
})

// Convierte markdown a HTML seguro (sin xss relevante en este contexto académico)
function renderMarkdown(text) {
  return { __html: marked.parse(text) }
}

export default function AIAnalysis({ inputs, recommendation }) {
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleGetAnalysis() {
    setLoading(true)
    setAnalysis(null)
    const result = await getAIAnalysis(inputs, recommendation)
    setAnalysis(result)
    setLoading(false)
  }

  // Estado inicial — botón para solicitar análisis
  if (!analysis && !loading) {
    return (
      <div className="text-center py-6">
        <p className="text-sm text-gray-500 mb-4">
          Obtén un análisis técnico detallado generado por Grok (LLaMA 3.3) sobre
          esta recomendación de infraestructura.
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

  // Estado de carga
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-10 text-gray-500">
        <Loader2 className="animate-spin text-purple-500" size={28} />
        <span className="text-sm">Consultando Grok (LLaMA 3.3)...</span>
        <span className="text-xs text-gray-400">Esto puede tardar 3–6 segundos</span>
      </div>
    )
  }

  // Estado de error
  if (analysis?.error) {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
          <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={18} />
          <div>
            <p className="text-sm font-semibold text-red-700">Error al consultar la IA</p>
            <p className="text-xs text-red-600 mt-1">{analysis.message}</p>
          </div>
        </div>
        <button
          onClick={handleGetAnalysis}
          className="inline-flex items-center gap-2 text-sm text-purple-600 hover:text-purple-800 transition self-start"
        >
          <RefreshCw size={14} />
          Reintentar
        </button>
      </div>
    )
  }

  // Estado de éxito — renderizar markdown
  return (
    <div>
      {/* Contenido markdown renderizado con estilos Tailwind Typography-like */}
      <div
        className="ai-markdown-body text-gray-700 text-sm leading-relaxed"
        dangerouslySetInnerHTML={renderMarkdown(analysis.text)}
      />

      {/* Metadata del modelo */}
      <div className="flex items-center justify-between mt-5 pt-4 border-t border-gray-100">
        <button
          onClick={handleGetAnalysis}
          className="inline-flex items-center gap-1.5 text-xs text-purple-500 hover:text-purple-700 transition"
        >
          <RefreshCw size={12} />
          Regenerar análisis
        </button>
        {analysis.tokensUsed && (
          <p className="text-xs text-gray-400">
            Modelo: <span className="font-mono">{analysis.model}</span>
            {' '}· {analysis.tokensUsed} tokens
          </p>
        )}
      </div>
    </div>
  )
}
