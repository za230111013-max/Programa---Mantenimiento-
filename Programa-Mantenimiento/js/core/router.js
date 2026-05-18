/**
 * CMMS Enterprise — SPA Router
 * Hash-based routing con lazy loading y guards
 */

const Router = (() => {
  const routes = {};
  let currentRoute = null;
  let beforeEachGuard = null;
  const container = () => document.getElementById('main-content');

  /**
   * Registrar una ruta
   */
  function register(path, config) {
    routes[path] = {
      title: config.title || '',
      icon: config.icon || '',
      module: config.module || null,
      render: config.render || null,
      breadcrumb: config.breadcrumb || [],
      requiresAuth: config.requiresAuth !== false,
      ...config
    };
  }

  /**
   * Registrar múltiples rutas
   */
  function registerAll(routeMap) {
    Object.entries(routeMap).forEach(([path, config]) => {
      register(path, config);
    });
  }

  /**
   * Establecer guard global
   */
  function beforeEach(guardFn) {
    beforeEachGuard = guardFn;
  }

  /**
   * Navegar a una ruta
   */
  function navigate(path) {
    if (path.startsWith('#')) path = path.substring(1);
    if (!path.startsWith('/')) path = '/' + path;
    window.location.hash = path;
  }

  /**
   * Obtener la ruta actual del hash
   */
  function getCurrentPath() {
    const hash = window.location.hash.slice(1) || '/dashboard';
    return hash;
  }

  /**
   * Parsear ruta con parámetros
   */
  function matchRoute(path) {
    // Chequear ruta exacta primero
    if (routes[path]) {
      return { route: routes[path], params: {} };
    }

    // Chequear rutas con parámetros (ej: /assets/:id)
    for (const [pattern, config] of Object.entries(routes)) {
      const patternParts = pattern.split('/');
      const pathParts = path.split('/');

      if (patternParts.length !== pathParts.length) continue;

      const params = {};
      let match = true;

      for (let i = 0; i < patternParts.length; i++) {
        if (patternParts[i].startsWith(':')) {
          params[patternParts[i].substring(1)] = pathParts[i];
        } else if (patternParts[i] !== pathParts[i]) {
          match = false;
          break;
        }
      }

      if (match) {
        return { route: config, params };
      }
    }

    return null;
  }

  /**
   * Resolver y renderizar la ruta actual
   */
  async function resolve() {
    const path = getCurrentPath();
    const matched = matchRoute(path);

    if (!matched) {
      console.warn(`[Router] Ruta no encontrada: ${path}`);
      navigate('/dashboard');
      return;
    }

    const { route, params } = matched;

    // Guard de navegación
    if (beforeEachGuard) {
      const canProceed = await beforeEachGuard(path, currentRoute, params);
      if (canProceed === false) return;
    }

    const previousRoute = currentRoute;
    currentRoute = { path, ...route, params };

    // Actualizar título
    document.title = `${route.title} — CMMS Enterprise`;

    // Actualizar navegación activa
    updateActiveNav(path);

    // Actualizar breadcrumb
    updateBreadcrumb(route.breadcrumb || [route.title]);

    // Transición de contenido
    const mainContent = container();
    if (!mainContent) return;

    mainContent.classList.add('view-transition-out');

    await new Promise(r => setTimeout(r, 150));

    // Renderizar vista
    try {
      Store.set('loading', true);
      
      if (route.render) {
        const html = await route.render(params);
        mainContent.innerHTML = typeof html === 'string' ? html : '';
        if (typeof html === 'object' && html instanceof HTMLElement) {
          mainContent.innerHTML = '';
          mainContent.appendChild(html);
        }
      } else if (route.module) {
        mainContent.innerHTML = '<div class="loading-view"><div class="spinner"></div><p>Cargando módulo...</p></div>';
        // Module render will be called by the module itself
      }

      mainContent.classList.remove('view-transition-out');
      mainContent.classList.add('view-transition-in');
      setTimeout(() => mainContent.classList.remove('view-transition-in'), 300);

      Store.set('loading', false);
      Store.set('currentModule', path.split('/')[1] || 'dashboard');
      Store.dispatch('route:changed', { path, params, route });

    } catch (error) {
      console.error('[Router] Error renderizando vista:', error);
      mainContent.innerHTML = `
        <div class="error-view">
          <div class="error-icon">⚠️</div>
          <h2>Error al cargar el módulo</h2>
          <p>${error.message}</p>
          <button class="btn btn-primary" onclick="Router.navigate('/dashboard')">Ir al Dashboard</button>
        </div>
      `;
      Store.set('loading', false);
    }
  }

  /**
   * Actualizar navegación activa en sidebar
   */
  function updateActiveNav(path) {
    const basePath = '/' + (path.split('/')[1] || 'dashboard');
    document.querySelectorAll('.nav-item').forEach(item => {
      const href = item.getAttribute('data-route');
      if (href === basePath || (basePath === '/dashboard' && href === '/dashboard')) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
  }

  /**
   * Actualizar breadcrumb
   */
  function updateBreadcrumb(items) {
    const breadcrumb = document.getElementById('breadcrumb');
    if (!breadcrumb) return;

    breadcrumb.innerHTML = items.map((item, i) => {
      if (i === items.length - 1) {
        return `<span class="breadcrumb-current">${item}</span>`;
      }
      return `<a class="breadcrumb-link" href="#/${item.toLowerCase()}">${item}</a>
              <span class="breadcrumb-sep">›</span>`;
    }).join('');
  }

  /**
   * Escuchar cambios de hash
   */
  function listen() {
    window.addEventListener('hashchange', () => resolve());
    // Resolver ruta inicial
    if (!window.location.hash) {
      window.location.hash = '/dashboard';
    } else {
      resolve();
    }
  }

  /**
   * Obtener ruta actual
   */
  function current() {
    return currentRoute;
  }

  return {
    register,
    registerAll,
    beforeEach,
    navigate,
    resolve,
    listen,
    current,
    getCurrentPath,
    matchRoute
  };
})();
