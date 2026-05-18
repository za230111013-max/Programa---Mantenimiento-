/**
 * CMMS Enterprise — Datos de Demostración
 * Manufactura automotriz — 50+ equipos, 200+ OTs, 100+ repuestos
 * Historial de 6 meses para gráficos de tendencia
 */

const SeedData = (() => {

  // Helper: fecha relativa
  function daysAgo(days) {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString();
  }

  function daysFromNow(days) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString();
  }

  function randomDate(daysBack, daysForward = 0) {
    const range = daysBack + daysForward;
    const offset = Math.floor(Math.random() * range) - daysBack;
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return d.toISOString();
  }

  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

  /* ═══════════════════════════════════════
   * USUARIOS
   * ═══════════════════════════════════════ */
  const users = [
    { id: 'usr_001', username: 'admin', password: 'admin123', name: 'Carlos Mendoza', role: 'admin', area: 'Mantenimiento', email: 'cmendoza@empresa.com', position: 'Gerente de Mantenimiento', active: true },
    { id: 'usr_002', username: 'jramirez', password: '1234', name: 'Juan Ramírez', role: 'planner', area: 'Mantenimiento', email: 'jramirez@empresa.com', position: 'Planeador de Mantenimiento', active: true },
    { id: 'usr_003', username: 'mlopez', password: '1234', name: 'Miguel López', role: 'technician', area: 'Mantenimiento', email: 'mlopez@empresa.com', position: 'Técnico Mecánico Sr.', active: true },
    { id: 'usr_004', username: 'aherrera', password: '1234', name: 'Ana Herrera', role: 'technician', area: 'Mantenimiento', email: 'aherrera@empresa.com', position: 'Técnica Eléctrica', active: true },
    { id: 'usr_005', username: 'rgarcia', password: '1234', name: 'Roberto García', role: 'technician', area: 'Mantenimiento', email: 'rgarcia@empresa.com', position: 'Técnico Mecánico', active: true },
    { id: 'usr_006', username: 'lsanchez', password: '1234', name: 'Laura Sánchez', role: 'supervisor', area: 'Producción', email: 'lsanchez@empresa.com', position: 'Supervisora de Producción', active: true },
    { id: 'usr_007', username: 'fmorales', password: '1234', name: 'Fernando Morales', role: 'technician', area: 'Mantenimiento', email: 'fmorales@empresa.com', position: 'Técnico Instrumentista', active: true },
    { id: 'usr_008', username: 'pcastillo', password: '1234', name: 'Patricia Castillo', role: 'warehouse', area: 'Almacén', email: 'pcastillo@empresa.com', position: 'Almacenista', active: true },
    { id: 'usr_009', username: 'dortiz', password: '1234', name: 'Diego Ortiz', role: 'technician', area: 'Mantenimiento', email: 'dortiz@empresa.com', position: 'Técnico Electromecánico', active: true },
    { id: 'usr_010', username: 'kvalencia', password: '1234', name: 'Karen Valencia', role: 'engineer', area: 'Mantenimiento', email: 'kvalencia@empresa.com', position: 'Ingeniera de Confiabilidad', active: true },
  ];


  /* ═══════════════════════════════════════
   * ACTIVOS / EQUIPOS (50+)
   * Jerarquía: Planta → Área → Sistema → Equipo
   * ═══════════════════════════════════════ */
  const assets = [
    // === ÁREA: ESTAMPADO ===
    { id: 'ast_001', tag: 'EST-PH-001', name: 'Prensa Hidráulica 500T', area: 'Estampado', system: 'Prensas', type: 'equipo', parentId: null, criticality: 'A', status: 'operando', brand: 'Schuler', model: 'TBS 500', serial: 'SCH-2019-4521', year: 2019, power: '75 kW', weight: '45 ton', location: 'Nave 1 - Bay 3', purchaseCost: 2850000, hoursOperated: 18500, lastMaintenance: daysAgo(12) },
    { id: 'ast_002', tag: 'EST-PH-002', name: 'Prensa Hidráulica 300T', area: 'Estampado', system: 'Prensas', type: 'equipo', parentId: null, criticality: 'A', status: 'operando', brand: 'Schuler', model: 'TBS 300', serial: 'SCH-2018-3302', year: 2018, power: '55 kW', weight: '32 ton', location: 'Nave 1 - Bay 4', purchaseCost: 1950000, hoursOperated: 22100, lastMaintenance: daysAgo(5) },
    { id: 'ast_003', tag: 'EST-PM-001', name: 'Prensa Mecánica 200T', area: 'Estampado', system: 'Prensas', type: 'equipo', parentId: null, criticality: 'B', status: 'operando', brand: 'Komatsu', model: 'H2F-200', serial: 'KOM-2017-1156', year: 2017, power: '45 kW', weight: '22 ton', location: 'Nave 1 - Bay 5', purchaseCost: 1200000, hoursOperated: 25600, lastMaintenance: daysAgo(30) },
    { id: 'ast_004', tag: 'EST-TR-001', name: 'Transfer Automático L1', area: 'Estampado', system: 'Transferencia', type: 'equipo', parentId: null, criticality: 'A', status: 'operando', brand: 'ABB', model: 'IRB 6700', serial: 'ABB-2020-7891', year: 2020, power: '12 kW', weight: '2.3 ton', location: 'Nave 1 - Bay 3', purchaseCost: 890000, hoursOperated: 14200, lastMaintenance: daysAgo(8) },
    { id: 'ast_005', tag: 'EST-DES-001', name: 'Desenrollador de Lámina', area: 'Estampado', system: 'Alimentación', type: 'equipo', parentId: null, criticality: 'B', status: 'operando', brand: 'Coe Press', model: 'CPF-600', serial: 'COE-2019-2244', year: 2019, power: '15 kW', weight: '8 ton', location: 'Nave 1 - Bay 2', purchaseCost: 450000, hoursOperated: 18200, lastMaintenance: daysAgo(15) },

    // === ÁREA: SOLDADURA ===
    { id: 'ast_006', tag: 'SOL-RB-001', name: 'Robot Soldadura FANUC #1', area: 'Soldadura', system: 'Robots', type: 'equipo', parentId: null, criticality: 'A', status: 'operando', brand: 'FANUC', model: 'R-2000iC/165F', serial: 'FAN-2020-8832', year: 2020, power: '8 kW', weight: '1.1 ton', location: 'Nave 2 - Celda 1', purchaseCost: 1250000, hoursOperated: 13800, lastMaintenance: daysAgo(3) },
    { id: 'ast_007', tag: 'SOL-RB-002', name: 'Robot Soldadura FANUC #2', area: 'Soldadura', system: 'Robots', type: 'equipo', parentId: null, criticality: 'A', status: 'operando', brand: 'FANUC', model: 'R-2000iC/165F', serial: 'FAN-2020-8833', year: 2020, power: '8 kW', weight: '1.1 ton', location: 'Nave 2 - Celda 1', purchaseCost: 1250000, hoursOperated: 13500, lastMaintenance: daysAgo(3) },
    { id: 'ast_008', tag: 'SOL-RB-003', name: 'Robot Soldadura FANUC #3', area: 'Soldadura', system: 'Robots', type: 'equipo', parentId: null, criticality: 'A', status: 'mantenimiento', brand: 'FANUC', model: 'R-2000iC/210F', serial: 'FAN-2021-1024', year: 2021, power: '10 kW', weight: '1.2 ton', location: 'Nave 2 - Celda 2', purchaseCost: 1380000, hoursOperated: 11200, lastMaintenance: daysAgo(0) },
    { id: 'ast_009', tag: 'SOL-RB-004', name: 'Robot Soldadura KUKA #1', area: 'Soldadura', system: 'Robots', type: 'equipo', parentId: null, criticality: 'B', status: 'operando', brand: 'KUKA', model: 'KR 150 R3100', serial: 'KUK-2019-5567', year: 2019, power: '9 kW', weight: '1.3 ton', location: 'Nave 2 - Celda 3', purchaseCost: 980000, hoursOperated: 17600, lastMaintenance: daysAgo(20) },
    { id: 'ast_010', tag: 'SOL-PU-001', name: 'Máquina Soldadura por Puntos', area: 'Soldadura', system: 'Soldadura Puntos', type: 'equipo', parentId: null, criticality: 'B', status: 'operando', brand: 'ARO', model: 'PM Series', serial: 'ARO-2018-4412', year: 2018, power: '25 kW', weight: '0.8 ton', location: 'Nave 2 - Manual', purchaseCost: 320000, hoursOperated: 20100, lastMaintenance: daysAgo(25) },
    { id: 'ast_011', tag: 'SOL-MIG-001', name: 'Equipo MIG/MAG Lincoln', area: 'Soldadura', system: 'Soldadura Arco', type: 'equipo', parentId: null, criticality: 'C', status: 'operando', brand: 'Lincoln Electric', model: 'Power Wave S500', serial: 'LIN-2020-3378', year: 2020, power: '18 kW', weight: '0.12 ton', location: 'Nave 2 - Reparación', purchaseCost: 185000, hoursOperated: 9800, lastMaintenance: daysAgo(45) },

    // === ÁREA: MAQUINADO CNC ===
    { id: 'ast_012', tag: 'CNC-TN-001', name: 'Torno CNC Mazak #1', area: 'Maquinado', system: 'Tornos', type: 'equipo', parentId: null, criticality: 'A', status: 'operando', brand: 'Mazak', model: 'Quick Turn 250M', serial: 'MAZ-2019-6614', year: 2019, power: '22 kW', weight: '6.5 ton', location: 'Nave 3 - Bay 1', purchaseCost: 1650000, hoursOperated: 19200, lastMaintenance: daysAgo(7) },
    { id: 'ast_013', tag: 'CNC-TN-002', name: 'Torno CNC Mazak #2', area: 'Maquinado', system: 'Tornos', type: 'equipo', parentId: null, criticality: 'A', status: 'operando', brand: 'Mazak', model: 'Quick Turn 250M', serial: 'MAZ-2019-6615', year: 2019, power: '22 kW', weight: '6.5 ton', location: 'Nave 3 - Bay 2', purchaseCost: 1650000, hoursOperated: 18900, lastMaintenance: daysAgo(7) },
    { id: 'ast_014', tag: 'CNC-CV-001', name: 'Centro de Maquinado Vertical Haas', area: 'Maquinado', system: 'Fresadoras', type: 'equipo', parentId: null, criticality: 'A', status: 'operando', brand: 'Haas', model: 'VF-4SS', serial: 'HAS-2020-2298', year: 2020, power: '30 kW', weight: '8.2 ton', location: 'Nave 3 - Bay 3', purchaseCost: 2100000, hoursOperated: 14500, lastMaintenance: daysAgo(10) },
    { id: 'ast_015', tag: 'CNC-CV-002', name: 'Centro de Maquinado Vertical DMG', area: 'Maquinado', system: 'Fresadoras', type: 'equipo', parentId: null, criticality: 'A', status: 'en_falla', brand: 'DMG Mori', model: 'DMC 850 V', serial: 'DMG-2021-0091', year: 2021, power: '35 kW', weight: '9.1 ton', location: 'Nave 3 - Bay 4', purchaseCost: 2800000, hoursOperated: 10200, lastMaintenance: daysAgo(2) },
    { id: 'ast_016', tag: 'CNC-CH-001', name: 'Centro de Maquinado Horizontal', area: 'Maquinado', system: 'Fresadoras', type: 'equipo', parentId: null, criticality: 'B', status: 'operando', brand: 'Okuma', model: 'MA-600HII', serial: 'OKU-2018-7742', year: 2018, power: '30 kW', weight: '14 ton', location: 'Nave 3 - Bay 5', purchaseCost: 2450000, hoursOperated: 21800, lastMaintenance: daysAgo(18) },
    { id: 'ast_017', tag: 'CNC-RE-001', name: 'Rectificadora Cilíndrica', area: 'Maquinado', system: 'Rectificado', type: 'equipo', parentId: null, criticality: 'B', status: 'operando', brand: 'Studer', model: 'S33', serial: 'STU-2017-3301', year: 2017, power: '15 kW', weight: '4.5 ton', location: 'Nave 3 - Bay 6', purchaseCost: 980000, hoursOperated: 24100, lastMaintenance: daysAgo(22) },

    // === ÁREA: TRATAMIENTOS TÉRMICOS ===
    { id: 'ast_018', tag: 'TT-HRN-001', name: 'Horno de Temple por Inducción', area: 'Tratamientos Térmicos', system: 'Hornos', type: 'equipo', parentId: null, criticality: 'A', status: 'operando', brand: 'Inductotherm', model: 'VIP 500', serial: 'IND-2019-8812', year: 2019, power: '500 kW', weight: '12 ton', location: 'Nave 4 - TT1', purchaseCost: 3200000, hoursOperated: 16800, lastMaintenance: daysAgo(6) },
    { id: 'ast_019', tag: 'TT-HRN-002', name: 'Horno de Revenido Continental', area: 'Tratamientos Térmicos', system: 'Hornos', type: 'equipo', parentId: null, criticality: 'A', status: 'operando', brand: 'Ipsen', model: 'TQF-8', serial: 'IPS-2018-4490', year: 2018, power: '200 kW', weight: '15 ton', location: 'Nave 4 - TT2', purchaseCost: 2100000, hoursOperated: 20500, lastMaintenance: daysAgo(14) },
    { id: 'ast_020', tag: 'TT-HRN-003', name: 'Horno de Carburizado', area: 'Tratamientos Térmicos', system: 'Hornos', type: 'equipo', parentId: null, criticality: 'A', status: 'operando', brand: 'SECO/WARWICK', model: 'CaseMaster', serial: 'SEC-2020-1175', year: 2020, power: '350 kW', weight: '18 ton', location: 'Nave 4 - TT3', purchaseCost: 4500000, hoursOperated: 12600, lastMaintenance: daysAgo(9) },
    { id: 'ast_021', tag: 'TT-ENF-001', name: 'Sistema de Enfriamiento (Quench)', area: 'Tratamientos Térmicos', system: 'Enfriamiento', type: 'equipo', parentId: null, criticality: 'B', status: 'operando', brand: 'Ipsen', model: 'QT-1000', serial: 'IPS-2018-4491', year: 2018, power: '45 kW', weight: '5 ton', location: 'Nave 4 - TT2', purchaseCost: 650000, hoursOperated: 20500, lastMaintenance: daysAgo(14) },

    // === ÁREA: PINTURA ===
    { id: 'ast_022', tag: 'PIN-CAB-001', name: 'Cabina de Pintura Electrostática', area: 'Pintura', system: 'Aplicación', type: 'equipo', parentId: null, criticality: 'A', status: 'operando', brand: 'Nordson', model: 'Encore HD', serial: 'NOR-2020-6234', year: 2020, power: '25 kW', weight: '3 ton', location: 'Nave 5 - Pintura', purchaseCost: 1800000, hoursOperated: 13200, lastMaintenance: daysAgo(4) },
    { id: 'ast_023', tag: 'PIN-HRN-001', name: 'Horno de Curado Pintura', area: 'Pintura', system: 'Curado', type: 'equipo', parentId: null, criticality: 'A', status: 'operando', brand: 'Wisconsin Oven', model: 'SPC-4048', serial: 'WIS-2020-1189', year: 2020, power: '150 kW', weight: '8 ton', location: 'Nave 5 - Curado', purchaseCost: 1200000, hoursOperated: 13000, lastMaintenance: daysAgo(11) },
    { id: 'ast_024', tag: 'PIN-PRE-001', name: 'Sistema de Pretratamiento', area: 'Pintura', system: 'Pretratamiento', type: 'equipo', parentId: null, criticality: 'B', status: 'operando', brand: 'Henkel', model: 'Bonderite M-ZN', serial: 'HEN-2019-3356', year: 2019, power: '30 kW', weight: '5 ton', location: 'Nave 5 - Lavado', purchaseCost: 750000, hoursOperated: 17500, lastMaintenance: daysAgo(28) },
    { id: 'ast_025', tag: 'PIN-CNV-001', name: 'Transportador Aéreo Power&Free', area: 'Pintura', system: 'Transporte', type: 'equipo', parentId: null, criticality: 'B', status: 'operando', brand: 'Pacline', model: 'OHC-500', serial: 'PAC-2019-2241', year: 2019, power: '7.5 kW', weight: '12 ton', location: 'Nave 5', purchaseCost: 950000, hoursOperated: 17500, lastMaintenance: daysAgo(35) },

    // === ÁREA: ENSAMBLE ===
    { id: 'ast_026', tag: 'ENS-LN-001', name: 'Línea de Ensamble Principal', area: 'Ensamble', system: 'Líneas', type: 'equipo', parentId: null, criticality: 'A', status: 'operando', brand: 'Bosch Rexroth', model: 'TS5', serial: 'BOS-2020-4478', year: 2020, power: '15 kW', weight: '10 ton', location: 'Nave 6 - Línea 1', purchaseCost: 2200000, hoursOperated: 13500, lastMaintenance: daysAgo(5) },
    { id: 'ast_027', tag: 'ENS-ATR-001', name: 'Atornillador Automático #1', area: 'Ensamble', system: 'Atornillado', type: 'equipo', parentId: null, criticality: 'B', status: 'operando', brand: 'Atlas Copco', model: 'QST 50-15', serial: 'ATL-2021-8891', year: 2021, power: '1.5 kW', weight: '0.05 ton', location: 'Nave 6 - Est. 3', purchaseCost: 185000, hoursOperated: 10200, lastMaintenance: daysAgo(40) },
    { id: 'ast_028', tag: 'ENS-PRE-001', name: 'Prensa de Inserción Servo', area: 'Ensamble', system: 'Prensado', type: 'equipo', parentId: null, criticality: 'B', status: 'operando', brand: 'Promess', model: 'UFM-30', serial: 'PRM-2020-1102', year: 2020, power: '5 kW', weight: '1.5 ton', location: 'Nave 6 - Est. 5', purchaseCost: 420000, hoursOperated: 13000, lastMaintenance: daysAgo(16) },
    { id: 'ast_029', tag: 'ENS-RB-001', name: 'Robot Ensamble Colaborativo', area: 'Ensamble', system: 'Robots', type: 'equipo', parentId: null, criticality: 'B', status: 'operando', brand: 'Universal Robots', model: 'UR10e', serial: 'UR-2021-5567', year: 2021, power: '2.5 kW', weight: '0.033 ton', location: 'Nave 6 - Est. 7', purchaseCost: 650000, hoursOperated: 9800, lastMaintenance: daysAgo(23) },

    // === ÁREA: CALIDAD / INSPECCIÓN ===
    { id: 'ast_030', tag: 'CAL-CMM-001', name: 'CMM Zeiss', area: 'Calidad', system: 'Metrología', type: 'equipo', parentId: null, criticality: 'A', status: 'operando', brand: 'Zeiss', model: 'Contura G2', serial: 'ZEI-2020-3345', year: 2020, power: '3 kW', weight: '2.8 ton', location: 'Lab. Metrología', purchaseCost: 2500000, hoursOperated: 12000, lastMaintenance: daysAgo(30) },
    { id: 'ast_031', tag: 'CAL-DUR-001', name: 'Durómetro Rockwell', area: 'Calidad', system: 'Ensayos', type: 'equipo', parentId: null, criticality: 'C', status: 'operando', brand: 'Mitutoyo', model: 'HR-530L', serial: 'MIT-2018-1198', year: 2018, power: '0.5 kW', weight: '0.1 ton', location: 'Lab. Calidad', purchaseCost: 180000, hoursOperated: 8500, lastMaintenance: daysAgo(60) },
    { id: 'ast_032', tag: 'CAL-VIS-001', name: 'Sistema Visión Artificial', area: 'Calidad', system: 'Inspección', type: 'equipo', parentId: null, criticality: 'B', status: 'operando', brand: 'Cognex', model: 'In-Sight 9912', serial: 'COG-2021-7789', year: 2021, power: '0.3 kW', weight: '0.02 ton', location: 'Nave 6 - Línea 1', purchaseCost: 350000, hoursOperated: 10500, lastMaintenance: daysAgo(50) },

    // === ÁREA: UTILIDADES ===
    { id: 'ast_033', tag: 'UTL-CMP-001', name: 'Compresor Atlas Copco #1', area: 'Utilidades', system: 'Aire Comprimido', type: 'equipo', parentId: null, criticality: 'A', status: 'operando', brand: 'Atlas Copco', model: 'GA 90+ VSD', serial: 'ATL-2019-5512', year: 2019, power: '90 kW', weight: '2.5 ton', location: 'Cuarto de Compresores', purchaseCost: 1100000, hoursOperated: 26000, lastMaintenance: daysAgo(7) },
    { id: 'ast_034', tag: 'UTL-CMP-002', name: 'Compresor Atlas Copco #2', area: 'Utilidades', system: 'Aire Comprimido', type: 'equipo', parentId: null, criticality: 'A', status: 'operando', brand: 'Atlas Copco', model: 'GA 75 VSD', serial: 'ATL-2018-3390', year: 2018, power: '75 kW', weight: '2.2 ton', location: 'Cuarto de Compresores', purchaseCost: 850000, hoursOperated: 30500, lastMaintenance: daysAgo(7) },
    { id: 'ast_035', tag: 'UTL-SEC-001', name: 'Secador de Aire Refrigerativo', area: 'Utilidades', system: 'Aire Comprimido', type: 'equipo', parentId: null, criticality: 'B', status: 'operando', brand: 'Atlas Copco', model: 'FD 300', serial: 'ATL-2019-5513', year: 2019, power: '5 kW', weight: '0.5 ton', location: 'Cuarto de Compresores', purchaseCost: 250000, hoursOperated: 26000, lastMaintenance: daysAgo(30) },
    { id: 'ast_036', tag: 'UTL-CHI-001', name: 'Chiller Industrial 100TR', area: 'Utilidades', system: 'Enfriamiento', type: 'equipo', parentId: null, criticality: 'A', status: 'operando', brand: 'Carrier', model: '30XA-100', serial: 'CAR-2019-8834', year: 2019, power: '120 kW', weight: '5 ton', location: 'Exterior - Roof', purchaseCost: 1500000, hoursOperated: 24000, lastMaintenance: daysAgo(15) },
    { id: 'ast_037', tag: 'UTL-CHI-002', name: 'Chiller Industrial 60TR', area: 'Utilidades', system: 'Enfriamiento', type: 'equipo', parentId: null, criticality: 'B', status: 'operando', brand: 'Carrier', model: '30XA-060', serial: 'CAR-2018-5521', year: 2018, power: '75 kW', weight: '3.5 ton', location: 'Exterior - Roof', purchaseCost: 900000, hoursOperated: 28000, lastMaintenance: daysAgo(15) },
    { id: 'ast_038', tag: 'UTL-TRF-001', name: 'Transformador Principal 2MVA', area: 'Utilidades', system: 'Eléctrico', type: 'equipo', parentId: null, criticality: 'A', status: 'operando', brand: 'ABB', model: 'Distribution OLTC', serial: 'ABB-2017-1190', year: 2017, power: '2000 kVA', weight: '6 ton', location: 'Subestación', purchaseCost: 1800000, hoursOperated: 45000, lastMaintenance: daysAgo(90) },
    { id: 'ast_039', tag: 'UTL-UPS-001', name: 'UPS 100 kVA', area: 'Utilidades', system: 'Eléctrico', type: 'equipo', parentId: null, criticality: 'A', status: 'operando', brand: 'Eaton', model: '93PM-100', serial: 'EAT-2020-4489', year: 2020, power: '100 kVA', weight: '0.8 ton', location: 'Cuarto Eléctrico', purchaseCost: 650000, hoursOperated: 35000, lastMaintenance: daysAgo(60) },
    { id: 'ast_040', tag: 'UTL-BOM-001', name: 'Bomba Centrífuga Agua #1', area: 'Utilidades', system: 'Agua', type: 'equipo', parentId: null, criticality: 'B', status: 'operando', brand: 'Grundfos', model: 'CR 64-3-1', serial: 'GRU-2019-2234', year: 2019, power: '22 kW', weight: '0.3 ton', location: 'Cuarto de Bombas', purchaseCost: 180000, hoursOperated: 22000, lastMaintenance: daysAgo(20) },
    { id: 'ast_041', tag: 'UTL-BOM-002', name: 'Bomba Centrífuga Agua #2', area: 'Utilidades', system: 'Agua', type: 'equipo', parentId: null, criticality: 'C', status: 'operando', brand: 'Grundfos', model: 'CR 64-3-1', serial: 'GRU-2019-2235', year: 2019, power: '22 kW', weight: '0.3 ton', location: 'Cuarto de Bombas', purchaseCost: 180000, hoursOperated: 15000, lastMaintenance: daysAgo(45) },
    { id: 'ast_042', tag: 'UTL-CTW-001', name: 'Torre de Enfriamiento', area: 'Utilidades', system: 'Enfriamiento', type: 'equipo', parentId: null, criticality: 'B', status: 'operando', brand: 'Marley', model: 'NC-8310', serial: 'MAR-2018-6671', year: 2018, power: '15 kW', weight: '8 ton', location: 'Exterior', purchaseCost: 500000, hoursOperated: 28000, lastMaintenance: daysAgo(30) },

    // === ÁREA: LOGÍSTICA / MANEJO MATERIALES ===
    { id: 'ast_043', tag: 'LOG-MON-001', name: 'Montacargas Toyota #1', area: 'Logística', system: 'Montacargas', type: 'equipo', parentId: null, criticality: 'B', status: 'operando', brand: 'Toyota', model: '8FBE18', serial: 'TOY-2020-9912', year: 2020, power: '12 kW', weight: '3.5 ton', location: 'Almacén MP', purchaseCost: 450000, hoursOperated: 8500, lastMaintenance: daysAgo(30) },
    { id: 'ast_044', tag: 'LOG-MON-002', name: 'Montacargas Toyota #2', area: 'Logística', system: 'Montacargas', type: 'equipo', parentId: null, criticality: 'C', status: 'operando', brand: 'Toyota', model: '8FBE15', serial: 'TOY-2019-7781', year: 2019, power: '10 kW', weight: '3 ton', location: 'Almacén PT', purchaseCost: 380000, hoursOperated: 11200, lastMaintenance: daysAgo(45) },
    { id: 'ast_045', tag: 'LOG-CNV-001', name: 'Transportador de Banda Principal', area: 'Logística', system: 'Transportadores', type: 'equipo', parentId: null, criticality: 'B', status: 'operando', brand: 'Hytrol', model: 'ProSort 421e', serial: 'HYT-2020-3345', year: 2020, power: '5 kW', weight: '4 ton', location: 'Nave 6 - Empaque', purchaseCost: 320000, hoursOperated: 13000, lastMaintenance: daysAgo(20) },
    { id: 'ast_046', tag: 'LOG-GRU-001', name: 'Grúa Puente 10 Ton', area: 'Logística', system: 'Grúas', type: 'equipo', parentId: null, criticality: 'B', status: 'operando', brand: 'Demag', model: 'EKDR 10', serial: 'DEM-2017-1145', year: 2017, power: '15 kW', weight: '5 ton', location: 'Nave 1', purchaseCost: 750000, hoursOperated: 18000, lastMaintenance: daysAgo(60) },

    // === EQUIPOS ADICIONALES ===
    { id: 'ast_047', tag: 'EST-CIZ-001', name: 'Cizalla Hidráulica', area: 'Estampado', system: 'Corte', type: 'equipo', parentId: null, criticality: 'C', status: 'operando', brand: 'Amada', model: 'HFA-170', serial: 'AMA-2016-8812', year: 2016, power: '30 kW', weight: '12 ton', location: 'Nave 1 - Bay 1', purchaseCost: 680000, hoursOperated: 28000, lastMaintenance: daysAgo(40) },
    { id: 'ast_048', tag: 'CNC-EDM-001', name: 'Electroerosionadora por Hilo', area: 'Maquinado', system: 'EDM', type: 'equipo', parentId: null, criticality: 'C', status: 'operando', brand: 'Sodick', model: 'ALN400Qs', serial: 'SOD-2019-4456', year: 2019, power: '8 kW', weight: '3.5 ton', location: 'Nave 3 - Bay 7', purchaseCost: 1100000, hoursOperated: 14500, lastMaintenance: daysAgo(35) },
    { id: 'ast_049', tag: 'ENS-BAL-001', name: 'Balanceadora Dinámica', area: 'Ensamble', system: 'Balanceo', type: 'equipo', parentId: null, criticality: 'C', status: 'operando', brand: 'Schenck', model: 'CAB 750', serial: 'SCH-2018-2267', year: 2018, power: '5 kW', weight: '2 ton', location: 'Nave 6 - Est. 10', purchaseCost: 420000, hoursOperated: 16500, lastMaintenance: daysAgo(55) },
    { id: 'ast_050', tag: 'UTL-CAL-001', name: 'Caldera Industrial 100 BHP', area: 'Utilidades', system: 'Vapor', type: 'equipo', parentId: null, criticality: 'A', status: 'operando', brand: 'Cleaver-Brooks', model: 'CBLE-100', serial: 'CLV-2018-5590', year: 2018, power: '100 BHP', weight: '8 ton', location: 'Cuarto de Calderas', purchaseCost: 1200000, hoursOperated: 25000, lastMaintenance: daysAgo(10) },
    { id: 'ast_051', tag: 'ENS-LN-002', name: 'Línea de Ensamble Secundaria', area: 'Ensamble', system: 'Líneas', type: 'equipo', parentId: null, criticality: 'B', status: 'operando', brand: 'FlexLink', model: 'XT', serial: 'FLX-2021-3312', year: 2021, power: '10 kW', weight: '7 ton', location: 'Nave 6 - Línea 2', purchaseCost: 1500000, hoursOperated: 9500, lastMaintenance: daysAgo(18) },
    { id: 'ast_052', tag: 'CAL-XRF-001', name: 'Espectrómetro XRF', area: 'Calidad', system: 'Análisis', type: 'equipo', parentId: null, criticality: 'C', status: 'operando', brand: 'Bruker', model: 'S8 TIGER', serial: 'BRU-2020-1134', year: 2020, power: '4 kW', weight: '1 ton', location: 'Lab. Calidad', purchaseCost: 1800000, hoursOperated: 7500, lastMaintenance: daysAgo(90) },
  ];


  /* ═══════════════════════════════════════
   * ÓRDENES DE TRABAJO (200+)
   * ═══════════════════════════════════════ */
  const workorderTemplates = [
    // Correctivas
    { prefix: 'Falla en sistema hidráulico', failureMode: 'Fuga de aceite', rootCause: 'Sello desgastado', type: 'correctivo' },
    { prefix: 'Falla eléctrica', failureMode: 'Cortocircuito', rootCause: 'Cable dañado', type: 'correctivo' },
    { prefix: 'Vibración excesiva', failureMode: 'Desbalanceo', rootCause: 'Rodamiento desgastado', type: 'correctivo' },
    { prefix: 'Sobrecalentamiento', failureMode: 'Temperatura alta', rootCause: 'Ventilador obstruido', type: 'correctivo' },
    { prefix: 'Falla en sensor', failureMode: 'Lectura errónea', rootCause: 'Sensor descalibrado', type: 'correctivo' },
    { prefix: 'Fuga de aire comprimido', failureMode: 'Pérdida de presión', rootCause: 'Conexión floja', type: 'correctivo' },
    { prefix: 'Falla en PLC', failureMode: 'Error de comunicación', rootCause: 'Módulo dañado', type: 'correctivo' },
    { prefix: 'Rotura de banda', failureMode: 'Paro de línea', rootCause: 'Desgaste por uso', type: 'correctivo' },
    { prefix: 'Falla en bomba', failureMode: 'Sin flujo', rootCause: 'Impulsor dañado', type: 'correctivo' },
    { prefix: 'Ruido anormal en motor', failureMode: 'Golpeteo', rootCause: 'Cojinete dañado', type: 'correctivo' },
    // Preventivas
    { prefix: 'MP - Lubricación general', type: 'preventivo' },
    { prefix: 'MP - Cambio de filtros', type: 'preventivo' },
    { prefix: 'MP - Inspección eléctrica', type: 'preventivo' },
    { prefix: 'MP - Cambio de aceite', type: 'preventivo' },
    { prefix: 'MP - Calibración de sensores', type: 'preventivo' },
    { prefix: 'MP - Alineación de ejes', type: 'preventivo' },
    { prefix: 'MP - Inspección de seguridades', type: 'preventivo' },
    { prefix: 'MP - Limpieza de sistema de enfriamiento', type: 'preventivo' },
    // Predictivas
    { prefix: 'MPd - Análisis de vibración', type: 'predictivo' },
    { prefix: 'MPd - Termografía', type: 'predictivo' },
    { prefix: 'MPd - Análisis de aceite', type: 'predictivo' },
    { prefix: 'MPd - Ultrasonido', type: 'predictivo' },
  ];

  const statuses = ['completada', 'completada', 'completada', 'completada', 'completada', 'completada', 'cerrada', 'cerrada', 'en_ejecucion', 'planificada', 'aprobada', 'solicitada'];
  const priorities = ['critica', 'alta', 'alta', 'media', 'media', 'media', 'baja', 'baja'];
  const technicians = ['usr_003', 'usr_004', 'usr_005', 'usr_007', 'usr_009'];

  function generateWorkOrders() {
    const orders = [];
    for (let i = 1; i <= 220; i++) {
      const template = pick(workorderTemplates);
      const asset = pick(assets);
      const status = pick(statuses);
      const dBack = rand(1, 180);
      const created = daysAgo(dBack);
      const isComplete = ['completada', 'cerrada'].includes(status);
      const estimatedHours = rand(1, 16);

      orders.push({
        id: `wo_${String(i).padStart(4, '0')}`,
        folio: `OT-${String(2024000 + i)}`,
        assetId: asset.id,
        assetTag: asset.tag,
        assetName: asset.name,
        area: asset.area,
        title: `${template.prefix} — ${asset.tag}`,
        description: `${template.prefix} en equipo ${asset.name} (${asset.tag}). ${template.failureMode ? 'Modo de falla: ' + template.failureMode + '.' : ''} Requiere atención ${template.type === 'correctivo' ? 'inmediata' : 'programada'}.`,
        type: template.type,
        priority: template.type === 'correctivo' ? pick(priorities) : 'media',
        status,
        failureMode: template.failureMode || null,
        rootCause: isComplete ? (template.rootCause || 'Desgaste normal') : null,
        assignedTo: pick(technicians),
        requestedBy: pick(['usr_006', 'usr_002', 'usr_010']),
        estimatedHours,
        actualHours: isComplete ? estimatedHours + rand(-2, 4) : null,
        materialCost: isComplete ? rand(500, 15000) : 0,
        laborCost: isComplete ? (estimatedHours + rand(-1, 3)) * 350 : 0,
        scheduledDate: daysAgo(dBack - rand(0, 3)),
        startedAt: ['en_ejecucion', 'completada', 'cerrada'].includes(status) ? daysAgo(dBack - rand(0, 2)) : null,
        completedAt: isComplete ? daysAgo(dBack - rand(1, 5)) : null,
        createdAt: created,
        safetyChecklist: {
          loto: isComplete ? true : null,
          ppe: isComplete ? true : null,
          permit: template.type === 'correctivo' && asset.criticality === 'A'
        },
        notes: isComplete ? 'Trabajo completado satisfactoriamente. Equipo entregado a producción.' : ''
      });
    }
    return orders;
  }


  /* ═══════════════════════════════════════
   * INVENTARIO DE REPUESTOS (100+)
   * ═══════════════════════════════════════ */
  const inventory = [
    // Rodamientos
    { id: 'inv_001', code: 'ROD-6205-2RS', name: 'Rodamiento 6205-2RS', category: 'Rodamientos', unit: 'pza', currentStock: 24, minStock: 10, maxStock: 50, reorderPoint: 15, unitCost: 185, location: 'A1-01', supplier: 'SKF México', leadTime: 5 },
    { id: 'inv_002', code: 'ROD-6308-2RS', name: 'Rodamiento 6308-2RS', category: 'Rodamientos', unit: 'pza', currentStock: 12, minStock: 6, maxStock: 30, reorderPoint: 10, unitCost: 420, location: 'A1-02', supplier: 'SKF México', leadTime: 5 },
    { id: 'inv_003', code: 'ROD-22210-E', name: 'Rodamiento Esférico 22210 E', category: 'Rodamientos', unit: 'pza', currentStock: 4, minStock: 4, maxStock: 12, reorderPoint: 6, unitCost: 1850, location: 'A1-03', supplier: 'FAG/Schaeffler', leadTime: 10 },
    { id: 'inv_004', code: 'ROD-NU310-E', name: 'Rodamiento Cilíndrico NU310', category: 'Rodamientos', unit: 'pza', currentStock: 6, minStock: 4, maxStock: 16, reorderPoint: 6, unitCost: 980, location: 'A1-04', supplier: 'SKF México', leadTime: 7 },
    { id: 'inv_005', code: 'ROD-7210-BEP', name: 'Rodamiento Angular 7210', category: 'Rodamientos', unit: 'pza', currentStock: 3, minStock: 4, maxStock: 12, reorderPoint: 6, unitCost: 1200, location: 'A1-05', supplier: 'SKF México', leadTime: 10 },
    // Sellos y empaques
    { id: 'inv_006', code: 'SEL-HID-50X70', name: 'Sello Hidráulico 50x70x10', category: 'Sellos', unit: 'pza', currentStock: 18, minStock: 10, maxStock: 40, reorderPoint: 15, unitCost: 95, location: 'A2-01', supplier: 'Parker Hannifin', leadTime: 7 },
    { id: 'inv_007', code: 'SEL-HID-80X100', name: 'Sello Hidráulico 80x100x12', category: 'Sellos', unit: 'pza', currentStock: 8, minStock: 8, maxStock: 30, reorderPoint: 12, unitCost: 145, location: 'A2-02', supplier: 'Parker Hannifin', leadTime: 7 },
    { id: 'inv_008', code: 'ORI-VIT-100', name: 'O-Ring Vitón Kit (100 pzs)', category: 'Sellos', unit: 'kit', currentStock: 5, minStock: 3, maxStock: 10, reorderPoint: 4, unitCost: 650, location: 'A2-03', supplier: 'Trelleborg', leadTime: 14 },
    // Filtros
    { id: 'inv_009', code: 'FIL-ACE-HF35', name: 'Filtro Aceite Hidráulico HF35', category: 'Filtros', unit: 'pza', currentStock: 15, minStock: 8, maxStock: 30, reorderPoint: 12, unitCost: 320, location: 'A3-01', supplier: 'Donaldson', leadTime: 5 },
    { id: 'inv_010', code: 'FIL-AIR-P780', name: 'Filtro de Aire P780522', category: 'Filtros', unit: 'pza', currentStock: 10, minStock: 6, maxStock: 24, reorderPoint: 8, unitCost: 280, location: 'A3-02', supplier: 'Donaldson', leadTime: 5 },
    { id: 'inv_011', code: 'FIL-ACE-CNC', name: 'Filtro Aceite CNC Mazak', category: 'Filtros', unit: 'pza', currentStock: 6, minStock: 4, maxStock: 16, reorderPoint: 6, unitCost: 450, location: 'A3-03', supplier: 'Mazak México', leadTime: 15 },
    // Bandas y correas
    { id: 'inv_012', code: 'BAN-5V-1600', name: 'Banda 5V-1600', category: 'Bandas', unit: 'pza', currentStock: 8, minStock: 4, maxStock: 16, reorderPoint: 6, unitCost: 185, location: 'A4-01', supplier: 'Gates', leadTime: 5 },
    { id: 'inv_013', code: 'BAN-HTD-14M', name: 'Banda HTD 14M-2100', category: 'Bandas', unit: 'pza', currentStock: 3, minStock: 2, maxStock: 8, reorderPoint: 3, unitCost: 850, location: 'A4-02', supplier: 'Gates', leadTime: 10 },
    { id: 'inv_014', code: 'BAN-DENT-T10', name: 'Banda Dentada T10-1500', category: 'Bandas', unit: 'pza', currentStock: 5, minStock: 3, maxStock: 12, reorderPoint: 4, unitCost: 420, location: 'A4-03', supplier: 'Optibelt', leadTime: 7 },
    // Aceites y lubricantes
    { id: 'inv_015', code: 'ACE-HID-AW68', name: 'Aceite Hidráulico AW-68 (20L)', category: 'Lubricantes', unit: 'cubeta', currentStock: 8, minStock: 4, maxStock: 16, reorderPoint: 6, unitCost: 1450, location: 'B1-01', supplier: 'Mobil Industrial', leadTime: 3 },
    { id: 'inv_016', code: 'ACE-CNC-S10', name: 'Aceite Corte Soluble (20L)', category: 'Lubricantes', unit: 'cubeta', currentStock: 6, minStock: 4, maxStock: 12, reorderPoint: 5, unitCost: 1250, location: 'B1-02', supplier: 'Castrol', leadTime: 3 },
    { id: 'inv_017', code: 'GRA-EP2-CART', name: 'Grasa EP-2 Cartucho 400g', category: 'Lubricantes', unit: 'pza', currentStock: 30, minStock: 12, maxStock: 60, reorderPoint: 20, unitCost: 85, location: 'B1-03', supplier: 'Mobil Industrial', leadTime: 3 },
    { id: 'inv_018', code: 'ACE-ENG-15W', name: 'Aceite Engranajes 15W-40 (20L)', category: 'Lubricantes', unit: 'cubeta', currentStock: 4, minStock: 3, maxStock: 10, reorderPoint: 4, unitCost: 1680, location: 'B1-04', supplier: 'Shell', leadTime: 5 },
    // Eléctricos
    { id: 'inv_019', code: 'CON-AC3-32A', name: 'Contactor AC3 32A 3P', category: 'Eléctrico', unit: 'pza', currentStock: 8, minStock: 4, maxStock: 16, reorderPoint: 6, unitCost: 680, location: 'C1-01', supplier: 'Schneider Electric', leadTime: 5 },
    { id: 'inv_020', code: 'CON-AC3-65A', name: 'Contactor AC3 65A 3P', category: 'Eléctrico', unit: 'pza', currentStock: 4, minStock: 3, maxStock: 10, reorderPoint: 4, unitCost: 1250, location: 'C1-02', supplier: 'Schneider Electric', leadTime: 7 },
    { id: 'inv_021', code: 'REL-TER-25A', name: 'Relevador Térmico 18-25A', category: 'Eléctrico', unit: 'pza', currentStock: 6, minStock: 4, maxStock: 12, reorderPoint: 5, unitCost: 520, location: 'C1-03', supplier: 'Schneider Electric', leadTime: 5 },
    { id: 'inv_022', code: 'VFD-ABB-22K', name: 'Variador Frecuencia ABB 22kW', category: 'Eléctrico', unit: 'pza', currentStock: 2, minStock: 1, maxStock: 4, reorderPoint: 2, unitCost: 18500, location: 'C2-01', supplier: 'ABB México', leadTime: 20 },
    { id: 'inv_023', code: 'FUS-NH-200A', name: 'Fusible NH Tamaño 1 200A', category: 'Eléctrico', unit: 'pza', currentStock: 12, minStock: 6, maxStock: 24, reorderPoint: 8, unitCost: 185, location: 'C1-04', supplier: 'Bussmann', leadTime: 3 },
    { id: 'inv_024', code: 'SEN-PRX-M18', name: 'Sensor Proximidad M18 PNP', category: 'Eléctrico', unit: 'pza', currentStock: 10, minStock: 6, maxStock: 20, reorderPoint: 8, unitCost: 380, location: 'C3-01', supplier: 'IFM Electronic', leadTime: 7 },
    { id: 'inv_025', code: 'SEN-TMP-PT100', name: 'Sensor Temperatura PT100', category: 'Eléctrico', unit: 'pza', currentStock: 8, minStock: 4, maxStock: 16, reorderPoint: 6, unitCost: 450, location: 'C3-02', supplier: 'Omega', leadTime: 10 },
    // Neumáticos
    { id: 'inv_026', code: 'CIL-NEU-50X100', name: 'Cilindro Neumático 50x100', category: 'Neumática', unit: 'pza', currentStock: 4, minStock: 2, maxStock: 8, reorderPoint: 3, unitCost: 1850, location: 'D1-01', supplier: 'Festo', leadTime: 10 },
    { id: 'inv_027', code: 'VLV-SOL-5-2', name: 'Válvula Solenoide 5/2 1/4"', category: 'Neumática', unit: 'pza', currentStock: 6, minStock: 4, maxStock: 12, reorderPoint: 5, unitCost: 920, location: 'D1-02', supplier: 'Festo', leadTime: 7 },
    { id: 'inv_028', code: 'FRL-NEU-1-4', name: 'Unidad FRL 1/4"', category: 'Neumática', unit: 'pza', currentStock: 3, minStock: 2, maxStock: 8, reorderPoint: 3, unitCost: 1250, location: 'D1-03', supplier: 'SMC', leadTime: 10 },
    // Hidráulicos
    { id: 'inv_029', code: 'BOM-HID-VK', name: 'Bomba Hidráulica Vickers V20', category: 'Hidráulica', unit: 'pza', currentStock: 1, minStock: 1, maxStock: 3, reorderPoint: 1, unitCost: 28500, location: 'D2-01', supplier: 'Eaton Hydraulics', leadTime: 25 },
    { id: 'inv_030', code: 'VLV-DIR-4W', name: 'Válvula Direccional 4 Vías', category: 'Hidráulica', unit: 'pza', currentStock: 3, minStock: 2, maxStock: 6, reorderPoint: 3, unitCost: 4500, location: 'D2-02', supplier: 'Bosch Rexroth', leadTime: 15 },
    { id: 'inv_031', code: 'MAN-HID-RD', name: 'Manguera Hidráulica R2 1/2" (m)', category: 'Hidráulica', unit: 'metro', currentStock: 25, minStock: 10, maxStock: 50, reorderPoint: 15, unitCost: 180, location: 'D2-03', supplier: 'Parker Hannifin', leadTime: 3 },
    // Soldadura consumibles
    { id: 'inv_032', code: 'ELE-SOL-7018', name: 'Electrodo 7018 3/32" (5kg)', category: 'Soldadura', unit: 'caja', currentStock: 8, minStock: 4, maxStock: 16, reorderPoint: 6, unitCost: 350, location: 'E1-01', supplier: 'Lincoln Electric', leadTime: 3 },
    { id: 'inv_033', code: 'ALA-MIG-035', name: 'Alambre MIG ER70S-6 0.035"', category: 'Soldadura', unit: 'rollo', currentStock: 6, minStock: 4, maxStock: 12, reorderPoint: 5, unitCost: 580, location: 'E1-02', supplier: 'Lincoln Electric', leadTime: 5 },
    { id: 'inv_034', code: 'TOB-SOL-RB', name: 'Tobera Soldadura Robot FANUC', category: 'Soldadura', unit: 'pza', currentStock: 15, minStock: 10, maxStock: 40, reorderPoint: 15, unitCost: 250, location: 'E1-03', supplier: 'FANUC México', leadTime: 15 },
    { id: 'inv_035', code: 'TIP-SOL-M8', name: 'Tip Contacto M8 CuCrZr', category: 'Soldadura', unit: 'pza', currentStock: 40, minStock: 20, maxStock: 100, reorderPoint: 30, unitCost: 45, location: 'E1-04', supplier: 'FANUC México', leadTime: 15 },
    // Herramientas de corte CNC
    { id: 'inv_036', code: 'INS-CNMG-432', name: 'Inserto CNMG 432 Carburo', category: 'Herramientas', unit: 'pza', currentStock: 30, minStock: 20, maxStock: 80, reorderPoint: 25, unitCost: 125, location: 'F1-01', supplier: 'Sandvik Coromant', leadTime: 7 },
    { id: 'inv_037', code: 'INS-WNMG-332', name: 'Inserto WNMG 332 Cermet', category: 'Herramientas', unit: 'pza', currentStock: 20, minStock: 10, maxStock: 50, reorderPoint: 15, unitCost: 165, location: 'F1-02', supplier: 'Sandvik Coromant', leadTime: 7 },
    { id: 'inv_038', code: 'FRE-CAR-12', name: 'Fresa Carburo Ø12mm 4F', category: 'Herramientas', unit: 'pza', currentStock: 8, minStock: 4, maxStock: 16, reorderPoint: 6, unitCost: 680, location: 'F1-03', supplier: 'Kennametal', leadTime: 10 },
    { id: 'inv_039', code: 'BRO-CAR-10', name: 'Broca Carburo Ø10mm', category: 'Herramientas', unit: 'pza', currentStock: 12, minStock: 6, maxStock: 24, reorderPoint: 8, unitCost: 350, location: 'F1-04', supplier: 'Dormer Pramet', leadTime: 7 },
    { id: 'inv_040', code: 'MAC-M10-HSS', name: 'Machuelo M10x1.5 HSS', category: 'Herramientas', unit: 'pza', currentStock: 10, minStock: 6, maxStock: 20, reorderPoint: 8, unitCost: 120, location: 'F1-05', supplier: 'Dormer Pramet', leadTime: 5 },
    // Misceláneos
    { id: 'inv_041', code: 'LIM-IND-20L', name: 'Limpiador Industrial (20L)', category: 'Consumibles', unit: 'cubeta', currentStock: 4, minStock: 2, maxStock: 8, reorderPoint: 3, unitCost: 480, location: 'G1-01', supplier: 'CRC Industries', leadTime: 3 },
    { id: 'inv_042', code: 'TRA-ABS-IND', name: 'Trapo Absorbente Industrial (paq)', category: 'Consumibles', unit: 'paq', currentStock: 15, minStock: 8, maxStock: 30, reorderPoint: 10, unitCost: 120, location: 'G1-02', supplier: 'Kimberly-Clark', leadTime: 3 },
    { id: 'inv_043', code: 'SIL-IND-300', name: 'Silicón Industrial 300ml', category: 'Consumibles', unit: 'pza', currentStock: 20, minStock: 10, maxStock: 40, reorderPoint: 15, unitCost: 85, location: 'G1-03', supplier: 'Loctite', leadTime: 3 },
    { id: 'inv_044', code: 'CIN-AIS-3M', name: 'Cinta Aislante 3M Super 33+', category: 'Consumibles', unit: 'rollo', currentStock: 25, minStock: 12, maxStock: 50, reorderPoint: 15, unitCost: 65, location: 'G1-04', supplier: '3M México', leadTime: 3 },
    { id: 'inv_045', code: 'ADH-LOC-242', name: 'Adhesivo Loctite 242 (50ml)', category: 'Consumibles', unit: 'pza', currentStock: 8, minStock: 4, maxStock: 16, reorderPoint: 6, unitCost: 280, location: 'G1-05', supplier: 'Loctite', leadTime: 5 },
  ];


  /* ═══════════════════════════════════════
   * PLANES PREVENTIVOS
   * ═══════════════════════════════════════ */
  const preventivePlans = [
    { id: 'pp_001', assetId: 'ast_001', assetTag: 'EST-PH-001', name: 'MP Mensual Prensa 500T', frequency: 'mensual', intervalDays: 30, estimatedHours: 4, tasks: 'Inspección de presión, revisión de sellos, lubricación de guías, verificación de sensores, limpieza de filtros', status: 'activo', nextDueDate: daysFromNow(18), lastExecuted: daysAgo(12), compliance: 92 },
    { id: 'pp_002', assetId: 'ast_001', assetTag: 'EST-PH-001', name: 'MP Anual Prensa 500T', frequency: 'anual', intervalDays: 365, estimatedHours: 24, tasks: 'Overhaul completo: cambio de aceite hidráulico, sellos principales, inspección de cilindro, calibración de presión, pruebas de seguridad', status: 'activo', nextDueDate: daysFromNow(120), lastExecuted: daysAgo(245), compliance: 100 },
    { id: 'pp_003', assetId: 'ast_006', assetTag: 'SOL-RB-001', name: 'MP Trimestral Robot FANUC #1', frequency: 'trimestral', intervalDays: 90, estimatedHours: 8, tasks: 'Lubricación de ejes, inspección de cables, verificación de repetibilidad, limpieza de encoders, backup de programa', status: 'activo', nextDueDate: daysFromNow(87), lastExecuted: daysAgo(3), compliance: 95 },
    { id: 'pp_004', assetId: 'ast_012', assetTag: 'CNC-TN-001', name: 'MP Semanal Torno CNC #1', frequency: 'semanal', intervalDays: 7, estimatedHours: 1, tasks: 'Verificar nivel de aceite, limpiar viruta, verificar presión hidráulica, inspección visual de bandas', status: 'activo', nextDueDate: daysFromNow(0), lastExecuted: daysAgo(7), compliance: 88 },
    { id: 'pp_005', assetId: 'ast_014', assetTag: 'CNC-CV-001', name: 'MP Mensual Centro Maquinado Haas', frequency: 'mensual', intervalDays: 30, estimatedHours: 3, tasks: 'Cambio/limpieza de filtros, verificación de geometría, inspección de husillo, calibración de herramientas', status: 'activo', nextDueDate: daysFromNow(20), lastExecuted: daysAgo(10), compliance: 90 },
    { id: 'pp_006', assetId: 'ast_018', assetTag: 'TT-HRN-001', name: 'MP Mensual Horno de Temple', frequency: 'mensual', intervalDays: 30, estimatedHours: 6, tasks: 'Inspección de refractario, calibración de pirómetros, prueba de atmósfera, verificación de sistema de enfriamiento', status: 'activo', nextDueDate: daysFromNow(24), lastExecuted: daysAgo(6), compliance: 96 },
    { id: 'pp_007', assetId: 'ast_033', assetTag: 'UTL-CMP-001', name: 'MP Semanal Compresor #1', frequency: 'semanal', intervalDays: 7, estimatedHours: 1, tasks: 'Drenar condensados, verificar presión, inspección de fugas, registrar amperaje', status: 'activo', nextDueDate: daysFromNow(0), lastExecuted: daysAgo(7), compliance: 94 },
    { id: 'pp_008', assetId: 'ast_033', assetTag: 'UTL-CMP-001', name: 'MP Trimestral Compresor #1', frequency: 'trimestral', intervalDays: 90, estimatedHours: 4, tasks: 'Cambio de filtros de aceite y aire, análisis de aceite, inspección de válvulas, limpieza de radiador', status: 'activo', nextDueDate: daysFromNow(65), lastExecuted: daysAgo(25), compliance: 100 },
    { id: 'pp_009', assetId: 'ast_036', assetTag: 'UTL-CHI-001', name: 'MP Mensual Chiller 100TR', frequency: 'mensual', intervalDays: 30, estimatedHours: 3, tasks: 'Registrar presiones de refrigerante, verificar temperatura de condensado, inspección de compresor, limpiar serpentín', status: 'activo', nextDueDate: daysFromNow(15), lastExecuted: daysAgo(15), compliance: 87 },
    { id: 'pp_010', assetId: 'ast_050', assetTag: 'UTL-CAL-001', name: 'MP Mensual Caldera 100BHP', frequency: 'mensual', intervalDays: 30, estimatedHours: 4, tasks: 'Purga de fondo, análisis de agua, inspección de quemador, verificación de presostatos, prueba de válvulas de seguridad', status: 'activo', nextDueDate: daysFromNow(20), lastExecuted: daysAgo(10), compliance: 98 },
    { id: 'pp_011', assetId: 'ast_022', assetTag: 'PIN-CAB-001', name: 'MP Semanal Cabina Pintura', frequency: 'semanal', intervalDays: 7, estimatedHours: 2, tasks: 'Limpieza de filtros de cabina, verificación de pistolas, presión de atomización, inspección de transportador', status: 'activo', nextDueDate: daysFromNow(3), lastExecuted: daysAgo(4), compliance: 91 },
    { id: 'pp_012', assetId: 'ast_026', assetTag: 'ENS-LN-001', name: 'MP Quincenal Línea Ensamble', frequency: 'quincenal', intervalDays: 15, estimatedHours: 2, tasks: 'Lubricación de cadenas, inspección de sensores, verificación de torque, prueba de poka-yokes', status: 'activo', nextDueDate: daysFromNow(10), lastExecuted: daysAgo(5), compliance: 85 },
  ];


  /* ═══════════════════════════════════════
   * ANÁLISIS AMEF
   * ═══════════════════════════════════════ */
  const amefAnalysis = [
    { id: 'amef_001', assetId: 'ast_001', assetTag: 'EST-PH-001', component: 'Cilindro hidráulico principal', function: 'Generar fuerza de estampado 500T', failureMode: 'Pérdida de presión', failureEffect: 'Pieza defectuosa, paro de línea', failureCause: 'Desgaste de sellos del pistón', severity: 9, occurrence: 4, detection: 5, npr: 180, action: 'Implementar plan preventivo de cambio de sellos cada 6 meses', actionOwner: 'usr_003', newSeverity: 9, newOccurrence: 2, newDetection: 3, newNpr: 54, status: 'implementado' },
    { id: 'amef_002', assetId: 'ast_001', assetTag: 'EST-PH-001', component: 'Sistema hidráulico', function: 'Suministrar aceite a presión', failureMode: 'Contaminación del aceite', failureEffect: 'Desgaste prematuro de componentes', failureCause: 'Filtros saturados', severity: 7, occurrence: 5, detection: 4, npr: 140, action: 'Análisis de aceite trimestral + cambio de filtros mensual', actionOwner: 'usr_003', newSeverity: 7, newOccurrence: 2, newDetection: 3, newNpr: 42, status: 'implementado' },
    { id: 'amef_003', assetId: 'ast_006', assetTag: 'SOL-RB-001', component: 'Servo motor eje J2', function: 'Movimiento del brazo robot', failureMode: 'Pérdida de torque', failureEffect: 'Posicionamiento impreciso, soldadura defectuosa', failureCause: 'Desgaste de encoder', severity: 8, occurrence: 3, detection: 6, npr: 144, action: 'Monitoreo de vibración trimestral + backup de parámetros', actionOwner: 'usr_004', newSeverity: 8, newOccurrence: 2, newDetection: 3, newNpr: 48, status: 'implementado' },
    { id: 'amef_004', assetId: 'ast_012', assetTag: 'CNC-TN-001', component: 'Husillo principal', function: 'Girar pieza a velocidad programada', failureMode: 'Vibración excesiva', failureEffect: 'Acabado superficial deficiente, dimensiones fuera de tolerancia', failureCause: 'Rodamientos desgastados', severity: 8, occurrence: 3, detection: 4, npr: 96, action: 'Análisis de vibración mensual + lubricación programada', actionOwner: 'usr_005', newSeverity: 8, newOccurrence: 2, newDetection: 3, newNpr: 48, status: 'en_proceso' },
    { id: 'amef_005', assetId: 'ast_018', assetTag: 'TT-HRN-001', component: 'Bobina de inducción', function: 'Generar campo magnético para calentamiento', failureMode: 'Falla de aislamiento', failureEffect: 'Paro total del horno, riesgo de cortocircuito', failureCause: 'Degradación del aislamiento por temperatura', severity: 10, occurrence: 2, detection: 5, npr: 100, action: 'Prueba de aislamiento semestral + termografía mensual', actionOwner: 'usr_004', newSeverity: 10, newOccurrence: 1, newDetection: 3, newNpr: 30, status: 'implementado' },
    { id: 'amef_006', assetId: 'ast_033', assetTag: 'UTL-CMP-001', component: 'Etapa de compresión', function: 'Comprimir aire a 7 bar', failureMode: 'Caída de presión', failureEffect: 'Actuadores neumáticos fallan, paro de producción', failureCause: 'Válvulas de admisión desgastadas', severity: 9, occurrence: 3, detection: 5, npr: 135, action: 'Monitoreo de presión en tiempo real + MP trimestral de válvulas', actionOwner: 'usr_005', newSeverity: 9, newOccurrence: 2, newDetection: 3, newNpr: 54, status: 'implementado' },
    { id: 'amef_007', assetId: 'ast_015', assetTag: 'CNC-CV-002', component: 'Cambiador de herramientas', function: 'Cambiar herramienta automáticamente', failureMode: 'Herramienta no suelta/toma', failureEffect: 'Paro de máquina, posible colisión', failureCause: 'Resortes de sujeción debilitados', severity: 9, occurrence: 4, detection: 6, npr: 216, action: 'Inspección de resortes trimestral + limpieza del cono', actionOwner: 'usr_003', newSeverity: null, newOccurrence: null, newDetection: null, newNpr: null, status: 'pendiente' },
    { id: 'amef_008', assetId: 'ast_050', assetTag: 'UTL-CAL-001', component: 'Quemador principal', function: 'Combustión de gas para generar vapor', failureMode: 'Falla de encendido', failureEffect: 'Sin vapor, paro de tratamientos térmicos', failureCause: 'Electrodo de ignición sucio/desgastado', severity: 8, occurrence: 3, detection: 4, npr: 96, action: 'Limpieza mensual de electrodo + inspección de bujía', actionOwner: 'usr_007', newSeverity: 8, newOccurrence: 1, newDetection: 3, newNpr: 24, status: 'implementado' },
  ];


  /* ═══════════════════════════════════════
   * CATÁLOGOS
   * ═══════════════════════════════════════ */
  const catalogs = [
    // Áreas
    { id: 'cat_001', type: 'area', code: 'EST', name: 'Estampado', active: true },
    { id: 'cat_002', type: 'area', code: 'SOL', name: 'Soldadura', active: true },
    { id: 'cat_003', type: 'area', code: 'CNC', name: 'Maquinado', active: true },
    { id: 'cat_004', type: 'area', code: 'TT', name: 'Tratamientos Térmicos', active: true },
    { id: 'cat_005', type: 'area', code: 'PIN', name: 'Pintura', active: true },
    { id: 'cat_006', type: 'area', code: 'ENS', name: 'Ensamble', active: true },
    { id: 'cat_007', type: 'area', code: 'CAL', name: 'Calidad', active: true },
    { id: 'cat_008', type: 'area', code: 'UTL', name: 'Utilidades', active: true },
    { id: 'cat_009', type: 'area', code: 'LOG', name: 'Logística', active: true },
    // Tipos de falla
    { id: 'cat_020', type: 'failure_type', code: 'MEC', name: 'Mecánica', active: true },
    { id: 'cat_021', type: 'failure_type', code: 'ELE', name: 'Eléctrica', active: true },
    { id: 'cat_022', type: 'failure_type', code: 'HID', name: 'Hidráulica', active: true },
    { id: 'cat_023', type: 'failure_type', code: 'NEU', name: 'Neumática', active: true },
    { id: 'cat_024', type: 'failure_type', code: 'CTR', name: 'Control/PLC', active: true },
    { id: 'cat_025', type: 'failure_type', code: 'INS', name: 'Instrumentación', active: true },
    { id: 'cat_026', type: 'failure_type', code: 'LUB', name: 'Lubricación', active: true },
    // Causas raíz
    { id: 'cat_040', type: 'root_cause', code: 'DES', name: 'Desgaste normal', active: true },
    { id: 'cat_041', type: 'root_cause', code: 'MAL', name: 'Mala operación', active: true },
    { id: 'cat_042', type: 'root_cause', code: 'FLM', name: 'Falta de lubricación/mantenimiento', active: true },
    { id: 'cat_043', type: 'root_cause', code: 'DEF', name: 'Defecto de fabricación', active: true },
    { id: 'cat_044', type: 'root_cause', code: 'SOB', name: 'Sobrecarga', active: true },
    { id: 'cat_045', type: 'root_cause', code: 'CON', name: 'Contaminación', active: true },
    { id: 'cat_046', type: 'root_cause', code: 'VIB', name: 'Vibración', active: true },
    { id: 'cat_047', type: 'root_cause', code: 'TMP', name: 'Temperatura', active: true },
  ];


  /* ═══════════════════════════════════════
   * FUNCIÓN PRINCIPAL DE SEED
   * ═══════════════════════════════════════ */
  async function seed() {
    console.log('[Seed] Iniciando carga de datos de demostración...');

    const workorders = generateWorkOrders();

    await CMMSDatabase.bulkCreate('users', users);
    console.log(`[Seed] ✓ ${users.length} usuarios`);

    await CMMSDatabase.bulkCreate('assets', assets);
    console.log(`[Seed] ✓ ${assets.length} activos/equipos`);

    await CMMSDatabase.bulkCreate('workorders', workorders);
    console.log(`[Seed] ✓ ${workorders.length} órdenes de trabajo`);

    await CMMSDatabase.bulkCreate('inventory', inventory);
    console.log(`[Seed] ✓ ${inventory.length} repuestos`);

    await CMMSDatabase.bulkCreate('preventive_plans', preventivePlans);
    console.log(`[Seed] ✓ ${preventivePlans.length} planes preventivos`);

    await CMMSDatabase.bulkCreate('amef', amefAnalysis);
    console.log(`[Seed] ✓ ${amefAnalysis.length} análisis AMEF`);

    await CMMSDatabase.bulkCreate('catalogs', catalogs);
    console.log(`[Seed] ✓ ${catalogs.length} catálogos`);

    console.log('[Seed] ✅ Datos de demostración cargados exitosamente');
  }

  return { seed, users, assets, inventory, preventivePlans, amefAnalysis, catalogs };
})();
