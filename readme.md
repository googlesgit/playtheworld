# ◉ SONIQ — Free Music Player

A beautiful, browser-based music player that streams **free, legal music** from around the world — including **Bollywood, Hindi, Punjabi, and Indian Classical** music. No backend needed. Just open `index.html` and play.

![SONIQ Preview](https://via.placeholder.com/900x500/0a0a0f/a78bfa?text=SONIQ+Music+Player)

---

## ✨ Features

- 🎵 **Streams real free music** from Jamendo, JioSaavn (unofficial), Bensound & Archive.org
- 🇮🇳 **Indian music support** — Bollywood, Hindi, Punjabi, Carnatic, Devotional, Folk
- 🔍 **Search** any song or artist
- 🎬 **Genre tabs** — All, Bollywood, Hindi, Indian, Jazz, Electronic, Rock
- ❤️ **Favorites** — saved in your browser (localStorage)
- 🕐 **Recently Played** history
- 🔀 **Shuffle** and 🔁 **Repeat** modes
- ⌨️ **Keyboard shortcuts** (Space = play/pause, Alt+→ = next, M = mute, S = shuffle)
- 💿 **Vinyl spinning animation** while playing
- 🌊 **Waveform animation** in the header
- 📱 **Responsive** — works on mobile and tablet
- 🎨 **Dark theme** with purple gradient accents
- ⚡ **Zero dependencies** — pure HTML, CSS, JavaScript

---

## 🚀 Quick Start

### Option 1: Just open the file
```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/REPO_NAME.git

# Open index.html in your browser
open index.html
```

### Option 2: Run a local server (recommended for API calls)
```bash
# Using Python
python3 -m http.server 8000

# Using Node.js
npx serve .

# Then open: http://localhost:8000
```

### Option 3: Deploy to GitHub Pages
1. Go to your repo → **Settings** → **Pages**
2. Set source to `main` branch
3. Your site will be live at `https://YOUR_USERNAME.github.io/REPO_NAME`

---

## 📁 File Structure

```
soniq-music-player/
├── index.html      ← Main page (HTML structure)
├── style.css       ← All styling (dark theme, animations)
├── app.js          ← All logic (playback, APIs, search)
└── README.md       ← This file
```

---

## 🎶 Music Sources

| Source | Type | Indian Music? |
|--------|------|--------------|
| **Jamendo** | Live API — Creative Commons music | ❌ (international) |
| **JioSaavn** | Unofficial API — Bollywood & Hindi | ✅ Yes! |
| **Bensound** | CC BY licensed tracks | ❌ |
| **Archive.org** | Public Domain Indian Classical | ✅ Ragas, Tabla |
| **SoundHelix** | Royalty-free | Instrumental |

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` | Play / Pause |
| `Alt + →` | Next track |
| `Alt + ←` | Previous track |
| `M` | Mute / Unmute |
| `S` | Toggle Shuffle |
| `R` | Toggle Repeat |

---

## 🇮🇳 Indian Music Categories

- 🎬 **Bollywood** — Latest Hindi film songs
- 🎵 **Hindi** — Hindi pop & independent music
- 🪘 **Carnatic / Hindustani** — Indian classical ragas
- 🎵 **Punjabi / Bhangra** — Energetic Punjabi beats
- 🙏 **Devotional** — Bhajans and mantras
- 🌾 **Folk** — Regional Indian folk music

---

## 🛠️ Customization

### Add your own tracks
Edit the `FALLBACK_TRACKS` array in `app.js`:
```js
{ 
  id: 'custom1', 
  name: 'My Favourite Song', 
  artist: 'Arijit Singh', 
  url: 'https://direct-mp3-link.com/song.mp3', 
  license: 'Free', 
  source: 'Custom', 
  duration: '4:30', 
  genre: 'bollywood' 
}
```

### Change the accent color
In `style.css`, update the `--accent` variable:
```css
:root {
  --accent: #a78bfa;  /* Change this to any color */
}
```

### Get your own Jamendo API key
1. Sign up at [jamendo.com/developer](https://devportal.jamendo.com)
2. Replace `JAMENDO_CLIENT_ID` in `app.js`

---

## 📝 License

This project is open source under the **MIT License**.

All music streamed is either Creative Commons licensed, public domain, or freely available via their respective platforms.

---

## 🙏 Credits

- Music from [Jamendo](https://www.jamendo.com), [Bensound](https://www.bensound.com), [Archive.org](https://archive.org), [JioSaavn](https://www.jiosaavn.com)
- Fonts: [Syne](https://fonts.google.com/specimen/Syne) + [DM Sans](https://fonts.google.com/specimen/DM+Sans) via Google Fonts
- Built with ❤️ using pure HTML, CSS & JavaScript

---

*Made in India 🇮🇳 — for music lovers everywhere*
