# Configurador Interactivo de Infraestructura Sophos
**Materia:** Desarrollo Web · **Estudiante:** Mateo Baca · **Corte:** 20%

## Descripción
SPA que recomienda hardware corporativo Sophos (Firewalls XGS, Switches CS, Access Points AP6) 
basándose en los requerimientos de red del usuario, con análisis de IA potenciado por Grok (LLaMA 3.3).

## Stack
- React 18 + Vite
- Tailwind CSS
- Grok API (llama-3.3-70b-versatile)
- Deploy: Vercel

## Instalación local

```bash
npm install
cp .env.example .env
# Edita .env y agrega tu VITE_GROQ_API_KEY
npm run dev
```

## Deploy en Vercel

1. Push a GitHub (repositorio público)
2. Importar proyecto en https://vercel.com/new
3. Framework: Vite (autodetectado)
4. En **Environment Variables** agregar:
   - `VITE_GROQ_API_KEY` = tu API key de https://console.groq.com/

## API Key de Grok
La API de Grok es **gratuita** (con límite generoso). Créala en:
https://console.groq.com/ → API Keys → Create API Key

## Repositorio
https://github.com/domo-backend-22/RubricaDesarrolloWeb
