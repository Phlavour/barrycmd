import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import { PILLARS, HOOK_TYPES, STRUCTURES, BARRY_VOICE } from '../lib/barry-voice';

const PASSWORD = 'barry12!';

// ─── Theme (matches djangodashboard) ─────────────────────────
const T = {
  bg: "#06060a", bg2: "#0c0c12", surface: "#101018", surfaceAlt: "#14141e",
  card: "#131320", cardHover: "#191930", border: "#1a1a2e", borderHi: "#252545",
  text: "#dfe0eb", textSoft: "#8888a4", textDim: "#4a4a65",
  cyan: "#00d4ff", cyanDim: "rgba(0,212,255,.08)",
  green: "#22c55e", red: "#ef4444", amber: "#f59e0b",
  purple: "#a78bfa", blue: "#60a5fa",
};

const pillarColor = (id) => PILLARS.find(p => p.id === id)?.color || T.textSoft;
const pillarLabel = (id) => PILLARS.find(p => p.id === id)?.label || id;

const STATUS_COLORS = { draft: T.textDim, ready: T.amber, posted: T.green, archived: T.textDim };

// ─── Components ───────────────────────────────────────────────
function Badge({ children, color }) {
  return (
    <span style={{
      fontSize: 10, fontWeight: 600, color,
      background: color + '18', padding: '2px 8px',
      borderRadius: 4, fontFamily: "'IBM Plex Mono', monospace",
      letterSpacing: '.02em', textTransform: 'uppercase',
    }}>{children}</span>
  );
}

function Btn({ children, onClick, color = T.cyan, outline, small, disabled, full, style: sx = {} }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      padding: small ? '5px 12px' : '8px 18px',
      fontSize: small ? 11 : 12,
      fontWeight: 700,
      border: `1px solid ${outline ? color : color}`,
      borderRadius: 6,
      cursor: disabled ? 'not-allowed' : 'pointer',
      background: outline ? 'transparent' : color,
      color: outline ? color : '#000',
      transition: 'all .15s',
      opacity: disabled ? .4 : 1,
      fontFamily: "'IBM Plex Mono', monospace",
      width: full ? '100%' : undefined,
      letterSpacing: '.02em',
      ...sx,
    }}>{children}</button>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 10, color: T.textSoft, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 5, fontFamily: "'IBM Plex Mono', monospace" }}>{label}</div>
      {children}
    </div>
  );
}

const inputStyle = {
  width: '100%', boxSizing: 'border-box',
  background: T.bg2, border: `1px solid ${T.border}`,
  borderRadius: 6, color: T.text,
  padding: '8px 12px', fontSize: 13,
  fontFamily: "'Satoshi', sans-serif", outline: 'none',
};

function Input({ value, onChange, placeholder, style = {} }) {
  return <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{ ...inputStyle, ...style }} />;
}

function Textarea({ value, onChange, placeholder, rows = 4, style = {} }) {
  return <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows} style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6, ...style }} />;
}

function Select({ value, onChange, options, style = {} }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} style={{ ...inputStyle, cursor: 'pointer', ...style }}>
      {options.map(o => <option key={o.value || o} value={o.value || o}>{o.label || o}</option>)}
    </select>
  );
}

function Card({ children, style = {} }) {
  return (
    <div style={{
      background: T.card, border: `1px solid ${T.border}`,
      borderRadius: 12, padding: 20, marginBottom: 14,
      ...style,
    }}>{children}</div>
  );
}

function SectionHead({ children }) {
  return (
    <h3 style={{
      margin: '0 0 16px', fontSize: 13, fontWeight: 600,
      color: T.text, fontFamily: "'Satoshi', sans-serif",
      textTransform: 'uppercase', letterSpacing: '.06em',
    }}>{children}</h3>
  );
}

