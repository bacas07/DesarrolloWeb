import { FIREWALLS, SWITCHES, ACCESS_POINTS, CALC_CONSTANTS } from '../data/sophosHardware.js'

/**
 * Recibe los inputs del formulario y devuelve la recomendación técnica.
 * @param {Object} inputs
 * @param {number}  inputs.users          - Número de usuarios totales
 * @param {number}  inputs.throughputGbps - Ancho de banda contratado en Gbps
 * @param {number}  inputs.wiredPorts     - Puertos cableados requeridos (1-48+)
 * @param {boolean} inputs.needsPoe       - ¿Requiere PoE en el switch?
 * @param {number}  inputs.wifiUsersPerZone - Usuarios WiFi por zona de cobertura
 * @param {string}  inputs.wifiDensity    - 'low' | 'medium' | 'high'
 * @param {boolean} inputs.outdoorWifi    - ¿Se necesita WiFi exterior?
 * @param {boolean} inputs.wifiE          - ¿Se prefiere WiFi 6E?
 * @param {string}  inputs.context        - Descripción libre del entorno
 * @returns {Object} recommendation
 */
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

  // ── 1. SELECCIÓN DE FIREWALL ──────────────────────────────
  const requiredFWThroughput = throughputGbps * CALC_CONSTANTS.OVERSIZE_FACTOR

  // Filtra por throughput mínimo, luego por rango de usuarios
  const eligibleFWs = FIREWALLS.filter(fw =>
    fw.throughputFW >= requiredFWThroughput &&
    fw.targetUsers[0] <= users * CALC_CONSTANTS.OVERSIZE_FACTOR
  )

  // Ordenar por throughput ascendente (elegir el más ajustado que cumple)
  eligibleFWs.sort((a, b) => a.throughputFW - b.throughputFW)
  const firewall = eligibleFWs[0] || FIREWALLS[FIREWALLS.length - 1]

  // ── 2. SELECCIÓN DE SWITCH ────────────────────────────────
  // Número de puertos necesarios con margen
  const portsNeeded = Math.ceil(wiredPorts * CALC_CONSTANTS.OVERSIZE_FACTOR)

  // ¿El AP6 840E está en consideración? → necesita CS210-8FP
  const apModel = selectAP(wifiUsersPerZone, wifiDensity, outdoorWifi, wifiE)
  const needsPoePlusPlus = apModel?.id === 'ap6-840e'

  let eligibleSwitches = SWITCHES.filter(sw => {
    // Puertos disponibles
    if (sw.ports < portsNeeded) return false
    // PoE
    if (needsPoe && !sw.poe) return false
    // PoE++ para AP6 840E
    if (needsPoePlusPlus && sw.poeStandard !== '802.3bt (PoE++)') return false
    return true
  })

  // Preferir switches de la serie CS200 si hay APs WiFi 6
  if (wifiUsersPerZone > 0) {
    const cs200 = eligibleSwitches.filter(sw => sw.series === 'CS200')
    if (cs200.length > 0) eligibleSwitches = cs200
  }

  // Ordenar: menor número de puertos que cumpla (no sobredimensionar innecesariamente)
  eligibleSwitches.sort((a, b) => a.ports - b.ports)
  const sw = eligibleSwitches[0] || SWITCHES[SWITCHES.length - 1]

  // ── 3. SELECCIÓN DE ACCESS POINT ─────────────────────────
  const ap = apModel

  // ── 4. CÁLCULO DE CANTIDAD DE APs ────────────────────────
  let apCount = 0
  if (wifiUsersPerZone > 0 && ap) {
    apCount = Math.ceil(users / ap.concurrentUsers)
  }

  // ── 5. ADVERTENCIAS Y NOTAS ──────────────────────────────
  const warnings = []

  if (ap?.id === 'ap6-840e') {
    warnings.push('⚠️ El AP6 840E requiere PoE++ (802.3bt). Use el switch CS210-8FP o un inyector 802.3bt dedicado.')
  }
  if (firewall.formFactor === '2U' && wiredPorts < 16) {
    warnings.push('ℹ️ Se seleccionó un firewall 2U por throughput requerido. Para menor carga de usuarios, evalúe si el throughput real lo justifica.')
  }
  if (throughputGbps > 10 && firewall.formFactor === 'Desktop') {
    warnings.push('⚠️ Throughput muy alto para un firewall Desktop. Considere un modelo 1U o 2U.')
  }
  if (needsPoe && sw.poeBudget < apCount * (ap?.poePower || 25)) {
    warnings.push(`⚠️ El presupuesto PoE del switch (${sw.poeBudget}W) puede ser insuficiente para ${apCount} APs. Considere distribuir en múltiples switches.`)
  }

  return {
    firewall,
    switch: sw,
    accessPoint: ap,
    apCount,
    warnings,
    calcSummary: {
      requiredFWThroughput: requiredFWThroughput.toFixed(1),
      portsNeeded,
      estimatedWifiBandwidth: wifiUsersPerZone > 0
        ? (users * CALC_CONSTANTS.BW_PER_WIFI_USER[wifiDensity] / 1000).toFixed(2)
        : 0,
    }
  }
}

function selectAP(wifiUsersPerZone, wifiDensity, outdoorWifi, wifiE) {
  if (wifiUsersPerZone === 0) return null

  if (outdoorWifi) {
    return ACCESS_POINTS.find(ap => ap.id === 'ap6-420x')
  }

  if (wifiUsersPerZone > 100 || wifiDensity === 'high') {
    return wifiE
      ? ACCESS_POINTS.find(ap => ap.id === 'ap6-840e')
      : ACCESS_POINTS.find(ap => ap.id === 'ap6-840')
  }

  if (wifiUsersPerZone > 30 || wifiDensity === 'medium') {
    return wifiE
      ? ACCESS_POINTS.find(ap => ap.id === 'ap6-420e')
      : ACCESS_POINTS.find(ap => ap.id === 'ap6-840')
  }

  // Baja densidad
  return wifiE
    ? ACCESS_POINTS.find(ap => ap.id === 'ap6-420e')
    : ACCESS_POINTS.find(ap => ap.id === 'ap6-420')
}
