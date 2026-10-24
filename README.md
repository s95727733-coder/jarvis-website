# J.A.R.V.I.S. HUD Website

A responsive, Iron Man-inspired cyan HUD website with a Gemini-powered chat backend, optional browser speech output/input, and basic PWA support.

## Requirements

- Node.js 20 or newer
- A Gemini API key from Google AI Studio

## Run locally

1. Extract the ZIP.
2. Open a terminal in the `jarvis-website` folder.
3. Install dependencies:

   ```bash
   npm install
   ```

4. Copy `.env.example` to `.env`.
5. Add your API key to `.env`:

   ```env
   GEMINI_API_KEY=your_real_key_here
   PORT=3000
   ```

6. Start the server:

   ```bash
   npm start
   ```

7. Open `http://localhost:3000` in your browser.

Do not open `public/index.html` directly as a file. The app must be served by the Express server.

## Deploy

Deploy this Node.js project to a host that supports Node 20+ and environment variables. Set `GEMINI_API_KEY` in the host's server-side environment settings. Use HTTPS for microphone access and PWA installation. Do not commit `.env` or place the API key in browser code.

## Features

- Responsive J.A.R.V.I.S. HUD interface and animated Arc Reactor
- Gemini-powered chat through a server endpoint
- Hindi/English response language toggle
- Browser speech output and optional speech recognition when supported
- Static-shell PWA caching; `/api/*` requests are never cached

## Notes

- Voice recognition availability depends on the browser and device.
- The basic in-memory rate limiter is intended for a single-instance starter app, not a high-traffic production service.
- API key usage may incur costs under your Google AI account.
