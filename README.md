## ESECURE Terms Analyzer

ESECURE is a web application that analyzes **Terms and Conditions** text, providing a **human-readable summary**, highlighting **risky clauses**, and generating a **safety score** (0–100). It uses **Google Gemini AI** for analysis and consists of a Flask backend and a React frontend.

## Features

- Analyze Terms & Conditions text with AI.
- Summarizes legal text in simple language.
- Identifies risky clauses (data sharing, hidden fees, no refund, etc.).
- Provides a safety score (0 = very risky, 100 = very safe).
- Rate-limited API to prevent abuse.
- Supports optional token-based authentication.

## Tech Stack

- **Backend:** Python, Flask, Flask-CORS, Flask-Limiter, Google Generative AI (Gemini)
- **Frontend:** React, TypeScript
- **Environment Management:** dotenv

## Backend Setup (Flask)

### Requirements

- Python 3.10+
- `pip` installed
- Google Gemini API key

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/honoursbhaduria/ESECURE.git
   cd ESECURE/BACKEND/

### Install Python dependencies

```bash
pip install -r requirements.txt

```
### Create a .env file in the BACKEND/ root folder with the following content:

- GEMINI_API_KEY=your_gemini_api_key
- MY_PUBLIC_TOKEN=your_public_token
- DISABLE_AUTH=false
- PORT=5000
- FLASK_DEBUG=true

### Start the Flask server from within the BACKEND/ directory:

```bash 
python main.py
```

### Navigate to the frontend folder:
```bash 
npm install
```
### Create a .env file in the frontend/ root folder:

- VITE_BACKEND_URL=http://127.0.0.1:5000
- VITE_PUBLIC_TOKEN=your_public_token

### Running the Frontend
```bash 
npm run dev
```

### Usage

* Open the application in your browser.

* Paste the Terms & Conditions text into the textarea.

* Click Analyze.

* View the generated safety score, summary, and clause feedback

## Load & Test Extension

Now:
```bash
>> Run the backend:

python main.py


>> Build your frontend:

npm run build

```

Go to Chrome → chrome://extensions/
→ Enable Developer Mode
→ Click “Load unpacked”
→ Select your React dist folder (the build output).

You’ll now see your extension icon — click it!