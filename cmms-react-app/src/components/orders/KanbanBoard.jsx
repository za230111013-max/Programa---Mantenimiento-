import { OrderCard } from './OrderCard';

const COLUMNS = [
  { id: 'abierta', title: 'Abierta', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  { id: 'asignada', title: 'Asignada', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  { id: 'en_proceso', title: 'En Proceso', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  { id: 'en_espera', title: 'En Espera (Refacciones)', color: 'bg-red-100 text-red-800 border-red-200' },
  { id: 'cerrada', title: 'Cerrada', color: 'bg-green-100 text-green-800 border-green-200' },
];

export function KanbanBoard({ orders, onOrderClick }) {
  return (
    <div className="flex h-full gap-4 overflow-x-auto pb-4 snap-x">
      {COLUMNS.map((column) => {
        const columnOrders = orders.filter((o) => o.status === column.id);
        
        return (
          <div key={column.id} className="flex-shrink-0 w-80 bg-gray-50/50 rounded-xl border border-gray-200 flex flex-col snap-start">
            <div className={`px-4 py-3 border-b text-sm font-bold flex justify-between items-center rounded-t-xl ${column.color}`}>
              <span>{column.title}</span>
              <span className="bg-white/50 px-2 py-0.5 rounded-full text-xs">
                {columnOrders.length}
              </span>
            </div>
            
            <div className="p-3 flex-1 overflow-y-auto space-y-3">
              {columnOrders.length === 0 ? (
                <div className="text-center text-sm text-gray-400 py-8 border-2 border-dashed border-gray-200 rounded-lg">
                  Sin órdenes
                </div>
              ) : (
                columnOrders.map((order) => (
                  <OrderCard 
                    key={order.id} 
                    order={order} 
                    onClick={() => onOrderClick(order.id)} 
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
