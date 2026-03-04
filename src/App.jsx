import { useState, useMemo } from "react";

const PRIORITIES = { high: { label: "高", color: "#ef4444" }, medium: { label: "中", color: "#f59e0b" }, low: { label: "低", color: "#6ee7b7" } };
const STATUSES = ["未着手", "進行中", "レビュー", "完了"];
const STATUS_COLORS = { "未着手": "#64748b", "進行中": "#3b82f6", "レビュー": "#a855f7", "完了": "#22c55e" };
const STATUS_EMOJI = { "未着手": "⬜", "進行中": "🔵", "レビュー": "🟣", "完了": "✅" };
const PRIORITY_EMOJI = { high: "🔴", medium: "🟡", low: "🟢" };
const MEMBERS = ["田中 花子", "佐藤 太郎", "山田 次郎", "鈴木 美穂", "高橋 健一"];
const CATEGORIES = ["マーケティング", "デザイン", "総務", "人事", "開発", "営業", "その他"];

const inputStyle = { width: "100%", padding: "10px 14px", background: "#0f1117", border: "1px solid #2a2d3e", borderRadius: 8, color: "#e2e8f0", fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "inherit" };
const btnStyle = { padding: "10px 20px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 14, fontFamily: "inherit" };

const initialTasks = [
  { id: 1, title: "Q2 マーケティング戦略の策定", description: "新規顧客獲得のための施策をまとめる", status: "進行中", priority: "high", assignee: "田中 花子", dueDate: "2026-03-15", category: "マーケティング", createdAt: "2026-03-01" },
  { id: 2, title: "新機能のUIデザイン", description: "ダッシュボードリニューアルのデザイン案を作成", status: "未着手", priority: "medium", assignee: "山田 次郎", dueDate: "2026-03-20", category: "デザイン", createdAt: "2026-03-02" },
  { id: 3, title: "月次レポートの作成", description: "3月分の売上・KPIレポートを作成してSlackで共有", status: "完了", priority: "medium", assignee: "佐藤 太郎", dueDate: "2026-03-10", category: "総務", createdAt: "2026-03-01" },
  { id: 4, title: "採用面接のスケジュール調整", description: "エンジニア候補3名の日程を確定する", status: "レビュー", priority: "high", assignee: "鈴木 美穂", dueDate: "2026-03-12", category: "人事", createdAt: "2026-03-03" },
  { id: 5, title: "サーバーインフラの移行計画", description: "AWSへの移行ロードマップを策定", status: "未着手", priority: "low", assignee: "高橋 健一", dueDate: "2026-04-01", category: "開発", createdAt: "2026-03-04" },
];

async function sendSlackNotification(webhookUrl, type, task, extra = {}) {
  if (!webhookUrl) return;
  let blocks = [];
  if (type === "created") {
    blocks = [
      { type: "header", text: { type: "plain_text", text: "✦ 新しいタスクが作成されました", emoji: true } },
      { type: "section", text: { type: "mrkdwn", text: `*${task.title}*\n${task.description || "（説明なし）"}` } },
      { type: "section", fields: [
        { type: "mrkdwn", text: `*担当者*\n${task.assignee}` },
        { type: "mrkdwn", text: `*優先度*\n${PRIORITY_EMOJI[task.priority]} ${PRIORITIES[task.priority].label}` },
        { type: "mrkdwn", text: `*ステータス*\n${STATUS_EMOJI[task.status]} ${task.status}` },
        { type: "mrkdwn", text: `*期限日*\n${task.dueDate || "未設定"}` },
        { type: "mrkdwn", text: `*カテゴリ*\n${task.category}` },
      ]},
      { type: "divider" },
    ];
  } else if (type === "status_changed") {
    const { from, to } = extra;
    blocks = [
      { type: "header", text: { type: "plain_text", text: "🔄 タスクのステータスが変更されました", emoji: true } },
      { type: "section", text: { type: "mrkdwn", text: `*${task.title}*` } },
      { type: "section", fields: [
        { type: "mrkdwn", text: `*変更前*\n${STATUS_EMOJI[from]} ${from}` },
        { type: "mrkdwn", text: `*変更後*\n${STATUS_EMOJI[to]} ${to}` },
        { type: "mrkdwn", text: `*担当者*\n${task.assignee}` },
        { type: "mrkdwn", text: `*期限日*\n${task.dueDate || "未設定"}` },
      ]},
      { type: "divider" },
    ];
  } else if (type === "completed") {
    blocks = [
      { type: "header", text: { type: "plain_text", text: "🎉 タスクが完了しました！", emoji: true } },
      { type: "section", text: { type: "mrkdwn", text: `*${task.title}*\n担当者: ${task.assignee}` } },
      { type: "divider" },
    ];
  }
  try {
    await fetch(webhookUrl, { method: "POST", mode: "no-cors", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ blocks }) });
    return true;
  } catch (e) { return false; }
}

