import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';

const TIDES_LOCATIONS: Record<string, { lat: number; lon: number; region: string }> = {
  // Semenanjung Malaysia — West Coast
  'Pulau Langkawi':   { lat: 6.3500,  lon: 99.8000,  region: 'Kedah' },
  'Pulau Pinang':     { lat: 5.4141,  lon: 100.3288, region: 'Pulau Pinang' },
  'Lumut':            { lat: 4.2333,  lon: 100.6333, region: 'Perak' },
  'Pelabuhan Kelang': { lat: 3.0042,  lon: 101.3936, region: 'Selangor' },
  'Tanjung Keling':   { lat: 2.1833,  lon: 102.1333, region: 'Melaka' },
  'Kukup':            { lat: 1.3203,  lon: 103.4395, region: 'Johor' },
  // Semenanjung Malaysia — East Coast
  'Johor Bahru':      { lat: 1.4655,  lon: 103.7578, region: 'Johor' },
  'Tanjung Sedili':   { lat: 1.9333,  lon: 104.1167, region: 'Johor' },
  'Pulau Tioman':     { lat: 2.8167,  lon: 104.1667, region: 'Pahang' },
  'Tanjung Gelang':   { lat: 3.9667,  lon: 103.4333, region: 'Pahang' },
  'Cendering':        { lat: 5.2667,  lon: 103.1167, region: 'Terengganu' },
  'Geting':           { lat: 5.9667,  lon: 102.5167, region: 'Kelantan' },
  // Sarawak
  'Pulau Lakei':      { lat: 3.4833,  lon: 113.0333, region: 'Sarawak' },
  'Sejingkat':        { lat: 1.5833,  lon: 110.3500, region: 'Sarawak' },
  'Bintulu':          { lat: 3.1667,  lon: 113.0333, region: 'Sarawak' },
  'Miri':             { lat: 4.3997,  lon: 113.9914, region: 'Sarawak' },
  // Sabah
  'Kota Kinabalu':    { lat: 5.9804,  lon: 116.0735, region: 'Sabah' },
  'Kudat':            { lat: 6.8833,  lon: 116.8333, region: 'Sabah' },
  'Sandakan':         { lat: 5.8389,  lon: 118.1178, region: 'Sabah' },
  'Lahad Datu':       { lat: 5.0333,  lon: 118.3333, region: 'Sabah' },
  'Tawau':            { lat: 4.2495,  lon: 117.8944, region: 'Sabah' },
  'Labuan':           { lat: 5.2831,  lon: 115.2308, region: 'Labuan' },
};

export { TIDES_LOCATIONS };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed.' });
  }

  try {
    // Load tides settings from DB
    const rows = await db('integration_settings')
      .where({ module: 'weather' })
      .select('key', 'value');

    const s: Record<string, string> = {};
    for (const row of rows) s[row.key] = row.value || '';

    if (!s.tides_api_key) {
      return res.status(400).json({ success: false, message: 'WorldTides API key not configured. Please save your settings first.' });
    }

    const location = s.tides_location || 'Pelabuhan Kelang';
    const coords   = TIDES_LOCATIONS[location];

    if (!coords) {
      return res.status(400).json({ success: false, message: `Location "${location}" not found.` });
    }

    const { lat, lon } = coords;
    const url = `https://www.worldtides.info/api/v3?extremes&lat=${lat}&lon=${lon}&key=${s.tides_api_key}&days=3`;

    const response = await fetch(url);
    const data     = await response.json();

    if (!response.ok || data.status !== 200) {
      return res.status(400).json({
        success: false,
        message: data.error || `WorldTides API error (${data.status}).`,
      });
    }

    if (!data.extremes?.length) {
      return res.status(400).json({ success: false, message: 'No tide data returned for this location.' });
    }

    // Parse extremes
    const extremes = data.extremes.map((e: any) => ({
      dt:     new Date(e.dt * 1000).toISOString(),
      type:   e.type === 'High' ? 'High' : 'Low',
      height: parseFloat(e.height.toFixed(2)),
    }));

    // Save to DB
    await db.raw(
      'INSERT INTO `integration_settings` (`module`, `key`, `value`) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE `value` = VALUES(`value`)',
      ['weather', 'tides_data', JSON.stringify({ location, extremes })]
    );
    await db.raw(
      'INSERT INTO `integration_settings` (`module`, `key`, `value`) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE `value` = VALUES(`value`)',
      ['weather', 'tides_last_sync', new Date().toISOString()]
    );

    return res.status(200).json({
      success: true,
      data: {
        location,
        region:   coords.region,
        extremes,
        synced_at: new Date().toISOString(),
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message || 'Failed to fetch tides data.' });
  }
}
