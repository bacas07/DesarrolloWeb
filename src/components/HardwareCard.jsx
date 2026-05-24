import { ShieldCheck, Network, Wifi } from 'lucide-react'

const ICONS = {
  firewall: <ShieldCheck className="text-blue-600" size={22} />,
  switch: <Network className="text-teal-600" size={22} />,
  ap: <Wifi className="text-purple-600" size={22} />,
}

const COLORS = {
  firewall: 'border-blue-200 bg-blue-50',
  switch: 'border-teal-200 bg-teal-50',
  ap: 'border-purple-200 bg-purple-50',
}

const BADGE = {
  firewall: 'bg-blue-100 text-blue-800',
  switch: 'bg-teal-100 text-teal-800',
  ap: 'bg-purple-100 text-purple-800',
}

const TITLE = {
  firewall: 'Firewall',
  switch: 'Switch',
  ap: 'Access Point',
}

export default function HardwareCard({ type, device, apCount }) {
  if (!device) return null

  return (
    <div className={`rounded-2xl border-2 ${COLORS[type]} p-5 flex flex-col`}>
      <div className="flex items-center gap-2 mb-3">
        {ICONS[type]}
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">{TITLE[type]}</span>
      </div>

      <div className="mb-3">
        <p className="text-xl font-bold text-gray-900">{device.model}</p>
        <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full mt-1 ${BADGE[type]}`}>
          {device.series}
        </span>
      </div>

      <p className="text-xs text-gray-600 mb-3 flex-1">{device.description}</p>

      {/* Specs clave según tipo */}
      <div className="space-y-1.5 text-xs">
        {type === 'firewall' && (
          <>
            <SpecRow label="FW Throughput" value={`${device.throughputFW} Gbps`} />
            <SpecRow label="Threat Protection" value={`${device.throughputThreat} Gbps`} />
            <SpecRow label="VPN IPsec" value={`${device.throughputVPN} Gbps`} />
            <SpecRow label="Puertos" value={`${device.ports.copper}x ${device.ports.type}`} />
            <SpecRow label="Form Factor" value={device.formFactor} />
            {device.fanless && <SpecRow label="Fanless" value="✅ Sí" />}
          </>
        )}
        {type === 'switch' && (
          <>
            <SpecRow label="Puertos acceso" value={`${device.ports}x ${device.portSpeed}`} />
            <SpecRow label="Uplinks" value={`${device.uplinks.count}x ${device.uplinks.type}`} />
            <SpecRow label="PoE" value={device.poe ? `${device.poeStandard}` : 'No'} />
            {device.poe && <SpecRow label="Presupuesto PoE" value={`${device.poeBudget}W`} />}
            <SpecRow label="Switching" value={`${device.switchingCapacity} Gbps`} />
          </>
        )}
        {type === 'ap' && (
          <>
            <SpecRow label="Estándar" value={device.wifiStandard} />
            <SpecRow label="Bandas" value={device.bands.join(' + ')} />
            <SpecRow label="Usuarios/AP" value={device.concurrentUsers} />
            <SpecRow label="Throughput max" value={`${device.maxThroughput} Mbps`} />
            <SpecRow label="Puerto LAN" value={device.portSpeed} />
            <SpecRow label="PoE requerido" value={device.poeRequirement} />
            <SpecRow label="Cantidad estimada" value={`${apCount} unidades`} highlight />
          </>
        )}
      </div>

      {/* Highlights */}
      <div className="mt-3 pt-3 border-t border-gray-200">
        <div className="flex flex-wrap gap-1">
          {device.highlights.map((h, i) => (
            <span key={i} className="text-xs bg-white border border-gray-200 rounded-full px-2 py-0.5 text-gray-600">
              {h}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

function SpecRow({ label, value, highlight }) {
  return (
    <div className={`flex justify-between items-center ${highlight ? 'font-semibold' : ''}`}>
      <span className="text-gray-500">{label}</span>
      <span className={`text-gray-800 ${highlight ? 'text-blue-700' : ''}`}>{value}</span>
    </div>
  )
}
