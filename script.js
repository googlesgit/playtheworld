/* ════════════════════════════════════════════════════════════════
   SONIQ — Free Music Player
   app.js
   Supports: Jamendo API, JioSaavn Unofficial API, Bensound fallback
   ════════════════════════════════════════════════════════════════ */

'use strict';

// ── Config ───────────────────────────────────────────────────────
const JAMENDO_CLIENT_ID = 'a4b6de04'; // Free public client ID

// Unofficial JioSaavn API (public, no key needed)
const SAAVN_BASE = 'https://saavn.dev/api';

// ── State ────────────────────────────────────────────────────────
let tracks       = [];
let currentIndex = -1;
let isPlaying    = false;
let isShuffle    = false;
let isRepeat     = false;
let isMuted      = false;
let favorites    = JSON.parse(localStorage.getItem('soniq_favorites') || '[]');
let recentlyPlayed = JSON.parse(localStorage.getItem('soniq_recent') || '[]');
let currentGenre = 'all';
let currentSource = 'jamendo';
let searchTimer  = null;

const audio = document.getElementById('audioEl');

// ── Fallback track library (always works, no CORS issues) ────────
const FALLBACK_TRACKS = [
  // International Free Tracks (Bensound - CC BY license)
  { id: 'bs1',  name: 'Jazzy Frenchy',    artist: 'Bensound',         url: 'https://www.bensound.com/bensound-music/bensound-jazzyfrenchy.mp3',   license: 'CC BY', source: 'Bensound', duration: '2:14', genre: 'jazz' },
  { id: 'bs2',  name: 'Ukulele',          artist: 'Bensound',         url: 'https://www.bensound.com/bensound-music/bensound-ukulele.mp3',          license: 'CC BY', source: 'Bensound', duration: '2:58', genre: 'pop' },
  { id: 'bs3',  name: 'Sunny',            artist: 'Bensound',         url: 'https://www.bensound.com/bensound-music/bensound-sunny.mp3',            license: 'CC BY', source: 'Bensound', duration: '2:20', genre: 'pop' },
  { id: 'bs4',  name: 'Acoustic Breeze',  artist: 'Bensound',         url: 'https://www.bensound.com/bensound-music/bensound-acousticbreeze.mp3',   license: 'CC BY', source: 'Bensound', duration: '3:30', genre: 'acoustic' },
  { id: 'bs5',  name: 'Creative Minds',   artist: 'Bensound',         url: 'https://www.bensound.com/bensound-music/bensound-creativeminds.mp3',    license: 'CC BY', source: 'Bensound', duration: '2:52', genre: 'electronic' },
  { id: 'bs6',  name: 'Buddy',            artist: 'Bensound',         url: 'https://www.bensound.com/bensound-music/bensound-buddy.mp3',            license: 'CC BY', source: 'Bensound', duration: '2:15', genre: 'acoustic' },
  { id: 'bs7',  name: 'Better Days',      artist: 'Bensound',         url: 'https://www.bensound.com/bensound-music/bensound-betterdays.mp3',       license: 'CC BY', source: 'Bensound', duration: '2:33', genre: 'pop' },
  { id: 'bs8',  name: 'Tenderness',       artist: 'Bensound',         url: 'https://www.bensound.com/bensound-music/bensound-tenderness.mp3',       license: 'CC BY', source: 'Bensound', duration: '2:17', genre: 'ambient' },
  { id: 'bs9',  name: 'Energy',           artist: 'Bensound',         url: 'https://www.bensound.com/bensound-music/bensound-energy.mp3',           license: 'CC BY', source: 'Bensound', duration: '2:24', genre: 'rock' },
  { id: 'bs10', name: 'Pop Dance',        artist: 'Bensound',         url: 'https://www.bensound.com/bensound-music/bensound-popdance.mp3',         license: 'CC BY', source: 'Bensound', duration: '2:11', genre: 'electronic' },

  // Indian Classical / Instrumental (Archive.org — Public Domain)
  { id: 'in1',  name: 'Raga Bhairav (Morning Raga)',    artist: 'Indian Classical',  url: 'https://archive.org/download/RagaBhairav_825/RagaBhairav.mp3',         license: 'PD',    source: 'Archive.org', duration: '5:12', genre: 'indian' },
  { id: 'in2',  name: 'Raga Yaman',                     artist: 'Indian Classical',  url: 'https://archive.org/download/RagaYaman/RagaYaman.mp3',                 license: 'PD',    source: 'Archive.org', duration: '8:30', genre: 'indian' },
  { id: 'in3',  name: 'Tabla Solo — Teentaal',          artist: 'Percussion India',  url: 'https://archive.org/download/IndianClassicalTabla/tabla_teentaal.mp3', license: 'PD',    source: 'Archive.org', duration: '4:45', genre: 'indian' },
  { id: 'in4',  name: 'Carnatic Violin',                artist: 'South Indian Music',url: 'https://archive.org/download/CarnatiCViolin/violin_carnatic.mp3',      license: 'PD',    source: 'Archive.org', duration: '6:00', genre: 'indian' },

  // Bollywood-style Free Tracks (Creative Commons / Free License)
  { id: 'bl1',  name: 'Bollywood Beat',           artist: 'FilmScore India',   url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',  license: 'Free', source: 'SoundHelix', duration: '5:49', genre: 'bollywood' },
  { id: 'bl2',  name: 'Desi Groove',              artist: 'IndieBeats',        url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',  license: 'Free', source: 'SoundHelix', duration: '4:17', genre: 'bollywood' },
  { id: 'bl3',  name: 'Fusion Rhythm',            artist: 'World Fusion',      url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',  license: 'Free', source: 'SoundHelix', duration: '3:55', genre: 'hindi' },
  { id: 'bl4',  name: 'Mystic India',             artist: 'AmbientAsia',       url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',  license: 'Free', source: 'SoundHelix', duration: '6:04', genre: 'hindi' },
  { id: 'bl5',  name: 'Punjabi Dhol',             artist: 'BhangraKing',       url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',  license: 'Free', source: 'SoundHelix', duration: '4:33', genre: 'punjabi' },
];

// ══════════════════════════════════════════════════════════════════
//  DATA FETCHING
// ══════════════════════════════════════════════════════════════════

async function loadTracks(genre = 'all', query = '') {
  currentGenre = genre;
  showLoading();

  const isIndian = ['bollywood', 'hindi', 'indian', 'punjabi', 'devotional', 'folk', 'classical'].includes(genre);

  if (isIndian || query) {
    // Try JioSaavn for Indian/search queries
    const saavnResult = await tryJioSaavn(genre, query);
    if (saavnResult && saavnResult.length > 0) {
      tracks = saavnResult;
      updateTracksCount(`${tracks.length} tracks from JioSaavn`);
      renderTracks();
      return;
    }
  }

  if (!isIndian) {
    // Try Jamendo for international music
    const jamendoResult = await tryJamendo(genre, query);
    if (jamendoResult && jamendoResult.length > 0) {
      tracks = jamendoResult;
      updateTracksCount(`${tracks.length} free tracks from Jamendo`);
      renderTracks();
      return;
    }
  }

  // Fallback: use built-in curated tracks
  useFallback(genre, query);
}

async function tryJamendo(genre, query) {
  try {
    const tagMap = { jazz: 'jazz', electronic: 'electronic', rock: 'rock', classical: 'classical', pop: 'pop', all: '' };
    const tag = tagMap[genre] || genre;

    let url = `https://api.jamendo.com/v3.0/tracks/?client_id=${JAMENDO_CLIENT_ID}&format=json&limit=40&include=musicinfo&audioformat=mp32&order=popularity_total`;
    if (tag) url += `&tags=${tag}`;
    if (query) url += `&search=${encodeURIComponent(query)}`;

    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();

    if (!data.results || data.results.length === 0) return null;

    return data.results.map(t => ({
      id:       `jam_${t.id}`,
      name:     t.name,
      artist:   t.artist_name,
      album:    t.album_name || '',
      url:      t.audio,
      license:  'CC',
      source:   'Jamendo',
      duration: formatDur(t.duration),
    }));
  } catch (err) {
    console.warn('Jamendo fetch failed:', err.message);
    return null;
  }
}

async function tryJioSaavn(genre, query) {
  try {
    const searchTerm = query || genreToSaavnQuery(genre);
    const url = `${SAAVN_BASE}/search/songs?query=${encodeURIComponent(searchTerm)}&page=1&limit=30`;

    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();

    if (!data.data || !data.data.results || data.data.results.length === 0) return null;

    return data.data.results
      .filter(t => t.downloadUrl && t.downloadUrl.length > 0)
      .map(t => {
        // Pick highest quality available
        const urls = t.downloadUrl || [];
        const best = urls.find(u => u.quality === '320kbps') ||
                     urls.find(u => u.quality === '160kbps') ||
                     urls[urls.length - 1];
        return {
          id:       `saavn_${t.id}`,
          name:     t.name,
          artist:   t.artists?.primary?.map(a => a.name).join(', ') || t.primaryArtists || 'Unknown',
          album:    t.album?.name || '',
          url:      best?.url || '',
          license:  'Free Stream',
          source:   'JioSaavn',
          duration: formatDur(t.duration),
          image:    t.image?.[2]?.url || t.image?.[0]?.url || '',
        };
      })
      .filter(t => t.url);
  } catch (err) {
    console.warn('JioSaavn fetch failed:', err.message);
    return null;
  }
}

function genreToSaavnQuery(genre) {
  const map = {
    bollywood:  'latest bollywood hits 2024',
    hindi:      'hindi songs',
    indian:     'popular indian songs',
    punjabi:    'punjabi bhangra songs',
    devotional: 'indian devotional bhajans',
    folk:       'indian folk music',
    classical:  'indian classical ragas',
    all:        'top hindi songs 2024',
  };
  return map[genre] || genre;
}

function useFallback(genre, query) {
  let filtered = FALLBACK_TRACKS;

  if (genre && genre !== 'all') {
    filtered = filtered.filter(t => t.genre === genre || t.genre === 'indian');
  }

  if (query) {
    const q = query.toLowerCase();
    filtered = FALLBACK_TRACKS.filter(t =>
      t.name.toLowerCase().includes(q) ||
      t.artist.toLowerCase().includes(q)
    );
  }

  tracks = filtered.length > 0 ? filtered : FALLBACK_TRACKS;
  updateTracksCount(`${tracks.length} curated free tracks`);
  renderTracks();
}

// ══════════════════════════════════════════════════════════════════
//  RENDERING
// ══════════════════════════════════════════════════════════════════

function showLoading() {
  document.getElementById('trackList').innerHTML = `
    <div class="loading-state">
      <div class="loading-spinner"></div>
      <div>Loading music...</div>
    </div>`;
  document.getElementById('tracksCount').textContent = 'Loading...';
}

function updateTracksCount(text) {
  document.getElementById('tracksCount').textContent = text;
}

function renderTracks() {
  if (!tracks.length) {
    document.getElementById('trackList').innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🎵</div>
        <div>No tracks found. Try a different search.</div>
      </div>`;
    return;
  }

  const isFav = id => favorites.includes(id);

  const rows = tracks.map((t, i) => {
    const licenseClass = t.license === 'CC' || t.license === 'CC BY' ? 'cc' :
                         t.license === 'PD' ? 'pd' : 'free';
    const isActive = i === currentIndex;
    return `
      <div class="track-row ${isActive ? 'playing' : ''}" onclick="playTrack(${i})">
        <div class="track-num">${isActive && isPlaying ? '▶' : i + 1}</div>
        <div class="track-info">
          <div class="track-name">${escHtml(t.name)}</div>
          <div class="track-artist">${escHtml(t.artist)}</div>
        </div>
        <div class="track-source">${escHtml(t.source || '')}</div>
        <div class="track-license ${licenseClass}">${escHtml(t.license)}</div>
        <div class="track-dur">${t.duration || '–'}</div>
      </div>`;
  }).join('');

  document.getElementById('trackList').innerHTML = `<div class="tracks-grid">${rows}</div>`;
}

// ══════════════════════════════════════════════════════════════════
//  PLAYBACK
// ══════════════════════════════════════════════════════════════════

function playTrack(index) {
  if (index < 0 || index >= tracks.length) return;
  currentIndex = index;
  const track = tracks[index];

  audio.src = track.url;
  audio.volume = isMuted ? 0 : (document.getElementById('volSlider').value / 100);

  audio.play()
    .then(() => {
      isPlaying = true;
      updatePlayerUI();
      addToRecent(track);
    })
    .catch(err => {
      console.warn('Playback error:', err.message, '— skipping to next');
      isPlaying = false;
      updatePlayerUI();
      // Auto-skip if error (e.g. CORS)
      if (index < tracks.length - 1) {
        setTimeout(() => playTrack(index + 1), 500);
      }
    });
}

function togglePlay() {
  if (tracks.length === 0) return;
  if (currentIndex === -1) { playTrack(0); return; }

  if (isPlaying) {
    audio.pause();
    isPlaying = false;
  } else {
    audio.play().then(() => { isPlaying = true; }).catch(() => {});
    isPlaying = true;
  }
  updatePlayerUI();
}

function prevTrack() {
  if (audio.currentTime > 3) { audio.currentTime = 0; return; }
  const prev = currentIndex > 0 ? currentIndex - 1 : tracks.length - 1;
  playTrack(prev);
}

function nextTrack() {
  if (isShuffle) {
    let rand;
    do { rand = Math.floor(Math.random() * tracks.length); }
    while (rand === currentIndex && tracks.length > 1);
    playTrack(rand);
    return;
  }
  const next = currentIndex < tracks.length - 1 ? currentIndex + 1 : 0;
  playTrack(next);
}

function toggleShuffle() {
  isShuffle = !isShuffle;
  document.getElementById('shuffleBtn').classList.toggle('active', isShuffle);
}

function toggleRepeat() {
  isRepeat = !isRepeat;
  document.getElementById('repeatBtn').classList.toggle('active', isRepeat);
}

function toggleMute() {
  isMuted = !isMuted;
  audio.volume = isMuted ? 0 : (document.getElementById('volSlider').value / 100);
  document.getElementById('volIcon').textContent = isMuted ? '🔇' : '🔊';
}

function toggleFavorite() {
  if (currentIndex === -1) return;
  const id = tracks[currentIndex].id;
  const idx = favorites.indexOf(id);
  if (idx === -1) {
    favorites.push(id);
    document.getElementById('heartBtn').textContent = '❤️';
  } else {
    favorites.splice(idx, 1);
    document.getElementById('heartBtn').textContent = '🤍';
  }
  localStorage.setItem('soniq_favorites', JSON.stringify(favorites));
}

function addToRecent(track) {
  recentlyPlayed = recentlyPlayed.filter(r => r.id !== track.id);
  recentlyPlayed.unshift({ id: track.id, name: track.name, artist: track.artist });
  if (recentlyPlayed.length > 50) recentlyPlayed.pop();
  localStorage.setItem('soniq_recent', JSON.stringify(recentlyPlayed));
}

// ══════════════════════════════════════════════════════════════════
//  UI UPDATES
// ══════════════════════════════════════════════════════════════════

function updatePlayerUI() {
  const track = currentIndex >= 0 ? tracks[currentIndex] : null;

  // Play/pause button
  document.getElementById('playBtn').textContent = isPlaying ? '⏸' : '▶';

  // Vinyl spin
  const vinyl = document.getElementById('vinyl');
  vinyl.className = 'vinyl-anim' + (isPlaying ? ' spinning' : '');

  // Wave animation in header
  document.getElementById('waveVisual').className = 'wave-visual' + (isPlaying ? '' : ' paused');

  // Now playing info
  if (track) {
    document.getElementById('nowTitle').textContent = track.name;
    document.getElementById('nowArtist').textContent = track.artist;
    document.getElementById('heartBtn').textContent = favorites.includes(track.id) ? '❤️' : '🤍';
    document.getElementById('qualityBadge').textContent = track.source === 'JioSaavn' ? '320K' : 'MP3';
    document.title = `${track.name} — SONIQ`;
  }

  // Re-render track list to update highlighted row
  renderTracks();
}

// ══════════════════════════════════════════════════════════════════
//  AUDIO EVENTS
// ══════════════════════════════════════════════════════════════════

audio.addEventListener('timeupdate', () => {
  if (!audio.duration || isNaN(audio.duration)) return;
  const pct = (audio.currentTime / audio.duration) * 100;

  document.getElementById('progressFill').style.width = pct + '%';
  document.getElementById('progressThumb').style.left = pct + '%';
  document.getElementById('currentTime').textContent = formatDur(audio.currentTime);
  if (audio.duration) {
    document.getElementById('totalTime').textContent = formatDur(audio.duration);
  }
});

audio.addEventListener('ended', () => {
  if (isRepeat) { audio.play(); return; }
  nextTrack();
});

audio.addEventListener('error', () => {
  console.warn('Audio error — skipping');
  if (currentIndex < tracks.length - 1) {
    setTimeout(() => playTrack(currentIndex + 1), 600);
  }
});

// Volume slider
document.getElementById('volSlider').addEventListener('input', e => {
  if (isMuted) { isMuted = false; document.getElementById('volIcon').textContent = '🔊'; }
  audio.volume = e.target.value / 100;
});

// Progress bar click to seek
document.getElementById('progressTrack').addEventListener('click', e => {
  if (!audio.duration || isNaN(audio.duration)) return;
  const rect = e.currentTarget.getBoundingClientRect();
  const pct = (e.clientX - rect.left) / rect.width;
  audio.currentTime = pct * audio.duration;
});

// ══════════════════════════════════════════════════════════════════
//  GENRE TABS
// ══════════════════════════════════════════════════════════════════

document.querySelectorAll('.genre-tab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.genre-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const genre = btn.dataset.genre;
    const titleMap = {
      all: 'Discover Free Music',
      bollywood: '🎬 Bollywood Hits',
      hindi: '🎵 Hindi Songs',
      indian: '🇮🇳 Indian Music',
      jazz: 'Jazz & Blues',
      electronic: 'Electronic',
      rock: 'Rock',
      classical: 'Classical'
    };
    document.getElementById('contentTitle').textContent = titleMap[genre] || genre;
    loadTracks(genre, document.getElementById('searchInput').value);
  });
});

// ══════════════════════════════════════════════════════════════════
//  SIDEBAR NAV
// ══════════════════════════════════════════════════════════════════

document.getElementById('nav-discover').addEventListener('click', () => {
  document.getElementById('contentTitle').textContent = 'Discover Free Music';
  loadTracks('all', '');
  setActiveNav('nav-discover');
});

document.getElementById('nav-indian').addEventListener('click', () => {
  document.getElementById('contentTitle').textContent = '🇮🇳 Indian Music';
  loadTracks('indian', 'hindi songs');
  setActiveNav('nav-indian');
});

document.getElementById('nav-favorites').addEventListener('click', () => {
  document.getElementById('contentTitle').textContent = '❤️ Favorites';
  // Show only favorited tracks
  const favTracks = FALLBACK_TRACKS.filter(t => favorites.includes(t.id));
  tracks = favTracks;
  if (tracks.length === 0) {
    document.getElementById('trackList').innerHTML = '<div class="empty-state"><div class="empty-icon">🤍</div><div>No favorites yet. Click ♡ while playing a track.</div></div>';
    document.getElementById('tracksCount').textContent = '0 favorites';
  } else {
    document.getElementById('tracksCount').textContent = `${tracks.length} favorites`;
    renderTracks();
  }
  setActiveNav('nav-favorites');
});

document.getElementById('nav-recent').addEventListener('click', () => {
  document.getElementById('contentTitle').textContent = '🕐 Recently Played';
  // Show recently played
  const recentIds = recentlyPlayed.map(r => r.id);
  tracks = FALLBACK_TRACKS.filter(t => recentIds.includes(t.id));
  if (tracks.length === 0) {
    document.getElementById('trackList').innerHTML = '<div class="empty-state"><div class="empty-icon">🕐</div><div>Nothing played yet. Start listening!</div></div>';
    document.getElementById('tracksCount').textContent = '0 tracks';
  } else {
    document.getElementById('tracksCount').textContent = `${tracks.length} recently played`;
    renderTracks();
  }
  setActiveNav('nav-recent');
});

document.querySelectorAll('[data-indian-genre]').forEach(el => {
  el.addEventListener('click', () => {
    const genre = el.dataset.indianGenre;
    document.getElementById('contentTitle').textContent = el.textContent.trim();
    loadTracks(genre, '');
    setActiveNav(null);
  });
});

function setActiveNav(id) {
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  if (id) document.getElementById(id)?.classList.add('active');
}

// ══════════════════════════════════════════════════════════════════
//  SEARCH
// ══════════════════════════════════════════════════════════════════

document.getElementById('searchInput').addEventListener('input', e => {
  clearTimeout(searchTimer);
  const q = e.target.value.trim();
  searchTimer = setTimeout(() => {
    if (q.length > 0) {
      document.getElementById('contentTitle').textContent = `Results for "${q}"`;
    }
    loadTracks(currentGenre, q);
  }, 600);
});

// ══════════════════════════════════════════════════════════════════
//  KEYBOARD SHORTCUTS
// ══════════════════════════════════════════════════════════════════

document.addEventListener('keydown', e => {
  // Don't fire if typing in search
  if (document.activeElement === document.getElementById('searchInput')) return;

  if (e.code === 'Space') { e.preventDefault(); togglePlay(); }
  if (e.code === 'ArrowRight' && e.altKey) nextTrack();
  if (e.code === 'ArrowLeft'  && e.altKey) prevTrack();
  if (e.code === 'KeyM') toggleMute();
  if (e.code === 'KeyS') toggleShuffle();
  if (e.code === 'KeyR') toggleRepeat();
});

// ══════════════════════════════════════════════════════════════════
//  UTILITIES
// ══════════════════════════════════════════════════════════════════

function formatDur(sec) {
  if (!sec || isNaN(sec)) return '–';
  const s = Math.floor(sec);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, '0')}`;
}

function escHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ══════════════════════════════════════════════════════════════════
//  INIT
// ══════════════════════════════════════════════════════════════════

loadTracks('all', '');
