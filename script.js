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

// Тихий генеративный ambient без внешнего аудиофайла.
let audioCtx;
let masterGain;
let nodes = [];
let musicStarted = false;
let muted = false;

function createAmbient() {
  if (musicStarted) return;
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  masterGain = audioCtx.createGain();
  masterGain.gain.value = 0.035;
  masterGain.connect(audioCtx.destination);

  const filter = audioCtx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 900;
  filter.Q.value = 0.6;
  filter.connect(masterGain);

  [146.83, 220, 293.66].forEach((freq, index) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = index === 1 ? 'triangle' : 'sine';
    osc.frequency.value = freq;
    gain.gain.value = index === 1 ? 0.12 : 0.08;
    osc.connect(gain).connect(filter);
    osc.start();
    nodes.push(osc, gain);
  });

  const lfo = audioCtx.createOscillator();
  const lfoGain = audioCtx.createGain();
  lfo.frequency.value = 0.08;
  lfoGain.gain.value = 0.015;
  lfo.connect(lfoGain).connect(masterGain.gain);
  lfo.start();
  nodes.push(lfo, lfoGain, filter);
  musicStarted = true;
}

function setMuted(value) {
  muted = value;
  if (masterGain && audioCtx) {
    masterGain.gain.cancelScheduledValues(audioCtx.currentTime);
    masterGain.gain.linearRampToValueAtTime(muted ? 0 : 0.035, audioCtx.currentTime + 0.25);
  }
  soundToggle.classList.toggle('muted', muted);
  soundToggle.setAttribute('aria-label', muted ? 'Включить музыку' : 'Выключить музыку');
}

openButton.addEventListener('click', async () => {
  createAmbient();
  if (audioCtx?.state === 'suspended') await audioCtx.resume();
  cover.classList.add('is-open');
  album.classList.add('visible');
  album.setAttribute('aria-hidden', 'false');
  soundToggle.classList.add('visible');
  document.body.classList.remove('locked');
  setTimeout(() => document.querySelector('.intro')?.classList.add('in-view'), 300);
});

soundToggle.addEventListener('click', async () => {
  if (!musicStarted) createAmbient();
  if (audioCtx?.state === 'suspended') await audioCtx.resume();
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
