import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { GlobalAlertSystem } from './GlobalAlertSystem';
import { useOrdersStore } from '../../store/useOrdersStore';

export function DashboardLayout() {
  const hasUrgent = useOrdersStore(s => s.orders.some(o => o.priority === 'P1' && o.status !== 'cerrada'));
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden relative">
      <GlobalAlertSystem />
      
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 md:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className={cn(
        "flex flex-col flex-1 overflow-hidden transition-all duration-500",
        hasUrgent ? "mt-12 md:mt-14" : ""
      )}>
        <Header onMenuToggle={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 custom-scrollbar">
          <div className="max-w-[1600px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}
