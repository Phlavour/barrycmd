import { supabase } from '../../lib/supabase';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('account', 'BARRY')
      .order('id', { ascending: true })
      .limit(1000);
    if (error) return res.status(500).json({ error });
    return res.json(data || []);
  }

  if (req.method === 'POST') {
    const rows = Array.isArray(req.body) ? req.body : [req.body];
    const toInsert = rows.map(p => ({
      tab: p.tab || 'DRAFT', category: p.category || '', structure: p.structure || '',
      post: p.post || p.content || '', notes: p.notes || '', score: p.score || null,
      how_to_fix: p.howToFix || p.how_to_fix || '', day: p.day || '',
      source: p.source || '', hook_type: p.hook_type || '', author: p.author || 'BARRY',
      account: 'BARRY', post_link: p.postLink || p.post_link || '',
      impressions: p.impressions || null, likes: p.likes || null,
      engagements: p.engagements || null, bookmarks: p.bookmarks || null,
      replies: p.replies || null, reposts: p.reposts || null,
      profile_visits: p.profileVisits || p.profile_visits || null,
      new_follows: p.newFollows || p.new_follows || null,
      url_clicks: p.urlClicks || p.url_clicks || null,
      image_url: p.image_url || '',
    }));
    const { data, error } = await supabase.from('posts').insert(toInsert).select();
    if (error) return res.status(500).json({ error });
    return res.json(data);
  }

  if (req.method === 'PATCH') {
    const { id, ...updates } = req.body;
    if (!id) return res.status(400).json({ error: 'id required' });
    const { data, error } = await supabase.from('posts').update(updates).eq('id', id).select();
    if (error) return res.status(500).json({ error });
    return res.json(data?.[0] || {});
  }

  if (req.method === 'DELETE') {
    const { id, tab, all } = req.body;
    if (all && tab) {
      const { error } = await supabase.from('posts').delete().eq('account', 'BARRY').eq('tab', tab);
      if (error) return res.status(500).json({ error });
    } else if (id) {
      const { error } = await supabase.from('posts').delete().eq('id', id);
      if (error) return res.status(500).json({ error });
    }
    return res.json({ ok: true });
  }

  res.status(405).end();
}
