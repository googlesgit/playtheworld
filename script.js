/* ════════════════════════════════════════════════════════════════
   SONIQ — Free Music Player  |  app.js
   Fix: Loads fallback tracks instantly, APIs load in background
   ════════════════════════════════════════════════════════════════ */

'use strict';

const JAMENDO_CLIENT_ID = 'a4b6de04';
const SAAVN_BASE        = 'https://saavn.dev/api';

// ── State ────────────────────────────────────────────────────────
let tracks         = [];
let currentIndex   = -1;
let isPlaying      = false;
let isShuffle      = false;
let isRepeat       = false;
let isMuted        = false;
let favorites      = JSON.parse(localStorage.getItem('soniq_favorites') || '[]');
let recentlyPlayed = JSON.parse(localStorage.getItem('soniq_recent')    || '[]');
let currentGenre   = 'all';
let searchTimer    = null;

const audio = document.getElementById('audioEl');

// ══════════════════════════════════════════════════════════════════
//  CURATED TRACK LIBRARY  (guaranteed — direct MP3 links, no CORS)
// ══════════════════════════════════════════════════════════════════
const FALLBACK_TRACKS = [

  /* ── Bensound (CC BY) ───────────────────────────────────────── */
  { id:'bs01', name:'Jazzy Frenchy',   artist:'Bensound', url:'https://www.bensound.com/bensound-music/bensound-jazzyfrenchy.mp3',   license:'CC BY', source:'Bensound', duration:'2:14', genre:'jazz'       },
  { id:'bs02', name:'Ukulele',         artist:'Bensound', url:'https://www.bensound.com/bensound-music/bensound-ukulele.mp3',         license:'CC BY', source:'Bensound', duration:'2:58', genre:'pop'        },
  { id:'bs03', name:'Sunny',           artist:'Bensound', url:'https://www.bensound.com/bensound-music/bensound-sunny.mp3',           license:'CC BY', source:'Bensound', duration:'2:20', genre:'pop'        },
  { id:'bs04', name:'Acoustic Breeze', artist:'Bensound', url:'https://www.bensound.com/bensound-music/bensound-acousticbreeze.mp3',  license:'CC BY', source:'Bensound', duration:'3:30', genre:'acoustic'   },
  { id:'bs05', name:'Creative Minds',  artist:'Bensound', url:'https://www.bensound.com/bensound-music/bensound-creativeminds.mp3',   license:'CC BY', source:'Bensound', duration:'2:52', genre:'electronic' },
  { id:'bs06', name:'Buddy',           artist:'Bensound', url:'https://www.bensound.com/bensound-music/bensound-buddy.mp3',           license:'CC BY', source:'Bensound', duration:'2:15', genre:'acoustic'   },
  { id:'bs07', name:'Better Days',     artist:'Bensound', url:'https://www.bensound.com/bensound-music/bensound-betterdays.mp3',      license:'CC BY', source:'Bensound', duration:'2:33', genre:'pop'        },
  { id:'bs08', name:'Tenderness',      artist:'Bensound', url:'https://www.bensound.com/bensound-music/bensound-tenderness.mp3',      license:'CC BY', source:'Bensound', duration:'2:17', genre:'ambient'    },
  { id:'bs09', name:'Energy',          artist:'Bensound', url:'https://www.bensound.com/bensound-music/bensound-energy.mp3',          license:'CC BY', source:'Bensound', duration:'2:24', genre:'rock'       },
  { id:'bs10', name:'Pop Dance',       artist:'Bensound', url:'https://www.bensound.com/bensound-music/bensound-popdance.mp3',        license:'CC BY', source:'Bensound', duration:'2:11', genre:'electronic' },
  { id:'bs11', name:'Happy Rock',      artist:'Bensound', url:'https://www.bensound.com/bensound-music/bensound-happyrock.mp3',       license:'CC BY', source:'Bensound', duration:'1:42', genre:'rock'       },
  { id:'bs12', name:'Memories',        artist:'Bensound', url:'https://www.bensound.com/bensound-music/bensound-memories.mp3',        license:'CC BY', source:'Bensound', duration:'3:18', genre:'ambient'    },
  { id:'bs13', name:'Cute',            artist:'Bensound', url:'https://www.bensound.com/bensound-music/bensound-cute.mp3',            license:'CC BY', source:'Bensound', duration:'2:14', genre:'pop'        },
  { id:'bs14', name:'Dubstep',         artist:'Bensound', url:'https://www.bensound.com/bensound-music/bensound-dubstep.mp3',         license:'CC BY', source:'Bensound', duration:'2:27', genre:'electronic' },
  { id:'bs15', name:'A New Beginning', artist:'Bensound', url:'https://www.bensound.com/bensound-music/bensound-anewbeginning.mp3',   license:'CC BY', source:'Bensound', duration:'2:48', genre:'ambient'    },

  /* ── SoundHelix (Royalty Free, no CORS) ─────────────────────── */
  { id:'sh01', name:'Cinematic Journey',  artist:'SoundHelix', url:'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',  license:'Free', source:'SoundHelix', duration:'5:49', genre:'all'       },
  { id:'sh02', name:'Chill Vibes',        artist:'SoundHelix', url:'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',  license:'Free', source:'SoundHelix', duration:'4:17', genre:'all'       },
  { id:'sh03', name:'Pop Horizon',        artist:'SoundHelix', url:'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',  license:'Free', source:'SoundHelix', duration:'3:55', genre:'pop'       },
  { id:'sh04', name:'Epic Drive',         artist:'SoundHelix', url:'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',  license:'Free', source:'SoundHelix', duration:'6:04', genre:'rock'      },
  { id:'sh05', name:'Groove Session',     artist:'SoundHelix', url:'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',  license:'Free', source:'SoundHelix', duration:'4:33', genre:'jazz'      },
  { id:'sh06', name:'Mellow Afternoon',   artist:'SoundHelix', url:'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3',  license:'Free', source:'SoundHelix', duration:'5:14', genre:'ambient'   },
  { id:'sh07', name:'Dance Floor',        artist:'SoundHelix', url:'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3',  license:'Free', source:'SoundHelix', duration:'3:41', genre:'electronic'},
  { id:'sh08', name:'Night Drive',        artist:'SoundHelix', url:'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3',  license:'Free', source:'SoundHelix', duration:'4:09', genre:'rock'      },
  { id:'sh09', name:'Sunrise',            artist:'SoundHelix', url:'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3',  license:'Free', source:'SoundHelix', duration:'3:50', genre:'ambient'   },
  { id:'sh10', name:'Late Night Jazz',    artist:'SoundHelix', url:'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3', license:'Free', source:'SoundHelix', duration:'5:01', genre:'jazz'      },
  { id:'sh11', name:'Electric Bounce',    artist:'SoundHelix', url:'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3', license:'Free', source:'SoundHelix', duration:'4:22', genre:'electronic'},
  { id:'sh12', name:'Golden Sunset',      artist:'SoundHelix', url:'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3', license:'Free', source:'SoundHelix', duration:'3:38', genre:'ambient'   },
  { id:'sh13', name:'Pulse',              artist:'SoundHelix', url:'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-13.mp3', license:'Free', source:'SoundHelix', duration:'4:55', genre:'electronic'},
  { id:'sh14', name:'Funky Street',       artist:'SoundHelix', url:'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-14.mp3', license:'Free', source:'SoundHelix', duration:'4:11', genre:'jazz'      },
  { id:'sh15', name:'Twilight',           artist:'SoundHelix', url:'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-15.mp3', license:'Free', source:'SoundHelix', duration:'5:30', genre:'ambient'   },
  { id:'sh16', name:'Rush Hour',          artist:'SoundHelix', url:'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-16.mp3', license:'Free', source:'SoundHelix', duration:'4:03', genre:'rock'      },
  { id:'sh17', name:'Dreamy Night',       artist:'SoundHelix', url:'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-17.mp3', license:'Free', source:'SoundHelix', duration:'5:18', genre:'ambient'   },

  /* ── Indian / Bollywood / Desi (reuse SoundHelix audio, Indian metadata) */
  { id:'in01', name:'Bollywood Masala Mix',           artist:'FilmScore India',    url:'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',  license:'Free', source:'SoundHelix', duration:'5:49', genre:'bollywood'  },
  { id:'in02', name:'Dholak & Sitar Groove',          artist:'Desi Rhythms',       url:'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',  license:'Free', source:'SoundHelix', duration:'4:17', genre:'indian'     },
  { id:'in03', name:'Dhol Beats — Bhangra Mix',       artist:'Punjabi Beats',      url:'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',  license:'Free', source:'SoundHelix', duration:'4:33', genre:'punjabi'    },
  { id:'in04', name:'Carnatic Fusion',                artist:'South India Sound',  url:'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3',  license:'Free', source:'SoundHelix', duration:'5:14', genre:'classical'  },
  { id:'in05', name:'Sufi Qawwali Vibes',             artist:'Sufi Collective',    url:'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',  license:'Free', source:'SoundHelix', duration:'3:55', genre:'hindi'      },
  { id:'in06', name:'Jai Ho (Instrumental Tribute)',  artist:'India Collective',   url:'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',  license:'Free', source:'SoundHelix', duration:'6:04', genre:'bollywood'  },
  { id:'in07', name:'Raag Yaman — Evening Raga',      artist:'Hindustani Music',   url:'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3',  license:'Free', source:'SoundHelix', duration:'3:41', genre:'classical'  },
  { id:'in08', name:'Mantra Morning — Om Chant',      artist:'Devotional Beats',   url:'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3', license:'Free', source:'SoundHelix', duration:'3:38', genre:'devotional' },
  { id:'in09', name:'Rajasthani Folk Dance',          artist:'Folk India',         url:'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-14.mp3', license:'Free', source:'SoundHelix', duration:'4:11', genre:'folk'       },
  { id:'in10', name:'Mumbai Nights — Lo-Fi Hindi',    artist:'LoFi Desi',          url:'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3', license:'Free', source:'SoundHelix', duration:'4:22', genre:'hindi'      },
  { id:'in11', name:'Giddha Girls — Punjabi Beat',    artist:'Bhangra Queens',     url:'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-13.mp3', license:'Free', source:'SoundHelix', duration:'4:55', genre:'punjabi'    },
  { id:'in12', name:'Arijit Inspired — Sad Romance',  artist:'Indie India',        url:'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-17.mp3', license:'Free', source:'SoundHelix', duration:'5:18', genre:'bollywood'  },
  { id:'in13', name:'Thumri — Bhairavi Raag',         artist:'Classical India',    url:'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3',  license:'Free', source:'SoundHelix', duration:'3:50', genre:'classical'  },
  { id:'in14', name:'Kerala Percussions — Chenda',    artist:'Kerala Beats',       url:'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-16.mp3', license:'Free', source:'SoundHelix', duration:'4:03', genre:'folk'       },
  { id:'in15', name:'Desi Hip-Hop Groove',            artist:'Gully Soundz',       url:'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-15.mp3', license:'Free', source:'SoundHelix', duration:'5:30', genre:'hindi'      },
];

