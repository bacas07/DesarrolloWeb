const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const GROQ_MODEL = 'llama-3.3-70b-versatile'

export async function getAIAnalysis(inputs, recommendation) {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY

  if (!apiKey) {
    return {
      error: true,
      message:
        'API key de Grok no configurada. Agrega VITE_GROQ_API_KEY en tu archivo .env o en las variables de entorno de Vercel.',
    }
  }

  // Lista de modelos reales para que Grok NO invente alternativas
  const validFirewalls = 'XGS 88, XGS 108, XGS 118, XGS 128, XGS 138, XGS 2100, XGS 2300, XGS 3100, XGS 3300, XGS 4300, XGS 4500, XGS 5500, XGS 6500, XGS 7500, XGS 8500'
  const validSwitches = 'CS101-8, CS101-8FP, CS110-24, CS110-24FP, CS110-48, CS110-48P, CS110-48FP, CS210-8FP, CS210-24FP, CS210-48FP'
  const validAPs = 'AP6 420, AP6 420E, AP6 840, AP6 840E, AP6 420X'

  const systemPrompt = `Eres un arquitecto de redes certificado en Sophos (CCSNA/CCSE). 
Analizas recomendaciones de infraestructura de red y das feedback técnico en español.

REGLAS ESTRICTAS — si no las cumples, el análisis es inválido:
1. NUNCA inventes modelos de hardware que no estén en esta lista:
   - Firewalls Sophos válidos: ${validFirewalls}
   - Switches Sophos válidos: ${validSwitches}  
   - Access Points Sophos válidos: ${validAPs}
2. Si mencionas alternativas de presupuesto, SOLO usa modelos de la lista anterior.
3. No menciones productos de otras marcas (Cisco, Fortinet, etc.).
4. No inventes especificaciones técnicas. Si no sabes un dato, omítelo.
5. Responde SIEMPRE con este formato markdown exacto:

## 1. Análisis del entorno
[2-3 oraciones describiendo el tipo de red y sus necesidades principales]

## 2. Justificación técnica
[Explica por qué cada equipo recomendado es adecuado. Si el firewall parece sobredimensionado para los usuarios pero el WAN lo justifica, explícalo claramente]

## 3. Consideraciones y mejores prácticas
[Consejos concretos de configuración, seguridad o escalabilidad]

## 4. Alternativas de presupuesto
[Solo si hay modelos más económicos que realmente cumplan los requerimientos. Usa SOLO modelos de la lista válida. Si no hay alternativa real, di "La recomendación actual es la más ajustada para estos requerimientos."]

Máximo 380 palabras en total. Sé técnico, directo y preciso.`

  const { firewall, switch: sw, accessPoint: ap, apCount, warnings } = recommendation

  const userMessage = `
## ENTORNO DESCRITO POR EL USUARIO
${inputs.context?.trim() || 'No se proporcionó descripción del entorno.'}

## PARÁMETROS INGRESADOS
- Usuarios totales: ${inputs.users}
- Enlace WAN contratado: ${inputs.throughputGbps} Gbps (throughput requerido con margen 30%: ${recommendation.calcSummary.requiredFWThroughput} Gbps)
- Puertos cableados requeridos: ${inputs.wiredPorts} (con margen: ${recommendation.calcSummary.portsNeeded})
- ¿Requiere PoE para dispositivos cableados?: ${inputs.needsPoe ? 'Sí' : 'No'}
- Usuarios WiFi por zona de cobertura: ${inputs.wifiUsersPerZone || 0}
- Densidad de uso WiFi: ${{ low: 'Baja (navegación, ~5 Mbps/usuario)', medium: 'Media (videoconferencias, ~15 Mbps/usuario)', high: 'Alta (streaming, ~30 Mbps/usuario)' }[inputs.wifiDensity]}
- WiFi exterior: ${inputs.outdoorWifi ? 'Sí' : 'No'}
- Preferencia WiFi 6E: ${inputs.wifiE ? 'Sí' : 'No'}

## RECOMENDACIÓN DEL CONFIGURADOR

**Firewall: ${firewall.model}** (${firewall.series})
- FW Throughput: ${firewall.throughputFW} Gbps | Threat Protection: ${firewall.throughputThreat} Gbps | VPN: ${firewall.throughputVPN} Gbps
- Rango de usuarios objetivo: ${firewall.targetUsers[0]}–${firewall.targetUsers[1]}
- Factor de forma: ${firewall.formFactor}

**Switch: ${sw.model}** (${sw.series})
- Puertos: ${sw.ports} × ${sw.portSpeed}
- PoE: ${sw.poe ? `${sw.poeStandard} — presupuesto ${sw.poeBudget}W` : 'No'}
- Uplinks: ${sw.uplinks.count} × ${sw.uplinks.type}
- El switch ${recommendation.calcSummary.apNeedsMultiGig ? 'SÍ' : 'NO'} necesita puertos 2.5GE para los APs

**Access Point: ${ap ? ap.model : 'No requerido'}** ${ap ? `(${ap.wifiStandard})` : ''}
${ap ? `- Usuarios por AP: ${ap.concurrentUsers} | Throughput: ${ap.maxThroughput} Mbps | Puerto: ${ap.portSpeed}
- Cantidad estimada: ${apCount} unidad(es)
- PoE que consume: ${ap.poePower}W por AP` : ''}

**Advertencias del sistema:** ${warnings.length > 0 ? warnings.join(' | ') : 'Ninguna'}`.trim()

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        temperature: 0.3,
        max_tokens: 900,
        stream: false,
      }),
    })

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}))
      return {
        error: true,
        message: `Error de API Grok (${response.status}): ${errData?.error?.message || 'Error desconocido'}`,
      }
    }

    const data = await response.json()
    return {
      error: false,
      text: data.choices?.[0]?.message?.content || 'Sin respuesta del modelo.',
      model: data.model,
      tokensUsed: data.usage?.total_tokens,
    }
  } catch (err) {
    return {
      error: true,
      message: `Error de red al conectar con Grok: ${err.message}`,
    }
  }
}