// ─── Login ────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [pw, setPw] = useState('');
  const [err, setErr] = useState(false);
  const submit = () => {
    if (pw === PASSWORD) onLogin();
    else { setErr(true); setTimeout(() => setErr(false), 1500); }
  };
  return (
    <div style={{ minHeight: '100vh', background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 24 }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 28, fontWeight: 900, color: T.text, fontFamily: "'Satoshi', sans-serif", letterSpacing: '-.02em' }}>barry</div>
        <div style={{ fontSize: 12, color: T.textDim, marginTop: 4, fontFamily: "'IBM Plex Mono', monospace" }}>content dashboard</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: 260 }}>
        <input
          type="password" value={pw}
          onChange={e => setPw(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()}
          placeholder="password"
          style={{ ...inputStyle, textAlign: 'center', borderColor: err ? T.red : T.border, transition: 'border-color .2s' }}
        />
        <Btn onClick={submit} full>enter</Btn>
      </div>
    </div>
  );
}

// ─── Content Tab ──────────────────────────────────────────────
function ContentTab() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [filterPillar, setFilterPillar] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [genTopic, setGenTopic] = useState('');
  const [genNotes, setGenNotes] = useState('');
  const [genPillar, setGenPillar] = useState('ai');
  const [genHook, setGenHook] = useState('N');
  const [genStructure, setGenStructure] = useState('Single Insight');
  const [genLength, setGenLength] = useState('medium');
  const [generated, setGenerated] = useState('');
  const [editId, setEditId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [editStatus, setEditStatus] = useState('draft');
  const [editScore, setEditScore] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [feedbackPostId, setFeedbackPostId] = useState(null);
  const [feedbacks, setFeedbacks] = useState({});
  const [newFeedback, setNewFeedback] = useState('');
  const [newRating, setNewRating] = useState('');

  const loadPosts = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/posts');
    const data = await res.json();
    setPosts(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  useEffect(() => { loadPosts(); }, [loadPosts]);

  const generate = async () => {
    setGenerating(true);
    setGenerated('');
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic: genTopic, pillar: genPillar, hook_type: genHook, structure: genStructure, length: genLength, notes: genNotes }),
    });
    const data = await res.json();
    setGenerated(data.post || '');
    setGenerating(false);
  };

  const saveDraft = async () => {
    if (!generated.trim()) return;
    await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: generated, pillar: genPillar, hook_type: genHook, structure: genStructure, status: 'draft' }),
    });
    setGenerated('');
    await loadPosts();
  };

  const updatePost = async (id, updates) => {
    await fetch('/api/posts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates }),
    });
    await loadPosts();
  };

  const deletePost = async (id) => {
    if (!confirm('Delete?')) return;
    await fetch('/api/posts', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    await loadPosts();
  };

  const saveEdit = async () => {
    await updatePost(editId, { content: editContent, status: editStatus, score: editScore ? parseInt(editScore) : null, notes: editNotes });
    setEditId(null);
  };

  const loadFeedback = async (postId) => {
    if (feedbackPostId === postId) { setFeedbackPostId(null); return; }
    const res = await fetch(`/api/feedback?post_id=${postId}`);
    const data = await res.json();
    setFeedbacks(p => ({ ...p, [postId]: Array.isArray(data) ? data : [] }));
    setFeedbackPostId(postId);
    setNewFeedback(''); setNewRating('');
  };

  const addFeedback = async (postId) => {
    if (!newFeedback.trim()) return;
    await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ post_id: postId, note: newFeedback, rating: newRating ? parseInt(newRating) : null }),
    });
    const res = await fetch(`/api/feedback?post_id=${postId}`);
    const data = await res.json();
    setFeedbacks(p => ({ ...p, [postId]: Array.isArray(data) ? data : [] }));
    setNewFeedback(''); setNewRating('');
  };

  const deleteFeedback = async (fbId, postId) => {
    await fetch('/api/feedback', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: fbId }) });
    setFeedbacks(p => ({ ...p, [postId]: (p[postId] || []).filter(f => f.id !== fbId) }));
  };

  const chars = generated.length;
  const charColor = chars > 600 ? T.amber : chars > 280 ? T.textSoft : T.green;
  const filtered = posts.filter(p => (filterPillar === 'all' || p.pillar === filterPillar) && (filterStatus === 'all' || p.status === filterStatus));

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 24, alignItems: 'flex-start' }}>

      {/* Generator */}
      <div>
        <Card>
          <SectionHead>generate post</SectionHead>

          <Field label="Pillar">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {PILLARS.map(p => (
                <button key={p.id} onClick={() => setGenPillar(p.id)} style={{
                  padding: '4px 10px', fontSize: 11, fontWeight: 700,
                  border: `1px solid ${genPillar === p.id ? p.color : T.border}`,
                  borderRadius: 5, cursor: 'pointer', fontFamily: "'IBM Plex Mono', monospace",
                  background: genPillar === p.id ? p.color + '20' : 'transparent',
                  color: genPillar === p.id ? p.color : T.textSoft,
                }}>{p.label}</button>
              ))}
            </div>
          </Field>

          <Field label="Hook">
            <Select value={genHook} onChange={setGenHook} options={HOOK_TYPES.map(h => ({ value: h.id, label: h.label }))} />
          </Field>

          <Field label="Structure">
            <Select value={genStructure} onChange={setGenStructure} options={STRUCTURES} />
          </Field>

          <Field label="Length">
            <div style={{ display: 'flex', gap: 6 }}>
              {[['short', '< 280'], ['medium', '280–600'], ['teacher', '600–1500']].map(([v, l]) => (
                <button key={v} onClick={() => setGenLength(v)} style={{
                  flex: 1, padding: '6px 4px', fontSize: 11, fontWeight: 700,
                  border: `1px solid ${genLength === v ? T.cyan : T.border}`,
                  borderRadius: 5, cursor: 'pointer', fontFamily: "'IBM Plex Mono', monospace",
                  background: genLength === v ? T.cyanDim : 'transparent',
                  color: genLength === v ? T.cyan : T.textSoft,
                }}>{l}</button>
              ))}
            </div>
          </Field>

          <Field label="Topic">
            <Input value={genTopic} onChange={setGenTopic} placeholder="what's this post about?" />
          </Field>

          <Field label="Notes">
            <Input value={genNotes} onChange={setGenNotes} placeholder="extra context, angles, data..." />
          </Field>

          <Btn onClick={generate} disabled={generating} full style={{ marginTop: 4 }}>
            {generating ? '⏳ generating...' : '⚡ generate'}
          </Btn>

          {generated && (
            <div style={{ marginTop: 16 }}>
              <textarea
                value={generated}
                onChange={e => setGenerated(e.target.value)}
                rows={8}
                style={{ ...inputStyle, background: T.bg2, borderColor: T.cyan + '40', lineHeight: 1.7 }}
              />
              <div style={{ fontSize: 10, color: charColor, textAlign: 'right', marginTop: 4, fontFamily: "'IBM Plex Mono', monospace" }}>{chars} chars</div>
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <Btn onClick={generate} outline small color={T.textSoft} sx={{ flex: 1 }} disabled={generating}>↺ retry</Btn>
                <Btn onClick={saveDraft} small sx={{ flex: 1 }}>💾 save draft</Btn>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Posts */}
      <div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <Select value={filterPillar} onChange={setFilterPillar} options={[{ value: 'all', label: 'All pillars' }, ...PILLARS.map(p => ({ value: p.id, label: p.label }))]} style={{ width: 'auto' }} />
          <Select value={filterStatus} onChange={setFilterStatus} options={['all', 'draft', 'ready', 'posted', 'archived'].map(s => ({ value: s, label: s }))} style={{ width: 'auto' }} />
          <span style={{ fontSize: 11, color: T.textDim, marginLeft: 'auto', fontFamily: "'IBM Plex Mono', monospace" }}>{filtered.length} posts</span>
        </div>

        {loading && <div style={{ color: T.textDim, fontSize: 13, padding: 20 }}>loading...</div>}

        {filtered.map(post => (
          <Card key={post.id} style={{ borderColor: editId === post.id ? T.cyan + '50' : T.border }}>
            {editId === post.id ? (
              <div>
                <Textarea value={editContent} onChange={setEditContent} rows={6} style={{ marginBottom: 10 }} />
                <div style={{ fontSize: 10, color: T.textDim, textAlign: 'right', marginBottom: 10, fontFamily: "'IBM Plex Mono', monospace" }}>{editContent.length} chars</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 80px', gap: 10, marginBottom: 12 }}>
                  <Field label="Status"><Select value={editStatus} onChange={setEditStatus} options={['draft', 'ready', 'posted', 'archived']} /></Field>
                  <Field label="Notes"><Input value={editNotes} onChange={setEditNotes} placeholder="notes..." /></Field>
                  <Field label="Score"><Input value={editScore} onChange={setEditScore} placeholder="1-10" /></Field>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Btn onClick={saveEdit} small>save</Btn>
                  <Btn onClick={() => setEditId(null)} outline small color={T.textSoft}>cancel</Btn>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 10, flexWrap: 'wrap' }}>
                  <Badge color={pillarColor(post.pillar)}>{pillarLabel(post.pillar)}</Badge>
                  {post.hook_type && <Badge color={T.purple}>{post.hook_type}</Badge>}
                  <Badge color={STATUS_COLORS[post.status] || T.textDim}>{post.status}</Badge>
                  {post.score && <Badge color={post.score >= 7 ? T.green : T.amber}>{post.score}/10</Badge>}
                  <span style={{ fontSize: 10, color: T.textDim, marginLeft: 'auto', fontFamily: "'IBM Plex Mono', monospace" }}>
                    {new Date(post.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </span>
                </div>

                <div style={{ fontSize: 13, color: T.text, lineHeight: 1.7, whiteSpace: 'pre-wrap', marginBottom: 10, fontFamily: "'Satoshi', sans-serif" }}>
                  {post.content}
                </div>

                {post.notes && <div style={{ fontSize: 11, color: T.textDim, fontStyle: 'italic', marginBottom: 8 }}>note: {post.notes}</div>}

                <div style={{ fontSize: 10, color: T.textDim, marginBottom: 12, fontFamily: "'IBM Plex Mono', monospace" }}>
                  {post.content?.length || 0} chars
                </div>

                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <Btn onClick={() => { setEditId(post.id); setEditContent(post.content); setEditStatus(post.status); setEditScore(post.score || ''); setEditNotes(post.notes || ''); }} outline small color={T.cyan}>edit</Btn>
                  {post.status !== 'ready' && <Btn onClick={() => updatePost(post.id, { status: 'ready' })} outline small color={T.amber}>mark ready</Btn>}
                  {post.status !== 'posted' && <Btn onClick={() => updatePost(post.id, { status: 'posted' })} outline small color={T.green}>mark posted</Btn>}
                  <Btn onClick={() => navigator.clipboard.writeText(post.content)} outline small color={T.textSoft}>copy</Btn>
                  <Btn onClick={() => loadFeedback(post.id)} outline small color={T.purple}>
                    {feedbackPostId === post.id ? 'close' : `feedback${feedbacks[post.id]?.length ? ` (${feedbacks[post.id].length})` : ''}`}
                  </Btn>
                  <Btn onClick={() => deletePost(post.id)} outline small color={T.red}>delete</Btn>
                </div>

                {feedbackPostId === post.id && (
                  <div style={{ marginTop: 14, padding: 14, background: T.bg2, borderRadius: 8, border: `1px solid ${T.purple}30` }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: T.purple, marginBottom: 10, fontFamily: "'IBM Plex Mono', monospace", textTransform: 'uppercase', letterSpacing: '.06em' }}>Barry Feedback</div>
                    {(feedbacks[post.id] || []).map(fb => (
                      <div key={fb.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 8, padding: '8px 10px', background: T.card, borderRadius: 6 }}>
                        {fb.rating && <span style={{ fontSize: 11, fontWeight: 700, color: T.amber, fontFamily: "'IBM Plex Mono', monospace", minWidth: 36 }}>{fb.rating}/10</span>}
                        <span style={{ flex: 1, fontSize: 12, color: T.text, lineHeight: 1.5 }}>{fb.note}</span>
                        <button onClick={() => deleteFeedback(fb.id, post.id)} style={{ background: 'none', border: 'none', color: T.textDim, cursor: 'pointer', fontSize: 11 }}>✕</button>
                      </div>
                    ))}
                    <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                      <input value={newRating} onChange={e => setNewRating(e.target.value)} placeholder="score" style={{ ...inputStyle, width: 60 }} />
                      <input value={newFeedback} onChange={e => setNewFeedback(e.target.value)} onKeyDown={e => e.key === 'Enter' && addFeedback(post.id)} placeholder="add note..." style={{ ...inputStyle, flex: 1 }} />
                      <Btn onClick={() => addFeedback(post.id)} small>add</Btn>
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>
        ))}

        {!loading && filtered.length === 0 && (
          <div style={{ color: T.textDim, fontSize: 13, textAlign: 'center', padding: 40, fontFamily: "'IBM Plex Mono', monospace" }}>no posts yet</div>
        )}
      </div>
    </div>
  );
}

// ─── Research Tab ─────────────────────────────────────────────
function ResearchTab() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [topic, setTopic] = useState('');
  const [content, setContent] = useState('');
  const [source, setSource] = useState('');
  const [tags, setTags] = useState('');
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/research');
    const data = await res.json();
    setItems(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const add = async () => {
    if (!topic.trim() || !content.trim()) return;
    await fetch('/api/research', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ topic, content, source, tags }) });
    setTopic(''); setContent(''); setSource(''); setTags('');
    await load();
  };

  const del = async (id) => {
    if (!confirm('Delete?')) return;
    await fetch('/api/research', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    await load();
  };

  const saveEdit = async () => {
    await fetch('/api/research', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editId, ...editData }) });
    setEditId(null);
    await load();
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 24, alignItems: 'flex-start' }}>
      <Card>
        <SectionHead>add research</SectionHead>
        <Field label="Topic"><Input value={topic} onChange={setTopic} placeholder="topic title" /></Field>
        <Field label="Content"><Textarea value={content} onChange={setContent} rows={6} placeholder="notes, data, observations..." /></Field>
        <Field label="Source"><Input value={source} onChange={setSource} placeholder="url or source name" /></Field>
        <Field label="Tags"><Input value={tags} onChange={setTags} placeholder="ai, market, onchain..." /></Field>
        <Btn onClick={add} full style={{ marginTop: 4 }}>save research</Btn>
      </Card>

      <div>
        {loading && <div style={{ color: T.textDim, fontSize: 13, padding: 20 }}>loading...</div>}
        {items.map(item => (
          <Card key={item.id}>
            {editId === item.id ? (
              <div>
                <Field label="Topic"><Input value={editData.topic} onChange={v => setEditData(p => ({ ...p, topic: v }))} /></Field>
                <Field label="Content"><Textarea value={editData.content} onChange={v => setEditData(p => ({ ...p, content: v }))} rows={5} /></Field>
                <Field label="Source"><Input value={editData.source} onChange={v => setEditData(p => ({ ...p, source: v }))} /></Field>
                <Field label="Tags"><Input value={editData.tags} onChange={v => setEditData(p => ({ ...p, tags: v }))} /></Field>
                <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                  <Btn onClick={saveEdit} small>save</Btn>
                  <Btn onClick={() => setEditId(null)} outline small color={T.textSoft}>cancel</Btn>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.text, fontFamily: "'Satoshi', sans-serif" }}>{item.topic}</div>
                  <span style={{ fontSize: 10, color: T.textDim, fontFamily: "'IBM Plex Mono', monospace" }}>{new Date(item.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                </div>
                {item.tags && (
                  <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
                    {item.tags.split(',').map(t => t.trim()).filter(Boolean).map(t => (
                      <Badge key={t} color={T.cyan}>{t}</Badge>
                    ))}
                  </div>
                )}
                <div style={{ fontSize: 13, color: T.textSoft, lineHeight: 1.6, whiteSpace: 'pre-wrap', marginBottom: 10 }}>{item.content}</div>
                {item.source && <div style={{ fontSize: 11, color: T.textDim }}>source: {item.source}</div>}
                <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
                  <Btn onClick={() => { setEditId(item.id); setEditData({ topic: item.topic, content: item.content, source: item.source || '', tags: item.tags || '' }); }} outline small color={T.cyan}>edit</Btn>
                  <Btn onClick={() => del(item.id)} outline small color={T.red}>delete</Btn>
                </div>
              </div>
            )}
          </Card>
        ))}
        {!loading && items.length === 0 && <div style={{ color: T.textDim, fontSize: 13, textAlign: 'center', padding: 40, fontFamily: "'IBM Plex Mono', monospace" }}>no research yet</div>}
      </div>
    </div>
  );
}

