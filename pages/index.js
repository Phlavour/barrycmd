import React, { useState, useEffect, useCallback, useRef } from "react";
import Head from "next/head";

// ═══════════════════════════════════════════════════════════════
// THEME — identyczna jak djangodashboard (light mode)
// ═══════════════════════════════════════════════════════════════
const DARK = {
  bg: "#06060a", bg2: "#0c0c12", surface: "#101018", surfaceAlt: "#14141e",
  card: "#131320", cardHover: "#191930", border: "#1a1a2e", borderHi: "#252545",
  text: "#dfe0eb", textSoft: "#8888a4", textDim: "#4a4a65",
  green: "#00e87b", greenDim: "rgba(0,232,123,.08)", greenMid: "rgba(0,232,123,.18)",
  red: "#ff3b5c", redDim: "rgba(255,59,92,.08)",
  blue: "#3d8bfd", blueDim: "rgba(61,139,253,.08)",
  amber: "#f0a030", amberDim: "rgba(240,160,48,.08)",
  purple: "#9966ff", purpleDim: "rgba(153,102,255,.08)",
  cyan: "#00d4ff", cyanDim: "rgba(0,212,255,.08)",
};
const LIGHT = {
  bg: "#f4f5f7", bg2: "#edeef2", surface: "#ffffff", surfaceAlt: "#f8f8fb",
  card: "#ffffff", cardHover: "#f0f0f5", border: "#d8dae5", borderHi: "#c0c2d0",
  text: "#1a1a2e", textSoft: "#5c5c7a", textDim: "#9898b0",
  green: "#00b85e", greenDim: "rgba(0,184,94,.07)", greenMid: "rgba(0,184,94,.16)",
  red: "#e0334e", redDim: "rgba(224,51,78,.07)",
  blue: "#2d72e5", blueDim: "rgba(45,114,229,.07)",
  amber: "#d48c1a", amberDim: "rgba(212,140,26,.07)",
  purple: "#7744dd", purpleDim: "rgba(119,68,221,.07)",
  cyan: "#0099cc", cyanDim: "rgba(0,153,204,.07)",
};
let T = LIGHT;

// ═══════════════════════════════════════════════════════════════
// BARRY CONSTANTS
// ═══════════════════════════════════════════════════════════════
const TABS = ["DRAFT", "POST", "DATABASE", "USED", "BAD", "SKETCH", "IDEAS"];
const STATUS_ORDER = ["DRAFT", "POST", "USED", "DATABASE", "BAD", "SKETCH", "IDEAS"];

const TABS_CONFIG_FN = () => ({
  DRAFT:    { color: T.blue,    icon: "✎",  label: "Draft" },
  POST:     { color: T.green,   icon: "◉",  label: "Post" },
  USED:     { color: T.textDim, icon: "✓",  label: "Used" },
  DATABASE: { color: T.purple,  icon: "◈",  label: "Database" },
  BAD:      { color: T.red,     icon: "✕",  label: "Bad" },
  SKETCH:   { color: T.amber,   icon: "💡", label: "Sketch" },
  IDEAS:    { color: T.cyan,    icon: "📝", label: "Ideas" },
});

const BARRY_CATEGORIES = ["ai", "on-chain", "trading-psychology", "eu-asia", "building"];
const CATEGORY_COLORS_FN = () => ({
  "ai":                T.cyan,
  "on-chain":          T.green,
  "trading-psychology":T.amber,
  "eu-asia":           T.purple,
  "building":          T.blue,
});

const STRUCTURES = [
  "APAG (Attention-Problem-Advantage-Guide)",
  "Single Insight",
  "Story → Lesson",
  "Case Study (with technical details)",
  "Contrarian Take",
  "Before/After",
  "Question → Answer",
  "List (3-5 points)",
  "Framework / System",
  "Shared Enemy",
  "Data + Interpretation",
  "Building in Public update",
];

const HOOKS = {
  H:  { name: "Helpful",    color: "#22c55e", desc: "Show how you'll help. Promise value upfront.", examples: ["here's what actually works", "the system that got me to 80% win rate"] },
  E1: { name: "Emotion",    color: "#f59e0b", desc: "Pain or experience. First-person, visceral.", examples: ["grew $3K to $40K. lost it all. built it back with AI tools"] },
  A:  { name: "Ask",        color: "#3b82f6", desc: "Question your audience is already thinking.", examples: ["why does everyone use AI but almost nobody builds with it?"] },
  D:  { name: "Do/Don't",   color: "#ef4444", desc: "Direct instruction. Clear and actionable.", examples: ["stop following KOLs. follow their wallets instead"] },
  L:  { name: "Lists",      color: "#8b5cf6", desc: "Signal scannable value. Concrete numbers.", examples: ["5 AI tools I built in 2 months that changed my trading"] },
  I:  { name: "Inspire",    color: "#ec4899", desc: "Paint the picture of the outcome.", examples: ["imagine knowing a wallet loaded up 4 hours before the call"] },
  N:  { name: "Numbers",    color: "#06b6d4", desc: "Lead with specific data. Always.", examples: ["80% win rate. 3-4 positions max. 1 failure per data cycle."] },
  E2: { name: "Empathy",    color: "#a78bfa", desc: "Show you understand the struggle.", examples: ["if you're still entering blind, without on-chain confirmation"] },
};

const PASSWORD = "barry12!";

// ═══════════════════════════════════════════════════════════════
// MICRO COMPONENTS (identical to djangodashboard)
// ═══════════════════════════════════════════════════════════════
const Dot = ({ color, pulse }) => (
  <span style={{ display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: color || T.green, boxShadow: pulse ? `0 0 8px ${color || T.green}` : "none" }} />
);

const Badge = ({ children, color = T.green, bg }) => (
  <span style={{ fontSize: 10, fontWeight: 600, color, background: bg || `${color}18`, padding: "2px 8px", borderRadius: 4, fontFamily: "'IBM Plex Mono', monospace", letterSpacing: ".02em" }}>{children}</span>
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
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, transition: "all .15s", boxShadow: "0 1px 3px rgba(0,0,0,.06)", ...sx }}>
    {children}
  </div>
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

const LoadingDots = () => {
  const [dots, setDots] = useState("");
  useEffect(() => { const i = setInterval(() => setDots(d => d.length >= 3 ? "" : d + "."), 400); return () => clearInterval(i); }, []);
  return <span style={{ color: T.green, fontFamily: "'IBM Plex Mono', monospace" }}>loading{dots}</span>;
};

// ═══════════════════════════════════════════════════════════════
// LOGIN
// ═══════════════════════════════════════════════════════════════
function LoginScreen({ onLogin }) {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState(false);
  const submit = () => {
    if (pw === PASSWORD) onLogin();
    else { setErr(true); setTimeout(() => setErr(false), 1500); }
  };
  return (
    <div style={{ minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 24 }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 28, fontWeight: 900, color: T.text, fontFamily: "'Satoshi', sans-serif" }}>barry</div>
        <div style={{ fontSize: 11, color: T.textDim, marginTop: 4, fontFamily: "'IBM Plex Mono', monospace" }}>content dashboard</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, width: 260 }}>
        <input type="password" value={pw} onChange={e => setPw(e.target.value)} onKeyDown={e => e.key === "Enter" && submit()} placeholder="password"
          style={{ background: T.bg2, border: `1px solid ${err ? T.red : T.border}`, borderRadius: 8, color: T.text, padding: "10px 14px", fontSize: 14, fontFamily: "'IBM Plex Mono', monospace", outline: "none", textAlign: "center", transition: "border-color .2s" }} />
        <Btn color={T.green} onClick={submit} style={{ width: "100%", textAlign: "center" }}>enter</Btn>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN CONTENT PANEL (WeeklyContent equivalent for Barry)