function Avatar({ name, size = 32 }) {
  const initials = name.split(" ").map(n => n[0]).join("").slice(0, 2);
  const hue = name.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  return <div style={{ width: size, height: size, borderRadius: "50%", background: `hsl(${hue},55%,45%)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.36, fontWeight: 700, color: "#fff", flexShrink: 0 }}>{initials}</div>;
}
function Badge({ label, color }) {
  return <span style={{ display: "inline-flex", alignItems: "center", padding: "2px 8px", borderRadius: 99, fontSize: 11, fontWeight: 600, color, background: color + "18", border: `1px solid ${color}30` }}>{label}</span>;
}
function Toast({ msg, ok }) {
  return <div style={{ position: "fixed", bottom: 28, right: 28, zIndex: 999, background: ok ? "#16a34a" : "#dc2626", color: "#fff", padding: "12px 20px", borderRadius: 10, fontSize: 13, fontWeight: 600, boxShadow: "0 8px 32px rgba(0,0,0,0.4)", display: "flex", alignItems: "center", gap: 8, animation: "fadeIn 0.2s ease" }}>{ok ? "✅" : "❌"} {msg}</div>;
}

function SettingsModal({ webhookUrl, notifyOn, onClose, onSave }) {
  const [url, setUrl] = useState(webhookUrl);
  const [notify, setNotify] = useState(notifyOn);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const toggle = (key) => setNotify(n => ({ ...n, [key]: !n[key] }));

  const testWebhook = async () => {
    if (!url) return;
    setTesting(true); setTestResult(null);
    try {
      await fetch(url, { method: "POST", mode: "no-cors", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: "✦ TaskFlow からのテスト通知です！Slack連携が正常に設定されました 🎉" }) });
      setTestResult("success");
    } catch { setTestResult("error"); }
    setTesting(false);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#1a1d27", border: "1px solid #2a2d3e", borderRadius: 16, width: "min(95vw,500px)", padding: "28px 32px", boxShadow: "0 24px 80px rgba(0,0,0,0.6)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <div style={{ width: 36, height: 36, background: "#4A154B", borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>💬</div>
          <div>
            <div style={{ color: "#f1f5f9", fontWeight: 700, fontSize: 17 }}>Slack 通知設定</div>
            <div style={{ color: "#64748b", fontSize: 12 }}>Incoming Webhook URLを設定してください</div>
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#94a3b8", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>Webhook URL</label>
          <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://hooks.slack.com/services/..." style={{ ...inputStyle, fontFamily: "monospace", fontSize: 12 }} />
          <div style={{ fontSize: 11, color: "#475569", marginTop: 6 }}>
            Slack App の <strong style={{ color: "#64748b" }}>Incoming Webhooks</strong> から取得できます。
            <a href="https://api.slack.com/messaging/webhooks" target="_blank" rel="noreferrer" style={{ color: "#f59e0b", marginLeft: 4 }}>設定方法 →</a>
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#94a3b8", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.08em" }}>通知するタイミング</label>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[["created", "✦ 新しいタスクが作成されたとき"], ["statusChanged", "🔄 ステータスが変更されたとき"], ["completed", "🎉 タスクが完了したとき"]].map(([key, label]) => (
              <label key={key} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: notify[key] ? "#1e2a1a" : "#13161f", border: `1px solid ${notify[key] ? "#22c55e40" : "#1e2235"}`, borderRadius: 8, cursor: "pointer", transition: "all 0.15s" }}>
                <div onClick={() => toggle(key)} style={{ width: 20, height: 20, borderRadius: 5, background: notify[key] ? "#22c55e" : "#1e2235", border: `2px solid ${notify[key] ? "#22c55e" : "#374151"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.15s" }}>
                  {notify[key] && <span style={{ color: "#0f1117", fontSize: 12, fontWeight: 800 }}>✓</span>}
                </div>
                <span style={{ color: notify[key] ? "#d1fae5" : "#94a3b8", fontSize: 13, fontWeight: notify[key] ? 600 : 400 }}>{label}</span>
              </label>
            ))}
          </div>
        </div>

        {url && (
          <div style={{ marginBottom: 20 }}>
            <button onClick={testWebhook} disabled={testing} style={{ ...btnStyle, background: "#1e2235", color: "#94a3b8", border: "1px solid #2a2d3e", fontSize: 13, width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              {testing ? "送信中..." : "🔔 テスト通知を送信"}
            </button>
            {testResult === "success" && <div style={{ fontSize: 11, color: "#22c55e", marginTop: 6, textAlign: "center" }}>✅ 送信リクエストを実行しました。Slackチャンネルをご確認ください。</div>}
            {testResult === "error" && <div style={{ fontSize: 11, color: "#ef4444", marginTop: 6, textAlign: "center" }}>❌ 送信に失敗しました。URLを確認してください。</div>}
          </div>
        )}

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ ...btnStyle, background: "transparent", color: "#94a3b8", border: "1px solid #2a2d3e" }}>キャンセル</button>
          <button onClick={() => { onSave(url, notify); onClose(); }} style={{ ...btnStyle, background: "#f59e0b", color: "#0f0f15", fontWeight: 700 }}>保存する</button>
        </div>
      </div>
    </div>
  );
}

