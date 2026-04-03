<!-- mcp-name: io.github.n3m1/solematica-mcp -->

# @solematica/mcp-server

[![npm version](https://img.shields.io/npm/v/@solematica/mcp-server)](https://www.npmjs.com/package/@solematica/mcp-server)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![MCP](https://img.shields.io/badge/MCP-compatible-blue)](https://modelcontextprotocol.io)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](https://nodejs.org)
[![Solematica](https://img.shields.io/badge/Solematica-solematica.it-f59e0b)](https://www.solematica.it)

[MCP](https://modelcontextprotocol.io) (Model Context Protocol) server for [Solematica](https://www.solematica.it) — solar estimates, provider comparison and energy data for Italy.

This server enables AI assistants like [Claude](https://claude.ai), [Cursor](https://cursor.com), [Windsurf](https://codeium.com/windsurf), [Kiro](https://kiro.dev) and other [MCP-compatible clients](https://modelcontextprotocol.io/clients) to analyze solar potential, compare photovoltaic providers, check energy prices and search energy-related articles for the Italian market.

## Tools

| Tool | Description | Auth |
|------|-------------|------|
| `stima_solare` | Generate a full solar estimate for an Italian address — production, savings, ROI, panel sizing | API key |
| `info_tetto` | Satellite roof analysis via [Google Solar API](https://developers.google.com/maps/documentation/solar) — surface, orientation, segments, panel potential | Free |
| `confronta_provider` | Compare 11 Italian solar providers — prices, components, warranties, transparency index | Free |
| `dettaglio_provider` | Full provider detail — accessories (heat pumps, EV chargers, boilers), contacts, financing | Free |
| `prezzi_energia` | Current Italian energy prices ([PUN](https://it.wikipedia.org/wiki/Prezzo_unico_nazionale)/[ARERA](https://www.arera.it)) with update date | Free |
| `cerca_articoli` | Search [Solematica blog](https://www.solematica.it/blog) articles by category or keyword | Free |

## Quick Start

### Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "solematica": {
      "command": "npx",
      "args": ["@solematica/mcp-server"],
      "env": {
        "SOLEMATICA_API_KEY": "your-api-key"
      }
    }
  }
}
```

### Claude Code

```bash
claude mcp add solematica npx @solematica/mcp-server
```

### Cursor

Add to your `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "solematica": {
      "command": "npx",
      "args": ["@solematica/mcp-server"],
      "env": {
        "SOLEMATICA_API_KEY": "your-api-key"
      }
    }
  }
}
```

### Windsurf

Add to your `~/.codeium/windsurf/mcp_config.json`:

```json
{
  "mcpServers": {
    "solematica": {
      "command": "npx",
      "args": ["@solematica/mcp-server"],
      "env": {
        "SOLEMATICA_API_KEY": "your-api-key"
      }
    }
  }
}
```

### Other MCP Clients

Any [MCP-compatible client](https://modelcontextprotocol.io/clients) can use this server via stdio transport:

```bash
npx @solematica/mcp-server
```

## Authentication

- **API key** is only required for `stima_solare` (consumes credits per estimate)
- All other tools are **free and public** — no API key needed
- Get an API key by registering as a partner at [solematica.it/partner](https://www.solematica.it/partner)

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SOLEMATICA_API_KEY` | Only for `stima_solare` | — | Your API key for authenticated endpoints |
| `SOLEMATICA_API_URL` | No | `https://api.solematica.it/api/v1` | API base URL (for self-hosted or testing) |

## Tool Details

### `stima_solare`

Generates a complete solar estimate for an Italian address using [Google Solar API](https://developers.google.com/maps/documentation/solar) + [PVGIS](https://re.jrc.ec.europa.eu/pvg_tools/en/) data.

**Input:**
- `indirizzo` (required) — Full Italian address (e.g. "Via Roma 1, 20100 Milano MI")
- `consumo_annuo_kwh` — Annual electricity consumption in kWh (default: 3500)
- `tipo_abitazione` — Building type: `indipendente`, `bifamiliare`, `schiera`, `condominio`
- `superficie_tetto_mq` — Roof surface in sqm (auto-calculated from satellite if omitted)
- `orientamento` — Roof orientation: `nord`, `sud`, `est`, `ovest`

**Returns:** kWp sizing, panel count, annual production, monthly distribution, savings, ROI, CO2 avoided, cost estimate.

### `info_tetto`

Analyzes a roof using [Google Solar API](https://developers.google.com/maps/documentation/solar) satellite data.

**Input:**
- `lat` (required) — Latitude
- `lng` (required) — Longitude

**Returns:** Roof surface, usable area, orientation, roof segments, max panel count, sunshine hours.

### `confronta_provider`

Lists all active Italian solar providers with comparison data. See the full [provider comparison](https://www.solematica.it/confronto-offerte) on Solematica.

**Returns:** Array of providers with name, price (3 kWp), panel brand, inverter brand, warranty, transparency index (1-3), and accessory services availability (heat pump, EV charger, boiler).

### `dettaglio_provider`

Full detail for a specific provider.

**Input:**
- `slug` (required) — Provider slug: `enel`, `iren`, `plenitude`, `otovo`, `eon`, `hera`, `a2a`, `edison`, `engie`, `sorgenia`, `bluenergy`

**Returns:** All comparison data plus: description, phone, headquarters, founding year, financing details, accessory service details with URLs.

### `prezzi_energia`

Current Italian energy prices from the [Solematica](https://www.solematica.it) database, updated monthly from [ARERA](https://www.arera.it) and [GME](https://www.mercatoelettrico.org).

**Returns:** Self-consumption price (EUR/kWh), SSP price, cost per kWp range, battery cost per kWh, last update date.

### `cerca_articoli`

Search the [Solematica blog](https://www.solematica.it/blog) for energy-related articles.

**Input:**
- `categoria` — Filter by category (e.g. `fotovoltaico`, `incentivi`, `risparmio`)
- `limit` — Max results (default: 10, max: 50)

**Returns:** Article list with title, slug, category, date, description, and full URL.

## Examples

Ask Claude:

- *"Quanto produrrebbe un impianto fotovoltaico in Via Garibaldi 15, Torino?"*
- *"Confronta le offerte fotovoltaico di Enel e Iren"*
- *"Quali provider offrono anche la pompa di calore?"*
- *"Qual e il prezzo corrente dell'energia in Italia?"*
- *"Cerca articoli sugli incentivi fotovoltaico 2026"*

## Links

- [Solematica](https://www.solematica.it) — Main platform
- [Provider Comparison](https://www.solematica.it/confronto-offerte) — Compare 11 Italian solar providers
- [Solar Estimate](https://www.solematica.it/stima) — Free solar estimate tool
- [Energy Guide](https://www.solematica.it/guida) — Complete energy guide
- [API Documentation](https://www.solematica.it/sviluppatori) — REST API docs
- [Blog](https://www.solematica.it/blog) — Energy articles and news
- [npm Package](https://www.npmjs.com/package/@solematica/mcp-server) — npm registry page
- [Model Context Protocol](https://modelcontextprotocol.io) — MCP specification
- [MCP Servers](https://modelcontextprotocol.io/examples) — More MCP servers

## Related

- [Google Solar API](https://developers.google.com/maps/documentation/solar) — Satellite-based solar potential
- [PVGIS](https://re.jrc.ec.europa.eu/pvg_tools/en/) — EU photovoltaic estimation tool
- [ARERA](https://www.arera.it) — Italian energy regulator
- [Superbonus & Incentivi](https://www.solematica.it/fotovoltaico) — Italian solar incentives info

## License

MIT — see [LICENSE](LICENSE) file.

## Author

[Solematica](https://www.solematica.it) — [Soloweb SRL](https://www.solematica.it/chi-siamo)
