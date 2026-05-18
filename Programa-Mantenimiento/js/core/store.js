/**
 * CMMS Enterprise — State Management
 * Patrón Pub/Sub para reactividad entre módulos
 */

const Store = (() => {
  const state = {};
  const listeners = {};
  const middlewares = [];

  /**
   * Inicializa el estado con valores por defecto
   */
  function init(initialState = {}) {
    Object.assign(state, {
      currentUser: null,
      currentModule: 'dashboard',
      notifications: [],
      filters: {},
      loading: false,
      sidebarCollapsed: false,
      theme: localStorage.getItem('cmms_theme') || 'dark',
      ...initialState
    });
    console.log('[Store] Estado inicializado');
  }

  /**
   * Obtiene un valor del estado
   */
  function get(key) {
    if (key.includes('.')) {
      return key.split('.').reduce((obj, k) => obj?.[k], state);
    }
    return state[key];
  }

  /**
   * Obtiene todo el estado (copia)
   */
  function getState() {
    return { ...state };
  }

  /**
   * Establece un valor en el estado y notifica suscriptores
   */
  function set(key, value) {
    const oldValue = get(key);
    if (oldValue === value) return;

    // Ejecutar middlewares
    for (const mw of middlewares) {
      const result = mw(key, value, oldValue);
      if (result === false) return; // Middleware canceló el cambio
      if (result !== undefined && result !== true) value = result;
    }

    // Actualizar estado
    if (key.includes('.')) {
      const keys = key.split('.');
      let obj = state;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!obj[keys[i]]) obj[keys[i]] = {};
        obj = obj[keys[i]];
      }
      obj[keys[keys.length - 1]] = value;
    } else {
      state[key] = value;
    }

    // Persistir tema
    if (key === 'theme') {
      localStorage.setItem('cmms_theme', value);
    }

    // Notificar suscriptores
    emit(key, value, oldValue);
  }

  /**
   * Suscribirse a cambios de una clave
   */
  function on(key, callback) {
    if (!listeners[key]) listeners[key] = [];
    listeners[key].push(callback);
    
    // Retorna función para desuscribirse
    return () => {
      listeners[key] = listeners[key].filter(cb => cb !== callback);
    };
  }

  /**
   * Emitir evento
   */
  function emit(key, value, oldValue) {
    // Notificar listeners exactos
    if (listeners[key]) {
      listeners[key].forEach(cb => {
        try {
          cb(value, oldValue, key);
        } catch (e) {
          console.error(`[Store] Error en listener de "${key}":`, e);
        }
      });
    }

    // Notificar listeners con wildcard
    if (listeners['*']) {
      listeners['*'].forEach(cb => {
        try {
          cb(value, oldValue, key);
        } catch (e) {
          console.error('[Store] Error en listener global:', e);
        }
      });
    }

    // Notificar listeners de patrón parcial (ej: 'filters.*')
    Object.keys(listeners).forEach(pattern => {
      if (pattern.endsWith('.*') && key.startsWith(pattern.slice(0, -2))) {
        listeners[pattern].forEach(cb => cb(value, oldValue, key));
      }
    });
  }

  /**
   * Emitir evento personalizado (sin cambio de estado)
   */
  function dispatch(eventName, payload) {
    emit(eventName, payload);
  }

  /**
   * Agregar middleware
   */
  function use(middleware) {
    middlewares.push(middleware);
  }

  /**
   * Suscripción única (se auto-remueve después de ejecutarse)
   */
  function once(key, callback) {
    const unsub = on(key, (value, oldValue) => {
      callback(value, oldValue);
      unsub();
    });
    return unsub;
  }

  /**
   * Batch update - múltiples cambios con una sola notificación
   */
  function batch(updates) {
    const changes = {};
    for (const [key, value] of Object.entries(updates)) {
      const oldValue = get(key);
      if (oldValue !== value) {
        changes[key] = { newValue: value, oldValue };
        if (key.includes('.')) {
          const keys = key.split('.');
          let obj = state;
          for (let i = 0; i < keys.length - 1; i++) {
            if (!obj[keys[i]]) obj[keys[i]] = {};
            obj = obj[keys[i]];
          }
          obj[keys[keys.length - 1]] = value;
        } else {
          state[key] = value;
        }
      }
    }

    // Notificar todos los cambios
    for (const [key, { newValue, oldValue }] of Object.entries(changes)) {
      emit(key, newValue, oldValue);
    }
  }

  return {
    init,
    get,
    getState,
    set,
    on,
    once,
    emit,
    dispatch,
    use,
    batch
  };
})();
