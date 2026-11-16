const startDate = new Date(2026, 5, 20); // 20 июня 2026, локальное время
const cover = document.getElementById('cover');
const album = document.getElementById('album');
const openButton = document.getElementById('openAlbum');
const soundToggle = document.getElementById('soundToggle');
const overlay = document.getElementById('noteOverlay');
const noteText = document.getElementById('noteText');

function declensionDays(n) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return 'день вместе';
  if ([2, 3, 4].includes(mod10) && ![12, 13, 14].includes(mod100)) return 'дня вместе';
  return 'дней вместе';
}

function updateCounter() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
  const days = Math.max(0, Math.floor((today - start) / 86400000));
  document.getElementById('daysTogether').textContent = days;
  document.getElementById('daysLabel').textContent = declensionDays(days);
}
updateCounter();

// Фоновая музыка: запускается после нажатия «Открыть».
const bgMusic = new Audio('assets/spring-flowers.mp3');
bgMusic.loop = true;
bgMusic.preload = 'auto';
bgMusic.volume = 0;

let musicStarted = false;
let muted = false;
let fadeTimer;
const TARGET_VOLUME = 0.18;

function fadeMusicTo(target, duration = 900) {
  clearInterval(fadeTimer);
  const from = bgMusic.volume;
  const steps = 18;
  const stepMs = Math.max(20, Math.floor(duration / steps));
  let step = 0;

  fadeTimer = setInterval(() => {
    step += 1;
    const next = from + (target - from) * (step / steps);
    bgMusic.volume = Math.min(1, Math.max(0, next));
    if (step >= steps) clearInterval(fadeTimer);
  }, stepMs);
}

async function startMusic() {
  if (!musicStarted) {
    try {
      await bgMusic.play();
      musicStarted = true;
      fadeMusicTo(muted ? 0 : TARGET_VOLUME, 1200);
    } catch (error) {
      console.warn('Браузер не разрешил запустить музыку:', error);
    }
  } else if (bgMusic.paused) {
    await bgMusic.play();
  }
}

function setMuted(value) {
  muted = value;
  fadeMusicTo(muted ? 0 : TARGET_VOLUME, 250);
  soundToggle.classList.toggle('muted', muted);
  soundToggle.setAttribute('aria-label', muted ? 'Включить музыку' : 'Выключить музыку');
}

openButton.addEventListener('click', async () => {
  await startMusic();
  cover.classList.add('is-open');
  album.classList.add('visible');
  album.setAttribute('aria-hidden', 'false');
  soundToggle.classList.add('visible');
  document.body.classList.remove('locked');
  setTimeout(() => document.querySelector('.intro')?.classList.add('in-view'), 300);
});

soundToggle.addEventListener('click', async () => {
  if (!musicStarted) await startMusic();
  setMuted(!muted);
});

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) entry.target.classList.add('in-view');
  });
}, { threshold: 0.14, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

const notes = {
  'first-note': 'Забавно смотреть на это фото и знать, чем всё в итоге закончилось ❤️',
  'effort-note': 'Если ты это нашла — да, я действительно заморочился.',
  'dont-note': 'Ну конечно ты нажала.\n\nЛюблю тебя, любопытная бестия ❤️',
  'beast-note': 'Ладно, очень красивая красноволосая бестия.'
};

function showNote(text) {
  noteText.textContent = text;
  overlay.hidden = false;
  document.body.style.overflow = 'hidden';
}
function closeNote() {
  overlay.hidden = true;
  document.body.style.overflow = '';
}

document.querySelectorAll('[data-note]').forEach(card => {
  const button = card.querySelector('.secret');
  const key = card.dataset.note;
  if (button && notes[key]) button.addEventListener('click', () => showNote(notes[key]));
});

overlay.querySelector('.note-close').addEventListener('click', closeNote);
overlay.querySelector('.note-overlay__backdrop').addEventListener('click', closeNote);
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !overlay.hidden) closeNote(); });

let beastClicks = 0;
let beastTimer;
document.getElementById('beastTitle').addEventListener('click', () => {
  beastClicks += 1;
  clearTimeout(beastTimer);
  if (beastClicks >= 4) {
    beastClicks = 0;
    showNote(notes['beast-note']);
    return;
  }
  beastTimer = setTimeout(() => { beastClicks = 0; }, 1800);
});
