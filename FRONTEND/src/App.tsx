import React, { useState } from "react";

const BACKEND_URL = (import.meta as any).env?.VITE_BACKEND_URL || "http://127.0.0.1:5000";
const PUBLIC_TOKEN = (import.meta as any).env?.VITE_PUBLIC_TOKEN || "your_public_token";

const App: React.FC = () => {
  const [text, setText] = useState("");
  const [feedback, setFeedback] = useState("");
  const [score, setScore] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAnalyze = async () => {
    if (!text.trim()) return alert("Please enter terms and conditions text.");

    setLoading(true);
    setError("");
    setFeedback("");
    setScore(null);

    try {
      const res = await fetch(`${BACKEND_URL}/analyze_terms`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Access-Token": PUBLIC_TOKEN,
        },
        body: JSON.stringify({ text }),
      });

      const ct = res.headers.get("content-type") || "";
      let data: any = {};

      if (ct.includes("application/json")) {
        try {
          data = await res.json();
        } catch (e) {
          data = { error: `Invalid JSON response (status ${res.status})` };
        }
      } else {
        const textBody = await res.text();
        data = { error: `Unexpected response content-type (${ct})`, body: textBody };
      }

      if (res.ok) {
        setFeedback(data.feedback || "No feedback returned");
        setScore(data.score ?? null);
      } else {
        setError(data.error || `Request failed: ${res.status}`);
      }
    } catch (err) {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: 20 }}>
      <h1>ESECURE Terms Analyzer</h1>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste terms & conditions here..."
        rows={10}
        style={{ width: "100%", padding: 10, fontSize: 16 }}
      />

      <button
        onClick={handleAnalyze}
        disabled={loading}
        style={{ marginTop: 10, padding: "10px 20px", fontSize: 16 }}
      >
        {loading ? "Analyzing..." : "Analyze"}
      </button>

      {feedback && (
        <div style={{ marginTop: 20, padding: 10, background: "#e0ffe0" }}>
          <h3>Safety Score: {score !== null ? score : "N/A"}/100</h3>
          <h3>Feedback:</h3>
          <p>{feedback}</p>
        </div>
      )}

      {error && (
        <div style={{ marginTop: 20, padding: 10, background: "#ffe0e0" }}>
          <h3>Error:</h3>
          <p>{error}</p>
        </div>
      )}
    </div>
  );
};

export default App;