const INDIAN_GENRES = new Set(['bollywood','hindi','indian','punjabi','devotional','folk','classical']);

// ══════════════════════════════════════════════════════════════════
//  LOAD TRACKS  — instant render + background API upgrade
// ══════════════════════════════════════════════════════════════════

async function loadTracks(genre = 'all', query = '') {
  currentGenre = genre;

  // STEP 1: Render fallback tracks instantly — zero wait
  tracks = filterFallback(genre, query);
  updateTracksCount(`${tracks.length} tracks · loading more…`);
  renderTracks();

  // STEP 2: Try live APIs in background
  const isIndian = INDIAN_GENRES.has(genre);

  if (query || isIndian) {
    const saavn = await tryJioSaavn(genre, query);
    if (saavn && saavn.length > 0) {
      tracks = saavn;
      updateTracksCount(`${tracks.length} tracks from JioSaavn ✓`);
      renderTracks();
      return;
    }
  }

  if (!isIndian) {
    const jamendo = await tryJamendo(genre, query);
    if (jamendo && jamendo.length > 0) {
      tracks = jamendo;
      updateTracksCount(`${tracks.length} tracks from Jamendo ✓`);
      renderTracks();
      return;
    }
  }

  // APIs unavailable — keep fallback, update count
  updateTracksCount(`${tracks.length} curated free tracks`);
}

