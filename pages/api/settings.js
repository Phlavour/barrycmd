import { supabase } from '../../lib/supabase';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { key } = req.query;
    if (!key) {
      const { data } = await supabase.from('settings').select('*');
      return res.json(data || []);
    }
    const { data } = await supabase.from('settings').select('value').eq('key', key).maybeSingle();
    return res.json({ value: data?.value || null });
  }

  if (req.method === 'POST') {
    const { key, value } = req.body;
    if (!key) return res.status(400).json({ error: 'key required' });

    // Try update first, then insert
    const { data: existing } = await supabase.from('settings').select('key').eq('key', key).maybeSingle();
    if (existing) {
      const { data, error } = await supabase.from('settings').update({ value }).eq('key', key).select();
      if (error) return res.status(500).json({ error });
      return res.json(data?.[0] || { key, value });
    } else {
      const { data, error } = await supabase.from('settings').insert({ key, value }).select();
      if (error) return res.status(500).json({ error });
      return res.json(data?.[0] || { key, value });
    }
  }

  res.status(405).end();
}