// ─── Analytics Tab ────────────────────────────────────────────
function AnalyticsTab({ posts }) {
  const total = posts.length;
  const posted = posts.filter(p => p.status === 'posted').length;
  const ready = posts.filter(p => p.status === 'ready').length;
  const draft = posts.filter(p => p.status === 'draft').length;

  const byPillar = PILLARS.map(p => {
    const pp = posts.filter(x => x.pillar === p.id);
    const scored = pp.filter(x => x.score);
    return {
      ...p, total: pp.length,
      posted: pp.filter(x => x.status === 'posted').length,
      ready: pp.filter(x => x.status === 'ready').length,
      draft: pp.filter(x => x.status === 'draft').length,
      avg: scored.length ? (scored.reduce((s, x) => s + x.score, 0) / scored.length).toFixed(1) : null,
    };
  }).filter(p => p.total > 0);

  const maxTotal = Math.max(...byPillar.map(p => p.total), 1);
  const topScored = [...posts].filter(p => p.score).sort((a, b) => b.score - a.score).slice(0, 5);

  const StatCard = ({ label, val, color }) => (
    <Card style={{ textAlign: 'center', marginBottom: 0 }}>
      <div style={{ fontSize: 10, color: T.textSoft, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 8, fontFamily: "'IBM Plex Mono', monospace" }}>{label}</div>
      <div style={{ fontSize: 32, fontWeight: 700, color, fontFamily: "'Satoshi', sans-serif" }}>{val}</div>
    </Card>
  );

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        <StatCard label="total" val={total} color={T.text} />
        <StatCard label="posted" val={posted} color={T.green} />
        <StatCard label="ready" val={ready} color={T.amber} />
        <StatCard label="drafts" val={draft} color={T.textDim} />
      </div>

      <Card>
        <SectionHead>by pillar</SectionHead>
        {byPillar.map(p => (
          <div key={p.id} style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: p.color, fontFamily: "'Satoshi', sans-serif" }}>{p.label}</span>
                {p.avg && <span style={{ fontSize: 10, color: T.amber, fontFamily: "'IBM Plex Mono', monospace" }}>avg {p.avg}/10</span>}
              </div>
              <span style={{ fontSize: 10, color: T.textDim, fontFamily: "'IBM Plex Mono', monospace" }}>{p.posted} posted · {p.ready} ready · {p.draft} draft</span>
            </div>
            <div style={{ height: 5, background: T.bg2, borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(p.total / maxTotal) * 100}%`, background: p.color, borderRadius: 3, transition: 'width .4s' }} />
            </div>
          </div>
        ))}
      </Card>

      {topScored.length > 0 && (
        <Card style={{ marginTop: 16 }}>
          <SectionHead>top scored</SectionHead>
          {topScored.map(p => (
            <div key={p.id} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 12, paddingBottom: 12, borderBottom: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 20, fontWeight: 900, color: p.score >= 8 ? T.green : p.score >= 6 ? T.amber : T.red, fontFamily: "'IBM Plex Mono', monospace", minWidth: 36 }}>{p.score}</div>
              <div>
                <Badge color={pillarColor(p.pillar)}>{pillarLabel(p.pillar)}</Badge>
                <div style={{ fontSize: 12, color: T.textSoft, lineHeight: 1.5, marginTop: 6 }}>{(p.content || '').slice(0, 120)}...</div>
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────
export default function App() {
  const [auth, setAuth] = useState(false);
  const [tab, setTab] = useState('content');
  const [allPosts, setAllPosts] = useState([]);

  useEffect(() => {
    if (typeof window !== 'undefined' && sessionStorage.getItem('barry_auth')) setAuth(true);
  }, []);

  useEffect(() => {
    if (auth) fetch('/api/posts').then(r => r.json()).then(d => setAllPosts(Array.isArray(d) ? d : []));
  }, [auth, tab]);

  const login = () => { sessionStorage.setItem('barry_auth', '1'); setAuth(true); };

  if (!auth) return (
    <>
      <Head>
        <title>barry — content dashboard</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600;700&family=Satoshi:wght@400;500;700;900&display=swap" rel="stylesheet" />
      </Head>
      <LoginScreen onLogin={login} />
    </>
  );

  const posted = allPosts.filter(p => p.status === 'posted').length;
  const ready = allPosts.filter(p => p.status === 'ready').length;

  return (
    <>
      <Head>
        <title>barry — content dashboard</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600;700&family=Satoshi:wght@400;500;700;900&display=swap" rel="stylesheet" />
      </Head>
      <div style={{ minHeight: '100vh', background: T.bg, color: T.text, fontFamily: "'Satoshi', sans-serif" }}>
        {/* Nav */}
        <div style={{ borderBottom: `1px solid ${T.border}`, padding: '0 32px', display: 'flex', alignItems: 'center', position: 'sticky', top: 0, background: T.bg, zIndex: 100 }}>
          <div style={{ fontSize: 16, fontWeight: 900, color: T.text, marginRight: 32, padding: '16px 0', letterSpacing: '-.01em', fontFamily: "'Satoshi', sans-serif" }}>barry</div>
          {['content', 'research', 'analytics'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '16px 18px', fontSize: 12, fontWeight: tab === t ? 700 : 400,
              background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: "'IBM Plex Mono', monospace",
              color: tab === t ? T.text : T.textDim,
              borderBottom: `2px solid ${tab === t ? T.cyan : 'transparent'}`,
              textTransform: 'uppercase', letterSpacing: '.04em',
              transition: 'all .15s',
            }}>{t}</button>
          ))}
          <div style={{ marginLeft: 'auto', fontSize: 10, color: T.textDim, padding: '16px 0', fontFamily: "'IBM Plex Mono', monospace" }}>
            {posted} posted · {ready} ready
          </div>
        </div>

        {/* Main */}
        <div style={{ padding: '28px 32px', maxWidth: 1400, margin: '0 auto' }}>
          {tab === 'content' && <ContentTab />}
          {tab === 'research' && <ResearchTab />}
          {tab === 'analytics' && <AnalyticsTab posts={allPosts} />}
        </div>
      </div>
    </>
  );
}
