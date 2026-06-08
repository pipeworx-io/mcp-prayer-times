interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

interface McpToolExport {
  tools: McpToolDefinition[];
  callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
  meter?: { credits: number };
  cost?: Record<string, unknown>;
  provider?: string;
}

/**
 * Islamic prayer times & calendar MCP (Aladhan API). Keyless.
 */


const BASE = 'https://api.aladhan.com/v1';
const UA = 'pipeworx/1.0 (+https://pipeworx.io)';

const tools: McpToolExport['tools'] = [
  {
    name: 'prayer_times',
    description:
      'Islamic prayer times (salah times: Fajr, Sunrise, Dhuhr, Asr, Maghrib, Isha, plus Imsak and Midnight) for a location today. Provide either city+country or latitude+longitude. Returns timings, Gregorian and Hijri (Islamic calendar) dates, timezone, and the calculation method used.',
    inputSchema: {
      type: 'object',
      properties: {
        city: { type: 'string', description: 'City name, e.g. "London". Requires country.' },
        country: { type: 'string', description: 'Country name or code, e.g. "UK". Requires city.' },
        latitude: { type: 'number', description: 'Latitude in decimal degrees. Use with longitude as an alternative to city+country.' },
        longitude: { type: 'number', description: 'Longitude in decimal degrees. Use with latitude.' },
        method: {
          type: 'number',
          description: 'Prayer-time calculation method. Default 2 = ISNA (Islamic Society of North America); 3 = MWL (Muslim World League); 4 = Umm al-Qura (Makkah); and others.',
        },
      },
    },
  },
  {
    name: 'qibla',
    description: 'Qibla direction (compass bearing toward the Kaaba in Mecca) for a given latitude/longitude, in degrees from true north.',
    inputSchema: {
      type: 'object',
      properties: {
        latitude: { type: 'number', description: 'Latitude in decimal degrees.' },
        longitude: { type: 'number', description: 'Longitude in decimal degrees.' },
      },
      required: ['latitude', 'longitude'],
    },
  },
  {
    name: 'convert_to_hijri',
    description: 'Convert a Gregorian date to the Hijri (Islamic) calendar date. Useful for Islamic calendar date conversion.',
    inputSchema: {
      type: 'object',
      properties: {
        date: { type: 'string', description: 'Gregorian date in DD-MM-YYYY format, e.g. "07-06-2026".' },
      },
      required: ['date'],
    },
  },
  {
    name: 'hijri_calendar',
    description:
      'Monthly Islamic prayer-times calendar for a city: per-day Gregorian and Hijri (Islamic calendar) dates with salah times (Fajr, Dhuhr, Maghrib, Isha).',
    inputSchema: {
      type: 'object',
      properties: {
        city: { type: 'string', description: 'City name, e.g. "London".' },
        country: { type: 'string', description: 'Country name or code, e.g. "UK".' },
        month: { type: 'number', description: 'Gregorian month, 1-12.' },
        year: { type: 'number', description: 'Gregorian year, e.g. 2026.' },
        method: {
          type: 'number',
          description: 'Prayer-time calculation method. Default 2 = ISNA; 3 = MWL; 4 = Umm al-Qura; and others.',
        },
      },
      required: ['city', 'country', 'month', 'year'],
    },
  },
];

