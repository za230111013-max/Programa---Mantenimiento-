import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useInventoryStore } from '../../store/useInventoryStore';
import { useOrdersStore } from '../../store/useOrdersStore';
import { useAuthStore } from '../../store/useAuthStore';

export function MovementModal({ isOpen, onClose, part, type }) {
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedOT, setSelectedOT] = useState('');
  const [selectedAsset, setSelectedAsset] = useState('');
  
  const recordMovement = useInventoryStore((state) => state.recordMovement);
  const orders = useOrdersStore((state) => state.orders);
  const user = useAuthStore((state) => state.user?.name || 'Admin');

  // Active orders for OT selection
  const activeOrders = orders.filter(o => o.status !== 'cerrada');

  useEffect(() => {
    if (isOpen) {
      setQuantity('');
      setNotes('');
      setSelectedOT('');
      setSelectedAsset('');
      setReason(type === 'entrada' ? 'compra' : 'consumo_ot');
    }
  }, [isOpen, type]);

  // Auto-fill asset when OT is selected
  useEffect(() => {
    if (selectedOT) {
      const ot = orders.find(o => o.folio === selectedOT);
      if (ot?.assetTag) {
        setSelectedAsset(ot.assetTag);
      }
    }
  }, [selectedOT, orders]);

  if (!isOpen || !part) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const qty = parseFloat(quantity);
    if (!qty || qty <= 0) return alert('Cantidad inválida');
    
    if (type === 'salida' && qty > part.currentStock) {
      return alert('Stock insuficiente para esta salida');
    }

    const orderId = reason === 'consumo_ot' ? (selectedOT || null) : null;
    const assetTag = reason === 'consumo_ot' ? (selectedAsset || null) : null;

    recordMovement(part.id, type, qty, reason, notes, user, orderId, assetTag);
    onClose();
  };

  const isEntry = type === 'entrada';
  const showOTSelector = reason === 'consumo_ot';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className={`p-4 border-b flex justify-between items-center text-white ${isEntry ? 'bg-green-600' : 'bg-red-600'}`}>
          <h2 className="text-lg font-bold flex items-center gap-2">
            {isEntry ? '📥 Registrar Entrada' : '📤 Registrar Salida'}
          </h2>
          <button onClick={onClose} className="hover:bg-black/20 p-1 rounded-full"><X className="w-5 h-5"/></button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-gray-50 border rounded-lg p-3 text-sm mb-4">
            <p className="font-bold text-gray-900">{part.name}</p>
            <p className="text-gray-500 font-mono text-xs">{part.code}</p>
            <p className="mt-2 text-gray-700">Stock Actual: <span className="font-bold">{part.currentStock} {part.unit}</span></p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad</label>
            <div className="relative">
              <input
                type="number"
                min="1"
                step="0.01"
                required
                className="w-full pl-3 pr-12 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <span className="text-gray-500 sm:text-sm">{part.unit}</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Motivo</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 text-sm"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            >
              {isEntry ? (
                <>
                  <option value="compra">Compra / Proveedor</option>
                  <option value="devolucion">Devolución a Almacén</option>
                  <option value="ajuste">Ajuste de Inventario (+)</option>
                </>
              ) : (
                <>
                  <option value="consumo_ot">Consumo en Orden de Trabajo</option>
                  <option value="transferencia">Transferencia de Área</option>
                  <option value="ajuste">Ajuste de Inventario (-)</option>
                </>
              )}
            </select>
          </div>

          {/* OT Selector - only when reason is consumo_ot */}
          {showOTSelector && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Orden de Trabajo</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 text-sm"
                  value={selectedOT}
                  onChange={(e) => setSelectedOT(e.target.value)}
                >
                  <option value="">Seleccionar OT...</option>
                  {activeOrders.map(ot => (
                    <option key={ot.id} value={ot.folio}>
                      {ot.folio} — {ot.title} ({ot.priority})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Activo Asociado</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-50"
                  value={selectedAsset}
                  onChange={(e) => setSelectedAsset(e.target.value)}
                  placeholder="Se auto-llena con la OT seleccionada"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notas / Referencia</label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 text-sm"
              rows="2"
              placeholder="Ej: Factura #123, OT-2023..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            ></textarea>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
              Cancelar
            </button>
            <button type="submit" className={`px-4 py-2 text-sm font-medium text-white rounded-md ${isEntry ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}>
              Confirmar {isEntry ? 'Entrada' : 'Salida'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