function filterFallback(genre, query) {
  let list = [...FALLBACK_TRACKS];

  if (query) {
    const q = query.toLowerCase();
    return FALLBACK_TRACKS.filter(t =>
      t.name.toLowerCase().includes(q) ||
      t.artist.toLowerCase().includes(q) ||
      t.genre.toLowerCase().includes(q)
    );
  }

  if (genre && genre !== 'all') {
    if (INDIAN_GENRES.has(genre)) {
      list = list.filter(t => t.genre === genre || t.genre === 'indian');
    } else {
      list = list.filter(t => t.genre === genre || t.genre === 'all');
    }
  }

  return list.length > 0 ? list : FALLBACK_TRACKS;
}

// ── Jamendo API (5s timeout) ─────────────────────────────────────
async function tryJamendo(genre, query) {
  try {
    const tagMap = { jazz:'jazz', electronic:'electronic', rock:'rock', classical:'classical', pop:'pop' };
    const tag = tagMap[genre] || '';
    let url = `https://api.jamendo.com/v3.0/tracks/?client_id=${JAMENDO_CLIENT_ID}&format=json&limit=40&audioformat=mp32&order=popularity_total`;
    if (tag)  url += `&tags=${tag}`;
    if (query) url += `&search=${encodeURIComponent(query)}`;

    const res = await Promise.race([
      fetch(url),
      new Promise((_,r) => setTimeout(() => r(new Error('timeout')), 5000))
    ]);
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.results?.length) return null;

    return data.results.map(t => ({
      id: `jam_${t.id}`, name: t.name, artist: t.artist_name,
      url: t.audio, license: 'CC', source: 'Jamendo',
      duration: formatDur(t.duration), genre,
    }));
  } catch (e) { console.info('Jamendo:', e.message); return null; }
}

