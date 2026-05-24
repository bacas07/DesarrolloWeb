// Integración con Grok (xAI) para análisis IA de la recomendación
// Modelo: llama-3.3-70b-versatile (gratuito en api.groq.com)
// Variable de entorno: VITE_GROQ_API_KEY

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const GROQ_MODEL = 'llama-3.3-70b-versatile'

/**
 * Envía el contexto del proyecto + la recomendación técnica a Grok
 * y obtiene un análisis detallado en español.
 */
export async function getAIAnalysis(inputs, recommendation) {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY

  if (!apiKey) {
    return {
      error: true,
      message: 'API key de Grok no configurada. Agrega VITE_GROQ_API_KEY en tu archivo .env o en las variables de entorno de Vercel.',
    }
  }

  const systemPrompt = `Eres un arquitecto de redes certificado en soluciones Sophos (CCSNA/CCSE). 
Tu rol es analizar requerimientos de infraestructura de red corporativa y validar recomendaciones de hardware.
Responde siempre en español, de forma técnica pero comprensible para administradores TI.
Estructura tu respuesta con las secciones: 
1. Análisis del entorno
2. Justificación técnica del hardware recomendado
3. Consideraciones adicionales y mejores prácticas
4. Posibles alternativas si el presupuesto es limitado
Sé conciso y profesional. Máximo 400 palabras.`

  const userMessage = `
## CONTEXTO DEL PROYECTO
${inputs.context || 'No se proporcionó contexto adicional.'}

## PARÁMETROS DE RED INGRESADOS
- Usuarios totales: ${inputs.users}
- Ancho de banda contratado: ${inputs.throughputGbps} Gbps
- Puertos cableados requeridos: ${inputs.wiredPorts}
- ¿Requiere PoE?: ${inputs.needsPoe ? 'Sí' : 'No'}
- Usuarios WiFi por zona: ${inputs.wifiUsersPerZone}
- Densidad WiFi: ${inputs.wifiDensity === 'low' ? 'Baja' : inputs.wifiDensity === 'medium' ? 'Media' : 'Alta'}
- ¿Requiere WiFi exterior?: ${inputs.outdoorWifi ? 'Sí' : 'No'}
- ¿Prefiere WiFi 6E?: ${inputs.wifiE ? 'Sí' : 'No'}

## RECOMENDACIÓN DEL CONFIGURADOR
- **Firewall:** Sophos ${recommendation.firewall.model} (${recommendation.firewall.series})
  - FW Throughput: ${recommendation.firewall.throughputFW} Gbps
  - Threat Protection: ${recommendation.firewall.throughputThreat} Gbps
  - Puertos: ${recommendation.firewall.ports.copper} x ${recommendation.firewall.ports.type}
  
- **Switch:** Sophos ${recommendation.switch.model} (${recommendation.switch.series})
  - Puertos: ${recommendation.switch.ports} x ${recommendation.switch.portSpeed}
  - PoE: ${recommendation.switch.poe ? `Sí - ${recommendation.switch.poeStandard} - ${recommendation.switch.poeBudget}W` : 'No'}
  
- **Access Point:** ${recommendation.accessPoint ? `Sophos ${recommendation.accessPoint.model} (${recommendation.accessPoint.wifiStandard})` : 'No requerido'}
  - Cantidad estimada: ${recommendation.apCount} unidades
  
- **Advertencias del sistema:** ${recommendation.warnings.join(', ') || 'Ninguna'}

Por favor analiza esta recomendación técnicamente.`

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        temperature: 0.4,
        max_tokens: 1024,
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
