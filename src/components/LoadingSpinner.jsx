import { Loader2 } from 'lucide-react'

export default function LoadingSpinner({ text = 'Cargando...' }) {
  return (
    <div className="flex items-center gap-2 text-gray-500 text-sm">
      <Loader2 className="animate-spin" size={16} />
      <span>{text}</span>
    </div>
  )
}
