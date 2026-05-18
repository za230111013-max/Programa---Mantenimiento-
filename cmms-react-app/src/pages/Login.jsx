import { useState, useEffect } from 'react';
import { Wrench, Shield, Users, PenTool, Mail, Lock, Loader2 } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useNavigate } from 'react-router-dom';

export function Login() {
  const { login, isAuthenticated, loading, error } = useAuthStore();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await login(email, password);
  };

  const quickLogin = async (e, r) => {
    await login(e, '123');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="flex justify-center">
          <div className="bg-primary-600 p-3 rounded-2xl shadow-lg shadow-primary-200">
            <Wrench className="h-8 w-8 text-white" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 tracking-tight">
          CMMS Industrial
        </h2>
        <p className="mt-2 text-center text-sm text-gray-500">
          Control de Mantenimiento y Gestión de Activos
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl sm:rounded-2xl sm:px-10 border border-gray-100">
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Usuario / Email</label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  placeholder="admin@empresa.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Contraseña</label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Iniciar Sesión'}
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-white text-gray-400 uppercase tracking-widest font-semibold">
                Acceso Rápido
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => quickLogin('admin@test.com')}
              className="flex items-center justify-center py-2.5 px-3 border border-gray-200 rounded-lg text-xs font-bold text-gray-700 hover:bg-blue-50 transition-all"
            >
              <Shield className="w-4 h-4 mr-2 text-blue-600" />
              Admin
            </button>
            <button
              type="button"
              onClick={() => quickLogin('supervisor@test.com')}
              className="flex items-center justify-center py-2.5 px-3 border border-gray-200 rounded-lg text-xs font-bold text-gray-700 hover:bg-amber-50 transition-all"
            >
              <Users className="w-4 h-4 mr-2 text-amber-500" />
              Supervisor
            </button>
            <button
              type="button"
              onClick={() => quickLogin('tecnico@test.com')}
              className="col-span-2 flex items-center justify-center py-3 px-3 border-2 border-primary-100 rounded-lg text-sm font-bold text-primary-700 bg-primary-50 hover:bg-primary-100 transition-all mt-2"
            >
              <PenTool className="w-5 h-5 mr-2 text-primary-600" />
              Modo Técnico
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
