import { useState } from 'react';
import { KanbanBoard } from '../../components/orders/KanbanBoard';
import { OrderList } from '../../components/orders/OrderList';
import { useOrdersStore } from '../../store/useOrdersStore';
import { ClipboardList, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function OrdersPage() {
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' | 'list'
  const { orders } = useOrdersStore();
  const navigate = useNavigate();

  const handleOrderClick = (id) => {
    navigate(`/orders/${id}`);
  };

  const total = orders.length;
  const pending = orders.filter(o => !['completada', 'cerrada', 'cancelada'].includes(o.status)).length;
  
  return (
    <div className="flex flex-col h-[calc(100vh-theme(spacing.20))]">
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <ClipboardList className="w-6 h-6 text-primary-600" />
              Órdenes de Trabajo
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Gestión visual interactiva. Total: {total} | Pendientes: {pending}
            </p>
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="bg-white rounded-lg p-1 border border-gray-200 flex shadow-sm">
              <button 
                onClick={() => setViewMode('kanban')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${viewMode === 'kanban' ? 'bg-primary-50 text-primary-700' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Kanban
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${viewMode === 'list' ? 'bg-primary-50 text-primary-700' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Lista
              </button>
            </div>
            
            <button 
              onClick={() => navigate('/orders/new')}
              className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-lg flex items-center gap-2 transition-colors ml-auto sm:ml-0 shadow-sm active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Nueva OT</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
        {viewMode === 'kanban' ? (
          <KanbanBoard orders={orders} onOrderClick={handleOrderClick} />
        ) : (
          <OrderList orders={orders} />
        )}
      </div>
    </div>
  );
}
