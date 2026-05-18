import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

export function AmefCharts({ amefs }) {
  // Data for Doughnut Chart
  const critical = amefs.filter(a => a.npr >= 200).length;
  const high = amefs.filter(a => a.npr >= 120 && a.npr < 200).length;
  const medium = amefs.filter(a => a.npr >= 80 && a.npr < 120).length;
  const low = amefs.filter(a => a.npr < 80).length;

  const pieData = [
    { name: 'Crítico (≥200)', value: critical },
    { name: 'Alto (120-199)', value: high },
    { name: 'Medio (80-119)', value: medium },
    { name: 'Bajo (<80)', value: low },
  ].filter(d => d.value > 0);

  const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e'];

  // Data for Bar Chart (NPR Reduction)
  const reductionData = amefs
    .filter(a => a.newNPR !== null && a.newNPR !== undefined)
    .map(a => ({
      name: a.assetTag,
      'NPR Original': a.npr,
      'NPR Revisado': a.newNPR
    }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Distribución NPR Actual</h3>
        <div className="h-[300px]">
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">Sin datos</div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Reducción de NPR (Impacto)</h3>
        <div className="h-[300px]">
          {reductionData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={reductionData}
                margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip cursor={{fill: 'transparent'}} />
                <Legend verticalAlign="top" height={36}/>
                <Bar dataKey="NPR Original" fill="#ef4444" radius={[4, 4, 0, 0]} />
                <Bar dataKey="NPR Revisado" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
             <div className="h-full flex flex-col items-center justify-center text-gray-500 text-sm">
                Aún no hay análisis con NPR reducidos
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
