import { useState } from 'react'
import Header from './components/Header.jsx'
import ConfigForm from './components/ConfigForm.jsx'
import ResultsPanel from './components/ResultsPanel.jsx'

const initialState = {
  users: '',
  throughputGbps: '',
  wiredPorts: '',
  needsPoe: false,
  wifiUsersPerZone: '',
  wifiDensity: 'medium',
  outdoorWifi: false,
  wifiE: false,
  context: '',
}

export default function App() {
  const [inputs, setInputs] = useState(initialState)
  const [recommendation, setRecommendation] = useState(null)
  const [hasSubmitted, setHasSubmitted] = useState(false)

  function handleInputChange(field, value) {
    setInputs(prev => ({ ...prev, [field]: value }))
  }

  function handleRecommendation(rec) {
    setRecommendation(rec)
    setHasSubmitted(true)
    // Scroll suave a resultados
    setTimeout(() => {
      document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  function handleReset() {
    setInputs(initialState)
    setRecommendation(null)
    setHasSubmitted(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <Header />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <ConfigForm
          inputs={inputs}
          onChange={handleInputChange}
          onRecommend={handleRecommendation}
          onReset={handleReset}
          hasSubmitted={hasSubmitted}
        />
        {recommendation && (
          <div id="results-section">
            <ResultsPanel
              recommendation={recommendation}
              inputs={inputs}
            />
          </div>
        )}
      </main>
      <footer className="text-center text-xs text-gray-400 py-6 border-t border-gray-200 mt-12">
        Configurador Sophos 2025/2026 — Proyecto Académico Desarrollo Web · Datos basados en catálogo oficial sophos.com
      </footer>
    </div>
  )
}
