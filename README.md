# mcp-prayer-times

Islamic prayer times & calendar MCP (Aladhan API). Keyless.

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1394+ live data sources.

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

Or connect to the full Pipeworx gateway for access to all 1394+ data sources:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English:

```
ask_pipeworx({ question: "your question about Prayer Times data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
