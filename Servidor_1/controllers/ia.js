const { response, request } = require('express');
const { runAIAgent } = require('../lib/ai-agent');

/**
 * Procesa una consulta usando el agente de IA integrado (LangGraph.js).
 */
const iaQueryPost = async (req = request, res = response) => {
    try {
        const { query } = req.body;
        
        if (!query) {
            return res.status(400).json({ msg: 'La consulta es obligatoria' });
        }

        // Ejecución directa del agente local
        console.log('\n[IA] ⏳ Iniciando procesamiento de la consulta:', query);
        console.log('[IA] 🤖 Esperando respuesta del modelo local (esto puede tardar unos minutos en CPU)...');
        
        const result = await runAIAgent(query);
        
        console.log('[IA] ✅ Respuesta generada con éxito:', result);

        res.json(result);

    } catch (error) {
        console.error('[iaController] Error:', error.message);
        res.status(500).json({
            msg: 'Error interno en el agente de IA',
            error: error.message
        });
    }
}

/**
 * Obtiene sugerencias (estáticas o dinámicas).
 */
const iaSuggestionsGet = async (req, res = response) => {
    // Retornamos sugerencias directamente para no depender del microservicio
    res.json({
        "mongodb": [
            "¿Cuántos dispositivos hay registrados?",
            "Muéstrame los últimos 5 datos de sensores",
            "Lista todos los dispositivos"
        ],
        "analysis": [
            "Analiza el promedio de los sensores",
            "¿Hay anomalías detectadas?",
            "Resumen estadístico de hoy"
        ]
    });
}

module.exports = {
    iaQueryPost,
    iaSuggestionsGet
}
