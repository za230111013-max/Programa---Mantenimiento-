/**
 * CMMS Enterprise — Database Layer
 * IndexedDB wrapper con CRUD genérico, índices y migraciones
 */

const CMMSDatabase = (() => {
  const DB_NAME = 'cmms_enterprise';
  const DB_VERSION = 1;
  let db = null;

  // Definición de stores y sus índices
  const STORES = {
    assets: {
      keyPath: 'id',
      indexes: [
        { name: 'tag', keyPath: 'tag', unique: true },
        { name: 'area', keyPath: 'area' },
        { name: 'criticality', keyPath: 'criticality' },
        { name: 'status', keyPath: 'status' },
        { name: 'parentId', keyPath: 'parentId' },
        { name: 'type', keyPath: 'type' }
      ]
    },
    workorders: {
      keyPath: 'id',
      indexes: [
        { name: 'folio', keyPath: 'folio', unique: true },
        { name: 'assetId', keyPath: 'assetId' },
        { name: 'status', keyPath: 'status' },
        { name: 'priority', keyPath: 'priority' },
        { name: 'type', keyPath: 'type' },
        { name: 'assignedTo', keyPath: 'assignedTo' },
        { name: 'createdAt', keyPath: 'createdAt' },
        { name: 'scheduledDate', keyPath: 'scheduledDate' }
      ]
    },
    preventive_plans: {
      keyPath: 'id',
      indexes: [
        { name: 'assetId', keyPath: 'assetId' },
        { name: 'frequency', keyPath: 'frequency' },
        { name: 'status', keyPath: 'status' },
        { name: 'nextDueDate', keyPath: 'nextDueDate' }
      ]
    },
    inspections: {
      keyPath: 'id',
      indexes: [
        { name: 'planId', keyPath: 'planId' },
        { name: 'assetId', keyPath: 'assetId' },
        { name: 'date', keyPath: 'date' },
        { name: 'status', keyPath: 'status' }
      ]
    },
    inventory: {
      keyPath: 'id',
      indexes: [
        { name: 'code', keyPath: 'code', unique: true },
        { name: 'category', keyPath: 'category' },
        { name: 'location', keyPath: 'location' },
        { name: 'stockLevel', keyPath: 'currentStock' }
      ]
    },
    inventory_movements: {
      keyPath: 'id',
      indexes: [
        { name: 'partId', keyPath: 'partId' },
        { name: 'workorderId', keyPath: 'workorderId' },
        { name: 'type', keyPath: 'type' },
        { name: 'date', keyPath: 'date' }
      ]
    },
    amef: {
      keyPath: 'id',
      indexes: [
        { name: 'assetId', keyPath: 'assetId' },
        { name: 'npr', keyPath: 'npr' },
        { name: 'status', keyPath: 'status' }
      ]
    },
    users: {
      keyPath: 'id',
      indexes: [
        { name: 'username', keyPath: 'username', unique: true },
        { name: 'role', keyPath: 'role' },
        { name: 'area', keyPath: 'area' }
      ]
    },
    catalogs: {
      keyPath: 'id',
      indexes: [
        { name: 'type', keyPath: 'type' },
        { name: 'code', keyPath: 'code' }
      ]
    },
    audit_log: {
      keyPath: 'id',
      indexes: [
        { name: 'entity', keyPath: 'entity' },
        { name: 'action', keyPath: 'action' },
        { name: 'userId', keyPath: 'userId' },
        { name: 'timestamp', keyPath: 'timestamp' }
      ]
    },
    notifications: {
      keyPath: 'id',
      indexes: [
        { name: 'userId', keyPath: 'userId' },
        { name: 'read', keyPath: 'read' },
        { name: 'type', keyPath: 'type' },
        { name: 'createdAt', keyPath: 'createdAt' }
      ]
    }
  };

  /**
   * Inicializa la base de datos
   */
  async function init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);

      request.onupgradeneeded = (event) => {
        const database = event.target.result;
        for (const [storeName, config] of Object.entries(STORES)) {
          if (!database.objectStoreNames.contains(storeName)) {
            const store = database.createObjectStore(storeName, {
              keyPath: config.keyPath,
              autoIncrement: false
            });
            if (config.indexes) {
              config.indexes.forEach(idx => {
                store.createIndex(idx.name, idx.keyPath, {
                  unique: idx.unique || false
                });
              });
            }
          }
        }
      };

      request.onsuccess = (event) => {
        db = event.target.result;
        console.log('[CMMS DB] Base de datos inicializada correctamente');
        resolve(db);
      };
    });
  }

  /**
   * Genera un ID único
   */
  function generateId(prefix = '') {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return prefix ? `${prefix}_${timestamp}_${random}` : `${timestamp}_${random}`;
  }

  /**
   * Obtiene una transacción y store
   */
  function getTransaction(storeName, mode = 'readonly') {
    if (!db) throw new Error('Base de datos no inicializada');
    const tx = db.transaction(storeName, mode);
    return { tx, store: tx.objectStore(storeName) };
  }

  /**
   * CRUD: Crear registro
   */
  async function create(storeName, data) {
    return new Promise((resolve, reject) => {
      const { tx, store } = getTransaction(storeName, 'readwrite');
      const record = {
        ...data,
        id: data.id || generateId(storeName.substring(0, 3)),
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      const request = store.add(record);
      request.onsuccess = () => resolve(record);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * CRUD: Leer registro por ID
   */
  async function getById(storeName, id) {
    return new Promise((resolve, reject) => {
      const { store } = getTransaction(storeName);
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * CRUD: Obtener todos los registros
   */
  async function getAll(storeName) {
    return new Promise((resolve, reject) => {
      const { store } = getTransaction(storeName);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * CRUD: Actualizar registro
   */
  async function update(storeName, data) {
    return new Promise((resolve, reject) => {
      const { store } = getTransaction(storeName, 'readwrite');
      const record = {
        ...data,
        updatedAt: new Date().toISOString()
      };
      const request = store.put(record);
      request.onsuccess = () => resolve(record);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * CRUD: Eliminar registro
   */
  async function remove(storeName, id) {
    return new Promise((resolve, reject) => {
      const { store } = getTransaction(storeName, 'readwrite');
      const request = store.delete(id);
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Buscar por índice
   */
  async function getByIndex(storeName, indexName, value) {
    return new Promise((resolve, reject) => {
      const { store } = getTransaction(storeName);
      const index = store.index(indexName);
      const request = index.getAll(value);
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Buscar con filtros múltiples (client-side filtering)
   */
  async function query(storeName, filters = {}) {
    const all = await getAll(storeName);
    return all.filter(record => {
      return Object.entries(filters).every(([key, value]) => {
        if (value === null || value === undefined || value === '') return true;
        if (Array.isArray(value)) return value.includes(record[key]);
        if (typeof value === 'object' && value.$gte !== undefined) {
          return record[key] >= value.$gte && record[key] <= (value.$lte || Infinity);
        }
        if (typeof value === 'string' && value.startsWith('~')) {
          // Búsqueda parcial (contains)
          return String(record[key]).toLowerCase().includes(value.substring(1).toLowerCase());
        }
        return record[key] === value;
      });
    });
  }

  /**
   * Contar registros con filtros opcionales
   */
  async function count(storeName, filters = {}) {
    if (Object.keys(filters).length === 0) {
      return new Promise((resolve, reject) => {
        const { store } = getTransaction(storeName);
        const request = store.count();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    }
    const results = await query(storeName, filters);
    return results.length;
  }

  /**
   * Insertar múltiples registros en batch
   */
  async function bulkCreate(storeName, records) {
    return new Promise((resolve, reject) => {
      const { tx, store } = getTransaction(storeName, 'readwrite');
      const results = [];
      let completed = 0;

      records.forEach(data => {
        const record = {
          ...data,
          id: data.id || generateId(storeName.substring(0, 3)),
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        const request = store.put(record);
        request.onsuccess = () => {
          results.push(record);
          completed++;
          if (completed === records.length) resolve(results);
        };
        request.onerror = () => reject(request.error);
      });

      if (records.length === 0) resolve([]);
    });
  }

  /**
   * Limpiar un store completo
   */
  async function clearStore(storeName) {
    return new Promise((resolve, reject) => {
      const { store } = getTransaction(storeName, 'readwrite');
      const request = store.clear();
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Limpiar toda la base de datos
   */
  async function clearAll() {
    for (const storeName of Object.keys(STORES)) {
      await clearStore(storeName);
    }
    console.log('[CMMS DB] Toda la base de datos ha sido limpiada');
  }

  /**
   * Exportar toda la base de datos a JSON
   */
  async function exportAll() {
    const data = {};
    for (const storeName of Object.keys(STORES)) {
      data[storeName] = await getAll(storeName);
    }
    return data;
  }

  /**
   * Importar datos desde JSON
   */
  async function importAll(data) {
    for (const [storeName, records] of Object.entries(data)) {
      if (STORES[storeName] && Array.isArray(records)) {
        await clearStore(storeName);
        await bulkCreate(storeName, records);
      }
    }
    console.log('[CMMS DB] Datos importados correctamente');
  }

  /**
   * Verifica si la DB ya tiene datos
   */
  async function isEmpty() {
    const assetCount = await count('assets');
    return assetCount === 0;
  }

  return {
    init,
    generateId,
    create,
    getById,
    getAll,
    update,
    remove,
    getByIndex,
    query,
    count,
    bulkCreate,
    clearStore,
    clearAll,
    exportAll,
    importAll,
    isEmpty,
    STORES
  };
})();
