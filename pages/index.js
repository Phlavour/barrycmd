import React, { useState, useEffect, useCallback, useRef } from "react";
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

// ═══════════════════════════════════════════════════════════════
// THEME — Tachyo-inspired light mode
// ═══════════════════════════════════════════════════════════════
const T = {
  bg: "#fafafa", bg2: "#f2f2f2", surface: "#ffffff", surfaceAlt: "#f7f7f7",
  card: "#ffffff", border: "#e8e8e8", borderHi: "#d0d0d0",
  text: "#0a0a0a", textSoft: "#4a4a4a", textDim: "#9a9a9a",
  green: "#0a7a3e", greenDim: "rgba(10,122,62,.06)", greenMid: "rgba(10,122,62,.14)",
  red: "#c0281e", redDim: "rgba(192,40,30,.06)",
  blue: "#1a4fd6", blueDim: "rgba(26,79,214,.06)",
  amber: "#a06010", amberDim: "rgba(160,96,16,.06)",
  purple: "#6030c0", purpleDim: "rgba(96,48,192,.06)",
  cyan: "#006fa0", cyanDim: "rgba(0,111,160,.06)",
};

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════
const PASSWORD = "barry12!";
const STATUS_ORDER = ["DRAFT", "POST", "USED", "DATABASE", "BAD", "SKETCH", "IDEAS"];

const TABS_CONFIG = {
  DRAFT:    { color: T.blue,   icon: "✎",  label: "Draft" },
  POST:     { color: T.green,  icon: "◉",  label: "Post" },
  USED:     { color: T.textDim,icon: "✓",  label: "Used" },
  DATABASE: { color: T.purple, icon: "◈",  label: "Database" },
  BAD:      { color: T.red,    icon: "✕",  label: "Bad" },
  SKETCH:   { color: T.amber,  icon: "💡", label: "Sketch" },
  IDEAS:    { color: T.cyan,   icon: "📝", label: "Ideas" },
};

const BARRY_CATEGORIES = [
  "ai", "on-chain", "trading-psychology", "eu-asia", "building",
  "tachyo", "articles", "monthly-summary", "market-analysis",
  "current", "mindset", "pnl-shares", "lifestyle",
];

const CAT_COLORS = {
  "ai": T.cyan, "on-chain": T.green, "trading-psychology": T.amber,
  "eu-asia": T.purple, "building": T.blue, "tachyo": "#0a7a3e",
  "articles": "#6030c0", "monthly-summary": "#a06010", "market-analysis": "#c0281e",
  "current": "#1a4fd6", "mindset": "#006fa0", "pnl-shares": "#0a7a3e", "lifestyle": "#7744dd",
};

const STRUCTURES = [
  "APAG (Attention-Problem-Advantage-Guide)", "Single Insight", "Story → Lesson",
  "Case Study (with technical details)", "Contrarian Take", "Before/After",
  "Question → Answer", "List (3-5 points)", "Framework / System",
  "Shared Enemy", "Data + Interpretation", "Building in Public update",
];

const HOOKS = {
  H:  { name: "Helpful",  color: "#22c55e", desc: "Show how you'll help.", examples: ["here's what actually works", "the system that got me to 80% win rate"] },
  E1: { name: "Emotion",  color: "#f59e0b", desc: "Pain or experience. First-person.", examples: ["grew $3K to $40K. lost it all. rebuilt with AI tools"] },
  A:  { name: "Ask",      color: "#3b82f6", desc: "Question they're thinking.", examples: ["why does everyone use AI but nobody builds with it?"] },
  D:  { name: "Do/Don't", color: "#ef4444", desc: "Direct instruction.", examples: ["stop following KOLs. follow their wallets instead"] },
  L:  { name: "Lists",    color: "#8b5cf6", desc: "Signal scannable value.", examples: ["5 AI tools I built in 2 months"] },
  I:  { name: "Inspire",  color: "#ec4899", desc: "Paint the outcome.", examples: ["imagine knowing a wallet loaded 4h before the call"] },
  N:  { name: "Numbers",  color: "#06b6d4", desc: "Lead with specific data.", examples: ["80% win rate. 3-4 positions max. 1 failure per cycle."] },
  E2: { name: "Empathy",  color: "#a78bfa", desc: "Show you understand.", examples: ["if you're still entering blind, without on-chain confirmation"] },
};

// ─── API helpers (all calls go through Next.js API routes — no keys in browser) ───
const api = {
  async generate(body) {
    const r = await fetch("/api/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    return r.json();
  },
  async getPosts() {
    const r = await fetch("/api/posts"); return r.json();
  },
  async savePost(post) {
    const r = await fetch("/api/posts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(post) });
    return r.json();
  },
  async savePosts(posts) {
    const r = await fetch("/api/posts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(posts) });
    return r.json();
  },
  async patchPost(id, updates) {
    await fetch("/api/posts", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, ...updates }) });
  },
  async deletePost(id) {
    await fetch("/api/posts", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
  },
  async deleteAllInTab(tab) {
    await fetch("/api/posts", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tab, all: true }) });
  },
  async getSetting(key) {
    const r = await fetch(`/api/settings?key=${key}`); const d = await r.json(); return d.value;
  },
  async setSetting(key, value) {
    const r = await fetch("/api/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key, value }) });
    const d = await r.json();
    if (!r.ok || d.error) throw new Error(JSON.stringify(d.error || d));
    return d;
  },
  async getAnalytics(type) {
    const r = await fetch(`/api/analytics?type=${type}`); return r.json();
  },
  async saveAnalytics(table, rows) {
    await fetch("/api/analytics", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ table, rows }) });
  },
  async getResearch() {
    const r = await fetch("/api/research"); return r.json();
  },
  async saveResearch(data) {
    const r = await fetch("/api/research", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    return r.json();
  },
  async deleteResearch(id) {
    await fetch("/api/research", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
  },
};

// ═══════════════════════════════════════════════════════════════
// MICRO COMPONENTS
// ═══════════════════════════════════════════════════════════════
const Badge = ({ children, color = T.green }) => (
  <span style={{ fontSize: 10, fontWeight: 600, color, background: `${color}18`, padding: "2px 8px", borderRadius: 4, fontFamily: "'IBM Plex Mono', monospace", letterSpacing: ".02em" }}>{children}</span>
);

const Btn = ({ children, color = T.green, outline, small, onClick, disabled, style: sx }) => (
  <button disabled={disabled} onClick={onClick} style={{
    background: outline ? "transparent" : `${color}14`,
    border: `1px solid ${outline ? T.border : `${color}40`}`,
    borderRadius: 7, padding: small ? "4px 10px" : "8px 16px",
    color: disabled ? T.textDim : (outline ? T.textSoft : color),
    fontSize: small ? 10 : 12, fontWeight: 600, cursor: disabled ? "default" : "pointer",
    transition: "all .15s", fontFamily: "'IBM Plex Mono', monospace", opacity: disabled ? .4 : 1, ...sx,
  }}
    onMouseEnter={e => { if (!disabled) { e.currentTarget.style.borderColor = color; e.currentTarget.style.background = `${color}20`; } }}
    onMouseLeave={e => { if (!disabled) { e.currentTarget.style.borderColor = outline ? T.border : `${color}40`; e.currentTarget.style.background = outline ? "transparent" : `${color}14`; } }}
  >{children}</button>
);

const Card = ({ children, style: sx }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, boxShadow: "0 1px 2px rgba(0,0,0,.04)", ...sx }}>{children}</div>
);

const Heading = ({ children, icon, right }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
    <h3 style={{ margin: 0, fontSize: 13, fontWeight: 600, color: T.text, fontFamily: "'Satoshi', sans-serif", textTransform: "uppercase", letterSpacing: ".06em", display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ opacity: .5 }}>{icon}</span>{children}
    </h3>
    {right}
  </div>
);

const TabBtn = ({ label, active, onClick, color = T.green, count }) => (
  <button onClick={onClick} style={{
    background: active ? `${color}12` : "transparent", border: `1px solid ${active ? `${color}50` : T.border}`,
    borderRadius: 7, padding: "7px 14px", color: active ? color : T.textSoft, fontSize: 12, fontWeight: 600,
    cursor: "pointer", transition: "all .15s", fontFamily: "'IBM Plex Mono', monospace", display: "flex", alignItems: "center", gap: 6,
  }}>{label}{count !== undefined && <span style={{ background: active ? color : T.borderHi, color: active ? T.bg : T.textSoft, borderRadius: 8, padding: "1px 6px", fontSize: 9, fontWeight: 700 }}>{count}</span>}</button>
);

const Dot = ({ color, pulse }) => (
  <span style={{ display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: color || T.green, boxShadow: pulse ? `0 0 8px ${color || T.green}` : "none" }} />
);

const LoadingDots = () => {
  const [d, setD] = useState("");
  useEffect(() => { const i = setInterval(() => setD(x => x.length >= 3 ? "" : x + "."), 400); return () => clearInterval(i); }, []);
  return <span style={{ color: T.green, fontFamily: "'IBM Plex Mono'" }}>loading{d}</span>;
};

const sel = { background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 6, padding: "6px 10px", color: T.text, fontSize: 12, fontFamily: "'IBM Plex Mono', monospace", outline: "none", cursor: "pointer" };

// ═══════════════════════════════════════════════════════════════
// ANALYTICS HELPERS
// ═══════════════════════════════════════════════════════════════
function normPillar(p) { return (p || "").toLowerCase().replace(/ /g, "-"); }
function parseXDate(raw) { if (!raw) return null; const d = new Date(raw); if (!isNaN(d)) return d; return null; }
function anum(v) { return parseInt((v || "").toString().replace(/,/g, "")) || 0; }

function parseAnalyticsCSV(text) {
  const lines = text.split("\n").filter(l => l.trim());
  if (!lines.length) return [];
  const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, ""));
  return lines.slice(1).map(line => {
    const vals = []; let cur = "", inQ = false;
    for (const ch of line) {
      if (ch === '"' && !inQ) { inQ = true; continue; }
      if (ch === '"' && inQ) { inQ = false; continue; }
      if (ch === "," && !inQ) { vals.push(cur.trim()); cur = ""; continue; }
      cur += ch;
    }
    vals.push(cur.trim());
    const row = {}; headers.forEach((h, i) => { row[h] = vals[i] || ""; }); return row;
  });
}

function getWords(text) { return (text || "").toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter(w => w.length > 3); }
function findMatch(postText, supaRows) {
  const pWords = new Set(getWords(postText));
  let best = null, bestScore = 0;
  for (const row of supaRows) {
    const rWords = getWords(row.post || "");
    if (!rWords.length) continue;
    let shared = 0; rWords.forEach(w => { if (pWords.has(w)) shared++; });
    const score = shared / Math.max(rWords.length, pWords.size);
    if (score > bestScore && score > 0.4) { bestScore = score; best = row; }
  }
  return best;
}

const AChartTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: T.card, border: "1px solid " + T.border, borderRadius: 8, padding: "8px 12px", fontSize: 11 }}>
      <div style={{ fontWeight: 600, color: T.text, marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => <div key={i} style={{ color: p.color || T.textSoft }}>{p.name}: <strong>{typeof p.value === "number" ? p.value.toLocaleString() : p.value}</strong></div>)}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// LOGIN
