// ============================================================
// MOTOR DE RECOMENDACIÓN SOPHOS
// ============================================================
// REGLAS DE DIMENSIONAMIENTO (leer antes de modificar):
//
// ── FIREWALL ────────────────────────────────────────────────
// El driver PRINCIPAL es el throughput WAN, no los usuarios.
// Un enlace de 10 Gbps necesita un firewall que pueda procesar
// 10 Gbps con todas las funciones de seguridad activas.
// Los usuarios sirven de guía secundaria para el factor de forma.
//
//   Throughput requerido = WAN_Gbps × 1.3  (margen de seguridad)
//   Selección: el modelo MÁS PEQUEÑO cuyo throughputFW >= requerido
//
// ── SWITCH ──────────────────────────────────────────────────
// Drivers: puertos necesarios, necesidad de PoE, velocidad de puerto.
//
//   Puertos necesarios = ceil(wiredPorts × 1.3), mínimo 8
//
//   PoE en el switch es necesaria si:
//     a) El usuario activa "Requiere PoE" (para cámaras, teléfonos VoIP, etc.)
//     b) Se va a conectar APs al switch (los APs siempre necesitan PoE)
//
//   Velocidad de puerto:
//     - CS200 (2.5GE) SOLO si el AP seleccionado tiene puerto 2.5GE
//       (AP6 420E, AP6 840, AP6 840E, AP6 420X)
//     - CS100 (1GE) es suficiente si el AP es AP6 420 (tiene puerto 1GE)
//       o si no hay APs
//
//   PoE++: obligatorio SOLO si el AP seleccionado es AP6 840E
//
// ── ACCESS POINT ────────────────────────────────────────────
// Driver: usuarios WiFi POR ZONA de cobertura (no el total de usuarios).
// wifiUsersPerZone = cuántos usuarios hay simultáneamente en la zona
// que cubre UN solo AP.
//
//   <= 30 usuarios/zona  → AP6 420  (WiFi 6, 1GE, baja densidad)
//   <= 50 usuarios/zona  → AP6 420E (WiFi 6E, 2.5GE, media densidad)
//   <= 100 usuarios/zona → AP6 840  (WiFi 6, 4 radios, alta densidad)
//   > 100 usuarios/zona  → AP6 840E (WiFi 6E, 4 radios, muy alta densidad)
//   Exterior             → AP6 420X (outdoor, independiente de densidad)
//   Si wifiE=true: preferir variante E cuando está disponible
//
//   Cantidad de APs = ceil(totalUsuariosWifi / ap.concurrentUsers)
//   totalUsuariosWifi = aproximado como (users × 0.8) si wifiUsersPerZone > 0
//   porque no todos los dispositivos son WiFi (hay algunos cableados)
// ============================================================

import { FIREWALLS, SWITCHES, ACCESS_POINTS, CALC_CONSTANTS } from '../data/sophosHardware.js'

