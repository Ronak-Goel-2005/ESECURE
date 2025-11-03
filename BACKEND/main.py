from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
import os
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import re

app = Flask(__name__)
CORS(app)
limiter = Limiter(app, key_func=get_remote_address, default_limits=["5 per minute"])

genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))

def auth_disabled():
    return os.environ.get("DISABLE_AUTH", "false").lower() in ("1", "true", "yes")

@app.before_request
def check_token():
    if auth_disabled():
        return None
    token = request.headers.get("X-Access-Token")
    expected = os.environ.get("MY_PUBLIC_TOKEN", "")
    if not expected or token != expected:
        return jsonify({"error": "Unauthorized"}), 401

@app.route("/analyze_terms", methods=["POST"])
@limiter.limit("5 per minute")
def analyze_terms():
    data = request.get_json(silent=True) or {}
    text = data.get("text", "") if isinstance(data, dict) else ""

    if not text.strip():
        return jsonify({"error": "No text provided"}), 400

    prompt = f"""
    You are a legal safety assistant. Read the following Terms and Conditions text and:
    1. Summarize it in simple, human-understandable language.
    2. Identify any risky or concerning clauses (e.g., data sharing, third parties, hidden fees, no refund).
    3. Give a safety score from 0 (very risky) to 100 (very safe).
    
    Terms & Conditions:
    {text[:12000]}
    """

    try:
        model = genai.GenerativeModel("gemini-2.5-flash")
        response = model.generate_content(prompt)
        result_text = (response.text or "").strip()

        score_match = re.search(r"(?:score|safety score)\s*[:=]?\s*(\d{1,3})", result_text, re.IGNORECASE)
        score = int(score_match.group(1)) if score_match else None

        return jsonify({"score": score, "feedback": result_text}), 200

    except Exception as e:
        return jsonify({"error": "AI backend error", "detail": str(e)}), 502

@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "message": "✅ ESECURE Backend is running successfully!",
        "endpoints": {
            "analyze_terms": "/analyze_terms (POST)"
        }
    })

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    debug_mode = os.environ.get("FLASK_DEBUG", "true").lower() in ("1", "true", "yes")
    app.run(host="0.0.0.0", port=port, debug=debug_mode)