// ═══════════════════════════════════════════════════════════════
function LoginScreen({ onLogin }) {
  const [pw, setPw] = useState(""), [err, setErr] = useState(false);
  const submit = () => { if (pw === PASSWORD) onLogin(); else { setErr(true); setTimeout(() => setErr(false), 1500); } };
  return (
    <div style={{ minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 24 }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: T.text, fontFamily: "'IBM Plex Mono', monospace" }}>barry</div>
        <div style={{ fontSize: 11, color: T.textDim, marginTop: 4, fontFamily: "'IBM Plex Mono', monospace" }}>content dashboard</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, width: 260 }}>
        <input type="password" value={pw} onChange={e => setPw(e.target.value)} onKeyDown={e => e.key === "Enter" && submit()} placeholder="password"
          style={{ ...sel, textAlign: "center", borderColor: err ? T.red : T.border, transition: "border-color .2s", padding: "10px 14px", fontSize: 14 }} />
        <Btn color={T.green} onClick={submit} style={{ width: "100%", textAlign: "center" }}>enter</Btn>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// CONTENT PANEL
// ═══════════════════════════════════════════════════════════════
function ContentPanel({ allPosts, setAllPosts, brandVoice, setBrandVoice, weeklyNotes, setWeeklyNotes, lastAnalysis, setLastAnalysis }) {
  const [activeTab, setActiveTab] = useState("DRAFT");
  const [sortBy, setSortBy] = useState("mine-first");
  const [newPostText, setNewPostText] = useState(""), [newPostCat, setNewPostCat] = useState("ai");
  const [newPostStructure, setNewPostStructure] = useState(""), [newPostHook, setNewPostHook] = useState("");
  const [newAuthor, setNewAuthor] = useState("BARRY");
  const [showAdd, setShowAdd] = useState(false);
  const [aiLoading, setAiLoading] = useState(null), [aiResults, setAiResults] = useState({});
  const [genLoading, setGenLoading] = useState(false), [genProgress, setGenProgress] = useState("");
  const [rewriteId, setRewriteId] = useState(null), [rewriteFeedback, setRewriteFeedback] = useState("");
  const [rewriteLoading, setRewriteLoading] = useState(false);
  const [fixLoading, setFixLoading] = useState(null), [sketchLoading, setSketchLoading] = useState(null);
  const [editingId, setEditingId] = useState(null), [editText, setEditText] = useState("");
  const [defineLoading, setDefineLoading] = useState(false);
  const [weeklyNotesSaving, setWeeklyNotesSaving] = useState(false);
  const weeklyNotesTimer = useRef(null);
  const EMPTY_WCTX = { hot_topics: "", personal: "", avoid: "", ai_notes: "", seasonal: "" };
  const [wctx, setWctxState] = useState(EMPTY_WCTX);
  const [wctxHistory, setWctxHistory] = useState([]);
  const setWctx = v => setWctxState(p => typeof v === "function" ? v(p) : v);

  useEffect(() => {
    api.getAnalytics("weekly_context").then(d => { if (Array.isArray(d)) setWctxHistory(d); }).catch(() => {});
    api.getSetting("weekly_notes_barry").then(v => { if (v) setWeeklyNotes(v); }).catch(() => {});
    api.getSetting("brand_voice_barry").then(v => { if (v) setBrandVoice(v); }).catch(() => {});
    api.getSetting("last_analysis_barry").then(v => { if (v) setLastAnalysis(v); }).catch(() => {});
  }, []);

  const TC = TABS_CONFIG;

  // Posts
  const tabPosts = (allPosts || []).filter(p => p.tab === activeTab);
  let sorted = [...tabPosts];
  if (sortBy === "mine-first") sorted.sort((a, b) => { const am = a.source === "manual" ? 0 : 1, bm = b.source === "manual" ? 0 : 1; if (am !== bm) return am - bm; return parseFloat(b.score || 0) - parseFloat(a.score || 0); });
  else if (sortBy === "category") sorted.sort((a, b) => (a.category || "").localeCompare(b.category || ""));
  else if (sortBy === "score-desc") sorted.sort((a, b) => parseFloat(b.score || 0) - parseFloat(a.score || 0));
  else if (sortBy === "score-asc") sorted.sort((a, b) => parseFloat(a.score || 0) - parseFloat(b.score || 0));
  else if (sortBy === "newest") sorted.sort((a, b) => (b._supaId || b.id) - (a._supaId || a.id));
  else if (sortBy === "day") { const D = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"]; sorted.sort((a, b) => (D.indexOf(a.day) < 0 ? 99 : D.indexOf(a.day)) - (D.indexOf(b.day) < 0 ? 99 : D.indexOf(b.day))); }

  const counts = {};
  STATUS_ORDER.forEach(t => { counts[t] = (allPosts || []).filter(p => p.tab === t).length; });
  const isUsed = activeTab === "USED", isBad = activeTab === "BAD", isPost = activeTab === "POST";
  const isDraft = activeTab === "DRAFT", isDb = activeTab === "DATABASE";
  const isSketch = activeTab === "SKETCH", isIdeas = activeTab === "IDEAS";

  const savePostsToSupa = async posts => {
    const saved = await api.savePosts(posts);
    if (Array.isArray(saved)) {
      setAllPosts(prev => {
        const updated = [...(prev || [])];
        saved.forEach((s, i) => { const idx = updated.findIndex(p => p.id === posts[i]?.id); if (idx >= 0) updated[idx] = { ...updated[idx], _supaId: s.id }; });
        return updated;
      });
    }
    return saved;
  };

  const movePost = (id, to) => {
    const post = (allPosts || []).find(x => x.id === id);
    setAllPosts(p => p.map(x => x.id === id ? { ...x, tab: to } : x));
    if (post?._supaId) api.patchPost(post._supaId, { tab: to });
  };

  const delPost = id => {
    const post = (allPosts || []).find(x => x.id === id);
    setAllPosts(p => p.filter(x => x.id !== id));
    if (post?._supaId) api.deletePost(post._supaId);
  };

  const deleteAllInTab = tab => {
    if (!confirm(`Delete ALL posts in ${tab}?`)) return;
    setAllPosts(p => p.filter(x => x.tab !== tab));
    api.deleteAllInTab(tab);
  };

  const moveToBad = id => {
    const reason = prompt("Why is this post bad?"); if (reason === null) return;
    const post = (allPosts || []).find(x => x.id === id);
    setAllPosts(p => p.map(x => x.id === id ? { ...x, tab: "BAD", notes: reason || "" } : x));
    if (post?._supaId) api.patchPost(post._supaId, { tab: "BAD", notes: reason || "" });
  };

  const setDay = (id, day) => {
    const post = (allPosts || []).find(x => x.id === id);
    setAllPosts(p => p.map(x => x.id === id ? { ...x, day } : x));
    if (post?._supaId) api.patchPost(post._supaId, { day });
  };

  const autoScore = async (text, pid, category) => {
    if (!text) return;
    try {
      const data = await api.generate({ action: "score", text, pillar: category });
      if (data.score) {
        setAllPosts(prev => {
          let idx = prev.findIndex(p => p.post === text && !p.score);
          if (idx < 0) idx = prev.findIndex(p => p.post === text);
          if (idx < 0) return prev;
          const post = prev[idx];
          if (post._supaId) api.patchPost(post._supaId, { score: String(data.score), notes: data.notes || "" });
          const updated = [...prev];
          updated[idx] = { ...post, score: String(data.score), notes: data.notes || "" };
          return updated;
        });
      }
    } catch {}
  };

  const addPost = async () => {
    if (!newPostText.trim()) return;
    const targetTab = activeTab === "POST" ? "POST" : "DRAFT";
    const newId = (allPosts ? Math.max(0, ...allPosts.map(p => p.id)) : 0) + 1;
    const newPost = {
      id: newId, tab: targetTab, category: newPostCat, structure: newPostStructure,
      post: newPostText.trim(), notes: newPostHook ? `hook: ${newPostHook}` : "",
      score: "", howToFix: "", day: "", source: "manual", hook_type: newPostHook || "",
      author: newAuthor || "BARRY",
    };
    setAllPosts(p => [...(p || []), newPost]);
    setNewPostText(""); setNewPostStructure(""); setNewPostHook(""); setShowAdd(false);
    savePostsToSupa([newPost]).then(() => setTimeout(() => autoScore(newPost.post, newPost.id, newPost.category), 500));
  };

  const saveEdit = (pid, newText) => {
    setAllPosts(prev => (prev || []).map(p => p.id === pid ? { ...p, post: newText } : p));
    const post = (allPosts || []).find(p => p.id === pid);
    if (post?._supaId) api.patchPost(post._supaId, { post: newText });
    setEditingId(null); setEditText("");
  };

  const defineStructure = async () => {
    if (!newPostText.trim()) return;
    setDefineLoading(true);
    try { const d = await api.generate({ action: "define_structure", text: newPostText.trim() }); if (d.structure) setNewPostStructure(d.structure); } catch {}
    setDefineLoading(false);
  };

  const askClaude = async (text, pid, category) => {
    setAiLoading(pid);
    try { const d = await api.generate({ action: "explain", text, pillar: category }); setAiResults(p => ({ ...p, [pid]: d })); }
    catch (err) { setAiResults(p => ({ ...p, [pid]: { notes: err.message } })); }
    finally { setAiLoading(null); }
  };

  const rewritePost = async post => {
    if (!rewriteFeedback.trim()) { alert("Write your feedback first"); return; }
    setRewriteLoading(true);
    try {
      const d = await api.generate({ action: "rewrite", text: post.post, feedback: rewriteFeedback, pillar: post.category });
      if (d.post) {
        const maxId = (allPosts ? Math.max(0, ...allPosts.map(p => p.id)) : 0) + 1;
        const newPost = { id: maxId, tab: "DRAFT", category: post.category, structure: d.structure || post.structure, post: d.post, notes: `rewrite: "${rewriteFeedback.slice(0, 60)}"`, score: "", howToFix: "", day: "", source: "ai", author: post.author || "BARRY" };
        setAllPosts(prev => [newPost, ...(prev || []).filter(p => p.id !== post.id)]);
        if (post._supaId) api.deletePost(post._supaId);
        savePostsToSupa([newPost]).then(() => setTimeout(() => autoScore(newPost.post, newPost.id, newPost.category), 1500));
      }
      setRewriteId(null); setRewriteFeedback("");
    } catch (err) { alert("Error: " + err.message); }
    setRewriteLoading(false);
  };

  const fixPost = async post => {
    setFixLoading(post.id);
    try {
      const d = await api.generate({ action: "fix", text: post.post });
      if (d.post) {
        setAllPosts(prev => (prev || []).map(p => p.id === post.id ? { ...p, post: d.post, notes: (p.notes ? p.notes + " | " : "") + "fixed: " + (d.changes || "").slice(0, 80) } : p));
        if (post._supaId) api.patchPost(post._supaId, { post: d.post });
        setTimeout(() => autoScore(d.post, post.id, post.category), 300);
      }
    } catch (err) { alert("Fix error: " + err.message); }
    setFixLoading(null);
  };

  const makePostFromSketch = async (id, sketchText, category) => {
    setSketchLoading(id);
    try {
      const d = await api.generate({ action: "sketch", text: sketchText, pillar: category });
      const variants = d.variants || [];
      if (variants.length > 0) {
        let maxId = (allPosts ? Math.max(0, ...allPosts.map(p => p.id)) : 0);
        const newPosts = variants.map((v, i) => ({
          id: ++maxId, tab: "DRAFT", category: category || "ai", structure: v.structure || "",
          post: (v.post || "").trim(), notes: `from sketch · hook: ${v.hook_type || "?"} · score: ${v.score || "?"}/10 · v${i + 1}`,
          score: String(v.score || ""), howToFix: "", day: "", source: "ai", author: "BARRY",
        }));
        setAllPosts(p => [...(p || []), ...newPosts]);
        savePostsToSupa(newPosts);
        setAllPosts(p => p.map(x => x.id === id ? { ...x, notes: `✓ ${variants.length} variants → DRAFT` } : x));
        const sk = (allPosts || []).find(x => x.id === id);
        if (sk?._supaId) api.patchPost(sk._supaId, { notes: `✓ ${variants.length} variants → DRAFT` });
      }
    } catch (err) { alert("Error: " + err.message); }
    setSketchLoading(null);
  };

  const handleBrandVoice = async files => {
    const fileArr = Array.from(files);
    if (!fileArr.length) return;
    const texts = await Promise.all(fileArr.map(file => new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = ev => resolve(`=== ${file.name} ===\n${ev.target.result}`);
      reader.onerror = reject;
      reader.readAsText(file);
    })));
    const combined = texts.join("\n\n").trim();
    setBrandVoice(combined);
    try {
      const result = await api.setSetting("brand_voice_barry", combined);
      console.log("Brand voice saved:", result);
      alert(`✅ Brand voice saved (${Math.round(combined.length / 1024)}KB)`);
    } catch (err) {
      console.error("Brand voice save error:", err);
      alert("❌ Save failed: " + err.message);
    }
  };

  const generateWeekly = async () => {
    if (!brandVoice) { alert("Upload brand voice files first"); return; }
    setGenLoading(true);
    const badPosts = (allPosts || []).filter(p => p.tab === "BAD");
    const badFeedback = badPosts.map(p => `"${p.post.slice(0, 80)}..." → ${(p.notes || "no reason").slice(0, 60)}`).join("\n");
    const bv = brandVoice.slice(0, 6000);
    const ctx = weeklyNotes || "";
    const last = (lastAnalysis || "").slice(0, 1000);

    const batches = [
      { category: "ai", count: 4, subtopics: ["AI tools for trading", "building AI bots", "30+ tools built", "money management via API", "FOMO detection bot", "position intelligence", "AI workflow automation"], structures: ["Case Study (with technical details)", "APAG (Attention-Problem-Advantage-Guide)", "Single Insight", "Contrarian Take"], advisor: "Barry builds AI tools, doesn't just consume. Every post: real technical specifics (API, stack, output). Always 1 failure or tool limitation. Concrete numbers only." },
      { category: "on-chain", count: 3, subtopics: ["smart money wallet tracking", "cluster analysis", "Hyperliquid data", "wallets loading before calls", "DuckDB aggregation", "20K wallet database"], structures: ["Case Study (with technical details)", "Data + Interpretation", "Shared Enemy", "Contrarian Take"], advisor: "Barry's edge. Deploy shared enemies: 'Follow KOLs = follow their exits'. Real case studies with wallet numbers, Parquet dumps, free data sources." },
      { category: "trading-psychology", count: 3, subtopics: ["emotional state system (Green/Yellow/Red)", "daily hard stop -$600", "max 3-4 positions", "pre-trade checklist", "losses as data", "patience", "80% win rate context"], structures: ["Single Insight", "Framework / System", "Story → Lesson", "APAG (Attention-Problem-Advantage-Guide)"], advisor: "Green/Yellow/Red system. Losses = data. Hard rules: daily stop -$600, max 3-4 positions. Always contextualize win rate." },
      { category: "eu-asia", count: 2, subtopics: ["EU doesn't see what CN crypto does", "HK conferences", "BNB patterns", "Chinese crypto community", "WOK Labs KOL campaigns", "relocation narrative"], structures: ["Contrarian Take", "Single Insight", "Building in Public update"], advisor: "Unique EU-Asia bridge angle. Real insights from both sides. BNB patterns EU misses. WOK Labs CN+EN community." },
      { category: "building", count: 3, subtopics: ["lockin mode updates", "WOK Labs progress", "The Wokers community", "tool development", "what broke this week", "honest progress"], structures: ["Building in Public update", "Story → Lesson", "Before/After"], advisor: "Honest, specific, with failures. Min 1 failure per post. Share what broke as freely as what worked." },
      { category: "tachyo", count: 2, subtopics: ["wallet scoring system", "S-tier vs C-tier performance", "on-chain intelligence", "smart money before the move", "6 chains scored", "588K wallets"], structures: ["Data + Interpretation", "Single Insight", "Case Study (with technical details)"], advisor: "Tachyo is Barry's product. Be specific about what it does: scores wallets on track record, surfaces S-tier moves before the crowd. Numbers always." },
      { category: "mindset", count: 2, subtopics: ["systems over motivation", "patience as edge", "failure as data", "consistent process", "emotional neutrality", "long-term game"], structures: ["Single Insight", "Contrarian Take", "Story → Lesson"], advisor: "Barry's mindset content: systems thinking, treating losses as data, patience. Never motivational speaker energy." },
      { category: "pnl-shares", count: 2, subtopics: ["weekly PnL with context", "what worked and what didn't", "specific trades with learning", "win rate update", "daily loss limit discipline"], structures: ["Building in Public update", "Data + Interpretation"], advisor: "Honest PnL shares with context. Win rate always contextualized (since when, which markets). Include losses freely." },
    ];

    const newPosts = [];
    let idCounter = ((allPosts ? Math.max(0, ...allPosts.map(p => p.id)) : 0)) + 1;

    for (const batch of batches) {
      setGenProgress(`Generating ${batch.category}... (${batch.count} posts)`);
      try {
        const d = await api.generate({ action: "batch", category: batch.category, count: batch.count, subtopics: batch.subtopics, structures: batch.structures, advisor: batch.advisor, brandVoice: bv, weeklyNotes: ctx, lastAnalysis: last, badFeedback });
        for (const p of (d.posts || [])) {
          newPosts.push({ id: idCounter++, tab: "DRAFT", category: batch.category, structure: p.structure || "", post: p.post || "", notes: `subtopic: ${p.subtopic || ""} · hook: ${p.hook_type || ""} · ${p.length || ""}`, score: "", howToFix: "", day: "", source: "ai", author: "BARRY", hook_type: p.hook_type || "" });
        }
      } catch (err) { setGenProgress(`Error generating ${batch.category}: ${err.message}`); }
    }

    if (newPosts.length > 0) {
      setGenProgress(`${newPosts.length} posts generated. Scoring...`);
      for (let i = 0; i < newPosts.length; i += 10) {
        const scoreBatch = newPosts.slice(i, i + 10);
        setGenProgress(`Scoring ${i + 1}-${Math.min(i + 10, newPosts.length)}...`);
        try {
          const d = await api.generate({ action: "score_batch", posts: scoreBatch });
          (d.scores || []).forEach((s, j) => { if (scoreBatch[j]) { scoreBatch[j].score = String(s.score || ""); scoreBatch[j].notes = (scoreBatch[j].notes ? scoreBatch[j].notes + " · " : "") + (s.feedback || ""); } });
        } catch {}
      }
      setAllPosts(prev => [...(prev || []), ...newPosts]);
      setGenProgress(`✅ ${newPosts.length} posts generated & scored → DRAFT`);
      setActiveTab("DRAFT"); setSortBy("score-desc");
      savePostsToSupa(newPosts);
    } else { setGenProgress("no posts generated — try again"); }
    setGenLoading(false);
  };

  const sortOpts = isUsed ? [{ v: "default", l: "Default" }, { v: "newest", l: "Newest ↓" }, { v: "impressions", l: "Impressions ↓" }]
    : isPost ? [{ v: "default", l: "Default" }, { v: "newest", l: "Newest ↓" }, { v: "day", l: "Day" }, { v: "category", l: "Category" }, { v: "score-desc", l: "Score ↓" }]
    : [{ v: "mine-first", l: "✍ Mine First" }, { v: "newest", l: "Newest ↓" }, { v: "category", l: "Category" }, { v: "score-desc", l: "Score ↓" }, { v: "score-asc", l: "Score ↑" }];

  const saveWeeklyContext = async () => {
    const combined = Object.entries(wctx).filter(([, v]) => v && v.trim()).map(([k, v]) => `[${k.toUpperCase()}] ${v}`).join("\n");
    setWeeklyNotes(combined);
    await api.setSetting("weekly_notes_barry", combined);
    await api.saveAnalytics("weekly_context", [{ week_start: new Date().toISOString().slice(0, 10), ...wctx, updated_at: new Date().toISOString() }]);
    setWeeklyNotesSaving(true); setTimeout(() => setWeeklyNotesSaving(false), 2000);
    const hist = await api.getAnalytics("weekly_context");
    if (Array.isArray(hist)) setWctxHistory(hist);
  };

  return (
    <div>
      {/* Top bar */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ fontSize: 11, color: T.textDim, fontFamily: "'IBM Plex Mono'" }}>{(allPosts || []).length} posts · supabase connected</div>
        <Dot color={T.green} pulse />
      </div>

      {/* Weekly Context */}
      <Card style={{ marginBottom: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span>📋</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>Weekly Context</span>
            <span style={{ fontSize: 10, color: T.textDim }}>feed AI with context for better posts</span>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {weeklyNotesSaving && <span style={{ fontSize: 10, color: T.green }}>✓ saved</span>}
            <Btn small color={T.green} outline onClick={saveWeeklyContext}>💾 Save Week</Btn>
            <Btn small outline onClick={() => { setWctx(EMPTY_WCTX); setWeeklyNotes(""); api.setSetting("weekly_notes_barry", ""); }}>Clear</Btn>
          </div>
        </div>
        {[
          { key: "hot_topics", label: "🔥 Hot Topics", placeholder: "what's happening in crypto, CT drama, EU/Asia news, new narratives...", color: T.red },
          { key: "personal", label: "👤 Personal", placeholder: "lockin updates, WOK Labs progress, tool development, Tachyo launch...", color: T.blue },
          { key: "avoid", label: "🚫 Avoid", placeholder: "patterns that didn't work, topics to skip...", color: T.amber },
          { key: "ai_notes", label: "🤖 Notes for Claude", placeholder: "focus on case studies, more failures, shorter posts...", color: T.green },
          { key: "seasonal", label: "📅 Seasonal", placeholder: "conferences, market cycles, community events...", color: T.purple },
        ].map(f => (
          <div key={f.key} style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: f.color, marginBottom: 3 }}>{f.label}</div>
            <textarea value={wctx[f.key] || ""} onChange={e => {
              const nv = { ...wctx, [f.key]: e.target.value }; setWctx(nv);
              const combined = Object.entries(nv).filter(([, v]) => v.trim()).map(([k, v]) => `[${k.toUpperCase()}] ${v}`).join("\n");
              setWeeklyNotes(combined);
              weeklyNotesTimer.current && clearTimeout(weeklyNotesTimer.current);
              weeklyNotesTimer.current = setTimeout(() => api.setSetting("weekly_notes_barry", combined).then(() => { setWeeklyNotesSaving(true); setTimeout(() => setWeeklyNotesSaving(false), 2000); }), 1500);
            }} placeholder={f.placeholder}
              style={{ width: "100%", minHeight: 44, background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 6, padding: 8, color: T.text, fontSize: 11, fontFamily: "'IBM Plex Mono'", resize: "vertical", lineHeight: 1.5, outline: "none", boxSizing: "border-box" }}
              onFocus={e => e.target.style.borderColor = f.color} onBlur={e => e.target.style.borderColor = T.border} />
          </div>
        ))}
        {wctxHistory.length > 0 && (
          <details style={{ marginTop: 6 }}>
            <summary style={{ fontSize: 11, color: T.textDim, cursor: "pointer" }}>📜 Previous weeks ({wctxHistory.length})</summary>
            <div style={{ marginTop: 6 }}>
              {wctxHistory.map(h => (
                <div key={h.id} style={{ padding: 8, background: T.bg2, borderRadius: 6, marginBottom: 6, fontSize: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, color: T.text }}>{h.week_start}</span>
                    <button onClick={() => setWctx({ hot_topics: h.hot_topics || "", personal: h.personal || "", avoid: h.avoid || "", ai_notes: h.ai_notes || "", seasonal: h.seasonal || "" })} style={{ fontSize: 9, color: T.blue, background: "none", border: "none", cursor: "pointer" }}>load</button>
                  </div>
                  {h.hot_topics && <div style={{ color: T.textSoft }}>🔥 {h.hot_topics.slice(0, 80)}...</div>}
                </div>
              ))}
            </div>
          </details>
        )}
        {lastAnalysis && (
          <details style={{ marginTop: 8 }}>
            <summary style={{ fontSize: 11, color: T.textDim, cursor: "pointer" }}>📊 Last AI Analysis (auto-attached to generation)</summary>
            <div style={{ fontSize: 11, color: T.textSoft, lineHeight: 1.5, marginTop: 6, padding: 8, background: T.bg2, borderRadius: 6, whiteSpace: "pre-wrap", maxHeight: 200, overflowY: "auto" }}>{lastAnalysis}</div>
          </details>
        )}
      </Card>

      {/* Generator */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span>🤖</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>Weekly Content Generator</span>
            {brandVoice && <Badge color={T.green}>Brand voice loaded ✓</Badge>}
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <label style={{ cursor: "pointer" }}>
              <input type="file" accept=".txt,.md" multiple onChange={e => handleBrandVoice(e.target.files)} style={{ display: "none" }} />
              <Btn small color={brandVoice ? T.textDim : T.cyan} style={{ pointerEvents: "none" }}>{brandVoice ? "↻ Update Voice" : "📄 Upload Barry MD"}</Btn>
            </label>
            <Btn small color={T.green} disabled={genLoading || !brandVoice} onClick={generateWeekly}>
              {genLoading ? "⏳ Generating..." : "⚡ Generate Posts"}
            </Btn>
          </div>
        </div>
        {genProgress && <div style={{ marginTop: 8, fontSize: 11, color: genProgress.startsWith("✅") ? T.green : genProgress.startsWith("⚠") ? T.amber : T.textSoft, fontFamily: "'IBM Plex Mono'" }}>{genProgress}</div>}
        {!brandVoice && <div style={{ marginTop: 6, fontSize: 10, color: T.cyan }}>ℹ Upload all 5 Barry MD files to enable generation</div>}
      </Card>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        {STATUS_ORDER.map(tab => (
          <TabBtn key={tab} label={`${TC[tab].icon} ${TC[tab].label}`} active={activeTab === tab}
            onClick={() => { setActiveTab(tab); setSortBy(tab === "DRAFT" ? "mine-first" : "default"); }}
            color={TC[tab].color} count={counts[tab]} />
        ))}
        <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ ...sel, marginLeft: "auto", fontSize: 11 }}>
          {sortOpts.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
        </select>
      </div>

      {/* Stats bar */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 8, marginBottom: 20 }}>
        {STATUS_ORDER.map(tab => (
          <div key={tab} style={{ background: activeTab === tab ? `${TC[tab].color}10` : T.surface, border: `1px solid ${activeTab === tab ? `${TC[tab].color}30` : T.border}`, borderRadius: 8, padding: "8px 10px", textAlign: "center", cursor: "pointer" }} onClick={() => setActiveTab(tab)}>
            <div style={{ fontSize: 18, fontWeight: 700, color: TC[tab].color, fontFamily: "'Satoshi'" }}>{counts[tab]}</div>
            <div style={{ fontSize: 9, color: T.textSoft, textTransform: "uppercase" }}>{tab}</div>
          </div>
        ))}
      </div>

      {/* Delete All / Move All */}
      {counts[activeTab] > 0 && (
        <div style={{ marginBottom: 12, display: "flex", justifyContent: "flex-end", gap: 8 }}>
          {isPost && <Btn small color={T.green} outline onClick={() => { if (!confirm(`Move ALL ${counts.POST} POST → USED?`)) return; setAllPosts(p => p.map(x => x.tab === "POST" ? { ...x, tab: "USED" } : x)); api.deleteAllInTab("_MOVE_POST_USED"); }}>✓ Move All POST → USED</Btn>}
          <Btn small color={T.red} outline onClick={() => deleteAllInTab(activeTab)}>🗑 Delete All {activeTab} ({counts[activeTab]})</Btn>
        </div>
      )}

      {/* Add Post */}
      {(isDraft || isPost) && (
        <div style={{ marginBottom: 16 }}>
          {showAdd ? (
            <Card>
              <Heading icon="✎">New {isPost ? "Post" : "Draft"}</Heading>
              <div style={{ display: "flex", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontSize: 10, color: T.textSoft, marginBottom: 4, textTransform: "uppercase" }}>Author</div>
                  <div style={{ display: "flex", gap: 4 }}>
                    {["BARRY", "HENRYK"].map(a => (
                      <button key={a} onClick={() => setNewAuthor(a)} style={{ padding: "6px 14px", fontSize: 11, fontWeight: 700, background: newAuthor === a ? (a === "BARRY" ? T.greenDim : T.blueDim) : "transparent", border: `1px solid ${newAuthor === a ? (a === "BARRY" ? T.green : T.blue) : T.border}`, borderRadius: 6, cursor: "pointer", color: newAuthor === a ? (a === "BARRY" ? T.green : T.blue) : T.textSoft, fontFamily: "'IBM Plex Mono'" }}>{a}</button>
                    ))}
                  </div>
                </div>
                <div style={{ flex: 1, minWidth: 140 }}>
                  <div style={{ fontSize: 10, color: T.textSoft, marginBottom: 4, textTransform: "uppercase" }}>Category</div>
                  <select value={newPostCat} onChange={e => setNewPostCat(e.target.value)} style={sel}>
                    {BARRY_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div style={{ flex: 2, minWidth: 200 }}>
                  <div style={{ fontSize: 10, color: T.textSoft, marginBottom: 4, textTransform: "uppercase" }}>Structure</div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <select value={newPostStructure} onChange={e => setNewPostStructure(e.target.value)} style={{ ...sel, flex: 1 }}>
                      <option value="">-- select --</option>
                      {STRUCTURES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <button onClick={defineStructure} disabled={defineLoading || !newPostText.trim()} style={{ ...sel, cursor: "pointer", color: defineLoading ? T.purple : T.textSoft, borderColor: defineLoading ? T.purple : T.border }}>
                      {defineLoading ? "⏳" : "🔍 Define"}
                    </button>
                  </div>
                </div>
              </div>
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 10, color: T.textSoft, marginBottom: 6, textTransform: "uppercase" }}>Hook Type</div>
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                  {Object.entries(HOOKS).map(([k, h]) => (
                    <button key={k} onClick={() => setNewPostHook(newPostHook === k ? "" : k)} title={`${h.desc}\n• ${h.examples.join("\n• ")}`}
                      style={{ background: newPostHook === k ? h.color + "20" : "transparent", color: newPostHook === k ? h.color : T.textSoft, border: `1px solid ${newPostHook === k ? h.color : T.border}`, borderRadius: 6, padding: "4px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'IBM Plex Mono'" }}>
                      {k} <span style={{ fontWeight: 400, fontSize: 10 }}>{h.name}</span>
                    </button>
                  ))}
                </div>
              </div>
              <textarea value={newPostText} onChange={e => setNewPostText(e.target.value)} placeholder="write your post..."
                style={{ width: "100%", minHeight: 80, background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 8, padding: 12, color: T.text, fontSize: 13, fontFamily: "'IBM Plex Mono'", resize: "vertical", lineHeight: 1.5, outline: "none", boxSizing: "border-box" }}
                onFocus={e => e.target.style.borderColor = T.green} onBlur={e => e.target.style.borderColor = T.border} />
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <Btn color={T.green} onClick={addPost}>Add to {isPost ? "Post" : "Draft"}</Btn>
                <Btn outline onClick={() => { setShowAdd(false); setNewPostText(""); }}>Cancel</Btn>
              </div>
            </Card>
          ) : <div style={{ textAlign: "center" }}><Btn color={T.green} onClick={() => setShowAdd(true)}>+ New Post</Btn></div>}
        </div>
      )}

      {/* Sketch input */}
      {isSketch && (
        <Card style={{ marginBottom: 16 }}>
          <Heading icon="💡">New Sketch <span style={{ fontSize: 10, color: T.textDim, fontWeight: 400 }}>rough idea → Claude polishes into 3 posts</span></Heading>
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <select value={newPostCat} onChange={e => setNewPostCat(e.target.value)} style={{ ...sel, fontSize: 11 }}>
              {BARRY_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <textarea value={newPostText} onChange={e => setNewPostText(e.target.value)} placeholder="rough idea, observation, case study angle..."
            style={{ width: "100%", minHeight: 60, background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 8, padding: 10, color: T.text, fontSize: 12, fontFamily: "'IBM Plex Mono'", resize: "vertical", lineHeight: 1.5, outline: "none", boxSizing: "border-box" }} />
          <div style={{ marginTop: 8 }}>
            <Btn color={T.amber} onClick={async () => {
              if (!newPostText.trim()) return;
              const newId = ((allPosts ? Math.max(0, ...allPosts.map(p => p.id)) : 0)) + 1;
              const np = { id: newId, tab: "SKETCH", category: newPostCat, structure: "", post: newPostText.trim(), notes: "", score: "", howToFix: "", day: "", source: "manual", author: "BARRY" };
              setAllPosts(p => [...(p || []), np]); savePostsToSupa([np]); setNewPostText("");
            }}>💡 Save Sketch</Btn>
          </div>
        </Card>
      )}

      {/* Ideas input */}
      {isIdeas && (
        <Card style={{ marginBottom: 16 }}>
          <Heading icon="📝">New Idea <span style={{ fontSize: 10, color: T.textDim, fontWeight: 400 }}>bank ideas for later</span></Heading>
          <textarea value={newPostText} onChange={e => setNewPostText(e.target.value)} placeholder="topic, observation, link, case study angle..."
            style={{ width: "100%", minHeight: 50, background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 8, padding: 10, color: T.text, fontSize: 12, fontFamily: "'IBM Plex Mono'", resize: "vertical", lineHeight: 1.5, outline: "none", boxSizing: "border-box" }} />
          <div style={{ marginTop: 8 }}>
            <Btn color={T.cyan} onClick={async () => {
              if (!newPostText.trim()) return;
              const newId = ((allPosts ? Math.max(0, ...allPosts.map(p => p.id)) : 0)) + 1;
              const np = { id: newId, tab: "IDEAS", category: "", structure: "", post: newPostText.trim(), notes: "", score: "", howToFix: "", day: "", source: "manual", author: "BARRY" };
              setAllPosts(p => [...(p || []), np]); savePostsToSupa([np]); setNewPostText("");
            }}>📝 Save Idea</Btn>
          </div>
        </Card>
      )}

      {/* Posts list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {sorted.length === 0 && <div style={{ textAlign: "center", padding: 40, color: T.textDim, fontSize: 13 }}>No posts in {TC[activeTab]?.label}</div>}
        {sorted.map(p => {
          const ai = aiResults[p.id];
          const catColor = CAT_COLORS[p.category] || T.textSoft;
          return (
            <div key={p.id} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16, transition: "all .12s" }}
              onMouseEnter={e => e.currentTarget.style.borderColor = (TC[activeTab]?.color || T.green) + "40"}
              onMouseLeave={e => e.currentTarget.style.borderColor = T.border}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {editingId === p.id ? (
                    <div>
                      <textarea value={editText} onChange={e => setEditText(e.target.value)} autoFocus
                        style={{ width: "100%", minHeight: 80, background: T.bg2, border: `1px solid ${T.cyan}`, borderRadius: 6, padding: 10, color: T.text, fontSize: 13, fontFamily: "'IBM Plex Mono'", resize: "vertical", lineHeight: 1.6, outline: "none", boxSizing: "border-box" }}
                        onKeyDown={e => { if (e.key === "Escape") { setEditingId(null); setEditText(""); } if (e.key === "Enter" && e.ctrlKey) saveEdit(p.id, editText); }} />
                      <div style={{ display: "flex", gap: 6, marginTop: 6, alignItems: "center" }}>
                        <Btn small color={T.cyan} onClick={() => saveEdit(p.id, editText)}>Save</Btn>
                        <Btn small outline onClick={() => { setEditingId(null); setEditText(""); }}>Cancel</Btn>
                        <span style={{ fontSize: 10, color: T.textDim, marginLeft: "auto" }}>{editText.length} chars · Ctrl+Enter to save</span>
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize: 13, color: T.text, lineHeight: 1.6, whiteSpace: "pre-wrap", cursor: "pointer", borderRadius: 6, padding: "2px 4px", margin: "-2px -4px", transition: "background .15s" }}
                      onClick={() => { setEditingId(p.id); setEditText(p.post || ""); }}
                      onMouseEnter={e => e.currentTarget.style.background = `${T.cyan}08`}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                      title="Click to edit">
                      {p.post || <span style={{ color: T.textDim, fontStyle: "italic" }}>Empty — click to edit</span>}
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end", flexShrink: 0 }}>
                  {p.author && p.author !== "BARRY" && <Badge color={T.blue}>{p.author}</Badge>}
                  {p.source === "manual" && <Badge color={T.cyan}>✍ Manual</Badge>}
                  {p.category && <Badge color={catColor}>{p.category}</Badge>}
                  {p.structure && <Badge color={T.textDim}>{p.structure.slice(0, 20)}</Badge>}
                  {p.score && <Badge color={parseFloat(p.score) >= 8.5 ? T.green : parseFloat(p.score) >= 7 ? T.amber : T.textSoft}>⭐ {p.score}</Badge>}
                  {p.day && <Badge color={T.cyan}>📅 {p.day}</Badge>}
                </div>
              </div>

              {isUsed && p.impressions && (
                <div style={{ display: "flex", gap: 12, marginTop: 8, flexWrap: "wrap" }}>
                  {[{ l: "Imp", v: p.impressions, c: T.green }, { l: "Likes", v: p.likes, c: T.red }, { l: "Eng", v: p.engagements, c: T.blue }, { l: "Bkm", v: p.bookmarks, c: T.amber }].filter(m => m.v && m.v !== "0").map((m, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 3 }}>
                      <span style={{ fontSize: 9, color: T.textDim }}>{m.l}:</span>
                      <span style={{ fontSize: 12, color: m.c, fontWeight: 600, fontFamily: "'IBM Plex Mono'" }}>{parseInt(m.v).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}

              {p.notes && !isUsed && <div style={{ marginTop: 6, fontSize: 11, color: T.textSoft }}>💡 {p.notes}</div>}

              {/* Actions */}
              <div style={{ display: "flex", gap: 5, marginTop: 10, alignItems: "center", flexWrap: "wrap" }}>
                {isDraft && <><Btn small color={T.green} onClick={() => movePost(p.id, "POST")}>◉ → Post</Btn><Btn small color={T.purple} outline onClick={() => movePost(p.id, "DATABASE")}>◈ → DB</Btn><Btn small color={T.red} outline onClick={() => moveToBad(p.id)}>✕ → Bad</Btn><Btn small outline onClick={() => delPost(p.id)}>🗑</Btn></>}
                {isPost && <>
                  <select value={p.day || ""} onChange={e => setDay(p.id, e.target.value)} style={{ ...sel, fontSize: 11, padding: "4px 8px" }}>
                    <option value="">📅 Day</option>
                    {["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"].map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <Btn small color={T.green} onClick={() => movePost(p.id, "USED")}>✓ → Used</Btn>
                  <Btn small color={T.blue} outline onClick={() => movePost(p.id, "DRAFT")}>✎ → Draft</Btn>
                  <Btn small color={T.red} outline onClick={() => moveToBad(p.id)}>✕ → Bad</Btn>
                  <Btn small outline onClick={() => delPost(p.id)}>🗑</Btn>
                </>}
                {isDb && <><Btn small color={T.blue} onClick={() => movePost(p.id, "DRAFT")}>✎ → Draft</Btn><Btn small color={T.green} outline onClick={() => movePost(p.id, "POST")}>◉ → Post</Btn><Btn small color={T.red} outline onClick={() => moveToBad(p.id)}>✕ → Bad</Btn><Btn small outline onClick={() => delPost(p.id)}>🗑</Btn></>}
                {isBad && <><Btn small color={T.blue} onClick={() => movePost(p.id, "DRAFT")}>✎ → Draft</Btn><Btn small color={T.red} outline onClick={() => delPost(p.id)}>🗑 Delete</Btn></>}
                {isUsed && <><Btn small color={T.blue} outline onClick={() => movePost(p.id, "DRAFT")}>✎ → Draft</Btn><Btn small outline onClick={() => delPost(p.id)}>🗑</Btn></>}
                {isSketch && <><Btn small color={T.green} disabled={sketchLoading === p.id} onClick={() => makePostFromSketch(p.id, p.post, p.category)}>{sketchLoading === p.id ? "⏳ generating..." : "✨ Generate 3 Posts"}</Btn><Btn small color={T.blue} outline onClick={() => movePost(p.id, "DRAFT")}>✎ → Draft</Btn><Btn small outline onClick={() => delPost(p.id)}>🗑</Btn></>}
                {isIdeas && <><Btn small color={T.amber} outline onClick={() => movePost(p.id, "SKETCH")}>💡 → Sketch</Btn><Btn small color={T.blue} outline onClick={() => movePost(p.id, "DRAFT")}>✎ → Draft</Btn><Btn small outline onClick={() => delPost(p.id)}>🗑</Btn></>}

                {!isUsed && <>
                  <Btn small color={T.purple} disabled={aiLoading === p.id} onClick={() => askClaude(p.post, p.id, p.category)}>{aiLoading === p.id ? "⏳..." : "🤖 Claude"}</Btn>
                  {isDraft && <Btn small color={T.cyan} outline onClick={() => { setRewriteId(rewriteId === p.id ? null : p.id); setRewriteFeedback(""); }}>{rewriteId === p.id ? "Cancel" : "✎ Rewrite"}</Btn>}
                  {isDraft && <Btn small color={T.amber} outline disabled={fixLoading === p.id} onClick={() => fixPost(p)}>{fixLoading === p.id ? "⏳..." : "🔧 Fix"}</Btn>}
                  {(isDraft || isPost) && <>
                    <span style={{ width: 1, height: 16, background: T.border, margin: "0 2px" }} />
                    {["🔁 repost", "💬 quote"].map(tag => (
                      <label key={tag} style={{ display: "flex", alignItems: "center", gap: 4, cursor: "pointer", fontSize: 10, color: (p.notes || "").includes(tag) ? T.cyan : T.textDim }}>
                        <input type="checkbox" checked={(p.notes || "").includes(tag)} onChange={() => {
                          const has = (p.notes || "").includes(tag);
                          const nn = has ? (p.notes || "").replace(new RegExp(`\\s*·?\\s*${tag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "g"), "").trim() : ((p.notes || "") + ` · ${tag}`).replace(/^\s*·\s*/, "").trim();
                          setAllPosts(prev => prev.map(x => x.id === p.id ? { ...x, notes: nn } : x));
                          if (p._supaId) api.patchPost(p._supaId, { notes: nn });
                        }} style={{ accentColor: T.cyan, width: 13, height: 13, cursor: "pointer" }} />{tag}
                      </label>
                    ))}
                  </>}
                </>}
              </div>

              {rewriteId === p.id && (
                <div style={{ marginTop: 8, background: `${T.cyan}10`, border: `1px solid ${T.cyan}30`, padding: "12px 14px", borderRadius: 8 }}>
                  <div style={{ fontSize: 10, color: T.cyan, fontWeight: 600, textTransform: "uppercase", marginBottom: 6 }}>✎ Rewrite with feedback</div>
                  <textarea value={rewriteFeedback} onChange={e => setRewriteFeedback(e.target.value)} placeholder="what should change? 'add concrete numbers', 'shorter', 'add a failure'..."
                    style={{ width: "100%", minHeight: 60, background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 6, padding: 10, color: T.text, fontSize: 12, fontFamily: "'IBM Plex Mono'", resize: "vertical", outline: "none", boxSizing: "border-box" }} />
                  <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                    <Btn small color={T.cyan} disabled={rewriteLoading || !rewriteFeedback.trim()} onClick={() => rewritePost(p)}>{rewriteLoading ? "⏳ Rewriting..." : "Generate Rewrite"}</Btn>
                    <Btn small outline onClick={() => { setRewriteId(null); setRewriteFeedback(""); }}>Cancel</Btn>
                  </div>
                </div>
              )}

              {ai?.notes && (
                <div style={{ marginTop: 8, fontSize: 12, color: T.text, background: T.purpleDim, border: `1px solid ${T.purple}30`, padding: "10px 14px", borderRadius: 8, lineHeight: 1.6 }}>
                  <span style={{ fontSize: 10, color: T.purple, fontWeight: 600, textTransform: "uppercase", display: "block", marginBottom: 4 }}>🤖 Claude</span>
                  {ai.notes}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// RESEARCH PANEL
// ═══════════════════════════════════════════════════════════════
function ResearchPanel() {
  const [items, setItems] = useState([]), [loading, setLoading] = useState(true);
  const [newTopic, setNewTopic] = useState(""), [newContent, setNewContent] = useState("");
  const [newSource, setNewSource] = useState(""), [newTags, setNewTags] = useState("");

  useEffect(() => { api.getResearch().then(d => { setItems(Array.isArray(d) ? d : []); setLoading(false); }).catch(() => setLoading(false)); }, []);

  const add = async () => {
    if (!newTopic.trim() || !newContent.trim()) return;
    const saved = await api.saveResearch({ topic: newTopic, content: newContent, source: newSource, tags: newTags });
    if (Array.isArray(saved) && saved[0]) setItems(p => [saved[0], ...p]);
    else if (saved?.id) setItems(p => [saved, ...p]);
    setNewTopic(""); setNewContent(""); setNewSource(""); setNewTags("");
  };

  const del = async id => { if (!confirm("Delete?")) return; setItems(p => p.filter(x => x.id !== id)); api.deleteResearch(id); };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: 20, alignItems: "flex-start" }}>
      <Card>
        <Heading icon="🔬">Add Research</Heading>
        {[{ label: "Topic", val: newTopic, set: setNewTopic, ph: "topic title" }, { label: "Source", val: newSource, set: setNewSource, ph: "url, artemis, dune..." }, { label: "Tags", val: newTags, set: setNewTags, ph: "on-chain, ai, eu-asia..." }].map(f => (
          <div key={f.label} style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 10, color: T.textSoft, marginBottom: 4, textTransform: "uppercase" }}>{f.label}</div>
            <input value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.ph} style={{ ...sel, width: "100%", boxSizing: "border-box" }} />
          </div>
        ))}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 10, color: T.textSoft, marginBottom: 4, textTransform: "uppercase" }}>Content</div>
          <textarea value={newContent} onChange={e => setNewContent(e.target.value)} rows={6} placeholder="notes, data, wallet addresses, API responses..." style={{ ...sel, width: "100%", boxSizing: "border-box", resize: "vertical", lineHeight: 1.5 }} />
        </div>
        <Btn color={T.green} onClick={add} style={{ width: "100%" }}>Save Research</Btn>
      </Card>
      <div>
        {loading && <div style={{ padding: 20 }}><LoadingDots /></div>}
        {!loading && items.length === 0 && <div style={{ textAlign: "center", padding: 40, color: T.textDim, fontSize: 13 }}>No research yet</div>}
        {items.map(item => (
          <div key={item.id} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16, marginBottom: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{item.topic}</div>
              <span style={{ fontSize: 10, color: T.textDim, fontFamily: "'IBM Plex Mono'" }}>{new Date(item.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>
            </div>
            {item.tags && <div style={{ display: "flex", gap: 5, marginBottom: 8, flexWrap: "wrap" }}>{item.tags.split(",").map(t => t.trim()).filter(Boolean).map(t => <Badge key={t} color={T.cyan}>{t}</Badge>)}</div>}
            <div style={{ fontSize: 13, color: T.textSoft, lineHeight: 1.6, whiteSpace: "pre-wrap", marginBottom: 8 }}>{item.content}</div>
            {item.source && <div style={{ fontSize: 11, color: T.textDim }}>source: {item.source}</div>}
            <div style={{ marginTop: 10 }}><Btn small color={T.red} outline onClick={() => del(item.id)}>🗑 Delete</Btn></div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// ANALYTICS PANEL
// ═══════════════════════════════════════════════════════════════
function AnalyticsPanel({ lastAnalysis, setLastAnalysis }) {
  const [status, setStatus] = useState(""), [busy, setBusy] = useState(false);
  const [report, setReport] = useState(""), [repLoad, setRepLoad] = useState(false);
  const [dailyData, setDailyData] = useState([]), [postData, setPostData] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [range, setRange] = useState("14d"), [customFrom, setCustomFrom] = useState(""), [customTo, setCustomTo] = useState("");

  useEffect(() => {
    setLoaded(false);
    Promise.all([api.getAnalytics("daily"), api.getAnalytics("posts")]).then(([d, p]) => { setDailyData(Array.isArray(d) ? d : []); setPostData(Array.isArray(p) ? p : []); setLoaded(true); }).catch(() => setLoaded(true));
  }, []);

  const filterByRange = (items, dateField) => {
    if (!items.length || range === "all") return items;
    const now = new Date(); let from, to;
    if (range === "custom" && customFrom) { from = new Date(customFrom); to = customTo ? new Date(customTo) : now; }
    else { const days = parseInt(range) || 14; from = new Date(now); from.setDate(from.getDate() - days); to = now; }
    return items.filter(item => { const dv = item[dateField]; if (!dv) return true; const d = new Date(dv); if (isNaN(d)) return true; return d >= from && d <= to; });
  };

  const filteredDaily = filterByRange(dailyData, "date").sort((a, b) => new Date(a.date) - new Date(b.date));
  const filteredPosts = filterByRange(postData, "date").sort((a, b) => new Date(b.date) - new Date(a.date));

  const uploadContent = useCallback(async e => {
    const file = e.target.files[0]; if (!file) return; e.target.value = "";
    setBusy(true); setStatus("parsing content CSV...");
    const text = await file.text();
    const rows = parseAnalyticsCSV(text);
    if (!rows.length) { setStatus("error: empty CSV"); setBusy(false); return; }
    const originals = rows.filter(r => { const t = r["Post text"] || r["Tweet text"] || ""; return !t.startsWith("@") && t.length > 5; }).map(r => {
      const d = parseXDate(r["Date"] || "");
      return { post_id: r["Post id"] || "", date: d ? d.toISOString().slice(0, 10) : "", post_text: r["Post text"] || r["Tweet text"] || "", post_link: r["Post Link"] || "", impressions: anum(r["Impressions"] || r["impressions"]), likes: anum(r["Likes"] || r["likes"]), engagements: anum(r["Engagements"] || r["engagements"]), bookmarks: anum(r["Bookmarks"] || r["bookmarks"]), reposts: anum(r["Reposts"] || r["Retweets"] || r["reposts"]), replies: anum(r["Replies"] || r["replies"]), new_follows: anum(r["New follows"]), pillar: null, structure: null, ai_score: null, source: "organic", account: "BARRY" };
    });
    let matched = 0; const unmatched = [];
    setStatus("matching " + originals.length + " posts with supabase...");
    const sp = await api.getPosts();
    if (sp.length > 0) {
      for (const o of originals) { const m = findMatch(o.post_text, sp); if (m) { o.pillar = normPillar(m.category); o.structure = (m.structure || "").toLowerCase(); o.ai_score = parseFloat(m.score) || null; o.source = m.source === "manual" ? "manual" : "ai"; matched++; } else unmatched.push(o); }
    } else originals.forEach(o => unmatched.push(o));
    if (unmatched.length > 0) {
      setStatus(matched + " matched · classifying " + unmatched.length + " with AI...");
      const d = await api.generate({ action: "classify", posts: unmatched.map(u => ({ id: u.post_id, text: u.post_text })) });
      for (const cp of (d.classified || [])) { const o = originals.find(x => x.post_id === cp.id); if (o) { o.pillar = normPillar(cp.pillar); o.structure = (cp.structure || "").toLowerCase(); o.ai_score = cp.aiScore || null; } }
    }
    setStatus("saving " + originals.length + " posts...");
    await api.saveAnalytics("analytics_posts", originals);
    setPostData(prev => { const map = new Map(prev.map(p => [p.post_id, p])); originals.forEach(o => map.set(o.post_id, o)); return [...map.values()].sort((a, b) => (b.date || "").localeCompare(a.date || "")); });
    setBusy(false);
    setStatus("✓ " + originals.length + " posts · " + matched + " matched · " + (rows.length - originals.length) + " replies filtered");
  }, []);

  const uploadOverview = useCallback(async e => {
    const file = e.target.files[0]; if (!file) return; e.target.value = "";
    setBusy(true); setStatus("parsing overview CSV...");
    const text = await file.text();
    const rows = parseAnalyticsCSV(text);
    const dailyRows = rows.map(r => { const d = parseXDate(r["Date"] || ""); return { account: "BARRY", date: d ? d.toISOString().slice(0, 10) : "", impressions: anum(r["Impressions"]), likes: anum(r["Likes"]), engagements: anum(r["Engagements"]), bookmarks: anum(r["Bookmarks"]), new_follows: anum(r["New follows"]), unfollows: anum(r["Unfollows"]), replies: anum(r["Replies"]), reposts: anum(r["Reposts"]), profile_visits: anum(r["Profile visits"]) }; }).filter(r => r.date);
    await api.saveAnalytics("analytics_daily", dailyRows);
    setDailyData(prev => { const map = new Map(prev.map(d => [d.date, d])); dailyRows.forEach(d => map.set(d.date, d)); return [...map.values()].sort((a, b) => (b.date || "").localeCompare(a.date || "")); });
    setBusy(false); setStatus("✓ overview: " + dailyRows.length + " days saved");
  }, []);

  const reMatch = async () => {
    if (!filteredPosts.length) return; setBusy(true); setStatus("re-matching...");
    const sp = await api.getPosts(); let matched = 0;
    const updated = filteredPosts.map(o => { const m = findMatch(o.post_text, sp); if (m) { matched++; return { ...o, pillar: normPillar(m.category), structure: (m.structure || "").toLowerCase(), ai_score: parseFloat(m.score) || o.ai_score, source: m.source === "manual" ? "manual" : "ai" }; } return { ...o, source: o.source || "organic" }; });
    await api.saveAnalytics("analytics_posts", updated);
    setPostData(prev => { const map = new Map(prev.map(p => [p.post_id, p])); updated.forEach(u => map.set(u.post_id, u)); return [...map.values()]; });
    setStatus("✓ " + matched + " matched"); setBusy(false);
  };

  const aiPosts = filteredPosts.filter(p => p.source === "ai");
  const manualPosts = filteredPosts.filter(p => p.source === "manual");
  const organicPosts = filteredPosts.filter(p => p.source !== "ai" && p.source !== "manual");
  const totalImp = filteredDaily.reduce((s, d) => s + (d.impressions || 0), 0) || filteredPosts.reduce((s, p) => s + (p.impressions || 0), 0);
  const totalEng = filteredDaily.reduce((s, d) => s + (d.engagements || 0), 0) || filteredPosts.reduce((s, p) => s + (p.engagements || 0), 0);
  const totalLikes = filteredDaily.reduce((s, d) => s + (d.likes || 0), 0) || filteredPosts.reduce((s, p) => s + (p.likes || 0), 0);
  const totalFollows = filteredDaily.reduce((s, d) => s + (d.new_follows || 0), 0);
  const totalUnfollows = filteredDaily.reduce((s, d) => s + (d.unfollows || 0), 0);
  const totalReplies = filteredPosts.reduce((s, p) => s + (p.replies || 0), 0);
  const totalBookmarks = filteredPosts.reduce((s, p) => s + (p.bookmarks || 0), 0);
  const totalReposts = filteredPosts.reduce((s, p) => s + (p.reposts || 0), 0);
  const engRate = totalImp > 0 ? ((totalEng / totalImp) * 100).toFixed(2) : "0";
  const aiAvg = aiPosts.length ? Math.round(aiPosts.reduce((s, p) => s + (p.impressions || 0), 0) / aiPosts.length) : 0;
  const manualAvg = manualPosts.length ? Math.round(manualPosts.reduce((s, p) => s + (p.impressions || 0), 0) / manualPosts.length) : 0;
  const organicAvg = organicPosts.length ? Math.round(organicPosts.reduce((s, p) => s + (p.impressions || 0), 0) / organicPosts.length) : 0;

  const pillarData = {};
  filteredPosts.filter(p => p.pillar).forEach(p => { const k = normPillar(p.pillar) || p.pillar; if (!pillarData[k]) pillarData[k] = { posts: 0, imp: 0, likes: 0, eng: 0, replies: 0, bookmarks: 0, topImp: 0, ai: 0, manual: 0 }; const d = pillarData[k]; d.posts++; d.imp += (p.impressions || 0); d.likes += (p.likes || 0); d.eng += (p.engagements || 0); d.replies += (p.replies || 0); d.bookmarks += (p.bookmarks || 0); d.topImp = Math.max(d.topImp, (p.impressions || 0)); if (p.source === "ai") d.ai++; else d.manual++; });
  const pillarChart = Object.entries(pillarData).map(([k, v]) => ({ name: k.replace(/-/g, " "), key: k, posts: v.posts, avgImp: Math.round(v.imp / v.posts), avgLikes: +(v.likes / v.posts).toFixed(1), avgReplies: +(v.replies / v.posts).toFixed(1), avgBookmarks: +(v.bookmarks / v.posts).toFixed(1), engRate: v.imp > 0 ? +((v.eng / v.imp) * 100).toFixed(1) : 0, topImp: v.topImp, ai: v.ai, manual: v.manual })).sort((a, b) => b.avgImp - a.avgImp);

  const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dowData = {};
  filteredPosts.forEach(p => { if (!p.date) return; const d = new Date(p.date); const day = DOW[d.getDay()]; if (!dowData[day]) dowData[day] = { posts: 0, imp: 0, eng: 0, likes: 0 }; dowData[day].posts++; dowData[day].imp += (p.impressions || 0); dowData[day].eng += (p.engagements || 0); dowData[day].likes += (p.likes || 0); });
  const dowChart = DOW.map(d => ({ name: d, posts: dowData[d]?.posts || 0, avgImp: dowData[d]?.posts ? Math.round(dowData[d].imp / dowData[d].posts) : 0, avgLikes: dowData[d]?.posts ? +(dowData[d].likes / dowData[d].posts).toFixed(1) : 0 })).filter(d => d.posts > 0);

  const topPosts = [...filteredPosts].sort((a, b) => (b.impressions || 0) - (a.impressions || 0));
  const hasData = loaded && (dailyData.length > 0 || postData.length > 0);
  const isEmpty = loaded && dailyData.length === 0 && postData.length === 0;
  const rangeLabel = range === "custom" ? (customFrom || "?") + " → " + (customTo || "now") : range === "all" ? "all time" : "last " + range.replace("d", " days");
  const rStyle = v => ({ background: range === v ? T.greenDim : "transparent", color: range === v ? T.green : T.textSoft, border: "1px solid " + (range === v ? T.greenMid : T.border), borderRadius: 6, padding: "4px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'IBM Plex Mono'" });

  const genReport = async () => {
    setRepLoad(true); setReport("");
    const ps = {}; filteredPosts.filter(p => p.pillar).forEach(p => { const k = normPillar(p.pillar) || p.pillar; if (!ps[k]) ps[k] = { n: 0, imp: 0, eng: 0, likes: 0, replies: 0, bookmarks: 0 }; ps[k].n++; ps[k].imp += (p.impressions || 0); ps[k].eng += (p.engagements || 0); ps[k].likes += (p.likes || 0); ps[k].replies += (p.replies || 0); ps[k].bookmarks += (p.bookmarks || 0); });
    const prompt = `You are Barry's (@Barry_x0) content strategist. Analyze this period.

PERIOD: ${rangeLabel} (${filteredDaily.length} days, ${filteredPosts.length} posts)
Total: ${totalImp.toLocaleString()} imp | ${totalLikes.toLocaleString()} likes | ${totalReplies} replies | ${totalBookmarks} bookmarks | ${totalReposts} reposts | ${engRate}% eng | +${totalFollows - totalUnfollows} follows
AI: ${aiPosts.length} posts (avg ${aiAvg} imp) | Manual: ${manualPosts.length} (avg ${manualAvg} imp) | Organic: ${organicPosts.length} (avg ${organicAvg} imp)

Pillars:
${Object.entries(ps).map(([k, v]) => k + ": " + v.n + "p, avg " + Math.round(v.imp / v.n) + "imp, " + (v.likes / v.n).toFixed(1) + "♥, " + (v.replies / v.n).toFixed(1) + "💬, " + (v.bookmarks / v.n).toFixed(1) + "🔖").join("\n")}

Day of week:
${dowChart.map(d => d.name + ": " + d.posts + " posts, avg " + d.avgImp + " imp").join("\n")}

Top 5 posts:
${topPosts.slice(0, 5).map((p, i) => (i + 1) + ". [" + p.impressions + "imp " + p.likes + "L] " + (p.source === "ai" ? "AI" : "manual") + "/" + (normPillar(p.pillar) || "?") + " \"" + (p.post_text || "").slice(0, 100) + "\"").join("\n")}

Bottom 3:
${[...filteredPosts].sort((a, b) => (a.impressions || 0) - (b.impressions || 0)).slice(0, 3).map((p, i) => (i + 1) + ". [" + p.impressions + "imp] " + (p.source === "ai" ? "AI" : "manual") + "/" + (normPillar(p.pillar) || "?") + " \"" + (p.post_text || "").slice(0, 80) + "\"").join("\n")}

Give a comprehensive report:
1) TL;DR (2-3 sentences)
2) AI vs Manual — compare performance, suggest specific improvements
3) Pillar Performance — rank by engagement
4) Best Day of Week — when to post
5) Top 3 Winners — why they worked
6) Bottom 3 — why they failed + specific fix
7) Engagement Deep Dive — bookmarks (value), replies (conversation), reposts (virality)
8) 5 specific Action Items for next period

Direct, lowercase, Barry strategist voice. No fluff.`;
    try {
      const d = await api.generate({ action: "report", prompt });
      setReport(d.report || d.text || "no response");
      if (d.report) { setLastAnalysis(d.report); api.setSetting("last_analysis_barry", d.report); }
    } catch (e) { setReport("error: " + e.message); }
    setRepLoad(false);
  };

  return (
    <div>
      <Card style={{ marginBottom: 16, padding: 14 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 10 }}>
          <label style={{ background: T.greenDim, color: T.green, border: "1px solid " + T.greenMid, borderRadius: 8, padding: "7px 14px", fontSize: 11, fontWeight: 600, cursor: busy ? "wait" : "pointer", opacity: busy ? 0.6 : 1, fontFamily: "'IBM Plex Mono'" }}>
            {busy ? "⏳ processing..." : "📄 Content CSV"}
            <input type="file" accept=".csv" onChange={uploadContent} disabled={busy} style={{ display: "none" }} />
          </label>
          <label style={{ background: T.blueDim, color: T.blue, border: "1px solid " + T.blue + "40", borderRadius: 8, padding: "7px 14px", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'IBM Plex Mono'" }}>
            📊 Overview CSV <input type="file" accept=".csv" onChange={uploadOverview} style={{ display: "none" }} />
          </label>
          {filteredPosts.length > 0 && <Btn small color={T.cyan} outline onClick={reMatch} disabled={busy}>{busy ? "⏳" : "🔄 Re-match"}</Btn>}
          <div style={{ flex: 1 }} />
          {loaded && <span style={{ fontSize: 10, color: T.textDim, fontFamily: "'IBM Plex Mono'" }}>{dailyData.length}d · {postData.length}p in db</span>}
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontSize: 10, color: T.textDim, marginRight: 4 }}>RANGE:</span>
          {["7d", "14d", "30d", "all"].map(v => <button key={v} onClick={() => setRange(v)} style={rStyle(v)}>{v === "all" ? "ALL" : v}</button>)}
          <button onClick={() => setRange("custom")} style={rStyle("custom")}>CUSTOM</button>
          {range === "custom" && <>
            <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)} style={{ ...sel, padding: "3px 8px", fontSize: 11 }} />
            <span style={{ color: T.textDim, fontSize: 10 }}>→</span>
            <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)} style={{ ...sel, padding: "3px 8px", fontSize: 11 }} />
          </>}
          <span style={{ fontSize: 10, color: T.textSoft, marginLeft: 8 }}>{filteredDaily.length}d · {filteredPosts.length} posts</span>
        </div>
        {status && <div style={{ fontSize: 10, marginTop: 8, fontFamily: "'IBM Plex Mono'", color: status.startsWith("✓") ? T.green : status.startsWith("error") ? T.red : T.textSoft }}>{status}</div>}
      </Card>

      {!loaded && <div style={{ textAlign: "center", padding: 40 }}><LoadingDots /></div>}

      {isEmpty && <div style={{ textAlign: "center", padding: 60, color: T.textDim }}>
        <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.3 }}>📈</div>
        <div style={{ fontSize: 13 }}>upload X analytics CSVs to start</div>
        <div style={{ fontSize: 11, marginTop: 4 }}>data persists in supabase — upload once, analyze anytime</div>
      </div>}

      {hasData && <>
        <Card style={{ marginBottom: 16, padding: 14 }}>
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
            {[{ l: "Impressions", v: totalImp.toLocaleString(), c: T.green }, { l: "Eng Rate", v: engRate + "%", c: T.amber }, { l: "Likes", v: totalLikes.toLocaleString(), c: T.blue }, { l: "Replies", v: totalReplies.toLocaleString(), c: T.cyan }, { l: "Bookmarks", v: totalBookmarks.toLocaleString(), c: T.purple }, { l: "Reposts", v: totalReposts.toLocaleString(), c: T.red }, { l: "Follows", v: "+" + (totalFollows - totalUnfollows), c: "#a78bfa" }, { l: "Posts", v: filteredPosts.length, c: T.text, sub: aiPosts.length + " AI · " + manualPosts.length + " manual" }].map(s => (
              <div key={s.l}><div style={{ fontSize: 10, color: T.textSoft, textTransform: "uppercase", letterSpacing: .5 }}>{s.l}</div><div style={{ fontSize: 22, fontWeight: 700, color: s.c, fontFamily: "'IBM Plex Mono'" }}>{s.v}</div>{s.sub && <div style={{ fontSize: 10, color: T.textDim }}>{s.sub}</div>}</div>
            ))}
          </div>
        </Card>

        {(aiPosts.length + manualPosts.length + organicPosts.length > 0) && <Card style={{ marginBottom: 16, padding: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 10 }}>⚡ Post Source Breakdown</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
            {aiPosts.length > 0 && <div style={{ padding: 12, background: T.greenDim, borderRadius: 10, border: "1px solid " + T.greenMid }}><div style={{ fontSize: 10, color: T.green, fontWeight: 600, textTransform: "uppercase", marginBottom: 4 }}>AI ({aiPosts.length})</div><div style={{ fontSize: 22, fontWeight: 700, color: T.text, fontFamily: "'IBM Plex Mono'" }}>{aiAvg.toLocaleString()}</div><div style={{ fontSize: 10, color: T.textSoft }}>avg impressions</div></div>}
            {manualPosts.length > 0 && <div style={{ padding: 12, background: T.cyanDim, borderRadius: 10, border: "1px solid " + T.cyan + "30" }}><div style={{ fontSize: 10, color: T.cyan, fontWeight: 600, textTransform: "uppercase", marginBottom: 4 }}>MANUAL ({manualPosts.length})</div><div style={{ fontSize: 22, fontWeight: 700, color: T.text, fontFamily: "'IBM Plex Mono'" }}>{manualAvg.toLocaleString()}</div><div style={{ fontSize: 10, color: T.textSoft }}>avg impressions</div></div>}
            {organicPosts.length > 0 && <div style={{ padding: 12, background: T.amberDim, borderRadius: 10, border: "1px solid " + T.amber + "30" }}><div style={{ fontSize: 10, color: T.amber, fontWeight: 600, textTransform: "uppercase", marginBottom: 4 }}>ORGANIC ({organicPosts.length})</div><div style={{ fontSize: 22, fontWeight: 700, color: T.text, fontFamily: "'IBM Plex Mono'" }}>{organicAvg.toLocaleString()}</div><div style={{ fontSize: 10, color: T.textSoft }}>avg impressions</div></div>}
          </div>
        </Card>}

        {pillarChart.length > 0 && <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <Card style={{ padding: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: T.textDim, textTransform: "uppercase", marginBottom: 10 }}>Content Distribution</div>
              <ResponsiveContainer width="100%" height={200}><PieChart><Pie data={pillarChart} dataKey="posts" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={35} paddingAngle={2} label={({ name, percent }) => name + " " + Math.round(percent * 100) + "%"} labelLine={false} style={{ fontSize: 9 }}>{pillarChart.map((e, i) => <Cell key={i} fill={CAT_COLORS[e.key] || T.textDim} />)}</Pie><Tooltip content={({ active, payload }) => { if (!active || !payload?.length) return null; const d = payload[0]?.payload; return <div style={{ background: T.card, border: "1px solid " + T.border, borderRadius: 8, padding: 10, fontSize: 11 }}><div style={{ color: CAT_COLORS[d?.key] || T.text, fontWeight: 600 }}>{d?.name}</div><div style={{ color: T.textSoft }}>{d?.posts} posts</div></div>; }} /></PieChart></ResponsiveContainer>
            </Card>
            <Card style={{ padding: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: T.textDim, textTransform: "uppercase", marginBottom: 10 }}>Avg Impressions per Pillar</div>
              <ResponsiveContainer width="100%" height={200}><BarChart data={pillarChart} layout="vertical" barSize={14}><CartesianGrid strokeDasharray="3 3" stroke={T.border} horizontal={false} /><XAxis type="number" tick={{ fontSize: 9, fill: T.textDim }} axisLine={false} tickLine={false} /><YAxis type="category" dataKey="name" tick={{ fontSize: 9, fill: T.textSoft }} axisLine={false} width={100} /><Tooltip content={<AChartTip />} /><Bar dataKey="avgImp" radius={[0, 6, 6, 0]} name="Avg Impressions">{pillarChart.map((e, i) => <Cell key={i} fill={CAT_COLORS[e.key] || T.textDim} />)}</Bar></BarChart></ResponsiveContainer>
            </Card>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10, marginBottom: 16 }}>
            {pillarChart.map(p => {
              const c = CAT_COLORS[p.key] || T.text;
              return <Card key={p.key} style={{ padding: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}><Badge color={c}>{p.name}</Badge><span style={{ fontSize: 18, fontWeight: 700, color: c, fontFamily: "'IBM Plex Mono'" }}>{p.posts}</span></div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, fontSize: 10 }}>
                  <div style={{ color: T.textSoft }}>avg imp</div><div style={{ color: T.text, fontWeight: 600, textAlign: "right", fontFamily: "'IBM Plex Mono'" }}>{p.avgImp.toLocaleString()}</div>
                  <div style={{ color: T.textSoft }}>eng %</div><div style={{ color: T.amber, fontWeight: 600, textAlign: "right", fontFamily: "'IBM Plex Mono'" }}>{p.engRate}%</div>
                  <div style={{ color: T.textSoft }}>avg ♥</div><div style={{ color: T.blue, fontWeight: 600, textAlign: "right", fontFamily: "'IBM Plex Mono'" }}>{p.avgLikes}</div>
                  <div style={{ color: T.textSoft }}>avg 💬</div><div style={{ color: T.cyan, fontWeight: 600, textAlign: "right", fontFamily: "'IBM Plex Mono'" }}>{p.avgReplies}</div>
                  <div style={{ color: T.textSoft }}>avg 🔖</div><div style={{ color: T.purple, fontWeight: 600, textAlign: "right", fontFamily: "'IBM Plex Mono'" }}>{p.avgBookmarks}</div>
                </div>
              </Card>;
            })}
          </div>
        </>}

        {dowChart.length > 0 && <Card style={{ marginBottom: 16, padding: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: T.textDim, textTransform: "uppercase", marginBottom: 10 }}>Performance by Day of Week</div>
          <ResponsiveContainer width="100%" height={180}><BarChart data={dowChart}><CartesianGrid strokeDasharray="3 3" stroke={T.border} /><XAxis dataKey="name" tick={{ fontSize: 11, fill: T.textSoft }} axisLine={false} /><YAxis tick={{ fontSize: 10, fill: T.textDim }} axisLine={false} /><Tooltip content={<AChartTip />} /><Bar dataKey="avgImp" fill={T.blue} radius={[4, 4, 0, 0]} name="Avg Impressions" /><Bar dataKey="avgLikes" fill={T.red} radius={[4, 4, 0, 0]} name="Avg Likes" /></BarChart></ResponsiveContainer>
        </Card>}

        {filteredDaily.length > 0 && <Card style={{ marginBottom: 16, padding: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: T.textDim, textTransform: "uppercase", marginBottom: 10 }}>Daily Impressions</div>
          <ResponsiveContainer width="100%" height={160}><LineChart data={filteredDaily}><CartesianGrid strokeDasharray="3 3" stroke={T.border} /><XAxis dataKey="date" tick={{ fontSize: 9, fill: T.textDim }} axisLine={false} tickFormatter={v => v.slice(5)} /><YAxis tick={{ fontSize: 9, fill: T.textDim }} axisLine={false} /><Tooltip content={<AChartTip />} /><Line type="monotone" dataKey="impressions" stroke={T.green} strokeWidth={2} dot={false} name="Impressions" /><Line type="monotone" dataKey="engagements" stroke={T.amber} strokeWidth={1.5} dot={false} name="Engagements" /></LineChart></ResponsiveContainer>
        </Card>}

        {topPosts.length > 0 && <Card style={{ marginBottom: 16, padding: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: T.textDim, textTransform: "uppercase", marginBottom: 10 }}>Top Posts by Impressions</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {topPosts.slice(0, 10).map((p, i) => (
              <div key={p.post_id || i} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "10px 12px", background: T.surface, borderRadius: 8, border: "1px solid " + T.border }}>
                <div style={{ minWidth: 24, textAlign: "center" }}><div style={{ fontSize: 16, fontWeight: 700, color: i < 3 ? T.green : T.textSoft, fontFamily: "'IBM Plex Mono'" }}>{i + 1}</div></div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: T.text, lineHeight: 1.5, marginBottom: 4 }}>{(p.post_text || "").slice(0, 200)}{(p.post_text || "").length > 200 ? "..." : ""}</div>
                  <div style={{ display: "flex", gap: 8, fontSize: 10, color: T.textSoft, flexWrap: "wrap" }}>
                    {p.date && <span>{p.date.slice(0, 10)}</span>}
                    {p.pillar && <Badge color={CAT_COLORS[normPillar(p.pillar)] || T.textSoft}>{p.pillar}</Badge>}
                    {p.source && <Badge color={p.source === "ai" ? T.green : p.source === "manual" ? T.cyan : T.amber}>{p.source}</Badge>}
                    {p.ai_score && <span style={{ color: T.amber }}>AI: {p.ai_score}/10</span>}
                    {p.post_link && <a href={p.post_link} target="_blank" rel="noreferrer" style={{ color: T.cyan }}>🔗</a>}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 10, flexShrink: 0, fontSize: 11, fontFamily: "'IBM Plex Mono'" }}>
                  <div style={{ textAlign: "center" }}><div style={{ color: T.green, fontWeight: 700 }}>{(p.impressions || 0).toLocaleString()}</div><div style={{ fontSize: 9, color: T.textDim }}>imp</div></div>
                  <div style={{ textAlign: "center" }}><div style={{ color: T.red, fontWeight: 700 }}>{p.likes || 0}</div><div style={{ fontSize: 9, color: T.textDim }}>♥</div></div>
                  <div style={{ textAlign: "center" }}><div style={{ color: T.purple, fontWeight: 700 }}>{p.bookmarks || 0}</div><div style={{ fontSize: 9, color: T.textDim }}>🔖</div></div>
                </div>
              </div>
            ))}
          </div>
        </Card>}

        <Card style={{ padding: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>🤖 AI Analysis Report</div>
            <Btn small color={T.purple} disabled={repLoad} onClick={genReport}>{repLoad ? "⏳ generating..." : "Generate Report"}</Btn>
          </div>
          {report && <div style={{ fontSize: 12, color: T.text, lineHeight: 1.7, whiteSpace: "pre-wrap", marginTop: 10, padding: 14, background: T.surface, borderRadius: 8 }}>{report}</div>}
        </Card>
      </>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════
export default function App() {
  const [auth, setAuth] = useState(false);
  const [nav, setNav] = useState("content");
  const [allPosts, setAllPosts] = useState(null);
  const [brandVoice, setBrandVoice] = useState("");
  const [weeklyNotes, setWeeklyNotes] = useState("");
  const [lastAnalysis, setLastAnalysis] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem("barry_auth")) setAuth(true);
  }, []);

  useEffect(() => {
    if (!auth) return;
    api.getPosts().then(rows => {
      if (!Array.isArray(rows)) { setAllPosts([]); return; }
      setAllPosts(rows.map(r => ({
        id: r.id, _supaId: r.id, tab: r.tab || "DRAFT", category: r.category || "",
        structure: r.structure || "", post: r.post || "", notes: r.notes || "",
        score: r.score || "", howToFix: r.how_to_fix || "", day: r.day || "",
        source: r.source || "", hook_type: r.hook_type || "", author: r.author || "BARRY",
        postLink: r.post_link || "", impressions: r.impressions || "", likes: r.likes || "",
        engagements: r.engagements || "", bookmarks: r.bookmarks || "",
      })));
    }).catch(() => setAllPosts([]));
  }, [auth]);

  const login = () => { sessionStorage.setItem("barry_auth", "1"); setAuth(true); };

  if (!auth) return (
    <>
      <head>
        <title>barry — dashboard</title>
        <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600;700&family=Satoshi:wght@400;500;700;900&display=swap" rel="stylesheet" />
      </head>
      <LoginScreen onLogin={login} />
    </>
  );

  const pipeline = (allPosts || []).filter(p => p.tab === "POST").length;
  const drafts = (allPosts || []).filter(p => p.tab === "DRAFT").length;

  return (
    <>
      <head>
        <title>barry — dashboard</title>
        <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600;700&family=Satoshi:wght@400;500;700;900&display=swap" rel="stylesheet" />
      </head>
      <div style={{ minHeight: "100vh", background: T.bg, color: T.text, fontFamily: "'Satoshi', sans-serif" }}>
        {/* Nav */}
        <div style={{ background: T.bg, borderBottom: `1px solid ${T.border}`, padding: "0 32px", display: "flex", alignItems: "center", gap: 4, position: "sticky", top: 0, zIndex: 100 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginRight: 24, padding: "16px 0", fontFamily: "'IBM Plex Mono', monospace" }}>barry</div>
          {[{ id: "content", icon: "𝕏", label: "Content" }, { id: "research", icon: "🔬", label: "Research" }, { id: "analytics", icon: "📈", label: "Analytics" }].map(n => (
            <button key={n.id} onClick={() => setNav(n.id)} style={{
              background: nav === n.id ? T.surfaceAlt || "#f0f0f0" : "transparent",
              border: "none", borderBottom: nav === n.id ? `2px solid ${T.green}` : "2px solid transparent",
              padding: "16px 20px", color: nav === n.id ? T.text : T.textSoft,
              fontSize: 12, fontWeight: nav === n.id ? 600 : 400, cursor: "pointer",
              fontFamily: "'IBM Plex Mono'", display: "flex", alignItems: "center", gap: 6, transition: "all .15s",
            }}><span>{n.icon}</span> {n.label}</button>
          ))}
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 10, color: T.textSoft, fontFamily: "'IBM Plex Mono'" }}>supabase connected</span>
            <Dot color={T.green} pulse />
            <span style={{ fontSize: 10, color: T.textDim, fontFamily: "'IBM Plex Mono'" }}>{pipeline} pipeline · {drafts} drafts</span>
          </div>
        </div>

        <div style={{ padding: "24px 32px", maxWidth: 1400, margin: "0 auto" }}>
          {nav === "content" && allPosts === null && <div style={{ padding: 60, textAlign: "center" }}><LoadingDots /></div>}
          {nav === "content" && allPosts !== null && <ContentPanel allPosts={allPosts} setAllPosts={setAllPosts} brandVoice={brandVoice} setBrandVoice={setBrandVoice} weeklyNotes={weeklyNotes} setWeeklyNotes={setWeeklyNotes} lastAnalysis={lastAnalysis} setLastAnalysis={setLastAnalysis} />}
          {nav === "research" && <ResearchPanel />}
          {nav === "analytics" && <AnalyticsPanel lastAnalysis={lastAnalysis} setLastAnalysis={setLastAnalysis} />}
        </div>
      </div>
    </>
  );
}
