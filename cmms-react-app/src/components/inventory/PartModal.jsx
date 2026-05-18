import { useState, useEffect } from 'react';
import { X, PackagePlus, Pencil, Cpu } from 'lucide-react';
import { useInventoryStore } from '../../store/useInventoryStore';
import { useAssetsStore } from '../../store/useAssetsStore';

export function PartModal({ isOpen, onClose, editPart = null }) {
  const addPart = useInventoryStore((state) => state.addPart);
  const updatePart = useInventoryStore((state) => state.updatePart);
  const assets = useAssetsStore((state) => state.assets);

  const emptyForm = {
    code: '',
    name: '',
    category: 'Rodamientos',
    unit: 'pza',
    currentStock: 0,
    minStock: 1,
    maxStock: 10,
    reorderPoint: 3,
    unitCost: 0,
    location: '',
    supplier: '',
    compatibleAssets: [],
  };

  const [formData, setFormData] = useState(emptyForm);
  const isEditing = !!editPart;

  useEffect(() => {
    if (editPart) {
      setFormData({
        code: editPart.code || '',
        name: editPart.name || '',
        category: editPart.category || 'Rodamientos',
        unit: editPart.unit || 'pza',
        currentStock: editPart.currentStock || 0,
        minStock: editPart.minStock || 1,
        maxStock: editPart.maxStock || 10,
        reorderPoint: editPart.reorderPoint || 3,
        unitCost: editPart.unitCost || 0,
        location: editPart.location || '',
        supplier: editPart.supplier || '',
        compatibleAssets: editPart.compatibleAssets || [],
      });
    } else {
      setFormData(emptyForm);
    }
  }, [editPart, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const toggleAsset = (tag) => {
    setFormData(prev => ({
      ...prev,
      compatibleAssets: prev.compatibleAssets.includes(tag)
        ? prev.compatibleAssets.filter(t => t !== tag)
        : [...prev.compatibleAssets, tag]
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isEditing) {
      updatePart(editPart.id, formData);
    } else {
      addPart(formData);
    }
    onClose();
  };

  const formGroups = [
    { label: 'Código', name: 'code', type: 'text', placeholder: 'Ej: ROD-01', required: true },
    { label: 'Descripción', name: 'name', type: 'text', placeholder: 'Ej: Rodamiento...', required: true, colSpan: 'col-span-2' },
    { 
      label: 'Categoría', name: 'category', type: 'select', 
      options: ['Rodamientos', 'Filtros', 'Lubricantes', 'Bandas', 'Eléctrico', 'Herramientas', 'Sellos', 'Consumibles']
    },
    { 
      label: 'Unidad de Medida', name: 'unit', type: 'select', 
      options: ['pza', 'kit', 'metro', 'cubeta', 'rollo', 'caja']
    },
    { label: 'Stock Inicial', name: 'currentStock', type: 'number', disabled: isEditing },
    { label: 'Mínimo', name: 'minStock', type: 'number' },
    { label: 'Punto de Reorden', name: 'reorderPoint', type: 'number' },
    { label: 'Máximo', name: 'maxStock', type: 'number' },
    { label: 'Costo Unitario ($)', name: 'unitCost', type: 'number' },
    { label: 'Ubicación Física', name: 'location', type: 'text', placeholder: 'Estante / Pasillo' },
    { label: 'Proveedor Preferido', name: 'supplier', type: 'text', colSpan: 'col-span-2' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-5 border-b flex justify-between items-center text-white bg-primary-900">
          <h2 className="text-xl font-bold flex items-center gap-2">
            {isEditing ? <><Pencil className="w-6 h-6" /> Editar Repuesto</> : <><PackagePlus className="w-6 h-6" /> Alta de Nuevo Repuesto</>}
          </h2>
          <button onClick={onClose} className="hover:bg-white/20 p-1.5 rounded-full transition-colors">
            <X className="w-5 h-5"/>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {formGroups.map((field) => (
              <div key={field.name} className={field.colSpan || ''}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                {field.type === 'select' ? (
                  <select
                    name={field.name}
                    value={formData[field.name]}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 text-sm"
                  >
                    {field.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                ) : (
                  <input
                    type={field.type}
                    name={field.name}
                    value={formData[field.name]}
                    onChange={handleChange}
                    placeholder={field.placeholder}
                    required={field.required}
                    disabled={field.disabled}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 text-sm disabled:bg-gray-100 disabled:text-gray-500"
                  />
                )}
              </div>
            ))}
          </div>

          {/* Asset Assignment */}
          <div className="mt-5 pt-5 border-t">
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-primary-500" />
              Activos Compatibles
            </label>
            <p className="text-xs text-gray-400 mb-3">Selecciona los equipos donde se usa esta refacción.</p>
            <div className="flex flex-wrap gap-2">
              {assets.map(asset => {
                const isSelected = formData.compatibleAssets.includes(asset.tag);
                return (
                  <button
                    key={asset.id}
                    type="button"
                    onClick={() => toggleAsset(asset.tag)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${
                      isSelected
                        ? 'bg-primary-50 border-primary-300 text-primary-700 shadow-sm ring-1 ring-primary-200'
                        : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <Cpu className="w-3.5 h-3.5" />
                    <span className="font-mono text-xs">{asset.tag}</span>
                    <span className="text-xs opacity-70">— {asset.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-6 mt-6 border-t flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
              Cancelar
            </button>
            <button type="submit" className="px-6 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 shadow-sm">
              {isEditing ? 'Actualizar Repuesto' : 'Guardar Repuesto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