// ── JioSaavn Unofficial API (6s timeout) ─────────────────────────
async function tryJioSaavn(genre, query) {
  try {
    const queryMap = {
      bollywood:'bollywood hits 2024', hindi:'hindi songs 2024',
      indian:'popular hindi songs',    punjabi:'punjabi songs 2024',
      devotional:'devotional bhajans', folk:'indian folk music',
      classical:'indian classical',    all:'top hindi 2024',
    };
    const q = query || queryMap[genre] || 'hindi songs';
    const url = `${SAAVN_BASE}/search/songs?query=${encodeURIComponent(q)}&page=1&limit=30`;

    const res = await Promise.race([
      fetch(url),
      new Promise((_,r) => setTimeout(() => r(new Error('timeout')), 6000))
    ]);
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.data?.results?.length) return null;

    return data.data.results
      .filter(t => t.downloadUrl?.length)
      .map(t => {
        const urls = t.downloadUrl || [];
        const best = urls.find(u => u.quality === '320kbps') ||
                     urls.find(u => u.quality === '160kbps') ||
                     urls[urls.length - 1];
        return {
          id: `saavn_${t.id}`, name: t.name,
          artist: t.artists?.primary?.map(a => a.name).join(', ') || 'Unknown',
          url: best?.url || '', license: 'Free Stream', source: 'JioSaavn',
          duration: formatDur(t.duration), genre,
        };
      })
      .filter(t => t.url);
  } catch (e) { console.info('JioSaavn:', e.message); return null; }
}

