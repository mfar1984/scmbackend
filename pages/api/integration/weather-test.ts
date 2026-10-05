import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed.' });
  }

  try {
    // Load weather settings from DB
    const rows = await db('integration_settings')
      .where({ module: 'weather' })
      .select('key', 'value');

    const s: Record<string, string> = {};
    for (const row of rows) s[row.key] = row.value || '';

    if (!s.api_key) {
      return res.status(400).json({ success: false, message: 'API key not configured. Please save your settings first.' });
    }

    const city    = s.city         || 'Petaling Jaya';
    const country = s.country_code || 'MY';
    const units   = s.units        || 'metric';
    const unitSymbol = units === 'imperial' ? '°F' : '°C';

    let weatherData: any = null;

    // ── OpenWeatherMap ──────────────────────────────────────
    if (s.provider === 'openweathermap' || !s.provider) {
      const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)},${country}&appid=${s.api_key}&units=${units}`;
      const r   = await fetch(url);
      const d   = await r.json();

      if (!r.ok) {
        return res.status(400).json({ success: false, message: d.message || 'OpenWeatherMap API error.' });
      }

      weatherData = {
        city:        d.name,
        country:     d.sys?.country,
        temp:        Math.round(d.main?.temp),
        feels_like:  Math.round(d.main?.feels_like),
        humidity:    d.main?.humidity,
        description: d.weather?.[0]?.description,
        icon:        d.weather?.[0]?.icon,
        wind_speed:  d.wind?.speed,
        unit:        unitSymbol,
      };
    }

    // ── WeatherAPI.com ──────────────────────────────────────
    else if (s.provider === 'weatherapi') {
      const url = `https://api.weatherapi.com/v1/current.json?key=${s.api_key}&q=${encodeURIComponent(city)}&aqi=no`;
      const r   = await fetch(url);
      const d   = await r.json();

      if (!r.ok) {
        return res.status(400).json({ success: false, message: d.error?.message || 'WeatherAPI error.' });
      }

      const temp = units === 'imperial' ? d.current?.temp_f : d.current?.temp_c;
      const feel = units === 'imperial' ? d.current?.feelslike_f : d.current?.feelslike_c;

      weatherData = {
        city:        d.location?.name,
        country:     d.location?.country,
        temp:        Math.round(temp),
        feels_like:  Math.round(feel),
        humidity:    d.current?.humidity,
        description: d.current?.condition?.text,
        icon:        d.current?.condition?.icon,
        wind_speed:  d.current?.wind_kph,
        unit:        unitSymbol,
      };
    }

    // ── Open-Meteo (Free, no key needed) ───────────────────
    else if (s.provider === 'openmeteo') {
      // First geocode the city
      const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`;
      const geoR   = await fetch(geoUrl);
      const geoD   = await geoR.json();

      if (!geoD.results?.length) {
        return res.status(400).json({ success: false, message: `City "${city}" not found.` });
      }

      const { latitude, longitude, name, country: geoCountry } = geoD.results[0];
      const meteoUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&hourly=relativehumidity_2m&temperature_unit=${units === 'imperial' ? 'fahrenheit' : 'celsius'}`;
      const meteoR   = await fetch(meteoUrl);
      const meteoD   = await meteoR.json();

      weatherData = {
        city:        name,
        country:     geoCountry,
        temp:        Math.round(meteoD.current_weather?.temperature),
        feels_like:  Math.round(meteoD.current_weather?.temperature),
        humidity:    meteoD.hourly?.relativehumidity_2m?.[0] || 0,
        description: meteoD.current_weather?.weathercode >= 0 ? 'Current weather' : 'N/A',
        icon:        null,
        wind_speed:  meteoD.current_weather?.windspeed,
        unit:        unitSymbol,
      };
    }

    else {
      return res.status(400).json({ success: false, message: `Provider "${s.provider}" test not supported yet.` });
    }

    return res.status(200).json({ success: true, data: weatherData });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message || 'Failed to fetch weather data.' });
  }
}
