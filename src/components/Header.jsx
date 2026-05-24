import { ShieldCheck } from 'lucide-react'

export default function Header() {
  return (
    <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
            <ShieldCheck className="text-white" size={20} />
          </div>
          <div>
            <p className="text-base font-bold text-gray-900 leading-tight">Configurador Sophos</p>
            <p className="text-xs text-gray-500">Infraestructura de red corporativa 2025/2026</p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <span className="text-xs bg-blue-50 border border-blue-200 text-blue-700 px-2.5 py-1 rounded-full font-medium">
            XGS · CS · AP6
          </span>
          <span className="text-xs bg-purple-50 border border-purple-200 text-purple-700 px-2.5 py-1 rounded-full font-medium">
            + IA Grok
          </span>
        </div>
      </div>
    </header>
  )
}