function TaskModal({ task, onClose, onSave }) {
  const [form, setForm] = useState(task || { title: "", description: "", status: "未着手", priority: "medium", assignee: MEMBERS[0], dueDate: "", category: CATEGORIES[0] });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#1a1d27", border: "1px solid #2a2d3e", borderRadius: 16, width: "min(95vw,520px)", padding: "28px 32px", boxShadow: "0 24px 80px rgba(0,0,0,0.6)" }}>
        <h2 style={{ color: "#f1f5f9", fontFamily: "'Noto Serif JP', serif", fontSize: 20, marginBottom: 24, fontWeight: 700 }}>{task ? "タスクを編集" : "新しいタスク"}</h2>
        {[["タイトル", <input value={form.title} onChange={e => set("title", e.target.value)} placeholder="タスクのタイトル" style={inputStyle} />],
          ["説明", <textarea value={form.description} onChange={e => set("description", e.target.value)} placeholder="詳細説明（任意）" style={{ ...inputStyle, height: 80, resize: "vertical" }} />],
          ["担当者", <select value={form.assignee} onChange={e => set("assignee", e.target.value)} style={inputStyle}>{MEMBERS.map(m => <option key={m}>{m}</option>)}</select>],
          ["ステータス", <select value={form.status} onChange={e => set("status", e.target.value)} style={inputStyle}>{STATUSES.map(s => <option key={s}>{s}</option>)}</select>],
          ["優先度", <select value={form.priority} onChange={e => set("priority", e.target.value)} style={inputStyle}>{Object.entries(PRIORITIES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select>],
          ["カテゴリ", <select value={form.category} onChange={e => set("category", e.target.value)} style={inputStyle}>{CATEGORIES.map(c => <option key={c}>{c}</option>)}</select>],
          ["期限日", <input type="date" value={form.dueDate} onChange={e => set("dueDate", e.target.value)} style={inputStyle} />],
        ].map(([label, el]) => (
          <div key={label} style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#94a3b8", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</label>
            {el}
          </div>
        ))}
        <div style={{ display: "flex", gap: 10, marginTop: 28, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ ...btnStyle, background: "transparent", color: "#94a3b8", border: "1px solid #2a2d3e" }}>キャンセル</button>
          <button onClick={() => { if (form.title.trim()) { onSave(form); onClose(); } }} style={{ ...btnStyle, background: "#f59e0b", color: "#0f0f15", fontWeight: 700 }}>保存する</button>
        </div>
      </div>
    </div>
  );
}

function TaskCard({ task, onClick, onDelete }) {
  const [hover, setHover] = useState(false);
  const isOverdue = task.dueDate && task.status !== "完了" && new Date(task.dueDate) < new Date();
  const daysLeft = task.dueDate ? Math.ceil((new Date(task.dueDate) - new Date()) / 86400000) : null;
  return (
    <div onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} style={{ background: hover ? "#1f2235" : "#181b2a", border: `1px solid ${hover ? "#3a3d5e" : "#23263a"}`, borderRadius: 12, padding: "16px 18px", cursor: "pointer", transition: "all 0.2s", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 0, left: 0, width: 3, height: "100%", background: PRIORITIES[task.priority].color, borderRadius: "2px 0 0 2px" }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
        <div onClick={onClick} style={{ flex: 1 }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
            <Badge label={task.category} color="#94a3b8" />
            <Badge label={PRIORITIES[task.priority].label + "優先"} color={PRIORITIES[task.priority].color} />
          </div>
          <div style={{ color: task.status === "完了" ? "#64748b" : "#e2e8f0", fontWeight: 600, fontSize: 14, lineHeight: 1.5, textDecoration: task.status === "完了" ? "line-through" : "none", marginBottom: 6 }}>{task.title}</div>
          {task.description && <div style={{ color: "#64748b", fontSize: 12, lineHeight: 1.6, marginBottom: 10 }}>{task.description}</div>}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Avatar name={task.assignee} size={24} /><span style={{ color: "#94a3b8", fontSize: 12 }}>{task.assignee}</span></div>
            {task.dueDate && <span style={{ fontSize: 11, fontWeight: 600, color: isOverdue ? "#ef4444" : daysLeft <= 3 ? "#f59e0b" : "#64748b" }}>{isOverdue ? "⚠ 期限超過" : daysLeft === 0 ? "今日が期限" : `残 ${daysLeft}日`}</span>}
          </div>
        </div>
        <button onClick={e => { e.stopPropagation(); onDelete(task.id); }} style={{ background: "transparent", border: "none", color: "#374151", cursor: "pointer", fontSize: 16, padding: 2, borderRadius: 4, lineHeight: 1, transition: "color 0.15s", flexShrink: 0 }} onMouseEnter={e => e.target.style.color = "#ef4444"} onMouseLeave={e => e.target.style.color = "#374151"}>✕</button>
      </div>
    </div>
  );
}

export default function App() {
  const [tasks, setTasks] = useState(initialTasks);
  const [modal, setModal] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [view, setView] = useState("kanban");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [search, setSearch] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [notifyOn, setNotifyOn] = useState({ created: true, statusChanged: true, completed: true });
  const [toast, setToast] = useState(null);

  const showToast = (msg, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3500); };

  const filtered = useMemo(() => tasks.filter(t =>
    (filterStatus === "all" || t.status === filterStatus) &&
    (filterPriority === "all" || t.priority === filterPriority) &&
    (!search || t.title.toLowerCase().includes(search.toLowerCase()) || t.assignee.includes(search))
  ), [tasks, filterStatus, filterPriority, search]);

  const save = async (form) => {
    const isNew = !form.id;
    const oldTask = tasks.find(t => t.id === form.id);
    if (isNew) {
      const newTask = { ...form, id: Date.now(), createdAt: new Date().toISOString().slice(0, 10) };
      setTasks(ts => [...ts, newTask]);
      if (webhookUrl && notifyOn.created) { await sendSlackNotification(webhookUrl, "created", newTask); showToast("Slackに通知を送信しました 💬"); }
    } else {
      setTasks(ts => ts.map(t => t.id === form.id ? form : t));
      if (webhookUrl && oldTask && oldTask.status !== form.status) {
        if (form.status === "完了" && notifyOn.completed) { await sendSlackNotification(webhookUrl, "completed", form); showToast("完了通知をSlackに送信しました 🎉"); }
        else if (notifyOn.statusChanged) { await sendSlackNotification(webhookUrl, "status_changed", form, { from: oldTask.status, to: form.status }); showToast("ステータス変更通知を送信しました 🔄"); }
      }
    }
  };

  const del = (id) => setTasks(ts => ts.filter(t => t.id !== id));
  const stats = { total: tasks.length, done: tasks.filter(t => t.status === "完了").length, inProgress: tasks.filter(t => t.status === "進行中").length, overdue: tasks.filter(t => t.dueDate && t.status !== "完了" && new Date(t.dueDate) < new Date()).length };

  return (
    <div style={{ minHeight: "100vh", background: "#0f1117", fontFamily: "'Noto Sans JP', 'Hiragino Sans', sans-serif", color: "#e2e8f0" }}>
      <style>{`@keyframes fadeIn { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }`}</style>
      <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;600;700&family=Noto+Serif+JP:wght@700&display=swap" rel="stylesheet" />

      <div style={{ background: "#13161f", borderBottom: "1px solid #1e2235", padding: "0 28px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 32, height: 32, background: "linear-gradient(135deg,#f59e0b,#ef4444)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>✦</div>
          <div>
            <div style={{ fontFamily: "'Noto Serif JP', serif", fontWeight: 700, fontSize: 17, color: "#f1f5f9" }}>TaskFlow</div>
            <div style={{ fontSize: 10, color: "#475569", letterSpacing: "0.1em" }}>社内タスク管理</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button onClick={() => setSettingsOpen(true)} style={{ display: "flex", alignItems: "center", gap: 7, padding: "7px 14px", background: webhookUrl ? "#1a2a1a" : "#13161f", color: webhookUrl ? "#22c55e" : "#64748b", border: `1px solid ${webhookUrl ? "#22c55e40" : "#1e2235"}`, borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "inherit" }}>
            💬 {webhookUrl ? "Slack 連携中" : "Slack 設定"}
          </button>
          <button onClick={() => setModal("new")} style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 18px", background: "#f59e0b", color: "#0f0f15", border: "none", borderRadius: 9, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
            ＋ 新しいタスク
          </button>
        </div>
      </div>

      <div style={{ padding: "24px 28px", maxWidth: 1300, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 24 }}>
          {[["総タスク数", stats.total, "#3b82f6", "📋"], ["完了", stats.done, "#22c55e", "✅"], ["進行中", stats.inProgress, "#f59e0b", "⚡"], ["期限超過", stats.overdue, "#ef4444", "⚠️"]].map(([label, val, color, icon]) => (
            <div key={label} style={{ background: "#13161f", border: "1px solid #1e2235", borderRadius: 12, padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div><div style={{ fontSize: 12, color: "#64748b", marginBottom: 4, fontWeight: 600 }}>{label}</div><div style={{ fontSize: 28, fontWeight: 800, color, fontFamily: "'Noto Serif JP', serif" }}>{val}</div></div>
              <div style={{ width: 44, height: 44, borderRadius: "50%", background: color + "18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>{icon}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 10, marginBottom: 22, flexWrap: "wrap", alignItems: "center" }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 タスク・担当者を検索..." style={{ ...inputStyle, width: 220, flex: "0 0 220px" }} />
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ ...inputStyle, width: "auto" }}>
            <option value="all">すべてのステータス</option>
            {STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
          <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} style={{ ...inputStyle, width: "auto" }}>
            <option value="all">すべての優先度</option>
            {Object.entries(PRIORITIES).map(([k, v]) => <option key={k} value={k}>{v.label}優先</option>)}
          </select>
          <div style={{ marginLeft: "auto", display: "flex", gap: 4, background: "#13161f", border: "1px solid #1e2235", borderRadius: 8, padding: 3 }}>
            {[["kanban", "📊 カンバン"], ["list", "☰ リスト"]].map(([v, label]) => (
              <button key={v} onClick={() => setView(v)} style={{ padding: "6px 14px", borderRadius: 6, border: "none", background: view === v ? "#f59e0b" : "transparent", color: view === v ? "#0f0f15" : "#64748b", cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "inherit" }}>{label}</button>
            ))}
          </div>
        </div>

        {view === "kanban" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, alignItems: "start" }}>
            {STATUSES.map(status => {
              const col = filtered.filter(t => t.status === status);
              return (
                <div key={status}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, padding: "8px 12px", background: "#13161f", borderRadius: 9, border: "1px solid #1e2235" }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: STATUS_COLORS[status] }} />
                    <span style={{ fontWeight: 700, fontSize: 13, color: "#c8d3e0" }}>{status}</span>
                    <span style={{ marginLeft: "auto", background: STATUS_COLORS[status] + "25", color: STATUS_COLORS[status], borderRadius: 99, padding: "1px 8px", fontSize: 12, fontWeight: 700 }}>{col.length}</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {col.map(t => <TaskCard key={t.id} task={t} onClick={() => setModal(t)} onDelete={del} />)}
                    {col.length === 0 && <div style={{ textAlign: "center", color: "#334155", fontSize: 13, padding: "32px 0", borderRadius: 10, border: "1px dashed #1e2235" }}>タスクなし</div>}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {view === "list" && (
          <div style={{ background: "#13161f", border: "1px solid #1e2235", borderRadius: 12, overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr auto", padding: "12px 20px", borderBottom: "1px solid #1e2235", fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.09em" }}>
              {["タイトル", "担当者", "ステータス", "優先度", "期限日", ""].map((h, i) => <div key={i}>{h}</div>)}
            </div>
            {filtered.map((t, i) => (
              <div key={t.id} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr auto", padding: "14px 20px", borderBottom: i < filtered.length - 1 ? "1px solid #1a1d2e" : "none", alignItems: "center", cursor: "pointer", transition: "background 0.15s" }} onMouseEnter={e => e.currentTarget.style.background = "#181b2a"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <div onClick={() => setModal(t)}><div style={{ color: "#e2e8f0", fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{t.title}</div><Badge label={t.category} color="#94a3b8" /></div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }} onClick={() => setModal(t)}><Avatar name={t.assignee} size={26} /><span style={{ color: "#94a3b8", fontSize: 12 }}>{t.assignee.split(" ")[0]}</span></div>
                <div onClick={() => setModal(t)}><Badge label={t.status} color={STATUS_COLORS[t.status]} /></div>
                <div onClick={() => setModal(t)}><Badge label={PRIORITIES[t.priority].label} color={PRIORITIES[t.priority].color} /></div>
                <div style={{ color: t.dueDate && t.status !== "完了" && new Date(t.dueDate) < new Date() ? "#ef4444" : "#64748b", fontSize: 12 }} onClick={() => setModal(t)}>{t.dueDate || "—"}</div>
                <button onClick={() => del(t.id)} style={{ background: "transparent", border: "none", color: "#374151", cursor: "pointer", fontSize: 15, padding: "2px 6px", borderRadius: 4 }} onMouseEnter={e => e.target.style.color = "#ef4444"} onMouseLeave={e => e.target.style.color = "#374151"}>✕</button>
              </div>
            ))}
            {filtered.length === 0 && <div style={{ textAlign: "center", color: "#334155", padding: "48px 0", fontSize: 14 }}>タスクが見つかりません</div>}
          </div>
        )}
      </div>

      {modal && <TaskModal task={modal === "new" ? null : modal} onClose={() => setModal(null)} onSave={save} />}
      {settingsOpen && <SettingsModal webhookUrl={webhookUrl} notifyOn={notifyOn} onClose={() => setSettingsOpen(false)} onSave={(url, notify) => { setWebhookUrl(url); setNotifyOn(notify); showToast("Slack設定を保存しました ✦"); }} />}
      {toast && <Toast msg={toast.msg} ok={toast.ok} />}
    </div>
  );
}
