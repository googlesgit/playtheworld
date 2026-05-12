# SONIQ — Music Player

A browser-based music player that streams real songs from JioSaavn — Bollywood, Hindi, Punjabi, and more. No account needed, no ads, no downloads. Just open and play.

Live at: **[googlesgit.github.io/playtheworld](https://googlesgit.github.io/playtheworld)**

---

## How It Works — Full Architecture

```
Browser (GitHub Pages)
        │
        │  Search query / genre
        ▼
Vercel Serverless Proxy
(soniq-proxy-2y7m.vercel.app/api/search)
        │
        │  HTTP request
        ▼
JioSaavn Internal API
(www.jiosaavn.com/api.php)
        │
        │  Returns encrypted audio URLs
        ▼
Proxy decrypts URLs (DES-ECB)
        │
        │  Returns clean song list with direct MP3 links
        ▼
Browser plays audio via <audio> tag
        │
        ▼
Supabase (favorites + recently played)
LocalStorage (offline fallback)
```

### Layer 1 — Frontend (GitHub Pages)

**File:** `index.html` — single file, no build step, no framework.

The entire app lives in one HTML file with embedded CSS and JavaScript. It is hosted on GitHub Pages for free. When the user searches or clicks a genre, the browser sends a fetch request to the Vercel proxy.

Technologies used:
- HTML5 `<audio>` tag for native playback (no iframes, no YouTube embeds)
- CSS Grid for layout, CSS custom properties for theming
- Vanilla JavaScript — no React, no jQuery, no bundler
- Google Fonts (Syne + DM Sans)

### Layer 2 — CORS Proxy (Vercel Serverless)

**Repo:** `googlesgit/soniq-proxy`
**Live URL:** `https://soniq-proxy-2y7m.vercel.app/api/search`

The browser cannot call JioSaavn's API directly because JioSaavn does not send CORS headers — the browser's same-origin policy blocks the request. The proxy solves this.

The proxy is a single Vercel serverless function (`api/search.js`) written in Node.js (ESM). When the browser sends a search query, the proxy:

1. Forwards the query to JioSaavn's internal search API
2. Receives song results with **encrypted** audio URLs
3. Decrypts each audio URL using DES-ECB
4. Returns a clean JSON list of songs with direct MP3 links

CORS headers (`Access-Control-Allow-Origin: *`) are set both inside the function code and at the Vercel CDN level via `vercel.json`, so they are always present regardless of what happens inside the function.

### Layer 3 — JioSaavn Internal API

JioSaavn is one of India's largest music streaming services. Their internal API is not publicly documented but is reachable at:

```
https://www.jiosaavn.com/api.php?__call=search.getResults
  &_format=json
  &api_version=4
  &ctx=wap6dot0
  &n=20
  &p=1
  &q=<search query>
```

This returns song metadata and `encrypted_media_url` for each song — the audio URL encrypted with DES-ECB.

### Layer 4 — DES-ECB Decryption (inside the proxy)

JioSaavn encrypts every audio URL before sending it. The encryption algorithm is **DES-ECB** (Data Encryption Standard, Electronic Codebook mode) with key `38346591`.

The proxy implements a complete DES-ECB decryption in pure JavaScript — no npm packages — using the standard FIPS 46-3 specification:

```
Encrypted base64 string from JioSaavn
        │
        ▼
Base64 decode → raw bytes
        │
        ▼
Split into 8-byte blocks
        │
        ▼
For each block:
  Apply Initial Permutation (IP)
  16 Feistel rounds (reversed subkey order for decryption)
    - Expand 32 bits → 48 bits (E permutation)
    - XOR with 48-bit subkey
    - Pass through 8 S-boxes → 32 bits
    - Apply P permutation
  Apply Final Permutation (FP)
        │
        ▼
Reassemble bytes → UTF-8 string
        │
        ▼
Replace _96.mp4 with _320.mp4 (upgrade to 320 kbps)
        │
        ▼
Direct HTTPS MP3 URL → sent to browser
```

The key schedule generates 16 subkeys from the 8-byte key using PC-1, PC-2 permutations and left-rotation shifts. For decryption, these 16 subkeys are applied in reverse order (K16 → K1).

Using pure JavaScript for this means:
- No npm install required
- No dependency on OpenSSL version (Node.js 18/20 removed DES from its native crypto)
- No external library that could fail to load in a serverless environment

### Layer 5 — Audio Playback

Once the browser receives the direct MP3 URL from the proxy, it sets it as the `src` of a native HTML5 `<audio>` element:

```html
<audio id="aud" preload="auto" crossorigin="anonymous"></audio>
```

```js
aud.src = song.url;  // e.g. https://aac.saavncdn.com/abc_320.mp4
aud.play();
```

The `.mp4` extension from JioSaavn actually contains AAC audio — browsers play it correctly via the native audio element.

### Layer 6 — Storage (Supabase + LocalStorage)

Favorites and recently played history are saved to **Supabase** (a hosted PostgreSQL service) using the REST API — no SDK needed, just `fetch`.

Each user gets a random session ID stored in `localStorage`. This ID is used to identify their data in Supabase. If Supabase is unavailable, everything falls back to `localStorage` automatically.

```
User presses ❤️
        │
        ▼
Save to Supabase: favorites table
  { session_id, song_id, title, artist, image, url }
        │
        ▼ (if Supabase fails)
Save to localStorage: sq_favs key
```

---

## What Broke and How I Fixed It

### The Problem

The proxy was not calling JioSaavn directly. Instead, it was calling a third-party JioSaavn API wrapper (`jiosaavn-api-2-liard.vercel.app`) that handled decryption on its end. That wrapper Int offline (404). Every other public JioSaavn wrapper was also dead.

When the proxy got a 404 from the wrapper, it crashed before the JavaScript handler could run. Because the CORS headers (`Access-Control-Allow-Origin: *`) Ire only set inside the handler function, the error response from Vercel had no CORS headers. The browser blocked the response and shoId:

```
Access to fetch has been blocked by CORS policy:
No 'Access-Control-Allow-Origin' header is present
```

This looked like an internet connection problem even though the internet was working fine.

### The Fix

Three files Ire changed in the `soniq-proxy` repo:

**`api/search.js`**
- Removed the call to the dead third-party wrapper
- Now calls JioSaavn's internal API directly
- Implements DES-ECB decryption inline in pure JavaScript
- No npm dependencies

**`vercel.json`**
- Changed from `{}` to include explicit CORS headers at the Vercel CDN routing level
- This means CORS headers are always present in every response, even if the function crashes entirely — future errors show the real error message instead of a confusing CORS error

**`package.json`**
- Removed the `node-forge` dependency that was causing a silent runtime crash
- Node.js 18/20 with OpenSSL 3.0 dropped DES from its built-in `crypto` module; `node-forge` was added as a pure-JS workaround but its CommonJS module failed to load inside the ESM (`"type": "module"`) Vercel function environment

---

## File Structure

```
Music App/
├── playtheworld/          ← Frontend (this repo, GitHub Pages)
│   ├── index.html         ← Entire app: HTML + CSS + JS in one file
│   └── readme.md          ← This file
│
├── soniq-proxy/           ← CORS proxy (separate repo, Vercel)
│   ├── api/
│   │   ├── search.js      ← Main handler: JioSaavn search + DES decrypt
│   │   └── stream.js      ← Song stream URL handler (unused by frontend)
│   ├── vercel.json        ← Vercel config: CDN-level CORS headers
│   └── package.json       ← No dependencies (pure Node.js)
│
└── jiosaavn-api-2-1/      ← Reference: full JioSaavn API TypeScript project
    └── src/               ← (not deployed; used as reference implementation)
```

---

## Features

- Search any song, artist, or movie name
- Genre tabs: All, Bollywood, Arijit Singh, Punjabi, Atif Aslam, A.R. Rahman, Pop, Chill
- Sidebar: artists and genres (Bollywood, Sufi, Punjabi, Devotional, Classic Hindi, Jazz, Lo-Fi, Rock)
- Favorites (heart button) — saved across sessions via Supabase
- Recently Played history — last 50 tracks
- Shuffle and Repeat modes
- Progress bar with seek
- Volume control and mute
- Vinyl spinning animation when playing
- Waveform animation in header
- 320 kbps audio when available, falls back to loIr quality
- Keyboard shortcuts: `Space` play/pause, `Alt+→` next, `Alt+←` previous, `M` mute, `S` shuffle, `R` repeat

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| Space | Play / Pause |
| Alt + → | Next track |
| Alt + ← | Previous track |
| M | Mute / Unmute |
| S | Toggle Shuffle |
| R | Toggle Repeat |

---

## Deployment

### Frontend (playtheworld)
Hosted on GitHub Pages. Any push to the `main` branch of `googlesgit/playtheworld` automatically updates the live site. No build step — the `index.html` is served directly.

### Proxy (soniq-proxy)
Hosted on Vercel. Connected to the `googlesgit/soniq-proxy` GitHub repo. Any push or file update on the `main` branch triggers an automatic Vercel deployment (typically completes in 30–60 seconds).

The proxy URL is hardcoded in `index.html`:
```js
const SAAVN = 'https://soniq-proxy-2y7m.vercel.app/api';
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5, CSS3, Vanilla JS |
| Hosting | GitHub Pages (free) |
| Proxy | Vercel Serverless Functions (free tier) |
| Audio decryption | Pure JS DES-ECB (no library) |
| Music source | JioSaavn internal API |
| User data | Supabase REST API + localStorage fallback |
| Audio playback | Native HTML5 `<audio>` |
| Fonts | Google Fonts (Syne, DM Sans) |

---

*Built with pure HTML, CSS, and JavaScript — no frameworks, no build tools, no bundlers.*
