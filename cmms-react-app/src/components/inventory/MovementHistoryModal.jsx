import { X, History } from 'lucide-react';
import { useInventoryStore } from '../../store/useInventoryStore';
import { cn } from '../../lib/utils';

export function MovementHistoryModal({ isOpen, onClose }) {
  const movements = useInventoryStore((state) => state.movements);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-5 border-b flex justify-between items-center bg-gray-50">
          <h2 className="text-xl font-bold flex items-center gap-2 text-gray-800">
            <History className="w-6 h-6 text-primary-600" />
            Historial de Movimientos de Inventario
          </h2>
          <button onClick={onClose} className="hover:bg-gray-200 p-1.5 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500"/>
          </button>
        </div>
        
        <div className="p-0 overflow-y-auto flex-1">
          {movements.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              No hay movimientos registrados.
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-max text-sm">
              <thead className="sticky top-0 bg-gray-100 shadow-sm">
                <tr className="text-xs text-gray-500 uppercase tracking-wider">
                  <th className="p-3">Fecha</th>
                  <th className="p-3">Código</th>
                  <th className="p-3">Descripción</th>
                  <th className="p-3">Tipo</th>
                  <th className="p-3 text-center">Cant.</th>
                  <th className="p-3">OT</th>
                  <th className="p-3">Activo</th>
                  <th className="p-3">Motivo / Notas</th>
                  <th className="p-3">Usuario</th>
                  <th className="p-3 font-mono text-center">Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {movements.map((mov) => (
                  <tr key={mov.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-3 text-gray-500 whitespace-nowrap text-xs">
                      {new Date(mov.date).toLocaleString('es-MX', {
                        day: '2-digit', month: '2-digit', year: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </td>
                    <td className="p-3">
                      <span className="font-mono font-medium text-primary-600 text-xs bg-primary-50 px-1.5 py-0.5 rounded">{mov.partCode}</span>
                    </td>
                    <td className="p-3 text-gray-700 text-xs max-w-[150px] truncate">{mov.partName}</td>
                    <td className="p-3">
                      {mov.type === 'entrada' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">📥 Entrada</span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">📤 Salida</span>
                      )}
                    </td>
                    <td className={cn("p-3 text-center font-bold", mov.type === 'entrada' ? 'text-green-600' : 'text-red-600')}>
                      {mov.type === 'entrada' ? '+' : '-'}{mov.quantity}
                    </td>
                    <td className="p-3">
                      {mov.orderId ? (
                        <span className="font-mono text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded border border-blue-200">{mov.orderId}</span>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </td>
                    <td className="p-3">
                      {mov.assetTag ? (
                        <span className="font-mono text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{mov.assetTag}</span>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </td>
                    <td className="p-3 max-w-xs truncate" title={mov.notes}>
                      <div className="font-medium text-gray-900 text-xs">{mov.reason.replace(/_/g, ' ').toUpperCase()}</div>
                      <div className="text-[10px] text-gray-500 truncate">{mov.notes || '—'}</div>
                    </td>
                    <td className="p-3 text-gray-600 text-xs">{mov.user}</td>
                    <td className="p-3 text-center font-mono text-xs text-gray-500">
                      {mov.previousStock} → <span className="font-bold text-gray-900">{mov.newStock}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
