"use client";
import { useSession, signIn, signOut } from "next-auth/react";
import { useState } from "react";

export default function Home() {
  const { data: session } = useSession();
  const [keywords, setKeywords] = useState(["お世話になっております", "見積", "発注", "契約"]);
  const [newKw, setNewKw] = useState("");
  const [days, setDays] = useState(1);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(null);
  const [sent, setSent] = useState({});

  const addKw = () => {
    if (newKw.trim() && !keywords.includes(newKw.trim())) {
      setKeywords([...keywords, newKw.trim()]);
      setNewKw("");
    }
  };

  const scan = async () => {
    setLoading(true);
    setResults([]);
    const res = await fetch("/api/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keywords, days }),
    });
    const data = await res.json();
    setResults(data.results ?? []);
    setLoading(false);
  };

  const sendReply = async (mail) => {
    setSending(mail.id);
    const res = await fetch("/api/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: mail.from,
        subject: `Re: ${mail.subject}`,
        body: mail.reply,
        threadId: mail.id,
      }),
    });
    const data = await res.json();
    if (data.success) setSent((p) => ({ ...p, [mail.id]: true }));
    setSending(null);
  };

  const s = {
    wrap: { maxWidth: 680, margin: "0 auto", padding: "2rem 1rem", fontFamily: "sans-serif" },
    h1: { fontSize: 22, fontWeight: 500, marginBottom: 4 },
    sub: { fontSize: 13, color: "#888", marginBottom: 24 },
    card: { border: "0.5px solid #ddd", borderRadius: 12, padding: "1rem 1.25rem", marginBottom: 12, background: "#fff" },
    label: { fontSize: 13, color: "#666", display: "block", marginBottom: 6 },
    input: { width: "100%", padding: "8px 10px", border: "0.5px solid #ccc", borderRadius: 8, fontSize: 14, boxSizing: "border-box" },
    btn: { padding: "8px 16px", border: "0.5px solid #ccc", borderRadius: 8, background: "#fff", cursor: "pointer", fontSize: 14 },
    btnPrimary: { padding: "10px", width: "100%", border: "none", borderRadius: 8, background: "#2563eb", color: "#fff", fontSize: 15, fontWeight: 500, cursor: "pointer", marginTop: 8 },
    tag: { display: "inline-flex", alignItems: "center", gap: 4, fontSize: 13, background: "#f3f4f6", border: "0.5px solid #ddd", borderRadius: 20, padding: "3px 10px", margin: 3 },
    badge: (color) => ({ fontSize: 12, borderRadius: 20, padding: "2px 10px", border: "0.5px solid", ...(color === "red" ? { background: "#fef2f2", borderColor: "#fca5a5", color: "#b91c1c" } : color === "yellow" ? { background: "#fffbeb", borderColor: "#fcd34d", color: "#92400e" } : { background: "#f0fdf4", borderColor: "#86efac", color: "#166534" }) }),
    summary: { background: "#f9fafb", borderRadius: 8, padding: "10px 12px", fontSize: 14, lineHeight: 1.6, marginBottom: 10 },
    replyBox: { width: "100%", padding: "8px 10px", border: "0.5px solid #ccc", borderRadius: 8, fontSize: 13, lineHeight: 1.6, boxSizing: "border-box", minHeight: 80, resize: "vertical" },
  };

  if (!session) return (
    <div style={{ ...s.wrap, textAlign: "center", paddingTop: "4rem" }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>📮</div>
      <div style={s.h1}>顧客メール モニター</div>
      <div style={s.sub}>Gmailと連携してメールを要約・返信案を生成します</div>
      <button style={s.btnPrimary} onClick={() => signIn("google")}>Googleでログイン</button>
    </div>
  );

  return (
    <div style={s.wrap}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <div style={s.h1}>📮 顧客メール モニター</div>
          <div style={s.sub}>{session.user.email}</div>
        </div>
        <button style={s.btn} onClick={() => signOut()}>ログアウト</button>
      </div>

      <div style={s.card}>
        <span style={s.label}>キーワード</span>
        <div style={{ marginBottom: 8 }}>
          {keywords.map(kw => (
            <span key={kw} style={s.tag}>{kw}
              <button onClick={() => setKeywords(keywords.filter(k => k !== kw))} style={{ background: "none", border: "none", cursor: "pointer", color: "#999", fontSize: 15, padding: 0 }}>×</button>
            </span>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <input style={{ ...s.input }} value={newKw} onChange={e => setNewKw(e.target.value)} onKeyDown={e => e.key === "Enter" && addKw()} placeholder="キーワードを追加..." />
          <button style={s.btn} onClick={addKw}>追加</button>
        </div>
        <span style={s.label}>スキャン期間</span>
        <select style={s.input} value={days} onChange={e => setDays(Number(e.target.value))}>
          <option value={1}>今日</option>
          <option value={3}>3日以内</option>
          <option value={7}>7日以内</option>
        </select>
        <button style={s.btnPrimary} onClick={scan} disabled={loading}>
          {loading ? "スキャン中..." : "🔍 スキャン開始"}
        </button>
      </div>

      {results.length > 0 && (
        <div>
          <div style={{ fontSize: 14, color: "#666", marginBottom: 10 }}>検出された顧客メール（{results.length}件）</div>
          {results.map(mail => (
            <div key={mail.id} style={{ ...s.card, borderLeft: `3px solid ${mail.priority === "高" ? "#ef4444" : mail.priority === "中" ? "#f59e0b" : "#22c55e"}` }}>
              <div style={{ fontWeight: 500, fontSize: 15, marginBottom: 2 }}>{mail.subject}</div>
              <div style={{ fontSize: 12, color: "#888", marginBottom: 8 }}>{mail.from}</div>
              <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                <span style={s.badge(mail.priority === "高" ? "red" : mail.priority === "中" ? "yellow" : "green")}>優先度: {mail.priority}</span>
                <span style={s.badge(mail.action === "要返信" ? "red" : mail.action === "確認のみ" ? "yellow" : "green")}>{mail.action}</span>
              </div>
              <div style={s.summary}>{mail.summary}</div>
              {mail.action === "要返信" && mail.reply && (
                <div>
                  <span style={s.label}>返信案（編集できます）</span>
                  <textarea
                    style={s.replyBox}
                    defaultValue={mail.reply}
                    onChange={e => mail.reply = e.target.value}
                  />
                  {sent[mail.id] ? (
                    <div style={{ color: "#16a34a", fontSize: 13, marginTop: 6 }}>✅ 送信済み</div>
                  ) : (
                    <button style={{ ...s.btnPrimary, background: "#16a34a" }} onClick={() => sendReply(mail)} disabled={sending === mail.id}>
                      {sending === mail.id ? "送信中..." : "📨 この返信を送信"}
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {!loading && results.length === 0 && (
        <div style={{ textAlign: "center", color: "#aaa", padding: "2rem" }}>
          スキャンしてメールを確認しましょう
        </div>
      )}
    </div>
  );
}
