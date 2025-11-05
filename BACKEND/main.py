from dotenv import load_dotenv
from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
import os
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import re
import requests
from bs4 import BeautifulSoup

load_dotenv()



app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

limiter = Limiter(
    get_remote_address,
    app=app,
    default_limits=["5 per minute"]
)


api_key = os.environ.get("GEMINI_API_KEY")
if not api_key:
    raise RuntimeError("GEMINI_API_KEY not set in environment")
genai.configure(api_key=api_key)

def extract_safety_score(text: str) -> int | None:
    """
    Extract a safety score from Gemini response text.
    Handles any reasonable phrasing.
    """
    if not text:
        return None

    score_match = re.search(r"(?i)(?:safety\s*score|score).{0,20}?(\d{1,3})", text)
    if score_match:
        try:
            score = int(score_match.group(1))
            return max(0, min(score, 100))  # clamp 0-100
        except ValueError:
            return None
    return None


def scrape_terms_from_url(url):
    """Scrape Terms & Conditions or Privacy Policy text from a given URL."""
    try:
        headers = {"User-Agent": "Mozilla/5.0"}
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()

        soup = BeautifulSoup(response.text, "html.parser")

        selectors = [
            "article", "main", ".terms", "#terms",
            ".policy", "#policy", ".content", "body"
        ]

        text = ""
        for sel in selectors:
            el = soup.select_one(sel)
            if el and len(el.get_text(strip=True)) > 400:
                text = el.get_text(separator="\n", strip=True)
                break

        if not text:
            text = soup.get_text(separator="\n", strip=True)

        if not re.search(r"(terms|conditions|privacy|policy)", text, re.I):
            return None

        return text[:12000]
    except Exception as e:
        print("Error scraping terms:", e)
        return None


@app.route("/analyze_terms", methods=["POST"])
@limiter.limit("5 per minute")
def analyze_terms():
    data = request.get_json()

    user_token = request.headers.get("X-Access-Token")
    if user_token != "secure123":
        return jsonify({"error": "Unauthorized"}), 403

    text = data.get("text")
    url = data.get("url")

    # Scrape automatically if URL is given
    if url and not text:
        text = scrape_terms_from_url(url)
        if not text:
            return jsonify({"error": "Failed to extract terms from URL"}), 400

    if not text:
        return jsonify({"error": "No text provided"}), 400

    try:
        prompt = f"""
You are a legal compliance and risk assistant. You receive the full Terms of Service or Privacy Policy text below.

Strictly follow all instructions and output structure. Do NOT include extra commentary, disclaimers, or formatting beyond what is requested. The output should be concise and easy to understand.

Instructions:
1. Assign a "Safety Score" from 0 (most risky) to 100 (safest) for this document, based solely on its language and risk exposure.
- Only output: Safety Score: X/100 (where X is an integer between 0 and 100).
2. Give a one-line summary (concise, neutral) of overall risk or safety (max 20 words).
3. List risky or concerning clauses ONLY (such as excessive data sharing, vague liability, hidden fees, broad refunds, forced arbitration, waiver of class action, or similar).
- Each risky clause must be a bullet point:
    - Briefly describe the risk.
    - Quote the relevant policy sentence (if possible), keeping each bullet under 35 words.
4. Do NOT include any non-risky clauses, general advice, or commentary.

Output in *exactly* this order:
Safety Score: X/100
Summary: [your one-line summary]
Risky Clauses:
- [bullet 1]
- [bullet 2]
- ... (if none, write "None found.")

Text to analyze:
{text[:12000]}
"""

        model = genai.GenerativeModel("gemini-2.5-flash")
        response = model.generate_content(prompt)
        result_text = (response.text or "").strip()

        score_match = re.search(r"(\d{1,3})\s*/\s*100", result_text)
        score = int(score_match.group(1)) if score_match else None

        return jsonify({
            "feedback": result_text,
            "score": score
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "message": "ESECURE Backend is running successfully!",
        "endpoints": {
            "analyze_terms": "/analyze_terms (POST)"
        }
    })


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    debug_mode = os.environ.get("FLASK_DEBUG", "true").lower() in ("1", "true", "yes")
    app.run(host="0.0.0.0", port=port, debug=debug_mode)
