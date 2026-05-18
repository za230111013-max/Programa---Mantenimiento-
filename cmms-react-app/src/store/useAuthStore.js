import { create } from 'zustand';

// ─── Local User Credentials ─────────────────────────────────────────────
// In a real app these would be stored with proper hashing.
// For this local CMMS demo, we use plain-text validation.
const LOCAL_USERS = [
  { email: 'admin@empresa.com', password: '123456', role: 'admin', name: 'Administrador del Sistema' },
  { email: 'supervisor@empresa.com', password: '123456', role: 'supervisor', name: 'Supervisor de Planta' },
  { email: 'tecnico@empresa.com', password: '123456', role: 'tecnico', name: 'Técnico de Guardia' },
  // Quick login aliases
  { email: 'admin@test.com', password: '123', role: 'admin', name: 'Administrador' },
  { email: 'supervisor@test.com', password: '123', role: 'supervisor', name: 'Supervisor de Planta' },
  { email: 'tecnico@test.com', password: '123', role: 'tecnico', name: 'Técnico de Guardia' },
];

export const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem('cmms_user')) || null,
  isAuthenticated: !!localStorage.getItem('cmms_user'),
  loading: false,
  error: null,

  checkAuth: async () => {
    const savedUser = localStorage.getItem('cmms_user');
    if (savedUser) {
      set({ user: JSON.parse(savedUser), isAuthenticated: true });
    }
  },

  login: async (email, password) => {
    set({ loading: true, error: null });
    await new Promise(r => setTimeout(r, 500));

    // Validate against local users
    const foundUser = LOCAL_USERS.find(
      u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );

    if (!foundUser) {
      set({ loading: false, error: 'Credenciales inválidas. Verifica tu email y contraseña.' });
      return;
    }

    const user = {
      email: foundUser.email,
      role: foundUser.role,
      name: foundUser.name,
      id: 'usr_' + crypto.randomUUID().split('-')[0]
    };

    localStorage.setItem('cmms_user', JSON.stringify(user));
    set({ user, isAuthenticated: true, loading: false, error: null });
  },

  logout: () => {
    localStorage.removeItem('cmms_user');
    set({ user: null, isAuthenticated: false, error: null });
  }
}));
