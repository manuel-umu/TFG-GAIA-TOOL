'use strict';

const Groq = require('groq-sdk');
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Documento de 50 paginas aprox (groq tiene limite de contexto de 125k tokens)
const MAX_DOCUMENT_CHARS = 100_000;
const MAX_RESPONSE_TOKENS = 12_000;
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
    const docText = documentText.length > MAX_DOCUMENT_CHARS
        ? documentText.slice(0, MAX_DOCUMENT_CHARS) + '\n\n[...documento truncado por longitud...]'
        : documentText;

    const dataPointList = dataPoints.map(dp => ({
        id: dp.id,
        official_id: dp.official_id,
        name: dp.name,
        data_type: dp.data_type || 'narrative',
    }));

    const userContent = `Estandar ESRS: ${standardCode} – ${standardName}

## Documento a analizar
---
${docText}
---

## Data Points a extraer
${JSON.stringify(dataPointList, null, 2)}

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
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                { role: 'user',   content: userContent },
            ],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.1, // con 0.1 solo copia lo que ve, no inventa
            max_tokens: MAX_RESPONSE_TOKENS,
            response_format: { type: 'json_object' },
            stream: false,
        });

        const content = chatCompletion.choices[0]?.message?.content;
        if (!content) throw new Error('Model didnt work: no content returned');

        const parsed = JSON.parse(content);
        const extractions = parsed.extractions;
        if (!Array.isArray(extractions)) {
                throw new Error('Model response format error: "extractions" array is missing');
        }
        // Devolver solo las que la IA encontro con confianza suficiente
        return extractions.filter(e => e.found === true && e.confidence >= 0.50);
    } catch (error) {
        console.error("Model call failed", error);
        throw error;
    }    
}

module.exports = { extractDataPoints };