export function recommend(inputs) {
  const {
    users,
    throughputGbps,
    wiredPorts,
    needsPoe,
    wifiUsersPerZone,
    wifiDensity,
    outdoorWifi,
    wifiE,
  } = inputs

  // ── PASO 1: SELECCIÓN DEL ACCESS POINT ───────────────────
  // Se hace PRIMERO porque el AP determina los requisitos del switch
  const ap = selectAP({ wifiUsersPerZone, wifiDensity, outdoorWifi, wifiE })
  const apCount = ap
    ? Math.max(1, Math.ceil((users * 0.8) / ap.concurrentUsers))
    : 0

  // ── PASO 2: SELECCIÓN DEL FIREWALL ───────────────────────
  // Driver primario: throughput WAN con margen del 30%
  const requiredFWThroughput = throughputGbps * CALC_CONSTANTS.OVERSIZE_FACTOR

  // Filtrar solo por throughput mínimo (criterio técnico estricto)
  const validFWs = FIREWALLS.filter(fw => fw.throughputFW >= requiredFWThroughput)

  // Entre los válidos, preferir los que el número de usuarios cae en su rango ideal
  // Esto no descarta nada, solo prioriza
  validFWs.sort((a, b) => {
    const aIdeal = users >= a.targetUsers[0] && users <= a.targetUsers[1]
    const bIdeal = users >= b.targetUsers[0] && users <= b.targetUsers[1]
    if (aIdeal && !bIdeal) return -1   // a es mejor
    if (!aIdeal && bIdeal) return 1    // b es mejor
    return a.throughputFW - b.throughputFW  // mismo nivel: elegir menor throughput
  })

  // El primero de la lista ordenada es el más apropiado
  // Si ninguno cumple throughput (> 145 Gbps), tomar el mayor disponible
  const firewall = validFWs[0] || FIREWALLS[FIREWALLS.length - 1]

  // ── PASO 3: SELECCIÓN DEL SWITCH ─────────────────────────
  const portsNeeded = Math.max(8, Math.ceil(wiredPorts * CALC_CONSTANTS.OVERSIZE_FACTOR))

  // ¿Necesita PoE el switch?
  // Sí si: el usuario lo activa (cámaras/VoIP) O si hay APs (siempre necesitan PoE)
  const switchNeedsPoE = needsPoe || (ap !== null && wifiUsersPerZone > 0)

  // ¿Necesita PoE++ (802.3bt)?
  // Solo el AP6 840E necesita PoE++
  const switchNeedsPoeXXX = ap?.id === 'ap6-840e'

  // ¿El AP se beneficia de puerto 2.5GE en el switch?
  // Solo los AP con portSpeed '2.5GE' se benefician de switches CS200
  // AP6 420 tiene 1GE → no necesita CS200
  const apNeedsMultiGig = ap !== null && ap.portSpeed === '2.5GE'

  // Calcular presupuesto PoE necesario para los APs
  const poeRequiredForAPs = ap ? apCount * ap.poePower : 0

  // Filtrar switches según los requisitos
  let eligibleSwitches = SWITCHES.filter(sw => {
    // Suficientes puertos
    if (sw.ports < portsNeeded) return false

    // PoE requerida y el switch no la tiene
    if (switchNeedsPoE && !sw.poe) return false

    // PoE++ requerida (solo AP6 840E)
    if (switchNeedsPoeXXX && sw.poeStandard !== '802.3bt (PoE++)') return false

    // Presupuesto PoE suficiente para los APs
    if (sw.poe && poeRequiredForAPs > sw.poeBudget) return false

    return true
  })

  // Si el AP necesita 2.5GE: preferir CS200, pero no forzar si no hay opciones
  if (apNeedsMultiGig) {
    const cs200Options = eligibleSwitches.filter(sw => sw.series === 'CS200')
    if (cs200Options.length > 0) eligibleSwitches = cs200Options
  }
  // Si el AP es 1GE (AP6 420) o no hay AP: CS100 es suficiente, no forzar CS200

  // Ordenar por número de puertos ascendente: elegir el más pequeño que cumpla
  eligibleSwitches.sort((a, b) => a.ports - b.ports)

  // Fallback: si ninguno cumple todos los requisitos, tomar el más capaz
  const sw = eligibleSwitches[0] || SWITCHES[SWITCHES.length - 1]

  // ── PASO 4: ADVERTENCIAS TÉCNICAS ────────────────────────
  const warnings = []

  // Advertencia: FW sobredimensionado para el número de usuarios
  const fwIsOverkill = firewall.targetUsers[0] > users * 2
  if (fwIsOverkill) {
    warnings.push(
      `ℹ️ El ${firewall.model} está sobredimensionado para ${users} usuarios, pero es necesario porque el enlace WAN de ${throughputGbps} Gbps requiere ${requiredFWThroughput.toFixed(1)} Gbps de throughput de firewall. Considere si realmente usa todo ese ancho de banda.`
    )
  }

  // Advertencia: AP6 840E requiere PoE++
  if (ap?.id === 'ap6-840e') {
    warnings.push(
      `⚠️ El AP6 840E requiere PoE++ (802.3bt, 50W por AP). El switch ${sw.model} lo soporta. Si usa otro switch, verifique compatibilidad PoE++.`
    )
  }

  // Advertencia: presupuesto PoE ajustado
  if (sw.poe && poeRequiredForAPs > 0 && poeRequiredForAPs > sw.poeBudget * 0.85) {
    warnings.push(
      `⚠️ El presupuesto PoE del ${sw.model} (${sw.poeBudget}W) está al ${Math.round((poeRequiredForAPs / sw.poeBudget) * 100)}% de capacidad con ${apCount} AP(s). Considere distribuir los APs en múltiples switches.`
    )
  }

  // Advertencia: switch sin PoE pero hay APs
  if (ap && wifiUsersPerZone > 0 && !sw.poe) {
    warnings.push(
      `⚠️ Los APs necesitan PoE para funcionar. Verifique que el switch o un inyector PoE provea alimentación a los APs.`
    )
  }

  // ── PASO 5: RESUMEN DE CÁLCULO ───────────────────────────
  const calcSummary = {
    requiredFWThroughput: requiredFWThroughput.toFixed(1),
    portsNeeded,
    estimatedWifiBandwidth: wifiUsersPerZone > 0
      ? ((users * 0.8) * CALC_CONSTANTS.BW_PER_WIFI_USER[wifiDensity] / 1000).toFixed(2)
      : 0,
    poeRequiredForAPs,
    apNeedsMultiGig,
    switchNeedsPoE,
  }

  return { firewall, switch: sw, accessPoint: ap, apCount, warnings, calcSummary }
}

// ── FUNCIÓN AUXILIAR: SELECCIÓN DE AP ────────────────────────
function selectAP({ wifiUsersPerZone, wifiDensity, outdoorWifi, wifiE }) {
  if (!wifiUsersPerZone || wifiUsersPerZone === 0) return null

  if (outdoorWifi) {
    return ACCESS_POINTS.find(ap => ap.id === 'ap6-420x')
  }

  const n = Number(wifiUsersPerZone)

  if (n > 100 || wifiDensity === 'high') {
    return wifiE
      ? ACCESS_POINTS.find(ap => ap.id === 'ap6-840e')
      : ACCESS_POINTS.find(ap => ap.id === 'ap6-840')
  }

  if (n > 50) {
    return wifiE
      ? ACCESS_POINTS.find(ap => ap.id === 'ap6-840e')
      : ACCESS_POINTS.find(ap => ap.id === 'ap6-840')
  }

  if (n > 30 || wifiDensity === 'medium') {
    return ACCESS_POINTS.find(ap => ap.id === 'ap6-420e')
  }

  return wifiE
    ? ACCESS_POINTS.find(ap => ap.id === 'ap6-420e')
    : ACCESS_POINTS.find(ap => ap.id === 'ap6-420')
}
