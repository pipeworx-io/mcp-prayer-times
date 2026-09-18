# mcp-prayer-times

Islamic prayer times & calendar MCP (Aladhan API). Keyless.

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1476+ live data sources.

## Tools

| Tool | Description |
|------|-------------|
| `prayer_times` | Islamic prayer times (salah times: Fajr, Sunrise, Dhuhr, Asr, Maghrib, Isha, plus Imsak and Midnight) for a location today. Provide either city+country or latitude+longitude. Returns timings, Gregorian and Hijri (Islamic calendar) dates, timezone, and the calculation method used. |
| `qibla` | Qibla direction (compass bearing toward the Kaaba in Mecca) for a given latitude/longitude, in degrees from true north. |
| `convert_to_hijri` | Convert a Gregorian date to the Hijri (Islamic) calendar date. Useful for Islamic calendar date conversion. |
| `hijri_calendar` | Monthly Islamic prayer-times calendar for a city: per-day Gregorian and Hijri (Islamic calendar) dates with salah times (Fajr, Dhuhr, Maghrib, Isha). |

## Quick Start

Add to your MCP client (Claude Desktop, Cursor, Windsurf, etc.):

```json
{
  "mcpServers": {
    "prayer-times": {
      "url": "https://gateway.pipeworx.io/prayer-times/mcp"
    }
  }
}
```

### What this endpoint actually serves

`tools/list` at `https://gateway.pipeworx.io/prayer-times/mcp` returns the tools in the table
above **plus the shared Pipeworx meta-tools** — `ask_pipeworx`,
`discover_tools`, `search_within`, `remember`/`recall` and the rest of the
gateway-wide set. So the tool count you see is larger than this table: a
single-pack endpoint currently lists roughly 30 shared tools alongside the
pack's own. The connection's `initialize` response states its exact scope, and
is the authoritative answer for a given day.

This is deliberate, not multiplexing by accident. The meta-tools are what let a
scoped connection answer a question this pack does not cover — via
`ask_pipeworx`, which routes across the whole catalog — without you adding a
second MCP server. There is currently no way to mount a pack endpoint without
them; if the extra schemas cost you more context than the routing is worth,
connect to the full gateway once rather than to several pack endpoints.

Or connect to the full Pipeworx gateway to get every pack's tools listed
directly, instead of just this one's:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

Both URLs reach the same gateway and the same 1476+ data sources. The
only difference is which pack's tools are listed **directly**; `ask_pipeworx`
reaches all of them from either one.

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English —
this works on the pack endpoint above as well as on the full gateway:

```
ask_pipeworx({ question: "your question about Prayer Times data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT

## No MCP client? Call it over HTTP

```bash
curl -X POST https://gateway.pipeworx.io/v1/tools/prayer_times \
  -H 'Content-Type: application/json' \
  -d '{"city":"London","country":"UK"}'
```

No account needed for the first calls. Inspect any tool: `GET https://gateway.pipeworx.io/v1/tools/prayer_times`. Find one: `POST https://gateway.pipeworx.io/v1/tools/search_packs` with `{"query":"..."}`.
