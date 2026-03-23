# @solematica/mcp-server

MCP (Model Context Protocol) server for Solematica — solar estimates, provider comparison and energy data for Italy.

## Tools

| Tool | Description | Auth required |
|------|-------------|---------------|
| `stima_solare` | Solar estimate for an Italian address (production, savings, ROI) | API key |
| `info_tetto` | Satellite roof analysis (surface, orientation, segments) | No |
| `confronta_provider` | Compare 11 Italian solar providers (prices, components, transparency) | No |
| `dettaglio_provider` | Full provider detail (services, contacts, accessories) | No |
| `prezzi_energia` | Current Italian energy prices (PUN/ARERA) | No |
| `cerca_articoli` | Search blog articles by category/keyword | No |

## Usage with Claude Desktop

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

API key is only required for `stima_solare`. All other tools work without authentication.

## Environment Variables

- `SOLEMATICA_API_KEY` — API key for authenticated endpoints (get one at solematica.it/partner)
- `SOLEMATICA_API_URL` — API base URL (default: `https://api.solematica.it/api/v1`)
