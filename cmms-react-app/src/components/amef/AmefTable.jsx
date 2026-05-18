import { cn } from '../../lib/utils'; // Optional

export function AmefTable({ amefs }) {
  const getBadgeColor = (npr) => {
    if (npr >= 200) return 'bg-red-100 text-red-800';
    if (npr >= 120) return 'bg-orange-100 text-orange-800';
    if (npr >= 80) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  const statusMap = {
    implementado: { label: 'Implementado', class: 'bg-green-100 text-green-800' },
    en_proceso: { label: 'En Proceso', class: 'bg-yellow-100 text-yellow-800' },
    pendiente: { label: 'Pendiente', class: 'bg-gray-100 text-gray-800' },
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse min-w-[1200px]">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wider">
            <th className="p-3 w-24">Equipo</th>
            <th className="p-3">Modo Falla</th>
            <th className="p-3 w-48">Causa</th>
            <th className="p-3 text-center w-12" title="Severidad">S</th>
            <th className="p-3 text-center w-12" title="Ocurrencia">O</th>
            <th className="p-3 text-center w-12" title="Detección">D</th>
            <th className="p-3 text-center w-16">NPR</th>
            <th className="p-3 w-56">Acción Recomendada</th>
            <th className="p-3 text-center w-20">NPR Rev.</th>
            <th className="p-3 text-center w-28">Estado</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 text-sm">
          {amefs.map((a) => (
            <tr key={a.id} className="hover:bg-gray-50 transition-colors">
              <td className="p-3 font-mono text-xs text-primary-600 font-bold">{a.assetTag}</td>
              <td className="p-3">
                <div className="font-medium text-red-600">{a.failureMode}</div>
                <div className="text-xs text-gray-500 font-normal mt-0.5" title={a.failureEffect}>{a.failureEffect}</div>
              </td>
              <td className="p-3 text-xs text-gray-600">
                <div className="line-clamp-2" title={a.failureCause}>{a.failureCause}</div>
              </td>
              <td className="p-3 text-center font-bold text-gray-700">{a.severity}</td>
              <td className="p-3 text-center font-bold text-gray-700">{a.occurrence}</td>
              <td className="p-3 text-center font-bold text-gray-700">{a.detection}</td>
              <td className="p-3 text-center">
                <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${getBadgeColor(a.npr)}`}>
                  {a.npr}
                </span>
              </td>
              <td className="p-3 text-xs text-gray-700 font-medium">
                <div className="line-clamp-2 italic" title={a.recommendedAction}>{a.recommendedAction}</div>
              </td>
              <td className="p-3 text-center">
                {a.newNPR ? (
                  <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${getBadgeColor(a.newNPR)}`}>
                    {a.newNPR}
                  </span>
                ) : (
                  <span className="text-gray-400">—</span>
                )}
              </td>
              <td className="p-3 text-center">
                <div className="flex flex-col gap-2 items-center">
                  <span className={`inline-block px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${statusMap[a.status].class}`}>
                    {statusMap[a.status].label}
                  </span>
                  {a.status === 'pendiente' && (
                    <button 
                      onClick={() => useAmefStore.getState().implementMitigation(a.id)}
                      className="text-[10px] text-primary-600 hover:underline font-bold"
                    >
                      IMPLEMENTAR
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
          {amefs.length === 0 && (
            <tr>
              <td colSpan="11" className="p-8 text-center text-gray-500">
                No se encontraron análisis AMEF.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