async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  switch (name) {
    case 'prayer_times': {
      const city = optStr(args, 'city');
      const country = optStr(args, 'country');
      const latitude = optNum(args, 'latitude');
      const longitude = optNum(args, 'longitude');
      const method = optNum(args, 'method') ?? 2;

      let data: AladhanResult | { error: unknown; message: string };
      if (city && country) {
        data = await aladhanGet(
          `/timingsByCity?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}&method=${method}`,
        );
      } else if (latitude !== undefined && longitude !== undefined) {
        data = await aladhanGet(`/timings?latitude=${latitude}&longitude=${longitude}&method=${method}`);
      } else {
        return { error: 'location_required', message: 'Provide city+country or latitude+longitude.' };
      }
      if (isError(data)) return data;

      const d = data as Record<string, any>;
      return {
        timings: d.timings,
        gregorian_date: d.date?.readable,
        hijri_date: d.date?.hijri
          ? `${d.date.hijri.day} ${d.date.hijri.month?.en} ${d.date.hijri.year}`
          : undefined,
        timezone: d.meta?.timezone,
        method: d.meta?.method?.name,
      };
    }

    case 'qibla': {
      const latitude = reqNum(args, 'latitude');
      const longitude = reqNum(args, 'longitude');
      const data = await aladhanGet(`/qibla/${latitude}/${longitude}`);
      if (isError(data)) return data;
      const d = data as Record<string, any>;
      return {
        qibla_direction_degrees: d.direction,
        note: 'Compass bearing from true north toward the Kaaba in Mecca',
      };
    }

    case 'convert_to_hijri': {
      const date = reqStr(args, 'date', '"07-06-2026"');
      const data = await aladhanGet(`/gToH/${encodeURIComponent(date)}`);
      if (isError(data)) return data;
      const d = data as Record<string, any>;
      return {
        gregorian: d.gregorian?.date,
        hijri: d.hijri ? `${d.hijri.day} ${d.hijri.month?.en} ${d.hijri.year} AH` : undefined,
        weekday: d.hijri?.weekday?.en,
      };
    }

    case 'hijri_calendar': {
      const city = reqStr(args, 'city', '"London"');
      const country = reqStr(args, 'country', '"UK"');
      const month = reqNum(args, 'month');
      const year = reqNum(args, 'year');
      const method = optNum(args, 'method') ?? 2;
      const data = await aladhanGet(
        `/calendarByCity?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}&month=${month}&year=${year}&method=${method}`,
      );
      if (isError(data)) return data;
      const days = (data as any[]) || [];
      return {
        city,
        days: days.map((day: Record<string, any>) => ({
          gregorian: day.date?.gregorian?.date,
          hijri: day.date?.hijri ? `${day.date.hijri.day} ${day.date.hijri.month?.en}` : undefined,
          fajr: day.timings?.Fajr,
          dhuhr: day.timings?.Dhuhr,
          maghrib: day.timings?.Maghrib,
          isha: day.timings?.Isha,
        })),
      };
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

type AladhanResult = unknown;

function isError(v: unknown): v is { error: unknown; message: string } {
  return typeof v === 'object' && v !== null && 'error' in (v as Record<string, unknown>);
}

async function aladhanGet(path: string): Promise<AladhanResult | { error: unknown; message: string }> {
  const res = await fetch(`${BASE}${path}`, { headers: { Accept: 'application/json', 'User-Agent': UA } });
  if (!res.ok) {
    return { error: res.status, message: res.statusText || `HTTP ${res.status}` };
  }
  const body = (await res.json()) as { code?: number; status?: string; data?: unknown };
  if (body.code !== 200) {
    return { error: body.code ?? 'unknown', message: body.status ?? 'Request failed' };
  }
  return body.data;
}

function optStr(args: Record<string, unknown>, key: string): string | undefined {
  const v = args[key];
  return typeof v === 'string' && v.trim() ? v : undefined;
}

function optNum(args: Record<string, unknown>, key: string): number | undefined {
  const v = args[key];
  return typeof v === 'number' && Number.isFinite(v) ? v : undefined;
}

function reqStr(args: Record<string, unknown>, key: string, example: string): string {
  const v = args[key];
  if (typeof v !== 'string' || !v.trim()) throw new Error(`Required argument "${key}" is missing. Pass a string like ${example}.`);
  return v;
}

function reqNum(args: Record<string, unknown>, key: string): number {
  const v = args[key];
  if (typeof v !== 'number' || !Number.isFinite(v)) throw new Error(`Required argument "${key}" is missing or not a number.`);
  return v;
}

export default { tools, callTool, meter: { credits: 1 } } satisfies McpToolExport;
