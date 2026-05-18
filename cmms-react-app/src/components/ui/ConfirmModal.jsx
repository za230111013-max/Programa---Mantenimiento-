import { AlertTriangle, Info, ShieldAlert } from 'lucide-react';

const variants = {
  danger: {
    icon: ShieldAlert,
    iconBg: 'bg-red-100 text-red-600',
    buttonBg: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
  },
  warning: {
    icon: AlertTriangle,
    iconBg: 'bg-amber-100 text-amber-600',
    buttonBg: 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500',
  },
  info: {
    icon: Info,
    iconBg: 'bg-blue-100 text-blue-600',
    buttonBg: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
  },
};

export function ConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirmar', variant = 'danger' }) {
  if (!isOpen) return null;

  const v = variants[variant] || variants.info;
  const Icon = v.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-full ${v.iconBg} flex items-center justify-center flex-shrink-0`}>
              <Icon className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900">{title}</h3>
              <p className="text-sm text-gray-500 mt-1">{message}</p>
            </div>
          </div>
        </div>
        <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => { onConfirm(); onClose(); }}
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${v.buttonBg}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
