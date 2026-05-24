import { AlertTriangle, CheckCircle, Sparkles } from 'lucide-react'
import HardwareCard from './HardwareCard.jsx'
import AIAnalysis from './AIAnalysis.jsx'

export default function ResultsPanel({ recommendation, inputs }) {
  const { firewall, switch: sw, accessPoint, apCount, warnings, calcSummary } = recommendation

  return (
    <div className="mt-8">
      <div className="flex items-center gap-3 mb-6">
        <CheckCircle className="text-green-500" size={24} />
        <h2 className="text-xl font-bold text-gray-900">Recomendación técnica</h2>
      </div>

      {/* Resumen de cálculo */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 text-sm text-blue-800">
        <p className="font-medium mb-1">Resumen de cálculo:</p>
        <ul className="list-disc list-inside space-y-0.5 text-blue-700">
          <li>Throughput FW requerido (×1.3 margen): <strong>{calcSummary.requiredFWThroughput} Gbps</strong></li>
          <li>Puertos con margen (×1.3): <strong>{calcSummary.portsNeeded}</strong></li>
          {calcSummary.estimatedWifiBandwidth > 0 && (
            <li>Ancho de banda WiFi estimado: <strong>{calcSummary.estimatedWifiBandwidth} Gbps</strong></li>
          )}
        </ul>
      </div>

      {/* Tarjetas de hardware */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <HardwareCard type="firewall" device={firewall} />
        <HardwareCard type="switch" device={sw} />
        {accessPoint
          ? <HardwareCard type="ap" device={accessPoint} apCount={apCount} />
          : (
            <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-6 flex flex-col items-center justify-center text-center text-gray-400">
              <p className="text-sm">WiFi no requerido</p>
              <p className="text-xs mt-1">No se ingresaron usuarios WiFi</p>
            </div>
          )
        }
      </div>

      {/* Advertencias */}
      {warnings.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="text-amber-500" size={18} />
            <p className="text-sm font-semibold text-amber-800">Advertencias técnicas</p>
          </div>
          <ul className="space-y-1">
            {warnings.map((w, i) => (
              <li key={i} className="text-sm text-amber-700">{w}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Análisis IA */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="text-purple-500" size={20} />
          <h3 className="text-base font-semibold text-gray-800">Análisis por IA (Grok / LLaMA 3.3)</h3>
        </div>
        <AIAnalysis inputs={inputs} recommendation={recommendation} />
      </div>
    </div>
  )
}