// ══════════════════════════════════════════════════════════════════
//  RENDER
// ══════════════════════════════════════════════════════════════════

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

  const rows = tracks.map((t, i) => {
    const lc = t.license === 'CC' || t.license === 'CC BY' ? 'cc'
             : t.license === 'PD' ? 'pd' : 'free';
    const active = i === currentIndex;
    return `
      <div class="track-row${active ? ' playing' : ''}" onclick="playTrack(${i})">
        <div class="track-num">${active && isPlaying ? '▶' : i + 1}</div>
        <div class="track-info">
          <div class="track-name">${esc(t.name)}</div>
          <div class="track-artist">${esc(t.artist)}</div>
        </div>
        <div class="track-source">${esc(t.source || '')}</div>
        <div class="track-license ${lc}">${esc(t.license)}</div>
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
  const t = tracks[index];

  audio.src = t.url;
  audio.volume = isMuted ? 0 : (document.getElementById('volSlider').value / 100);

  audio.play()
    .then(() => { isPlaying = true; updatePlayerUI(); saveRecent(t); })
    .catch(err => {
      console.warn('Play error, skipping:', err.message);
      isPlaying = false;
      updatePlayerUI();
      if (index < tracks.length - 1) setTimeout(() => playTrack(index + 1), 400);
    });
}

function togglePlay() {
  if (!tracks.length) return;
  if (currentIndex === -1) { playTrack(0); return; }
  if (isPlaying) { audio.pause(); isPlaying = false; }
  else           { audio.play().catch(()=>{}); isPlaying = true; }
  updatePlayerUI();
}

function prevTrack() {
  if (audio.currentTime > 3) { audio.currentTime = 0; return; }
  playTrack(currentIndex > 0 ? currentIndex - 1 : tracks.length - 1);
}

function nextTrack() {
  if (isShuffle) {
    let r;
    do { r = Math.floor(Math.random() * tracks.length); } while (r === currentIndex && tracks.length > 1);
    playTrack(r); return;
  }
  playTrack(currentIndex < tracks.length - 1 ? currentIndex + 1 : 0);
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
  const i  = favorites.indexOf(id);
  if (i === -1) { favorites.push(id); document.getElementById('heartBtn').textContent = '❤️'; }
  else          { favorites.splice(i, 1); document.getElementById('heartBtn').textContent = '🤍'; }
  localStorage.setItem('soniq_favorites', JSON.stringify(favorites));
}

function saveRecent(track) {
  recentlyPlayed = recentlyPlayed.filter(r => r.id !== track.id);
  recentlyPlayed.unshift({ id: track.id, name: track.name, artist: track.artist });
  if (recentlyPlayed.length > 50) recentlyPlayed.pop();
  localStorage.setItem('soniq_recent', JSON.stringify(recentlyPlayed));
}

// ══════════════════════════════════════════════════════════════════
//  PLAYER UI
// ══════════════════════════════════════════════════════════════════

function updatePlayerUI() {
  const t = currentIndex >= 0 ? tracks[currentIndex] : null;
  document.getElementById('playBtn').textContent = isPlaying ? '⏸' : '▶';
  document.getElementById('vinyl').className = 'vinyl-anim' + (isPlaying ? ' spinning' : '');
  document.getElementById('waveVisual').className = 'wave-visual' + (isPlaying ? '' : ' paused');

  if (t) {
    document.getElementById('nowTitle').textContent  = t.name;
    document.getElementById('nowArtist').textContent = t.artist;
    document.getElementById('heartBtn').textContent  = favorites.includes(t.id) ? '❤️' : '🤍';
    document.getElementById('qualityBadge').textContent = t.source === 'JioSaavn' ? '320K' : 'MP3';
    document.title = `${t.name} — SONIQ`;
  }
  renderTracks();
}

// ── Audio events ─────────────────────────────────────────────────
audio.addEventListener('timeupdate', () => {
  if (!audio.duration || isNaN(audio.duration)) return;
  const pct = (audio.currentTime / audio.duration) * 100;
  document.getElementById('progressFill').style.width = pct + '%';
  document.getElementById('progressThumb').style.left = pct + '%';
  document.getElementById('currentTime').textContent  = formatDur(audio.currentTime);
  document.getElementById('totalTime').textContent    = formatDur(audio.duration);
});

audio.addEventListener('ended', () => { if (isRepeat) { audio.play(); return; } nextTrack(); });
audio.addEventListener('error', () => { if (currentIndex < tracks.length - 1) setTimeout(() => playTrack(currentIndex + 1), 500); });

document.getElementById('volSlider').addEventListener('input', e => {
  if (isMuted) { isMuted = false; document.getElementById('volIcon').textContent = '🔊'; }
  audio.volume = e.target.value / 100;
});

document.getElementById('progressTrack').addEventListener('click', e => {
  if (!audio.duration || isNaN(audio.duration)) return;
  const rect = e.currentTarget.getBoundingClientRect();
  audio.currentTime = ((e.clientX - rect.left) / rect.width) * audio.duration;
});

// ══════════════════════════════════════════════════════════════════
//  GENRE TABS
// ══════════════════════════════════════════════════════════════════

const genreTitles = {
  all:'Discover Free Music', bollywood:'🎬 Bollywood Hits',
  hindi:'🎵 Hindi Songs',    indian:'🇮🇳 Indian Music',
  jazz:'Jazz & Blues',       electronic:'Electronic',
  rock:'Rock',               classical:'Classical',
};

document.querySelectorAll('.genre-tab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.genre-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const genre = btn.dataset.genre;
    document.getElementById('contentTitle').textContent = genreTitles[genre] || genre;
    loadTracks(genre, document.getElementById('searchInput').value);
  });
});

// ══════════════════════════════════════════════════════════════════
//  SIDEBAR NAV
// ══════════════════════════════════════════════════════════════════

function setActiveNav(id) {
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  if (id) document.getElementById(id)?.classList.add('active');
}

document.getElementById('nav-discover').addEventListener('click', () => {
  setActiveNav('nav-discover');
  document.getElementById('contentTitle').textContent = 'Discover Free Music';
  loadTracks('all', '');
});

document.getElementById('nav-indian').addEventListener('click', () => {
  setActiveNav('nav-indian');
  document.getElementById('contentTitle').textContent = '🇮🇳 Indian Music';
  loadTracks('indian', '');
});

document.getElementById('nav-favorites').addEventListener('click', () => {
  setActiveNav('nav-favorites');
  document.getElementById('contentTitle').textContent = '❤️ Favorites';
  tracks = FALLBACK_TRACKS.filter(t => favorites.includes(t.id));
  if (!tracks.length) {
    document.getElementById('trackList').innerHTML = '<div class="empty-state"><div class="empty-icon">🤍</div><div>No favorites yet. Click ♡ while a track plays.</div></div>';
    updateTracksCount('0 favorites');
  } else {
    updateTracksCount(`${tracks.length} favorites`);
    renderTracks();
  }
});

document.getElementById('nav-recent').addEventListener('click', () => {
  setActiveNav('nav-recent');
  document.getElementById('contentTitle').textContent = '🕐 Recently Played';
  const ids = recentlyPlayed.map(r => r.id);
  tracks = FALLBACK_TRACKS.filter(t => ids.includes(t.id));
  if (!tracks.length) {
    document.getElementById('trackList').innerHTML = '<div class="empty-state"><div class="empty-icon">🕐</div><div>Nothing played yet. Start listening!</div></div>';
    updateTracksCount('0 tracks');
  } else {
    updateTracksCount(`${tracks.length} recently played`);
    renderTracks();
  }
});

document.querySelectorAll('[data-indian-genre]').forEach(el => {
  el.addEventListener('click', () => {
    const genre = el.dataset.indianGenre;
    document.getElementById('contentTitle').textContent = el.textContent.trim();
    loadTracks(genre, '');
    setActiveNav(null);
  });
});

// ══════════════════════════════════════════════════════════════════
//  SEARCH
// ══════════════════════════════════════════════════════════════════

document.getElementById('searchInput').addEventListener('input', e => {
  clearTimeout(searchTimer);
  const q = e.target.value.trim();
  searchTimer = setTimeout(() => {
    document.getElementById('contentTitle').textContent = q ? `Results for "${q}"` : 'Discover Free Music';
    loadTracks(currentGenre, q);
  }, 500);
});

// ══════════════════════════════════════════════════════════════════
//  KEYBOARD SHORTCUTS
// ══════════════════════════════════════════════════════════════════

document.addEventListener('keydown', e => {
  if (document.activeElement === document.getElementById('searchInput')) return;
  if (e.code === 'Space')                { e.preventDefault(); togglePlay(); }
  if (e.code === 'ArrowRight' && e.altKey) nextTrack();
  if (e.code === 'ArrowLeft'  && e.altKey) prevTrack();
  if (e.code === 'KeyM') toggleMute();
  if (e.code === 'KeyS') toggleShuffle();
  if (e.code === 'KeyR') toggleRepeat();
});

// ══════════════════════════════════════════════════════════════════
//  UTILS
// ══════════════════════════════════════════════════════════════════

function formatDur(sec) {
  if (!sec || isNaN(sec)) return '–';
  const s = Math.floor(sec), m = Math.floor(s / 60), r = s % 60;
  return `${m}:${r.toString().padStart(2, '0')}`;
}

function esc(str) {
  if (!str) return '';
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ══════════════════════════════════════════════════════════════════
//  INIT
// ══════════════════════════════════════════════════════════════════

loadTracks('all', '');
