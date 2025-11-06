import React, { useState, useEffect } from "react";
import "./App.css"

const BACKEND_URL =
  (import.meta as any).env?.VITE_BACKEND_URL || "http://127.0.0.1:5000";
const PUBLIC_TOKEN =
  (import.meta as any).env?.VITE_PUBLIC_TOKEN || "your_public_token";

declare const chrome: any;

// 🖋 Typing animation (no auto-scroll)
const TypingText: React.FC<{ text: string }> = ({ text }) => {
  const [displayedText, setDisplayedText] = React.useState("");

  React.useEffect(() => {
    setDisplayedText("");
    let i = 0;
    const interval = setInterval(() => {
      if (i < text.length) {
        setDisplayedText((prev) => prev + text[i]);
        i++;
      } else {
        clearInterval(interval);
      }
    }, 40);
    return () => clearInterval(interval);
  }, [text]);

  return (
    <div className="text-white whitespace-pre-wrap text-sm leading-relaxed">
      {displayedText}
    </div>
  );
};

const App: React.FC = () => {
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [feedback, setFeedback] = useState("");
  const [score, setScore] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 🔍 Auto-detect current tab URL
  const handleFetchActiveTab = async () => {
    try {
      if (typeof chrome !== "undefined" && chrome.tabs?.query) {
        const [tab] = await chrome.tabs.query({
          active: true,
          currentWindow: true,
        });
        if (tab?.url) {
          setUrl(tab.url);
          setError("");
        } else {
          setError("No active tab detected.");
        }
      } else {
        setError("Chrome API not available — open from extension popup.");
      }
    } catch (err) {
      console.error("Tab fetch failed:", err);
      setError("Unable to fetch current tab URL.");
    }
  };

  // 🧠 Analyze terms
  const handleAnalyze = async () => {
    if (!url.trim() && !text.trim()) {
      alert("Please enter a URL or paste Terms text first.");
      return;
    }

    setLoading(true);
    setError("");
    setFeedback("");
    setScore(null);

    try {
      const body = url.trim() ? { url } : { text };
      const res = await fetch(`${BACKEND_URL}/analyze_terms`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Access-Token": PUBLIC_TOKEN,
        },
        body: JSON.stringify(body),
      });

      const contentType = res.headers.get("content-type") || "";
      let data: any = {};

      if (contentType.includes("application/json")) {
        data = await res.json();
      } else {
        const textBody = await res.text();
        data = { error: `Unexpected content-type (${contentType})`, body: textBody };
      }

      if (res.ok) {
        setFeedback(data.feedback || "No feedback returned.");
        setScore(data.score ?? null);
      } else {
        setError(data.error || `Request failed: ${res.status}`);
      }
    } catch (err) {
      console.error(err);
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  // 🔁 Loading text cycle
  const loadingMessages = [
    "Analyzing...",
    "Thinking...",
    "Calculating risk score...",
    "Almost there...",
  ];
  const [loadingText, setLoadingText] = useState(loadingMessages[0]);

  useEffect(() => {
    if (!loading) return;
    let i = 0;
    const interval = setInterval(() => {
      i = (i + 1) % loadingMessages.length;
      setLoadingText(loadingMessages[i]);
    }, 3000);
    return () => clearInterval(interval);
  }, [loading]);

  return (
    <div
      className="flex items-start justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black text-gray-100 p-4"
      style={{
        width: "400px",
        height: "570px",
        borderRadius: "16px",
        overflow: "hidden",
      }}
    >
      <div className="w-full max-w-lg bg-gray-900/70 border border-gray-700 backdrop-blur-md rounded-2xl shadow-2xl p-5 flex flex-col h-full">
        <h1 className="text-2xl font-bold text-center text-blue-400 mb-2">
          ESECURE Terms Analyzer
        </h1>

        {/* Input Section */}
        {!feedback && (
          <>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter or auto-detect website URL..."
              className="w-full bg-gray-800 text-gray-100 border border-gray-700 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
            />

            <button
              onClick={handleFetchActiveTab}
              className="w-full py-2 mb-3 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
            >
              Use Current Tab URL
            </button>

            <p className="text-center text-gray-400 mb-4 text-sm">
              Analyze Terms & Conditions or Privacy Policy for safety and transparency.
            </p>

            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste terms & conditions here (optional)..."
              rows={6}
              className="w-full bg-gray-800 text-gray-100 border border-gray-700 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500 resize-none"
            />

            <button
              onClick={handleAnalyze}
              disabled={loading}
              className={`mt-4 w-full py-2 rounded-lg font-semibold transition-colors ${
                loading
                  ? "bg-blue-600 cursor-not-allowed"
                  : "bg-blue-700 hover:bg-blue-800"
              }`}
            >
              {loading ? loadingText : "Analyze"}
            </button>
          </>
        )}

        {/* Feedback Output (scrollable) */}
        {feedback && (
          <div
            className="mt-5 bg-gray-800 border border-gray-700 rounded-lg p-4 shadow-inner flex-1 overflow-y-auto"
            style={{
              minHeight: "320px",
              scrollbarWidth: "thin",
              scrollbarColor: "rgba(180,180,180,0.5) transparent",
            }}
          >
            {/* Chrome/Edge scrollbar styling */}
            <style>
              {`
                div::-webkit-scrollbar {
                  width: 8px;
                }
                div::-webkit-scrollbar-thumb {
                  background-color: rgba(180,180,180,0.4);
                  border-radius: 6px;
                }
                div::-webkit-scrollbar-thumb:hover {
                  background-color: rgba(180,180,180,0.6);
                }
              `}
            </style>

            <h3 className="text-lg font-semibold text-blue-400 mb-2">
              Safety Score:{" "}
              <span className="text-green-400">{score ?? "N/A"}/100</span>
            </h3>

            <TypingText text={feedback} />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-4 bg-red-900/40 border border-red-600 text-red-300 p-3 rounded-lg">
            <h3 className="font-semibold">Error:</h3>
            <p className="text-sm">{error}</p>
          </div>
        )}

        <footer className="mt-auto text-center text-gray-500 text-xs border-t border-gray-700 pt-3">
          Powered by <span className="text-blue-400 font-medium">ESECURE AI</span>
        </footer>
      </div>
    </div>
  );
};

export default App;
