import { ShieldCheck, Network, Wifi, Server, Cpu, RotateCcw } from 'lucide-react'
import { recommend } from '../utils/recommender.js'

const SECTION = 'bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6'
const LABEL = 'block text-sm font-medium text-gray-700 mb-1'
const INPUT = 'w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition'
const TOGGLE = 'relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer'

export default function ConfigForm({ inputs, onChange, onRecommend, onReset, hasSubmitted }) {
  function handleSubmit(e) {
    e.preventDefault()
    const parsed = {
      ...inputs,
      users: parseInt(inputs.users) || 10,
      throughputGbps: parseFloat(inputs.throughputGbps) || 0.1,
      wiredPorts: parseInt(inputs.wiredPorts) || 8,
      wifiUsersPerZone: parseInt(inputs.wifiUsersPerZone) || 0,
    }
    const rec = recommend(parsed)
    onRecommend(rec)
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Sección 0 — Contexto */}
      <div className={SECTION}>
        <div className="flex items-center gap-2 mb-4">
          <Server className="text-blue-600" size={20} />
          <h2 className="text-base font-semibold text-gray-800">Describe tu entorno</h2>
        </div>
        <p className="text-xs text-gray-500 mb-3">
          Opcional pero recomendado. La IA usará este contexto para personalizar el análisis.
        </p>
        <textarea
          className={INPUT + ' resize-none'}
          rows={3}
          placeholder="Ej: Campus universitario con 3 edificios, 800 estudiantes, necesitamos cubrir aulas, biblioteca y cafetería. Actualmente con switches no administrables y AP domésticos..."
          value={inputs.context}
          onChange={e => onChange('context', e.target.value)}
        />
      </div>

      {/* Sección 1 — Usuarios y Firewall */}
      <div className={SECTION}>
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck className="text-blue-600" size={20} />
          <h2 className="text-base font-semibold text-gray-800">Firewall — Capacidad y usuarios</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={LABEL}>Usuarios totales en la red</label>
            <input
              type="number" min="1" max="99999"
              className={INPUT}
              placeholder="Ej: 150"
              value={inputs.users}
              onChange={e => onChange('users', e.target.value)}
              required
            />
            <p className="text-xs text-gray-400 mt-1">Todos los dispositivos conectados (PCs, móviles, IoT, etc.)</p>
          </div>
          <div>
            <label className={LABEL}>Ancho de banda contratado (Gbps)</label>
            <input
              type="number" min="0.01" max="100" step="0.01"
              className={INPUT}
              placeholder="Ej: 1 (para 1 Gbps)"
              value={inputs.throughputGbps}
              onChange={e => onChange('throughputGbps', e.target.value)}
              required
            />
            <p className="text-xs text-gray-400 mt-1">Velocidad del enlace WAN (0.1 = 100 Mbps, 10 = 10 Gbps)</p>
          </div>
        </div>
      </div>

      {/* Sección 2 — Switch y Puertos */}
      <div className={SECTION}>
        <div className="flex items-center gap-2 mb-4">
          <Network className="text-blue-600" size={20} />
          <h2 className="text-base font-semibold text-gray-800">Switch — Conectividad cableada</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={LABEL}>Puertos cableados necesarios</label>
            <input
              type="number" min="1" max="200"
              className={INPUT}
              placeholder="Ej: 24"
              value={inputs.wiredPorts}
              onChange={e => onChange('wiredPorts', e.target.value)}
              required
            />
            <p className="text-xs text-gray-400 mt-1">Dispositivos que se conectan por cable de red</p>
          </div>
          <div className="flex items-start gap-3 pt-6">
            <button
              type="button"
              onClick={() => onChange('needsPoe', !inputs.needsPoe)}
              className={`${TOGGLE} ${inputs.needsPoe ? 'bg-blue-600' : 'bg-gray-300'}`}
              aria-label="Toggle PoE"
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${inputs.needsPoe ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
            <div>
              <p className="text-sm font-medium text-gray-700">¿Requiere PoE?</p>
              <p className="text-xs text-gray-400">Power over Ethernet (para APs, cámaras IP, teléfonos VoIP)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sección 3 — WiFi */}
      <div className={SECTION}>
        <div className="flex items-center gap-2 mb-4">
          <Wifi className="text-blue-600" size={20} />
          <h2 className="text-base font-semibold text-gray-800">WiFi — Access Points</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className={LABEL}>Usuarios WiFi por zona de cobertura</label>
            <input
              type="number" min="0" max="500"
              className={INPUT}
              placeholder="Ej: 30 (0 si no necesita WiFi)"
              value={inputs.wifiUsersPerZone}
              onChange={e => onChange('wifiUsersPerZone', e.target.value)}
            />
            <p className="text-xs text-gray-400 mt-1">Máx. usuarios simultáneos en la zona de cobertura de un AP</p>
          </div>
          <div>
            <label className={LABEL}>Densidad de uso WiFi</label>
            <select
              className={INPUT}
              value={inputs.wifiDensity}
              onChange={e => onChange('wifiDensity', e.target.value)}
            >
              <option value="low">Baja — Navegación general (~5 Mbps/usuario)</option>
              <option value="medium">Media — Videoconferencias (~15 Mbps/usuario)</option>
              <option value="high">Alta — Streaming 4K / multimedia (~30 Mbps/usuario)</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <button
              type="button"
              onClick={() => onChange('outdoorWifi', !inputs.outdoorWifi)}
              className={`${TOGGLE} ${inputs.outdoorWifi ? 'bg-blue-600' : 'bg-gray-300'}`}
              aria-label="Toggle WiFi exterior"
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${inputs.outdoorWifi ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
            <div>
              <p className="text-sm font-medium text-gray-700">¿WiFi en zonas exteriores?</p>
              <p className="text-xs text-gray-400">Estacionamientos, patios, terrazas</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <button
              type="button"
              onClick={() => onChange('wifiE', !inputs.wifiE)}
              className={`${TOGGLE} ${inputs.wifiE ? 'bg-blue-600' : 'bg-gray-300'}`}
              aria-label="Toggle WiFi 6E"
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${inputs.wifiE ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
            <div>
              <p className="text-sm font-medium text-gray-700">¿Prefiere WiFi 6E?</p>
              <p className="text-xs text-gray-400">Incluye banda de 6 GHz (menos congestionada)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Botones */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="submit"
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition flex items-center justify-center gap-2"
        >
          <Cpu size={18} />
          Generar recomendación
        </button>
        {hasSubmitted && (
          <button
            type="button"
            onClick={onReset}
            className="flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 rounded-xl text-gray-600 hover:bg-gray-100 transition text-sm font-medium"
          >
            <RotateCcw size={16} />
            Nueva consulta
          </button>
        )}
      </div>
    </form>
  )
}
