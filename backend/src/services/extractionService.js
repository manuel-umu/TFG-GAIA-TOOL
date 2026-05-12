'use strict';

const OpenAI = require('openai');
const client = new OpenAI({
  baseURL: process.env.URL_API,
  apiKey: process.env.API_KEY, 
});
const MAX_TOKENS = 4000;
const TEMPERATURE = 0.1;
const MAX_DOC_CHARS = 6000;
const BATCH_SIZE = 10;

const SYSTEM_PROMPT = `Eres un extractor de datos de sostenibilidad especializado en los estándares ESRS \
del marco CSRD (Corporate Sustainability Reporting Directive, EU 2022/2464).

## Tu tarea
Analizar el texto de un documento corporativo (memoria de sostenibilidad, informe anual, política \
ambiental, etc.) y extraer los valores correspondientes a una lista de Data Points ESRS proporcionada.

## Instrucciones por Data Point
Para cada Data Point de la lista:
1. Busca en el documento el valor o información que responde a ese indicador.
2. Si lo encuentras, devuelve:
   - extracted_value: el valor extraído (formato según data_type)
   - quote: la cita LITERAL y EXACTA del documento que lo respalda (copiada tal cual)
   - page_hint: número de página aproximado donde aparece (null si no lo puedes determinar)
   - confidence: tu nivel de seguridad entre 0.00 y 1.00
   - found: true
3. Si NO lo encuentras o no hay evidencia suficiente, devuelve found: false y el resto null.

## Formato del campo extracted_value según data_type
- "numeric"   → número como string, incluye unidades si el doc las menciona (ej: "12450 tCO2eq", "34.2 %")
- "boolean"   → "true" o "false"
- "narrative" → resumen del texto relevante, máximo 300 palabras
- "date"      → formato YYYY-MM-DD, o solo YYYY si el documento solo menciona el año
- otro/null   → texto libre con el fragmento más relevante encontrado

## Escala de confianza
- 0.90–1.00: La cita contiene el valor literal e inequívoco con unidades claras
- 0.70–0.89: El valor se infiere claramente de tablas, gráficos o contexto próximo
- 0.50–0.69: Hay ambigüedad (varios periodos temporales, unidades poco claras, dato indirecto)
- < 0.50    : No encontrado o muy incierto → usa found: false

## Regla crítica
Devuelve EXCLUSIVAMENTE el JSON especificado. Sin texto antes ni después, sin bloques markdown.`;

async function extractDataPoints({ documentText, dataPoints, standardCode, standardName }) {
    const docText = documentText.length > MAX_DOC_CHARS
        ? documentText.slice(0, MAX_DOC_CHARS) + '\n\n[...documento truncado...]'
        : documentText;

    console.log(`documentText: ${documentText.length} chars → ${docText.length} tras truncar | dataPoints: ${dataPoints.length} en ${Math.ceil(dataPoints.length / BATCH_SIZE)} lotes`);

    const dataPointList = dataPoints.map(dp => ({
        id: dp.id,
        official_id: dp.official_id,
        name: dp.name,
        data_type: dp.data_type || 'narrative',
    }));

    const allExtractions = [];
    for (let i = 0; i < dataPointList.length; i += BATCH_SIZE) {
        const batch = dataPointList.slice(i, i + BATCH_SIZE);
        console.log(`Lote ${Math.floor(i / BATCH_SIZE) + 1}: data points ${i + 1}-${i + batch.length}`);

        const userContent = `Estandar ESRS: ${standardCode} – ${standardName}

## Documento a analizar
---
${docText}
---

## Data Points a extraer
${JSON.stringify(batch, null, 2)}

## Formato de respuesta requerido
Devuelve SOLO este JSON:
{
  "extractions": [
    {
      "data_point_id": <id numérico del Data Point>,
      "found": <true | false>,
      "extracted_value": <string con el valor, o null>,
      "quote": <cita literal exacta del documento, o null>,
      "page_hint": <número de página aproximado, o null>,
      "confidence": <número entre 0.00 y 1.00>
    }
  ]
}`;

        try {
            const chatCompletion = await call({
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT },
                    { role: 'user',   content: userContent },
                ],
            });

            const content = chatCompletion.choices[0]?.message?.content;
            if (!content) {
                console.warn(`Lote ${Math.floor(i / BATCH_SIZE) + 1}: sin respuesta, se omite`);
                continue;
            }

            const parsed = JSON.parse(content);
            if (!Array.isArray(parsed.extractions)) continue;
            allExtractions.push(...parsed.extractions);
        } catch (error) {
            console.error(`Lote ${Math.floor(i / BATCH_SIZE) + 1} falló:`, error.message);
        }
    }

    return allExtractions.filter(e => e.found === true && e.confidence >= 0.50);
}

async function call({ messages }) {
    console.log("Calling model to extract data points...");
    const response = await client.chat.completions.create({
        messages,
        model: 'gpt-oss',
        temperature: TEMPERATURE,
        max_tokens: MAX_TOKENS,
    });
    const u = response.usage;
    console.log(`Tokens — prompt: ${u?.prompt_tokens}, completion: ${u?.completion_tokens}, total: ${u?.total_tokens}`);
    return response;
}

module.exports = { extractDataPoints };
