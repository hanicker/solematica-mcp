#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const API_BASE = process.env.SOLEMATICA_API_URL || "https://api.solematica.it/api/v1";
const API_KEY = process.env.SOLEMATICA_API_KEY || "";

async function apiFetch(path, options = {}) {
  const headers = { "Content-Type": "application/json" };
  if (API_KEY) headers["Authorization"] = `Bearer ${API_KEY}`;
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${err.slice(0, 200)}`);
  }
  return res.json();
}

const TOOLS = [
  {
    name: "stima_solare",
    description:
      "Genera una stima del potenziale fotovoltaico per un indirizzo in Italia. Analizza il tetto via satellite, calcola produzione, risparmio, ROI e dimensionamento ottimale. Richiede API key con crediti.",
    inputSchema: {
      type: "object",
      properties: {
        indirizzo: { type: "string", description: "Indirizzo completo in Italia (es. 'Via Roma 1, 20100 Milano MI')" },
        consumo_annuo_kwh: { type: "number", description: "Consumo elettrico annuo in kWh (default 3500)" },
        tipo_abitazione: { type: "string", enum: ["indipendente", "bifamiliare", "schiera", "condominio"], description: "Tipo di abitazione" },
        superficie_tetto_mq: { type: "number", description: "Superficie tetto in mq (opzionale, calcolata da satellite se omessa)" },
        orientamento: { type: "string", description: "Orientamento tetto: nord, sud, est, ovest (opzionale)" },
      },
      required: ["indirizzo"],
    },
  },
  {
    name: "info_tetto",
    description:
      "Analizza un tetto tramite dati satellitari Google Solar API. Restituisce superficie, orientamento, segmenti del tetto e potenziale per pannelli solari. Non richiede API key.",
    inputSchema: {
      type: "object",
      properties: {
        lat: { type: "number", description: "Latitudine (es. 45.464)" },
        lng: { type: "number", description: "Longitudine (es. 9.190)" },
      },
      required: ["lat", "lng"],
    },
  },
  {
    name: "confronta_provider",
    description:
      "Restituisce il confronto aggiornato delle offerte fotovoltaico dei principali operatori italiani (Enel, Iren, Plenitude, Otovo, E.ON, Hera, ecc.). Include prezzi, brand componenti, garanzie, finanziamento e indice di trasparenza. Non richiede API key.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "dettaglio_provider",
    description:
      "Restituisce la scheda completa di un operatore fotovoltaico italiano: prezzi, componenti, garanzia, finanziamento, servizi accessori (pompa di calore, wallbox, caldaia), contatti e descrizione. Non richiede API key.",
    inputSchema: {
      type: "object",
      properties: {
        slug: {
          type: "string",
          description: "Slug del provider (es. 'iren', 'enel', 'plenitude', 'otovo', 'eon', 'hera', 'a2a', 'edison', 'engie', 'sorgenia', 'bluenergy')",
        },
      },
      required: ["slug"],
    },
  },
  {
    name: "prezzi_energia",
    description:
      "Restituisce i prezzi correnti dell'energia elettrica in Italia (PUN, ARERA) con data di aggiornamento. Utile per calcoli di risparmio e confronti. Non richiede API key.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "cerca_articoli",
    description:
      "Cerca articoli nel blog di Solematica per categoria o keyword. Restituisce titolo, slug, categoria, data e meta description. Non richiede API key.",
    inputSchema: {
      type: "object",
      properties: {
        categoria: { type: "string", description: "Filtro per categoria (es. 'fotovoltaico', 'incentivi', 'risparmio')" },
        limit: { type: "number", description: "Numero massimo di risultati (default 10, max 50)" },
      },
    },
  },
];

// Tool handlers
async function handleTool(name, args) {
  switch (name) {
    case "stima_solare": {
      const body = {
        indirizzo: args.indirizzo,
        consumo_annuo_kwh: args.consumo_annuo_kwh || 3500,
        tipo_abitazione: args.tipo_abitazione || "indipendente",
        ...(args.superficie_tetto_mq ? { superficie_tetto_mq: args.superficie_tetto_mq } : {}),
        ...(args.orientamento ? { orientamento: args.orientamento } : {}),
      };
      const data = await apiFetch("/stima", { method: "POST", body: JSON.stringify(body) });
      return JSON.stringify(data, null, 2);
    }

    case "info_tetto": {
      const data = await apiFetch(`/stima/solar-info?lat=${args.lat}&lng=${args.lng}`);
      return JSON.stringify(data, null, 2);
    }

    case "confronta_provider": {
      const data = await apiFetch("/providers");
      const summary = (data.providers || []).map((p) => ({
        nome: p.nome,
        slug: p.slug,
        prezzo_3kw: p.prezzo_3kw,
        pannelli: p.pannelli,
        inverter: p.inverter,
        garanzia: p.garanzia,
        trasparenza: p.trasparenza === 3 ? "alta" : p.trasparenza === 2 ? "media" : "bassa",
        pompa_calore: p.offerta_pompa_calore?.disponibile ? "si" : "no",
        wallbox: p.offerta_wallbox?.disponibile ? "si" : "no",
        caldaia: p.offerta_caldaia?.disponibile ? "si" : "no",
      }));
      return JSON.stringify({ operatori: summary.length, providers: summary }, null, 2);
    }

    case "dettaglio_provider": {
      const data = await apiFetch("/providers");
      const p = (data.providers || []).find((x) => x.slug === args.slug);
      if (!p) throw new Error(`Provider '${args.slug}' non trovato`);
      return JSON.stringify(p, null, 2);
    }

    case "prezzi_energia": {
      const data = await apiFetch("/stima/prezzi-energia");
      return JSON.stringify(data, null, 2);
    }

    case "cerca_articoli": {
      const params = new URLSearchParams();
      if (args.categoria) params.set("categoria", args.categoria);
      params.set("limit", String(Math.min(args.limit || 10, 50)));
      const data = await apiFetch(`/blog?${params.toString()}`);
      const articles = (data.articles || []).map((a) => ({
        titolo: a.titolo,
        slug: a.slug,
        categoria: a.categoria,
        data: a.pubblicato_at?.slice(0, 10),
        descrizione: a.meta_description,
        url: `https://www.solematica.it/blog/${a.slug}`,
      }));
      return JSON.stringify({ totale: data.total, articoli: articles }, null, 2);
    }

    default:
      throw new Error(`Tool sconosciuto: ${name}`);
  }
}

// Server setup
const server = new Server(
  { name: "solematica", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: TOOLS,
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  try {
    const result = await handleTool(name, args || {});
    return { content: [{ type: "text", text: result }] };
  } catch (err) {
    return {
      content: [{ type: "text", text: `Errore: ${err.message}` }],
      isError: true,
    };
  }
});

// Start
const transport = new StdioServerTransport();
await server.connect(transport);