// ═══════════════════════════════════════════════════════════════
function BarryContentPanel({ apiKey, supa, allPosts, setAllPosts, brandVoice, setBrandVoice, weeklyNotes, setWeeklyNotes, lastAnalysis, setLastAnalysis }) {
  const [activeTab, setActiveTab] = useState("DRAFT");
  const [sortBy, setSortBy] = useState("mine-first");
  const [newPostText, setNewPostText] = useState("");
  const [newPostCat, setNewPostCat] = useState("ai");
  const [newPostStructure, setNewPostStructure] = useState("");
  const [newPostHook, setNewPostHook] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [aiLoading, setAiLoading] = useState(null);
  const [aiResults, setAiResults] = useState({});
  const [genLoading, setGenLoading] = useState(false);
  const [genProgress, setGenProgress] = useState("");
  const [rewriteId, setRewriteId] = useState(null);
  const [rewriteFeedback, setRewriteFeedback] = useState("");
  const [rewriteLoading, setRewriteLoading] = useState(false);
  const [fixLoading, setFixLoading] = useState(null);
  const [sketchLoading, setSketchLoading] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [saving, setSaving] = useState(false);
  const [defineLoading, setDefineLoading] = useState(false);
  const [weeklyNotesSaving, setWeeklyNotesSaving] = useState(false);
  const weeklyNotesTimer = useRef(null);
  const EMPTY_WCTX = { hot_topics: "", personal: "", avoid: "", ai_notes: "", seasonal: "" };
  const [wctx, setWctxState] = useState(EMPTY_WCTX);
  const [wctxHistory, setWctxHistory] = useState([]);
  const setWctx = (v) => setWctxState(prev => typeof v === "function" ? v(prev) : v);

  const TC = TABS_CONFIG_FN();
  const PC = CATEGORY_COLORS_FN();
  const sel = { background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 6, padding: "6px 10px", color: T.text, fontSize: 12, fontFamily: "'IBM Plex Mono', monospace", outline: "none", cursor: "pointer" };

  // Load wctx history from Supabase
  useEffect(() => {
    if (!supa?.url || !supa?.key) return;
    fetch(supa.url + "/rest/v1/weekly_context?order=week_start.desc&limit=10",
      { headers: { apikey: supa.key, Authorization: "Bearer " + supa.key } })
      .then(r => r.ok ? r.json() : []).then(setWctxHistory).catch(() => {});
  }, [supa?.url, supa?.key]);

  // Posts scoped to Barry account
  const accountPosts = allPosts || [];
  const tabPosts = accountPosts.filter(p => p.tab === activeTab);
  let sorted = [...tabPosts];
  if (sortBy === "mine-first") {
    sorted.sort((a, b) => {
      const aM = a.source === "manual" ? 0 : 1, bM = b.source === "manual" ? 0 : 1;
      const aR = (a.notes || "").startsWith("rewrite") ? 0 : 1, bR = (b.notes || "").startsWith("rewrite") ? 0 : 1;
      const aP = Math.min(aM, aR), bP = Math.min(bM, bR);
      if (aP !== bP) return aP - bP;
      return parseFloat(b.score || 0) - parseFloat(a.score || 0);
    });
  } else if (sortBy === "category") sorted.sort((a, b) => (a.category || "").localeCompare(b.category || ""));
  else if (sortBy === "score-desc") sorted.sort((a, b) => parseFloat(b.score || 0) - parseFloat(a.score || 0));
  else if (sortBy === "score-asc") sorted.sort((a, b) => parseFloat(a.score || 0) - parseFloat(b.score || 0));
  else if (sortBy === "newest") sorted.sort((a, b) => (b._supaId || b.id) - (a._supaId || a.id));
  else if (sortBy === "oldest") sorted.sort((a, b) => (a._supaId || a.id) - (b._supaId || b.id));
  else if (sortBy === "day") {
    const D = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
    sorted.sort((a, b) => (D.indexOf(a.day) < 0 ? 99 : D.indexOf(a.day)) - (D.indexOf(b.day) < 0 ? 99 : D.indexOf(b.day)));
  }

  const counts = {};
  STATUS_ORDER.forEach(t => { counts[t] = accountPosts.filter(p => p.tab === t).length; });

  const isUsed = activeTab === "USED", isBad = activeTab === "BAD",
    isPost = activeTab === "POST", isDraft = activeTab === "DRAFT", isDb = activeTab === "DATABASE",
    isSketch = activeTab === "SKETCH", isIdeas = activeTab === "IDEAS";

  // Save posts to Supabase
  const savePostsToSupa = async (posts) => {
    if (!supa || !posts.length) return;
    try {
      const rows = posts.map(p => ({
        tab: p.tab, category: p.category, structure: p.structure, post: p.post,
        notes: p.notes, score: p.score, how_to_fix: p.howToFix || "", day: p.day || "",
        source: p.source || "", hook_type: p.hook_type || "", account: "BARRY",
        post_link: p.postLink || "", impressions: p.impressions || "", likes: p.likes || "",
        engagements: p.engagements || "", bookmarks: p.bookmarks || "", replies: p.replies || "",
        reposts: p.reposts || "", profile_visits: p.profileVisits || "", new_follows: p.newFollows || "",
        url_clicks: p.urlClicks || "",
      }));
      const saved = await supa.post("posts", rows);
      if (Array.isArray(saved)) {
        setAllPosts(prev => {
          const updated = [...(prev || [])];
          saved.forEach((s, i) => {
            const local = posts[i];
            const idx = updated.findIndex(p => p.id === local.id);
            if (idx >= 0) updated[idx] = { ...updated[idx], _supaId: s.id };
          });
          return updated;
        });
      }
    } catch (err) { console.error("Save error:", err); }
  };

  // Actions
  const movePost = (id, to) => {
    const post = (allPosts || []).find(x => x.id === id);
    setAllPosts(p => p.map(x => x.id === id ? { ...x, tab: to } : x));
    if (supa && post?._supaId) supa.patch("posts", `id=eq.${post._supaId}`, { tab: to });
  };

  const delPost = (id) => {
    const post = (allPosts || []).find(x => x.id === id);
    setAllPosts(p => p.filter(x => x.id !== id));
    if (supa && post?._supaId) supa.del("posts", `id=eq.${post._supaId}`);
  };

  const deleteAllInTab = (tab) => {
    if (!confirm(`Delete ALL posts in ${tab}? This can't be undone.`)) return;
    setAllPosts(p => p.filter(x => x.tab !== tab));
    if (supa) supa.del("posts", `tab=eq.${tab}&account=eq.BARRY`);
  };

  const moveToBad = (id) => {
    const reason = prompt("Why is this post bad?");
    if (reason === null) return;
    const post = (allPosts || []).find(x => x.id === id);
    setAllPosts(p => p.map(x => x.id === id ? { ...x, tab: "BAD", notes: reason || "", howToFix: "" } : x));
    if (supa && post?._supaId) supa.patch("posts", `id=eq.${post._supaId}`, { tab: "BAD", notes: reason || "" });
  };

  const setDay = (id, day) => {
    const post = (allPosts || []).find(x => x.id === id);
    setAllPosts(p => p.map(x => x.id === id ? { ...x, day } : x));
    if (supa && post?._supaId) supa.patch("posts", `id=eq.${post._supaId}`, { day });
  };

  const addPost = async () => {
    if (!newPostText.trim()) return;
    const targetTab = activeTab === "POST" ? "POST" : "DRAFT";
    const newId = allPosts ? Math.max(0, ...allPosts.map(p => p.id)) + 1 : 1;
    const newPost = {
      id: newId, tab: targetTab, category: newPostCat, structure: newPostStructure,
      post: newPostText.trim(), notes: newPostHook ? `hook: ${newPostHook}` : "", score: "", howToFix: "", day: "",
      source: "manual", hook_type: newPostHook || "", account: "BARRY",
      postLink: "", impressions: "", likes: "", engagements: "", bookmarks: "",
      replies: "", reposts: "", profileVisits: "", newFollows: "", urlClicks: "",
    };
    setAllPosts(p => [...(p || []), newPost]);
    setNewPostText(""); setNewPostCat("ai"); setNewPostStructure(""); setNewPostHook(""); setShowAdd(false);
    if (supa) { try { await savePostsToSupa([newPost]); } catch {} }
    if (apiKey) setTimeout(() => autoScore(newPost.post, newPost.id, newPost.category), 500);
  };

  const saveEdit = (pid, newText) => {
    setAllPosts(prev => (prev || []).map(p => p.id === pid ? { ...p, post: newText } : p));
    const post = (allPosts || []).find(p => p.id === pid);
    if (supa && post?._supaId) supa.patch("posts", `id=eq.${post._supaId}`, { post: newText });
    setEditingId(null); setEditText("");
  };

  const saveAllToSupa = async () => {
    if (!supa || !allPosts) return;
    if (!confirm(`Import ${allPosts.length} posts to Supabase?`)) return;
    setSaving(true);
    try {
      await supa.del("posts", "account=eq.BARRY");
      const rows = allPosts.map(p => ({
        tab: p.tab, category: p.category, structure: p.structure, post: p.post,
        notes: p.notes, score: p.score, how_to_fix: p.howToFix || "", day: p.day || "",
        source: p.source || "", hook_type: p.hook_type || "", account: "BARRY",
        post_link: p.postLink || "", impressions: p.impressions || "", likes: p.likes || "",
      }));
      for (let i = 0; i < rows.length; i += 50) {
        const saved = await supa.post("posts", rows.slice(i, i + 50));
        if (Array.isArray(saved)) {
          setAllPosts(prev => {
            const updated = [...(prev || [])];
            saved.forEach((s, j) => { if (updated[i + j]) updated[i + j] = { ...updated[i + j], _supaId: s.id }; });
            return updated;
          });
        }
      }
      alert(`✅ ${rows.length} posts saved!`);
    } catch (err) { alert("Error: " + err.message); }
    setSaving(false);
  };

  // Auto-score
  const autoScore = async (text, pid, category) => {
    if (!apiKey || !text) return;
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6", max_tokens: 200,
          messages: [{ role: "user", content: `Score this Barry (@Barry_x0) post 1-10.

Post: "${text}"
Category: ${category || "unknown"}

CRITERIA:
- Zero em-dashes, zero "haha", zero "I guess"? (hard rule — any violation = max 6)
- Every claim has a number? (concrete > vague)
- Sounds like Barry wrote it, not AI?
- Min 1 failure or limitation embedded?
- First line creates tension, not explanation?
- Information value > storytelling?

9-10: exceptional, this is Barry at his best
7-8: solid, authentic, would post
5-6: decent but generic, could be anyone
1-4: sounds like AI, no voice, violates rules

Respond ONLY in JSON: {"score": 7.5, "notes": "one sentence why + one concrete fix"}` }],
        }),
      });
      const data = await res.json();
      const t = data.content?.[0]?.text || "";
      try {
        const parsed = JSON.parse(t.replace(/```json|```/g, "").trim());
        setAllPosts(prev => {
          let idx = prev.findIndex(p => p.post === text && !p.score);
          if (idx < 0) idx = prev.findIndex(p => p.post === text);
          if (idx < 0) return prev;
          const post = prev[idx];
          if (supa && post._supaId) supa.patch("posts", `id=eq.${post._supaId}`, { score: String(parsed.score || ""), notes: parsed.notes || "" });
          const updated = [...prev];
          updated[idx] = { ...post, score: String(parsed.score || ""), notes: parsed.notes || "" };
          return updated;
        });
      } catch {}
    } catch (err) { console.error("AutoScore error:", err); }
  };

  // Define structure
  const defineStructure = async () => {
    if (!apiKey || !newPostText.trim()) return;
    setDefineLoading(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6", max_tokens: 100,
          messages: [{ role: "user", content: `Analyze this Barry post and determine its structure type.

Post: "${newPostText.trim()}"

KNOWN STRUCTURES: ${STRUCTURES.join(", ")}

If it matches a known structure, respond with EXACTLY that structure name.
If not, respond with a short new name on line 1, then "NEW: brief description" on line 2.

Respond ONLY with the structure name.` }],
        }),
      });
      const data = await res.json();
      setNewPostStructure((data.content?.[0]?.text || "").trim().split("\n")[0]);
    } catch {}
    setDefineLoading(false);
  };

  // Ask Claude
  const askClaude = async (text, pid, category) => {
    if (!apiKey) { alert("Add Claude API key in Settings"); return; }
    setAiLoading(pid);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6", max_tokens: 400,
          messages: [{ role: "user", content: `You are Barry's content strategist. Analyze this post — why it works or doesn't, and one specific improvement.

Post: "${text}"
Category: ${category || "unknown"}

Check against Barry's rules:
- Zero em-dashes, separator lines, "haha", "I guess"?
- Every claim has a concrete number?
- Min 1 failure or limitation embedded?
- First line creates tension, not explanation?
- Information value > storytelling?
- Peer-level tone (never guru positioning)?

Be specific. 2-4 sentences max.

Respond ONLY in JSON: {"notes": "Your analysis here"}` }],
        }),
      });
      const data = await res.json();
      const t = data.content?.[0]?.text || "";
      try { setAiResults(prev => ({ ...prev, [pid]: JSON.parse(t.replace(/```json|```/g, "").trim()) })); }
      catch { setAiResults(prev => ({ ...prev, [pid]: { notes: t } })); }
    } catch (err) { setAiResults(prev => ({ ...prev, [pid]: { notes: err.message } })); }
    finally { setAiLoading(null); }
  };

  // Rewrite
  const rewritePost = async (post) => {
    if (!apiKey) { alert("Add Claude API key in Settings"); return; }
    if (!rewriteFeedback.trim()) { alert("Write your feedback first"); return; }
    setRewriteLoading(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6", max_tokens: 600,
          messages: [{ role: "user", content: `You are Barry (@Barry_x0). Rewrite this post based on the feedback.

ORIGINAL POST:
"${post.post}"

CATEGORY: ${post.category}

USER FEEDBACK:
${rewriteFeedback}

BARRY'S RULES (non-negotiable):
- Zero em-dashes "—", zero separator lines "---", zero "haha", zero "I guess", zero "basically"
- Every claim needs a number. Never "a lot", always "30 tools", "80% win rate"
- Min 1 failure or limitation. No pure win framing
- First person, direct, fragments over full sentences
- Confidence from experience, not credentials
- Peer-level always — never guru positioning
- Information value > storytelling

Keep the same topic but apply the feedback. Stay true to Barry's voice.

Respond ONLY with JSON: {"post": "rewritten text", "structure": "Structure Name"}` }],
        }),
      });
      const data = await res.json();
      const version = JSON.parse((data.content?.[0]?.text || "{}").replace(/```json|```/g, "").trim());
      if (version.post) {
        const maxId = allPosts ? Math.max(0, ...allPosts.map(p => p.id)) + 1 : 1;
        const newPost = {
          id: maxId, tab: "DRAFT", category: post.category,
          structure: version.structure || post.structure, post: version.post,
          notes: `rewrite of #${post.id}: "${rewriteFeedback.slice(0, 60)}"`,
          score: "", howToFix: "", day: "", account: "BARRY",
          postLink: "", impressions: "", likes: "", engagements: "", bookmarks: "",
          replies: "", reposts: "", profileVisits: "", newFollows: "", urlClicks: "",
        };
        setAllPosts(prev => [newPost, ...(prev || []).filter(p => p.id !== post.id)]);
        if (supa && post._supaId) supa.del("posts", `id=eq.${post._supaId}`);
        if (supa) savePostsToSupa([newPost]);
        await new Promise(r => setTimeout(r, 1500));
        autoScore(newPost.post, newPost.id, newPost.category);
      }
      setRewriteId(null); setRewriteFeedback("");
    } catch (err) { alert("Error: " + err.message); }
    setRewriteLoading(false);
  };

  // Fix post
  const fixPost = async (post) => {
    if (!apiKey) { alert("Add Claude API key in Settings"); return; }
    setFixLoading(post.id);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6", max_tokens: 600,
          messages: [{ role: "user", content: `You are Barry. Fix this post.

ORIGINAL:
"${post.post}"

INSTRUCTIONS:
- Fix grammar and style errors
- Remove em-dashes, separator lines, "haha", "I guess", "basically"
- Add concrete numbers if vague claims exist
- Ensure min 1 failure or limitation is embedded
- Keep the same length roughly — don't expand unnecessarily
- Polished version of original, not a rewrite

Respond ONLY with JSON: {"post": "fixed text", "changes": "brief note what changed"}` }],
        }),
      });
      const data = await res.json();
      const parsed = JSON.parse((data.content?.[0]?.text || "{}").replace(/```json|```/g, "").trim());
      if (parsed.post) {
        setAllPosts(prev => (prev || []).map(p => p.id === post.id ? { ...p, post: parsed.post, notes: (p.notes ? p.notes + " | " : "") + "fixed: " + (parsed.changes || "").slice(0, 80) } : p));
        if (supa && post._supaId) supa.patch("posts", `id=eq.${post._supaId}`, { post: parsed.post });
        setTimeout(() => autoScore(parsed.post, post.id, post.category), 300);
      }
    } catch (err) { alert("Fix error: " + err.message); }
    setFixLoading(null);
  };

  // Generate from Sketch
  const makePostFromSketch = async (id, sketchText, category) => {
    if (!apiKey) { alert("Add Claude API key in Settings"); return; }
    setSketchLoading(id);
    const bv = brandVoice ? brandVoice.slice(0, 3000) : "";
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6", max_tokens: 2000,
          messages: [{ role: "user", content: `You are Barry (@Barry_x0). Turn this sketch into 3 polished posts.

${bv ? `BRAND VOICE:\n${bv}\n` : ""}

SKETCH:
"${sketchText}"

Category: ${category || "ai"}

Barry's rules (non-negotiable):
- Zero em-dashes, separator lines, "haha", "I guess", "basically"  
- Every claim needs a concrete number
- Min 1 failure or limitation per post
- First person, direct, fragments over full sentences
- Peer-level always
- Concrete numbers: 42K views, 80% win rate, 30 tools, not "many" or "a lot"

Generate 3 DIFFERENT variants:
- One SHORT (under 280 chars, no "read more" cutoff)
- One MEDIUM (280-600 chars)
- One LONG (600-1500 chars, APAG structure, short paragraphs)

RESPOND ONLY with valid JSON array:
[{"post": "text", "hook_type": "N", "structure": "Single Insight", "score": 8}, ...]` }],
        }),
      });
      const data = await res.json();
      const raw = (data.content?.[0]?.text || "[]").trim();
      let variants = [];
      try { variants = JSON.parse(raw.replace(/```json|```/g, "").trim()); }
      catch { variants = [{ post: raw, hook_type: "?", structure: "?", score: 0 }]; }

      if (variants.length > 0) {
        let maxId = allPosts ? Math.max(0, ...allPosts.map(p => p.id)) : 0;
        const newPosts = variants.map((v, i) => ({
          id: ++maxId, tab: "DRAFT", category: category || "ai",
          structure: v.structure || "", post: (v.post || "").trim(),
          notes: `from sketch · hook: ${v.hook_type || "?"} · score: ${v.score || "?"}/10 · variant ${i+1}/${variants.length}`,
          score: String(v.score || ""), howToFix: "", day: "", source: "ai", account: "BARRY", hook_type: v.hook_type || "",
          postLink: "", impressions: "", likes: "", engagements: "", bookmarks: "",
          replies: "", reposts: "", profileVisits: "", newFollows: "", urlClicks: "",
        }));
        setAllPosts(p => [...(p || []), ...newPosts]);
        if (supa) try { await savePostsToSupa(newPosts); } catch {}
        setAllPosts(p => p.map(x => x.id === id ? { ...x, notes: `✓ ${variants.length} variants → DRAFT` } : x));
        if (supa) {
          const sk = (allPosts || []).find(x => x.id === id);
          if (sk?._supaId) supa.patch("posts", `id=eq.${sk._supaId}`, { notes: `✓ ${variants.length} variants → DRAFT` });
        }
      }
    } catch (err) { alert("Error: " + err.message); }
    setSketchLoading(null);
  };

  // Brand voice upload
  const handleBrandVoice = (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target.result;
      setBrandVoice(text);
      if (supa) supa.upsert("settings", { key: "brand_voice_barry", value: text });
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // Generate weekly content
  const generateWeekly = async () => {
    if (!apiKey) { alert("Add Claude API key in Settings"); return; }
    if (!brandVoice) { alert("Upload brand voice files first (.txt or .md)"); return; }
    setGenLoading(true);

    const badPosts = accountPosts.filter(p => p.tab === "BAD");
    const badFeedback = badPosts.map(p => `"${p.post.slice(0, 80)}..." → ${(p.notes || "no reason").slice(0, 60)}`).join("\n");
    const bvTrimmed = brandVoice.slice(0, 6000);
    const ctx = Object.entries(wctx).filter(([,v]) => v && v.trim()).map(([k,v]) => `[${k.toUpperCase()}] ${v}`).join("\n");

    // Barry batch definitions (mirrors djangodashboard structure)
    const batches = [
      {
        category: "ai", count: 5,
        subtopics: ["AI tools for trading", "building AI bots", "AI workflow automation", "AI in crypto research", "what actually works vs what people think works", "30+ tools built", "money management via API", "FOMO detection bot", "position intelligence"],
        structures: ["Case Study (with technical details)", "APAG (Attention-Problem-Advantage-Guide)", "Single Insight", "Contrarian Take", "Building in Public update"],
        advisor: "AI TOOLS: Barry builds, not just consumes. Every post must reference real technical specifics (API, stack, output). Always include 1 failure or tool limitation. Concrete numbers only: 30 tools, 80% win rate, 32GB Parquet dumps, 90 days of fills. Zero vague claims.",
      },
      {
        category: "on-chain", count: 4,
        subtopics: ["smart money wallet tracking", "cluster analysis", "Hyperliquid data", "wallets loading before calls", "DuckDB aggregation", "behavioral patterns", "20K wallet database", "per-wallet-per-coin stats"],
        structures: ["Case Study (with technical details)", "Data + Interpretation", "Shared Enemy", "Contrarian Take"],
        advisor: "ON-CHAIN: This is Barry's edge. Deploy shared enemies from brand guide: 'Follow KOLs = follow their exits', 'Clusters show intent, not certainty'. Real case studies: 12 connected wallets loading 4 hours before call. Artemis S3 Parquet dumps. Free data sources only.",
      },
      {
        category: "trading-psychology", count: 4,
        subtopics: ["emotional state system (Green/Yellow/Red)", "daily hard stop -$600", "max 3-4 positions", "pre-trade checklist", "losses as data", "patience", "position sizing by mcap", "80% win rate context"],
        structures: ["Single Insight", "Framework / System", "Story → Lesson", "APAG (Attention-Problem-Advantage-Guide)"],
        advisor: "TRADING PSYCHOLOGY: Barry's emotional state system (Green/Yellow/Red). Losses = data, not failure. Hard rules: daily stop -$600, max 3-4 positions. Always contextualize win rate (since when, which markets, sample size). Zero 'get rich' energy.",
      },
      {
        category: "eu-asia", count: 3,
        subtopics: ["EU doesn't see what CN crypto does", "HK conferences", "BNB patterns", "Chinese crypto community", "Poland to Thailand relocation", "multilingual advantage", "WOK Labs KOL campaigns", "cultural differences in crypto"],
        structures: ["Contrarian Take", "Single Insight", "Building in Public update", "Shared Enemy"],
        advisor: "EU-ASIA BRIDGE: This is unique to Barry. Nobody else has this angle. Real insights from both sides. CN crypto community behaviors EU misses. BNB patterns. The relocation narrative (Poland → Thailand). WOK Labs building CN+EN bilingual community.",
      },
      {
        category: "building", count: 5,
        subtopics: ["lockin mode updates", "WOK Labs progress", "The Wokers community", "tool development", "what broke this week", "honest progress", "what worked vs what didn't", "building with AI"],
        structures: ["Building in Public update", "Story → Lesson", "Before/After", "Framework / System"],
        advisor: "BUILDING IN PUBLIC: Honest, specific, with failures. Daily lockin updates. Tool development. WOK Labs. The Wokers community. Min 1 failure per post. Share what broke as freely as what worked.",
      },
    ];

    const newPosts = [];
    const maxId = allPosts ? Math.max(0, ...allPosts.map(p => p.id)) : 0;
    let idCounter = maxId + 1;

    for (const batch of batches) {
      setGenProgress(`Generating ${batch.category}... (${batch.count} posts)`);

      const prompt = `You are Barry (@Barry_x0) — crypto trader, co-founder WOK Labs, EU-Asia bridge builder.

YOUR BRAND VOICE:
${bvTrimmed}

${ctx ? `═══ WEEKLY CONTEXT ═══\n${ctx}\n` : ""}
${badFeedback ? `═══ POSTS THAT FAILED (avoid these patterns) ═══\n${badFeedback}\n` : ""}
${lastAnalysis ? `═══ LAST ANALYSIS (apply insights) ═══\n${lastAnalysis.slice(0, 1000)}\n` : ""}

═══ CATEGORY: ${batch.category.toUpperCase()} ═══

SUBTOPICS (rotate — each post different):
${batch.subtopics.map((s, i) => `${i+1}. ${s}`).join("\n")}

STRUCTURES (vary):
${batch.structures.map((s, i) => `${i+1}. ${s}`).join("\n")}

═══ ADVISOR ═══
${batch.advisor}

═══ TASK ═══
Generate exactly ${batch.count} posts for "${batch.category}".

HEADLINE HOOK SYSTEM — EVERY post MUST use one type for its FIRST LINE:
H=Helpful | E1=Emotion (visceral, first-person) | A=Ask | D=Do/Don't | L=List | I=Inspire | N=Numbers | E2=Empathy
RULES: first line = hook, max 15 words, create tension not explanation, vary types.

BARRY'S NON-NEGOTIABLE RULES:
- Zero em-dashes "—", zero separator lines "---", zero "haha", zero "I guess", zero "basically"
- Every claim needs a concrete number (42K views, 80% win rate, 30 tools, 32GB)
- Min 1 failure or limitation per post
- First person, direct, fragments over full sentences
- Peer-level always — never guru positioning
- APAG for longer posts: Attention (hook) → Problem (shared enemy) → Advantage (Barry's experience) → Guide (concrete action)
- LENGTH: ~30% short (under 280 chars, no "read more" cutoff), ~40% medium (280-600), ~30% long (600-1500, APAG, short paragraphs, white space)

RESPOND ONLY with valid JSON array:
[{"post": "text", "structure": "Structure Name", "subtopic": "subtopic used", "hook_type": "H/E/A/D/L/I/N/E", "length": "short/medium/long"}]`;

      try {
        const res = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
          body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 4000, messages: [{ role: "user", content: prompt }] }),
        });
        const data = await res.json();
        const text = data.content?.[0]?.text || "[]";
        try {
          const posts = JSON.parse(text.replace(/```json|```/g, "").trim());
          for (const p of posts) {
            newPosts.push({
              id: idCounter++, tab: "DRAFT", category: batch.category,
              structure: p.structure || "", post: p.post || "",
              notes: `subtopic: ${p.subtopic || ""} · hook: ${p.hook_type || ""} · ${p.length || ""}`,
              score: "", howToFix: "", day: "", account: "BARRY", source: "ai", hook_type: p.hook_type || "",
              postLink: "", impressions: "", likes: "", engagements: "", bookmarks: "",
              replies: "", reposts: "", profileVisits: "", newFollows: "", urlClicks: "",
            });
          }
        } catch { setGenProgress(`Error parsing ${batch.category}`); }
      } catch (err) { setGenProgress(`Error: ${err.message}`); }
    }

    if (newPosts.length > 0) {
      setGenProgress(`${newPosts.length} posts generated. Scoring...`);

      // Batch score
      for (let i = 0; i < newPosts.length; i += 10) {
        const scoreBatch = newPosts.slice(i, i + 10);
        const postsText = scoreBatch.map((p, j) => `${i+j+1}. [${p.category}] "${p.post.slice(0, 200)}"`).join("\n");
        setGenProgress(`Scoring ${i+1}-${Math.min(i+10, newPosts.length)}...`);
        try {
          const res2 = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
            body: JSON.stringify({
              model: "claude-sonnet-4-6", max_tokens: 2000,
              messages: [{ role: "user", content: `You are Barry's content strategist. Score these posts 1-10.

SCORING CRITERIA:
- Zero em-dashes, separator lines, "haha", "I guess"? (violation = max 6)
- Every claim has concrete numbers?
- Min 1 failure or limitation embedded?
- Sounds like Barry, not AI?
- First line creates tension, not explanation?
- Information value > storytelling?

9-10: exceptional, Barry at his best
7-8: solid, authentic
5-6: decent but generic
1-4: violates rules or sounds like AI

POSTS:
${postsText}

RESPOND ONLY with JSON array, one per post in order:
[{"score": 7.5, "feedback": "one sentence why + one concrete fix"}]` }],
            }),
          });
          const data2 = await res2.json();
          const scores = JSON.parse((data2.content?.[0]?.text || "[]").replace(/```json|```/g, "").trim());
          scores.forEach((s, j) => {
            if (scoreBatch[j]) {
              scoreBatch[j].score = String(s.score || "");
              scoreBatch[j].notes = (scoreBatch[j].notes ? scoreBatch[j].notes + " · " : "") + (s.feedback || "");
            }
          });
        } catch {}
      }

      setAllPosts(prev => [...(prev || []), ...newPosts]);
      setGenProgress(`✅ ${newPosts.length} posts generated & scored → DRAFT`);
      setActiveTab("DRAFT");
      setSortBy("score-desc");
      if (supa) {
        try { await savePostsToSupa(newPosts); }
        catch (err) { setGenProgress(`⚠ ${newPosts.length} posts generated but Supabase save failed`); }
      }
    } else {
      setGenProgress("no posts generated — check API key and try again");
    }
    setGenLoading(false);
  };

  const sortOpts = isUsed
    ? [{ v: "default", l: "Default" }, { v: "newest", l: "Newest ↓" }, { v: "impressions", l: "Impressions ↓" }]
    : isPost
    ? [{ v: "default", l: "Default" }, { v: "newest", l: "Newest ↓" }, { v: "day", l: "Day of Week" }, { v: "category", l: "Category" }, { v: "score-desc", l: "Score ↓" }]
    : [{ v: "mine-first", l: "✍ Mine First" }, { v: "newest", l: "Newest ↓" }, { v: "category", l: "Category" }, { v: "score-desc", l: "Score ↓" }, { v: "score-asc", l: "Score ↑" }];

  if (!allPosts) return <div style={{ textAlign: "center", padding: 60 }}><LoadingDots /></div>;

  return (
    <div>
      {/* Top bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontSize: 11, color: T.textDim, fontFamily: "'IBM Plex Mono', monospace" }}>{accountPosts.length} posts · {supa ? "supabase" : "local mode"}</div>
          {supa && <Dot color={T.green} pulse />}
          {saving && <Badge color={T.amber}>saving...</Badge>}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {supa && <Btn small color={T.purple} onClick={saveAllToSupa} disabled={saving}>💾 Save All</Btn>}
        </div>
      </div>

      {/* Weekly Context */}
      <Card style={{ marginBottom: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 14 }}>📋</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>Weekly Context</span>
            <span style={{ fontSize: 10, color: T.textDim }}>feed AI with context for better posts</span>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {weeklyNotesSaving && <span style={{ fontSize: 10, color: T.green }}>✓ saved</span>}
            <Btn small color={T.green} outline onClick={async () => {
              if (!supa) return;
              const combined = Object.entries(wctx).filter(([,v]) => v && v.trim()).map(([k,v]) => `[${k.toUpperCase()}] ${v}`).join("\n");
              setWeeklyNotes(combined);
              supa.upsert("settings", { key: "weekly_notes_barry", value: combined }).catch(() => {});
              const ctx2 = { week_start: new Date().toISOString().slice(0,10), hot_topics: wctx.hot_topics||"", personal: wctx.personal||"", avoid: wctx.avoid||"", ai_notes: wctx.ai_notes||"", seasonal: wctx.seasonal||"", updated_at: new Date().toISOString() };
              try {
                await fetch(supa.url + "/rest/v1/weekly_context", { method: "POST", headers: { apikey: supa.key, Authorization: "Bearer " + supa.key, "Content-Type": "application/json", Prefer: "return=minimal" }, body: JSON.stringify(ctx2) });
                setWeeklyNotesSaving(true); setTimeout(() => setWeeklyNotesSaving(false), 2000);
                const r = await fetch(supa.url + "/rest/v1/weekly_context?order=week_start.desc&limit=10", { headers: { apikey: supa.key, Authorization: "Bearer " + supa.key } });
                if (r.ok) setWctxHistory(await r.json());
              } catch {}
            }}>💾 Save Week</Btn>
            <Btn small outline onClick={() => { setWctx(EMPTY_WCTX); setWeeklyNotes(""); }}>Clear</Btn>
          </div>
        </div>
        {[
          { key: "hot_topics", label: "🔥 Hot Topics", placeholder: "what's happening in crypto, CT drama, EU/Asia news, new narratives...", color: T.red },
          { key: "personal", label: "👤 Personal", placeholder: "lockin updates, WOK Labs progress, relocation news, tool development...", color: T.blue },
          { key: "avoid", label: "🚫 Avoid", placeholder: "patterns that didn't work, topics to skip, styles to avoid...", color: T.amber },
          { key: "ai_notes", label: "🤖 Notes for Claude", placeholder: "focus on case studies, more EU-Asia content, shorter posts, more failures...", color: T.green },
          { key: "seasonal", label: "📅 Seasonal", placeholder: "conferences, market cycles, community events, milestones...", color: T.purple },
        ].map(f => (
          <div key={f.key} style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: f.color, marginBottom: 3, letterSpacing: .5 }}>{f.label}</div>
            <textarea value={wctx[f.key] || ""} onChange={e => {
              const nv = { ...wctx, [f.key]: e.target.value }; setWctx(nv);
              const combined = Object.entries(nv).filter(([,v]) => v.trim()).map(([k,v]) => `[${k.toUpperCase()}] ${v}`).join("\n");
              setWeeklyNotes(combined);
              weeklyNotesTimer.current && clearTimeout(weeklyNotesTimer.current);
              weeklyNotesTimer.current = setTimeout(() => { if (supa) supa.upsert("settings", { key: "weekly_notes_barry", value: combined }).then(() => { setWeeklyNotesSaving(true); setTimeout(() => setWeeklyNotesSaving(false), 2000); }); }, 1000);
            }}
              placeholder={f.placeholder}
              style={{ width: "100%", minHeight: 44, background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 6, padding: 8, color: T.text, fontSize: 11, fontFamily: "'IBM Plex Mono', monospace", resize: "vertical", lineHeight: 1.5, outline: "none", boxSizing: "border-box" }}
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
                    <button onClick={() => setWctx({ hot_topics: h.hot_topics||"", personal: h.personal||"", avoid: h.avoid||"", ai_notes: h.ai_notes||"", seasonal: h.seasonal||"" })} style={{ fontSize: 9, color: T.blue, background: "none", border: "none", cursor: "pointer" }}>load</button>
                  </div>
                  {h.hot_topics && <div style={{ color: T.textSoft }}><span style={{color:T.red}}>🔥</span> {h.hot_topics.slice(0,80)}...</div>}
                  {h.personal && <div style={{ color: T.textSoft }}><span style={{color:T.blue}}>👤</span> {h.personal.slice(0,80)}...</div>}
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
            <span style={{ fontSize: 14 }}>🤖</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>Weekly Content Generator</span>
            {brandVoice && <Badge color={T.green}>Brand voice loaded ✓</Badge>}
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <label style={{ cursor: "pointer" }}>
              <input type="file" accept=".txt,.md" multiple onChange={e => {
                const files = Array.from(e.target.files);
                let combined = "";
                let loaded = 0;
                files.forEach(file => {
                  const reader = new FileReader();
                  reader.onload = ev => {
                    combined += `\n\n=== ${file.name} ===\n${ev.target.result}`;
                    loaded++;
                    if (loaded === files.length) {
                      setBrandVoice(combined.trim());
                      if (supa) supa.upsert("settings", { key: "brand_voice_barry", value: combined.trim() });
                    }
                  };
                  reader.readAsText(file);
                });
                e.target.value = "";
              }} style={{ display: "none" }} />
              <Btn small color={brandVoice ? T.textDim : T.cyan} style={{ pointerEvents: "none" }}>
                {brandVoice ? "↻ Update Voice" : "📄 Upload Barry MD (.txt/.md)"}
              </Btn>
            </label>
            <Btn small color={T.green} disabled={genLoading || !brandVoice || !apiKey} onClick={generateWeekly}>
              {genLoading ? "⏳ Generating..." : "⚡ Generate 21 Posts"}
            </Btn>
          </div>
        </div>
        {genProgress && <div style={{ marginTop: 8, fontSize: 11, color: genProgress.startsWith("✅") ? T.green : genProgress.startsWith("⚠") ? T.amber : T.textSoft, fontFamily: "'IBM Plex Mono', monospace" }}>{genProgress}</div>}
        {!apiKey && <div style={{ marginTop: 6, fontSize: 10, color: T.amber }}>⚠ Add Claude API key in Settings (⚙) first</div>}
        {!brandVoice && <div style={{ marginTop: 6, fontSize: 10, color: T.cyan }}>ℹ Upload all 5 Barry MD files (.md) to enable generation</div>}
      </Card>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        {STATUS_ORDER.map(tab => (
          <TabBtn key={tab} label={`${TC[tab].icon} ${TC[tab].label}`}
            active={activeTab === tab} onClick={() => { setActiveTab(tab); setSortBy(tab === "DRAFT" ? "mine-first" : "default"); }}
            color={TC[tab].color} count={counts[tab]} />
        ))}
        <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ ...sel, marginLeft: "auto", fontSize: 11 }}>
          {sortOpts.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
        </select>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 8, marginBottom: 20 }}>
        {STATUS_ORDER.map(tab => (
          <div key={tab} style={{
            background: activeTab === tab ? `${TC[tab].color}10` : T.surface,
            border: `1px solid ${activeTab === tab ? `${TC[tab].color}30` : T.border}`,
            borderRadius: 8, padding: "8px 10px", textAlign: "center", cursor: "pointer",
          }} onClick={() => setActiveTab(tab)}>
            <div style={{ fontSize: 18, fontWeight: 700, color: TC[tab].color, fontFamily: "'Satoshi', sans-serif" }}>{counts[tab]}</div>
            <div style={{ fontSize: 9, color: T.textSoft, textTransform: "uppercase" }}>{tab}</div>
          </div>
        ))}
      </div>

      {/* Delete All */}
      {counts[activeTab] > 0 && (
        <div style={{ marginBottom: 12, display: "flex", justifyContent: "flex-end", gap: 8 }}>
          {activeTab === "POST" && <Btn small color={T.green} outline onClick={() => {
            if (!confirm(`Move ALL ${counts.POST} posts from POST to USED?`)) return;
            setAllPosts(p => p.map(x => x.tab === "POST" ? { ...x, tab: "USED" } : x));
            if (supa) supa.patch("posts", "tab=eq.POST&account=eq.BARRY", { tab: "USED" });
          }}>✓ Move All POST → USED ({counts.POST})</Btn>}
          <Btn small color={T.red} outline onClick={() => deleteAllInTab(activeTab)}>🗑 Delete All {activeTab} ({counts[activeTab]})</Btn>
        </div>
      )}

      {/* Add Post */}
      {(isDraft || isPost) && (
        <div style={{ marginBottom: 16 }}>
          {showAdd ? (
            <Card>
              <Heading icon="✎">New {isPost ? "Post" : "Draft"}</Heading>
              <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, color: T.textSoft, marginBottom: 4, textTransform: "uppercase" }}>Category</div>
                  <select value={newPostCat} onChange={e => setNewPostCat(e.target.value)} style={sel}>
                    {BARRY_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div style={{ flex: 2 }}>
                  <div style={{ fontSize: 10, color: T.textSoft, marginBottom: 4, textTransform: "uppercase" }}>Structure</div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <select value={newPostStructure} onChange={e => setNewPostStructure(e.target.value)} style={{ ...sel, flex: 1 }}>
                      <option value="">-- select --</option>
                      {STRUCTURES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <button onClick={defineStructure} disabled={defineLoading || !newPostText.trim() || !apiKey}
                      style={{ background: defineLoading ? `${T.purple}15` : T.bg2, border: `1px solid ${defineLoading ? T.purple : T.border}`, borderRadius: 6, padding: "6px 12px", fontSize: 11, fontWeight: 600, color: defineLoading ? T.purple : T.textSoft, cursor: "pointer", fontFamily: "'IBM Plex Mono', monospace", whiteSpace: "nowrap" }}>
                      {defineLoading ? "⏳..." : "🔍 Define"}
                    </button>
                  </div>
                </div>
              </div>
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 10, color: T.textSoft, marginBottom: 6, textTransform: "uppercase" }}>Hook Type</div>
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                  {Object.entries(HOOKS).map(([k, h]) => {
                    const active = newPostHook === k;
                    return <button key={k} onClick={() => setNewPostHook(active ? "" : k)} style={{
                      background: active ? h.color+"20" : "transparent", color: active ? h.color : T.textSoft,
                      border: `1px solid ${active ? h.color : T.border}`, borderRadius: 6, padding: "4px 10px",
                      fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'IBM Plex Mono'",
                    }} title={`${h.desc}\n\nExamples:\n• ${h.examples.join("\n• ")}`}>
                      {k} <span style={{ fontWeight: 400, fontSize: 10 }}>{h.name}</span>
                    </button>;
                  })}
                </div>
                {newPostHook && HOOKS[newPostHook] && (
                  <div style={{ marginTop: 6, padding: 8, background: HOOKS[newPostHook].color+"10", borderRadius: 6 }}>
                    <div style={{ fontSize: 10, color: HOOKS[newPostHook].color, fontWeight: 600, marginBottom: 4 }}>{HOOKS[newPostHook].desc}</div>
                    {HOOKS[newPostHook].examples.map((ex, i) => <div key={i} style={{ fontSize: 10, color: T.textSoft, fontStyle: "italic" }}>"{ex}"</div>)}
                  </div>
                )}
              </div>
              <textarea value={newPostText} onChange={e => setNewPostText(e.target.value)} placeholder="write your post..."
                style={{ width: "100%", minHeight: 80, background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 8, padding: 12, color: T.text, fontSize: 13, fontFamily: "'IBM Plex Mono', monospace", resize: "vertical", lineHeight: 1.5, outline: "none", boxSizing: "border-box" }}
                onFocus={e => e.target.style.borderColor = T.green} onBlur={e => e.target.style.borderColor = T.border} />
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <Btn color={T.green} onClick={addPost}>Add to {activeTab === "POST" ? "Post" : "Draft"}</Btn>
                <Btn outline onClick={() => { setShowAdd(false); setNewPostText(""); }}>Cancel</Btn>
              </div>
            </Card>
          ) : (
            <div style={{ textAlign: "center" }}><Btn color={T.green} onClick={() => setShowAdd(true)}>+ New Post</Btn></div>
          )}
        </div>
      )}

      {/* Add Sketch */}
      {isSketch && (
        <div style={{ marginBottom: 16 }}>
          <Card>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span>💡</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>New Sketch</span>
              <span style={{ fontSize: 10, color: T.textDim }}>rough idea → Claude polishes into 3 Barry posts</span>
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <select value={newPostCat} onChange={e => setNewPostCat(e.target.value)} style={{ ...sel, fontSize: 11 }}>
                {BARRY_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <textarea value={newPostText} onChange={e => setNewPostText(e.target.value)}
              placeholder="rough idea, observation, case study angle, technical detail..."
              style={{ width: "100%", minHeight: 60, background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 8, padding: 10, color: T.text, fontSize: 12, fontFamily: "'IBM Plex Mono', monospace", resize: "vertical", lineHeight: 1.5, outline: "none", boxSizing: "border-box" }}
              onFocus={e => e.target.style.borderColor = T.amber} onBlur={e => e.target.style.borderColor = T.border} />
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <Btn color={T.amber} onClick={async () => {
                if (!newPostText.trim()) return;
                const newId = allPosts ? Math.max(0, ...allPosts.map(p => p.id)) + 1 : 1;
                const newPost = { id: newId, tab: "SKETCH", category: newPostCat, structure: "", post: newPostText.trim(), notes: "", score: "", howToFix: "", day: "", source: "manual", account: "BARRY", hook_type: "", postLink: "", impressions: "", likes: "", engagements: "", bookmarks: "", replies: "", reposts: "", profileVisits: "", newFollows: "", urlClicks: "" };
                setAllPosts(p => [...(p || []), newPost]);
                if (supa) try { await savePostsToSupa([newPost]); } catch {}
                setNewPostText("");
              }}>💡 Save Sketch</Btn>
            </div>
          </Card>
        </div>
      )}

      {/* Add Idea */}
      {isIdeas && (
        <div style={{ marginBottom: 16 }}>
          <Card>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span>📝</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>New Idea</span>
              <span style={{ fontSize: 10, color: T.textDim }}>bank pomysłów na przyszłość</span>
            </div>
            <textarea value={newPostText} onChange={e => setNewPostText(e.target.value)}
              placeholder="topic, observation, link, case study idea, anything for later..."
              style={{ width: "100%", minHeight: 50, background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 8, padding: 10, color: T.text, fontSize: 12, fontFamily: "'IBM Plex Mono', monospace", resize: "vertical", lineHeight: 1.5, outline: "none", boxSizing: "border-box" }}
              onFocus={e => e.target.style.borderColor = T.cyan} onBlur={e => e.target.style.borderColor = T.border} />
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <Btn color={T.cyan} onClick={async () => {
                if (!newPostText.trim()) return;
                const newId = allPosts ? Math.max(0, ...allPosts.map(p => p.id)) + 1 : 1;
                const newPost = { id: newId, tab: "IDEAS", category: "", structure: "", post: newPostText.trim(), notes: "", score: "", howToFix: "", day: "", source: "manual", account: "BARRY", hook_type: "", postLink: "", impressions: "", likes: "", engagements: "", bookmarks: "", replies: "", reposts: "", profileVisits: "", newFollows: "", urlClicks: "" };
                setAllPosts(p => [...(p || []), newPost]);
                if (supa) try { await savePostsToSupa([newPost]); } catch {}
                setNewPostText("");
              }}>📝 Save Idea</Btn>
            </div>
          </Card>
        </div>
      )}

      {/* Posts */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {sorted.length === 0 && <div style={{ textAlign: "center", padding: 40, color: T.textDim, fontSize: 13 }}>No posts in {TC[activeTab]?.label}</div>}
        {sorted.map(p => {
          const ai = aiResults[p.id];
          const catColor = PC[p.category] || T.textSoft;
          return (
            <div key={p.id} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16, transition: "all .12s" }}
              onMouseEnter={e => e.currentTarget.style.borderColor = (TC[activeTab]?.color || T.green) + "40"}
              onMouseLeave={e => e.currentTarget.style.borderColor = T.border}>

              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {editingId === p.id ? (
                    <div>
                      <textarea value={editText} onChange={e => setEditText(e.target.value)} autoFocus
                        style={{ width: "100%", minHeight: 80, background: T.bg2, border: `1px solid ${T.cyan}`, borderRadius: 6, padding: 10, color: T.text, fontSize: 13, fontFamily: "'IBM Plex Mono', monospace", resize: "vertical", lineHeight: 1.6, outline: "none", boxSizing: "border-box" }}
                        onKeyDown={e => { if (e.key === "Escape") { setEditingId(null); setEditText(""); } if (e.key === "Enter" && e.ctrlKey) saveEdit(p.id, editText); }} />
                      <div style={{ display: "flex", gap: 6, marginTop: 6, alignItems: "center" }}>
                        <Btn small color={T.cyan} onClick={() => saveEdit(p.id, editText)}>Save</Btn>
                        <Btn small outline onClick={() => { setEditingId(null); setEditText(""); }}>Cancel</Btn>
                        <span style={{ fontSize: 10, color: T.textDim, marginLeft: "auto" }}>{editText.length} chars · Ctrl+Enter</span>
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize: 13, color: T.text, lineHeight: 1.6, whiteSpace: "pre-wrap", cursor: "pointer", borderRadius: 6, padding: "2px 4px", margin: "-2px -4px", transition: "background .15s" }}
                      onClick={() => { setEditingId(p.id); setEditText(p.post || ""); }}
                      onMouseEnter={e => e.currentTarget.style.background = `${T.cyan}08`}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                      title="Click to edit">
                      {p.post ? p.post.replace(/\n{3,}/g, "\n\n") : <span style={{ color: T.textDim, fontStyle: "italic" }}>Empty — click to edit</span>}
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end", flexShrink: 0 }}>
                  {p.source === "manual" && <Badge color={T.cyan}>✍ Manual</Badge>}
                  {p.category && <Badge color={catColor}>{p.category}</Badge>}
                  {p.structure && <Badge color={T.textDim}>{p.structure}</Badge>}
                  {p.score && <Badge color={parseFloat(p.score) >= 8.5 ? T.green : parseFloat(p.score) >= 7 ? T.amber : T.textSoft}>⭐ {p.score}</Badge>}
                  {p.day && <Badge color={T.cyan}>📅 {p.day}</Badge>}
                </div>
              </div>

              {/* USED analytics */}
              {isUsed && p.impressions && (
                <div style={{ display: "flex", gap: 12, marginTop: 8, flexWrap: "wrap" }}>
                  {[{ l: "Imp", v: p.impressions, c: T.green }, { l: "Likes", v: p.likes, c: T.red }, { l: "Eng", v: p.engagements, c: T.blue }, { l: "Bkm", v: p.bookmarks, c: T.amber }, { l: "Replies", v: p.replies, c: T.cyan }, { l: "RT", v: p.reposts, c: T.purple }]
                    .filter(m => m.v && m.v !== "0").map((m, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 3 }}>
                        <span style={{ fontSize: 9, color: T.textDim }}>{m.l}:</span>
                        <span style={{ fontSize: 12, color: m.c, fontWeight: 600, fontFamily: "'IBM Plex Mono', monospace" }}>{parseInt(m.v).toLocaleString()}</span>
                      </div>
                    ))}
                  {p.postLink && <a href={p.postLink} target="_blank" rel="noreferrer" style={{ fontSize: 10, color: T.cyan }}>🔗 View</a>}
                </div>
              )}

              {p.notes && !isUsed && <div style={{ marginTop: 6, fontSize: 11, color: T.textSoft }}>💡 {p.notes}</div>}
              {isBad && p.howToFix && <div style={{ marginTop: 6, fontSize: 11, color: T.amber, background: T.amberDim, padding: "6px 10px", borderRadius: 6 }}>🔧 {p.howToFix}</div>}

              {/* Actions */}
              <div style={{ display: "flex", gap: 6, marginTop: 10, alignItems: "center", flexWrap: "wrap" }}>
                {isDraft && <>
                  <Btn small color={T.green} onClick={() => movePost(p.id, "POST")}>◉ → Post</Btn>
                  <Btn small color={T.purple} outline onClick={() => movePost(p.id, "DATABASE")}>◈ → DB</Btn>
                  <Btn small color={T.red} outline onClick={() => moveToBad(p.id)}>✕ → Bad</Btn>
                  <Btn small outline onClick={() => delPost(p.id)}>🗑</Btn>
                </>}
                {isPost && <>
                  <select value={p.day} onChange={e => setDay(p.id, e.target.value)} style={{ ...sel, fontSize: 11, padding: "4px 8px" }}>
                    <option value="">📅 Day</option>
                    {["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"].map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <Btn small color={T.green} onClick={() => movePost(p.id, "USED")}>✓ → Used</Btn>
                  <Btn small color={T.blue} outline onClick={() => movePost(p.id, "DRAFT")}>✎ → Draft</Btn>
                  <Btn small color={T.red} outline onClick={() => moveToBad(p.id)}>✕ → Bad</Btn>
                  <Btn small outline onClick={() => delPost(p.id)}>🗑</Btn>
                </>}
                {isDb && <>
                  <Btn small color={T.blue} onClick={() => movePost(p.id, "DRAFT")}>✎ → Draft</Btn>
                  <Btn small color={T.green} outline onClick={() => movePost(p.id, "POST")}>◉ → Post</Btn>
                  <Btn small color={T.red} outline onClick={() => moveToBad(p.id)}>✕ → Bad</Btn>
                  <Btn small outline onClick={() => delPost(p.id)}>🗑</Btn>
                </>}
                {isBad && <>
                  <Btn small color={T.blue} onClick={() => movePost(p.id, "DRAFT")}>✎ → Draft</Btn>
                  <Btn small color={T.red} outline onClick={() => delPost(p.id)}>🗑 Delete</Btn>
                </>}
                {isUsed && <>
                  <Btn small color={T.blue} outline onClick={() => movePost(p.id, "DRAFT")}>✎ → Draft</Btn>
                  <Btn small outline onClick={() => delPost(p.id)}>🗑</Btn>
                </>}
                {isSketch && <>
                  <Btn small color={T.green} disabled={sketchLoading === p.id || !p.post} onClick={() => makePostFromSketch(p.id, p.post, p.category)}>
                    {sketchLoading === p.id ? "⏳ generating 3 variants..." : "✨ Generate 3 Posts"}
                  </Btn>
                  <Btn small color={T.blue} outline onClick={() => movePost(p.id, "DRAFT")}>✎ → Draft as-is</Btn>
                  <Btn small outline onClick={() => delPost(p.id)}>🗑</Btn>
                </>}
                {isIdeas && <>
                  <Btn small color={T.amber} outline onClick={() => movePost(p.id, "SKETCH")}>💡 → Sketch</Btn>
                  <Btn small color={T.blue} outline onClick={() => movePost(p.id, "DRAFT")}>✎ → Draft</Btn>
                  <Btn small outline onClick={() => delPost(p.id)}>🗑</Btn>
                </>}

                {!isUsed && <>
                  <Btn small color={T.purple} disabled={aiLoading === p.id || !p.post} onClick={() => askClaude(p.post, p.id, p.category)}>
                    {aiLoading === p.id ? "⏳..." : "🤖 Claude"}
                  </Btn>
                  {isDraft && <Btn small color={T.cyan} outline onClick={() => { setRewriteId(rewriteId === p.id ? null : p.id); setRewriteFeedback(""); }}>
                    {rewriteId === p.id ? "Cancel" : "✎ Rewrite"}
                  </Btn>}
                  {isDraft && <Btn small color={T.amber} outline disabled={fixLoading === p.id} onClick={() => fixPost(p)}>
                    {fixLoading === p.id ? "⏳..." : "🔧 Fix"}
                  </Btn>}
                  {(isDraft || isPost) && <>
                    <span style={{ width: 1, height: 16, background: T.border, margin: "0 2px" }} />
                    <label style={{ display: "flex", alignItems: "center", gap: 4, cursor: "pointer", fontSize: 10, color: (p.notes||"").includes("🔁 repost") ? T.cyan : T.textDim }}>
                      <input type="checkbox" checked={(p.notes||"").includes("🔁 repost")} onChange={e => {
                        const has = (p.notes||"").includes("🔁 repost");
                        const nn = has ? (p.notes||"").replace(/\s*·?\s*🔁 repost/g,"").replace(/🔁 repost\s*·?\s*/g,"").trim() : ((p.notes||"")+" · 🔁 repost").replace(/^\s*·\s*/,"").trim();
                        setAllPosts(prev => prev.map(x => x.id === p.id ? {...x, notes: nn} : x));
                        if (supa && p._supaId) supa.patch("posts", `id=eq.${p._supaId}`, { notes: nn });
                      }} style={{ accentColor: T.cyan, width: 13, height: 13, cursor: "pointer" }} />🔁
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: 4, cursor: "pointer", fontSize: 10, color: (p.notes||"").includes("💬 quote") ? T.purple : T.textDim }}>
                      <input type="checkbox" checked={(p.notes||"").includes("💬 quote")} onChange={e => {
                        const has = (p.notes||"").includes("💬 quote");
                        const nn = has ? (p.notes||"").replace(/\s*·?\s*💬 quote/g,"").replace(/💬 quote\s*·?\s*/g,"").trim() : ((p.notes||"")+" · 💬 quote").replace(/^\s*·\s*/,"").trim();
                        setAllPosts(prev => prev.map(x => x.id === p.id ? {...x, notes: nn} : x));
                        if (supa && p._supaId) supa.patch("posts", `id=eq.${p._supaId}`, { notes: nn });
                      }} style={{ accentColor: T.purple, width: 13, height: 13, cursor: "pointer" }} />💬
                    </label>
                  </>}
                </>}
              </div>

              {/* Rewrite */}
              {rewriteId === p.id && (
                <div style={{ marginTop: 8, background: T.cyanDim || `${T.cyan}10`, border: `1px solid ${T.cyan}30`, padding: "12px 14px", borderRadius: 8 }}>
                  <div style={{ fontSize: 10, color: T.cyan, fontWeight: 600, textTransform: "uppercase", marginBottom: 6 }}>✎ Rewrite with feedback</div>
                  <textarea value={rewriteFeedback} onChange={e => setRewriteFeedback(e.target.value)}
                    placeholder="what should change? e.g. 'add concrete numbers', 'shorter and punchier', 'add a failure', 'first line too explanatory'"
                    style={{ width: "100%", minHeight: 60, background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 6, padding: 10, color: T.text, fontSize: 12, fontFamily: "'IBM Plex Mono', monospace", resize: "vertical", lineHeight: 1.5, outline: "none", boxSizing: "border-box" }}
                    onFocus={e => e.target.style.borderColor = T.cyan} onBlur={e => e.target.style.borderColor = T.border} />
                  <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                    <Btn small color={T.cyan} disabled={rewriteLoading || !rewriteFeedback.trim()} onClick={() => rewritePost(p)}>
                      {rewriteLoading ? "⏳ Rewriting..." : "Generate Rewrite"}
                    </Btn>
                    <Btn small outline onClick={() => { setRewriteId(null); setRewriteFeedback(""); }}>Cancel</Btn>
                  </div>
                </div>
              )}

              {/* AI result */}
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
function ResearchPanel({ supa, apiKey }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTopic, setNewTopic] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newSource, setNewSource] = useState("");
  const [newTags, setNewTags] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");

  const sel = { background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 6, padding: "6px 10px", color: T.text, fontSize: 12, fontFamily: "'IBM Plex Mono', monospace", outline: "none" };

  const load = useCallback(async () => {
    if (!supa) { setLoading(false); return; }
    setLoading(true);
    try {
      const data = await supa.get("research", "order=created_at.desc");
      setItems(Array.isArray(data) ? data : []);
    } catch {}
    setLoading(false);
  }, [supa]);

  useEffect(() => { load(); }, [load]);

  const add = async () => {
    if (!newTopic.trim() || !newContent.trim() || !supa) return;
    const saved = await supa.post("research", [{ topic: newTopic, content: newContent, source: newSource, tags: newTags }]);
    if (Array.isArray(saved) && saved[0]) setItems(prev => [saved[0], ...prev]);
    setNewTopic(""); setNewContent(""); setNewSource(""); setNewTags("");
  };

  const del = async (id) => {
    if (!confirm("Delete?")) return;
    setItems(prev => prev.filter(x => x.id !== id));
    if (supa) supa.del("research", `id=eq.${id}`);
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: 20, alignItems: "flex-start" }}>
      <Card>
        <Heading icon="🔬">Add Research</Heading>
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 10, color: T.textSoft, marginBottom: 4, textTransform: "uppercase" }}>Topic</div>
          <input value={newTopic} onChange={e => setNewTopic(e.target.value)} placeholder="topic title" style={{ ...sel, width: "100%", boxSizing: "border-box" }} />
        </div>
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 10, color: T.textSoft, marginBottom: 4, textTransform: "uppercase" }}>Content</div>
          <textarea value={newContent} onChange={e => setNewContent(e.target.value)} rows={6} placeholder="notes, data, case study details, wallet addresses, API responses..."
            style={{ ...sel, width: "100%", boxSizing: "border-box", resize: "vertical", lineHeight: 1.5 }} />
        </div>
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 10, color: T.textSoft, marginBottom: 4, textTransform: "uppercase" }}>Source</div>
          <input value={newSource} onChange={e => setNewSource(e.target.value)} placeholder="url, artemis, dune, telegram..." style={{ ...sel, width: "100%", boxSizing: "border-box" }} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 10, color: T.textSoft, marginBottom: 4, textTransform: "uppercase" }}>Tags</div>
          <input value={newTags} onChange={e => setNewTags(e.target.value)} placeholder="on-chain, ai, eu-asia, hyperliquid..." style={{ ...sel, width: "100%", boxSizing: "border-box" }} />
        </div>
        <Btn color={T.green} onClick={add} style={{ width: "100%" }}>Save Research</Btn>
        {!supa && <div style={{ marginTop: 8, fontSize: 10, color: T.amber }}>⚠ Connect Supabase in Settings to save research</div>}
      </Card>
      <div>
        {loading && <div style={{ padding: 20 }}><LoadingDots /></div>}
        {!loading && items.length === 0 && <div style={{ textAlign: "center", padding: 40, color: T.textDim, fontSize: 13 }}>No research yet</div>}
        {items.map(item => (
          <div key={item.id} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16, marginBottom: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{item.topic}</div>
              <span style={{ fontSize: 10, color: T.textDim, fontFamily: "'IBM Plex Mono', monospace" }}>{new Date(item.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>
            </div>
            {item.tags && (
              <div style={{ display: "flex", gap: 5, marginBottom: 8, flexWrap: "wrap" }}>
                {item.tags.split(",").map(t => t.trim()).filter(Boolean).map(t => <Badge key={t} color={T.cyan}>{t}</Badge>)}
              </div>
            )}
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
// MAIN APP
// ═══════════════════════════════════════════════════════════════
export default function App() {
  const [auth, setAuth] = useState(false);
  const [nav, setNav] = useState("content");
  const [apiKey, setApiKey] = useState(() => { try { return localStorage.getItem("barry_api_key") || ""; } catch { return ""; } });
  const [supaUrl, setSupaUrl] = useState(() => { try { return localStorage.getItem("barry_supa_url") || ""; } catch { return ""; } });
  const [supaKey, setSupaKey] = useState(() => { try { return localStorage.getItem("barry_supa_key") || ""; } catch { return ""; } });
  const [keyInput, setKeyInput] = useState("");
  const [supaUrlInput, setSupaUrlInput] = useState("");
  const [supaKeyInput, setSupaKeyInput] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [allPosts, setAllPosts] = useState(null);
  const [brandVoice, setBrandVoice] = useState(() => { try { return localStorage.getItem("barry_brand_voice") || ""; } catch { return ""; } });
  const [weeklyNotes, setWeeklyNotes] = useState("");
  const [lastAnalysis, setLastAnalysis] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem("barry_auth")) setAuth(true);
  }, []);

  // Save API key / Supabase to localStorage
  const saveSettings = () => {
    try {
      localStorage.setItem("barry_api_key", keyInput);
      localStorage.setItem("barry_supa_url", supaUrlInput);
      localStorage.setItem("barry_supa_key", supaKeyInput);
    } catch {}
    setApiKey(keyInput); setSupaUrl(supaUrlInput); setSupaKey(supaKeyInput);
    setShowSettings(false);
    if (keyInput && supaUrlInput && supaKeyInput) {
      const h = { apikey: supaKeyInput, Authorization: `Bearer ${supaKeyInput}`, "Content-Type": "application/json", Prefer: "return=representation" };
      if (keyInput) fetch(`${supaUrlInput}/rest/v1/settings`, { method: "POST", headers: h, body: JSON.stringify({ key: "claude_api_key", value: keyInput }) }).catch(() => {});
    }
  };

  // Save brand voice to localStorage
  const handleSetBrandVoice = (v) => {
    setBrandVoice(v);
    try { localStorage.setItem("barry_brand_voice", v); } catch {}
  };

  const supa = (supaUrl && supaKey) ? {
    url: supaUrl, key: supaKey,
    headers: { apikey: supaKey, Authorization: `Bearer ${supaKey}`, "Content-Type": "application/json", Prefer: "return=representation" },
    async get(table, params = "") { const r = await fetch(`${supaUrl}/rest/v1/${table}?${params}`, { headers: this.headers }); return r.json(); },
    async post(table, data) { const r = await fetch(`${supaUrl}/rest/v1/${table}`, { method: "POST", headers: this.headers, body: JSON.stringify(data) }); return r.json(); },
    async patch(table, params, data) { const r = await fetch(`${supaUrl}/rest/v1/${table}?${params}`, { method: "PATCH", headers: this.headers, body: JSON.stringify(data) }); return r.json(); },
    async del(table, params) { await fetch(`${supaUrl}/rest/v1/${table}?${params}`, { method: "DELETE", headers: this.headers }); },
    async upsert(table, data) { const r = await fetch(`${supaUrl}/rest/v1/${table}`, { method: "POST", headers: { ...this.headers, Prefer: "resolution=merge-duplicates,return=representation" }, body: JSON.stringify(data) }); return r.json(); },
  } : null;

  // Load posts from Supabase on auth
  useEffect(() => {
    if (!auth || !supa) { if (auth) setAllPosts([]); return; }
    supa.get("posts", "account=eq.BARRY&order=id.asc&limit=1000")
      .then(rows => {
        if (!Array.isArray(rows)) { setAllPosts([]); return; }
        const posts = rows.map(r => ({
          id: r.id, _supaId: r.id, tab: r.tab || "DRAFT", category: r.category || "",
          structure: r.structure || "", post: r.post || "", notes: r.notes || "",
          score: r.score || "", howToFix: r.how_to_fix || "", day: r.day || "",
          source: r.source || "", hook_type: r.hook_type || "", account: "BARRY",
          postLink: r.post_link || "", impressions: r.impressions || "", likes: r.likes || "",
          engagements: r.engagements || "", bookmarks: r.bookmarks || "", replies: r.replies || "",
          reposts: r.reposts || "", profileVisits: r.profile_visits || "", newFollows: r.new_follows || "",
          urlClicks: r.url_clicks || "", image_url: r.image_url || "",
        }));
        setAllPosts(posts);
      }).catch(() => setAllPosts([]));
    // Load weekly notes
    supa.get("settings", "key=eq.weekly_notes_barry").then(r => { if (r?.[0]?.value) setWeeklyNotes(r[0].value); }).catch(() => {});
    // Load brand voice
    supa.get("settings", "key=eq.brand_voice_barry").then(r => { if (r?.[0]?.value) handleSetBrandVoice(r[0].value); }).catch(() => {});
  }, [auth, supaUrl, supaKey]);

  const login = () => { sessionStorage.setItem("barry_auth", "1"); setAuth(true); };

  if (!auth) return (
    <>
      <Head>
        <title>barry — dashboard</title>
        <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600;700&family=Satoshi:wght@400;500;700;900&display=swap" rel="stylesheet" />
      </Head>
      <LoginScreen onLogin={login} />
    </>
  );

  const NAV_ITEMS = [
    { id: "content", icon: "𝕏", label: "Content" },
    { id: "research", icon: "🔬", label: "Research" },
  ];

  const postCount = (allPosts || []).length;
  const draftCount = (allPosts || []).filter(p => p.tab === "DRAFT").length;
  const postPipelineCount = (allPosts || []).filter(p => p.tab === "POST").length;

  return (
    <>
      <Head>
        <title>barry — dashboard</title>
        <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600;700&family=Satoshi:wght@400;500;700;900&display=swap" rel="stylesheet" />
      </Head>
      <div style={{ minHeight: "100vh", background: T.bg, color: T.text, fontFamily: "'Satoshi', sans-serif" }}>
        {/* Nav — identical structure to djangodashboard */}
        <div style={{ background: T.surface, borderBottom: `1px solid ${T.border}`, padding: "0 24px", display: "flex", alignItems: "center", gap: 4, position: "sticky", top: 0, zIndex: 100, boxShadow: "0 1px 3px rgba(0,0,0,.05)" }}>
          <div style={{ fontSize: 15, fontWeight: 900, color: T.text, marginRight: 20, padding: "16px 0", fontFamily: "'Satoshi', sans-serif", letterSpacing: "-.01em" }}>barry</div>
          {NAV_ITEMS.map(n => (
            <button key={n.id} onClick={() => setNav(n.id)} style={{
              background: nav === n.id ? T.surfaceAlt : "transparent",
              border: "none", borderBottom: nav === n.id ? `2px solid ${T.green}` : "2px solid transparent",
              padding: "16px 20px", color: nav === n.id ? T.text : T.textSoft,
              fontSize: 12, fontWeight: nav === n.id ? 600 : 400, cursor: "pointer",
              fontFamily: "'IBM Plex Mono', monospace", display: "flex", alignItems: "center", gap: 6, transition: "all .15s",
            }}>
              <span>{n.icon}</span> {n.label}
            </button>
          ))}
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 10, color: T.textSoft, fontFamily: "'IBM Plex Mono', monospace" }}>{supa ? "supabase" : "local"} connected</span>
            {supa && <Dot color={T.green} pulse />}
            <span style={{ fontSize: 10, color: T.textDim, fontFamily: "'IBM Plex Mono', monospace" }}>{postPipelineCount} in pipeline · {draftCount} drafts</span>
            <button onClick={() => { setKeyInput(apiKey); setSupaUrlInput(supaUrl); setSupaKeyInput(supaKey); setShowSettings(true); }} style={{
              background: apiKey ? T.greenDim : T.card, border: `1px solid ${apiKey ? T.greenMid : T.border}`,
              borderRadius: 8, padding: "7px 14px", fontSize: 11, fontWeight: 600, cursor: "pointer",
              color: apiKey ? T.green : T.textSoft, fontFamily: "'IBM Plex Mono', monospace", transition: "all .15s",
            }}>
              {apiKey ? "AI on" : "⚙ settings"}
            </button>
          </div>
        </div>

        {/* Main content */}
        <div style={{ padding: "24px 28px", maxWidth: 1400, margin: "0 auto" }}>
          {nav === "content" && (
            <BarryContentPanel
              apiKey={apiKey} supa={supa}
              allPosts={allPosts} setAllPosts={setAllPosts}
              brandVoice={brandVoice} setBrandVoice={handleSetBrandVoice}
              weeklyNotes={weeklyNotes} setWeeklyNotes={setWeeklyNotes}
              lastAnalysis={lastAnalysis} setLastAnalysis={setLastAnalysis}
            />
          )}
          {nav === "research" && <ResearchPanel supa={supa} apiKey={apiKey} />}
        </div>

        {/* Settings modal */}
        {showSettings && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }} onClick={e => { if (e.target === e.currentTarget) setShowSettings(false); }}>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: 28, width: 480, boxShadow: "0 20px 60px rgba(0,0,0,.3)" }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: T.text, marginBottom: 20 }}>⚙ Settings</div>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 10, color: T.textSoft, marginBottom: 6, textTransform: "uppercase", letterSpacing: ".06em" }}>Claude API Key</div>
                <input type="password" value={keyInput} onChange={e => setKeyInput(e.target.value)} placeholder="sk-ant-..."
                  style={{ width: "100%", boxSizing: "border-box", background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, padding: "10px 12px", fontSize: 13, fontFamily: "'IBM Plex Mono', monospace", outline: "none" }} />
              </div>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 10, color: T.textSoft, marginBottom: 6, textTransform: "uppercase", letterSpacing: ".06em" }}>Supabase URL</div>
                <input value={supaUrlInput} onChange={e => setSupaUrlInput(e.target.value)} placeholder="https://xxxxx.supabase.co"
                  style={{ width: "100%", boxSizing: "border-box", background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, padding: "10px 12px", fontSize: 13, fontFamily: "'IBM Plex Mono', monospace", outline: "none" }} />
              </div>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 10, color: T.textSoft, marginBottom: 6, textTransform: "uppercase", letterSpacing: ".06em" }}>Supabase Anon Key</div>
                <input type="password" value={supaKeyInput} onChange={e => setSupaKeyInput(e.target.value)} placeholder="eyJhb..."
                  style={{ width: "100%", boxSizing: "border-box", background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, padding: "10px 12px", fontSize: 13, fontFamily: "'IBM Plex Mono', monospace", outline: "none" }} />
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <Btn color={T.green} onClick={saveSettings} style={{ flex: 1 }}>Save Settings</Btn>
                <Btn outline onClick={() => setShowSettings(false)}>Cancel</Btn>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
