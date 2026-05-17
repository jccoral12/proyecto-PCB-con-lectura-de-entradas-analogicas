const { ChatOllama } = require("@langchain/ollama");
const { Annotation, StateGraph, START, END } = require("@langchain/langgraph");
const { DynamicStructuredTool } = require("@langchain/core/tools");
const { z } = require("zod");
const Dato = require('../models/dato');
const Dispositivo = require('../models/dispositivo');

/**
 * @fileoverview Servicio de IA integrado usando LangGraph.js y Ollama (Local).
 * Gestiona consultas a MongoDB y análisis estadístico localmente.
 */

// 1. Configuración del Modelo Local (Ollama)
const model = new ChatOllama({
    model: "llama3", // Asegúrate de haber corrido `ollama run llama3`
    baseUrl: "http://localhost:11434",
    temperature: 0,
});

// 2. Definición del Estado
const GraphState = Annotation.Root({
    query: Annotation(),
    intent: Annotation(),
    mongoData: Annotation(),
    analysis: Annotation(),
    response: Annotation(),
    agentUsed: Annotation(),
});

// 3. Herramientas de MongoDB (Tools)
const getDispositivosTool = new DynamicStructuredTool({
    name: "get_dispositivos",
    description: "Lista todos los dispositivos IoT registrados.",
    schema: z.object({}),
    func: async () => {
        const docs = await Dispositivo.find();
        return JSON.stringify(docs);
    }
});

const getDatosTool = new DynamicStructuredTool({
    name: "get_latest_datos",
    description: "Obtiene los últimos N registros de sensores.",
    schema: z.object({
        limit: z.number().default(10).describe("Cantidad de registros a obtener")
    }),
    func: async ({ limit }) => {
        const docs = await Dato.find().sort({ fecha_insercion: -1 }).limit(limit);
        return JSON.stringify(docs);
    }
});

// 4. Herramientas de Análisis
const analysisTool = {
    calculateStats: (data) => {
        if (!data || data.length === 0) return "No hay datos para analizar.";
        
        const sensors = ['sensor1', 'sensor2', 'sensor3', 'sensor4'];
        const results = {};

        sensors.forEach(s => {
            const values = data.map(d => d[s]).filter(v => v !== null);
            if (values.length > 0) {
                const sum = values.reduce((a, b) => a + b, 0);
                const avg = sum / values.length;
                const max = Math.max(...values);
                const min = Math.min(...values);
                results[s] = { promedio: avg.toFixed(2), max, min, count: values.length };
            }
        });

        return results;
    },
    detectAnomalies: (data, threshold = 2) => {
        // Implementación básica de Z-Score
        const results = {};
        const sensors = ['sensor1', 'sensor2', 'sensor3', 'sensor4'];

        sensors.forEach(s => {
            const values = data.map(d => d[s]).filter(v => v !== null);
            if (values.length < 5) return;

            const n = values.length;
            const mean = values.reduce((a, b) => a + b, 0) / n;
            const std = Math.sqrt(values.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b, 0) / n);

            const anomalies = data.filter(d => {
                if (d[s] === null) return false;
                const z = Math.abs((d[s] - mean) / std);
                return z > threshold;
            });

            if (anomalies.length > 0) {
                results[s] = `${anomalies.length} anomalías detectadas.`;
            }
        });
        return results;
    }
};

// 5. Nodos del Grafo

// Nodo Orquestador
async function orchestratorNode(state) {
    const prompt = `Actúa como un orquestador de IA para un sistema IoT.
    Consulta del usuario: "${state.query}"
    
    Tu tarea es clasificar la intención en una de estas:
    - 'mongodb': Si el usuario quiere datos crudos, listas de dispositivos o contar registros.
    - 'analysis': Si el usuario pide promedios, tendencias, anomalías o resúmenes estadísticos.
    
    Responde ÚNICAMENTE con la palabra de la categoría.`;

    const res = await model.invoke(prompt);
    const intent = res.content.toLowerCase().trim();
    
    return { intent: intent.includes('analysis') ? 'analysis' : 'mongodb' };
}

// Nodo MongoDB
async function mongoNode(state) {
    let result = "";
    if (state.query.toLowerCase().includes("dispositivo")) {
        result = await getDispositivosTool.func({});
    } else {
        result = await getDatosTool.func({ limit: 20 });
    }
    
    return { mongoData: result, agentUsed: 'Agente MongoDB' };
}

// Nodo Análisis
async function analysisNode(state) {
    const rawData = await Dato.find().sort({ fecha_insercion: -1 }).limit(50);
    const stats = analysisTool.calculateStats(rawData);
    const anomalies = analysisTool.detectAnomalies(rawData);
    
    return { 
        analysis: JSON.stringify({ stats, anomalies }), 
        agentUsed: 'Agente de Análisis' 
    };
}

// Nodo Generador de Respuesta
async function generatorNode(state) {
    const context = state.intent === 'analysis' ? state.analysis : state.mongoData;
    const prompt = `Eres un asistente experto en IoT. Responde a la consulta del usuario usando el contexto proporcionado.
    Consulta: "${state.query}"
    Contexto: ${context}
    
    Responde de forma profesional y clara en español. Si hay datos estadísticos, menciónalos de forma estructurada.`;

    const res = await model.invoke(prompt);
    return { response: res.content };
}

// 6. Construcción del Grafo
const workflow = new StateGraph(GraphState)
    .addNode("orchestrator", orchestratorNode)
    .addNode("mongodb_agent", mongoNode)
    .addNode("analysis_agent", analysisNode)
    .addNode("generator", generatorNode)
    .addEdge(START, "orchestrator")
    .addConditionalEdges("orchestrator", (state) => state.intent, {
        "mongodb": "mongodb_agent",
        "analysis": "analysis_agent"
    })
    .addEdge("mongodb_agent", "generator")
    .addEdge("analysis_agent", "generator")
    .addEdge("generator", END);

const app = workflow.compile();

/**
 * Ejecuta una consulta a través del sistema multi-agente.
 * @param {string} query 
 */
async function runAIAgent(query) {
    const initialState = { query };
    const finalState = await app.invoke(initialState);
    return {
        response: finalState.response,
        agent_used: finalState.agentUsed,
        intent: finalState.intent
    };
}

module.exports = {
    runAIAgent
};
