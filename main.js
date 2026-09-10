// relative time on the status box (only runs if the box exists)
(function () {
  const el = document.querySelector('.status .ago');
  if (el && el.dataset.date) {
    const then = new Date(el.dataset.date);
    const days = Math.floor((Date.now() - then) / 86400000);
    const weeks = Math.floor(days / 7);
    el.textContent = days < 1 ? 'today'
      : days < 7 ? days + (days === 1 ? ' day ago' : ' days ago')
      : weeks + (weeks === 1 ? ' week ago' : ' weeks ago');
  }
})();

// copy email
document.querySelectorAll('.mail-copy').forEach(function (link) {
  link.addEventListener('click', function (e) {
    e.preventDefault();
    navigator.clipboard.writeText(this.dataset.email);
    const label = this.querySelector('i');
    const original = label.textContent;
    label.textContent = 'Copied!';
    setTimeout(function () { label.textContent = original; }, 1500);
  });
});

// hover / click sounds
let audioCtx;
function ensureAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
}
window.addEventListener('pointerdown', ensureAudio, { once: true });
window.addEventListener('keydown', ensureAudio, { once: true });

function blip({ freq = 1800, dur = 0.03, vol = 0.4, q = 0.8 } = {}) {
  if (!audioCtx || audioCtx.state !== 'running') return;
  const now = audioCtx.currentTime;
  const buffer = audioCtx.createBuffer(1, Math.max(1, audioCtx.sampleRate * dur), audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const noise = audioCtx.createBufferSource();
  noise.buffer = buffer;
  const filter = audioCtx.createBiquadFilter();
  filter.type = 'bandpass'; filter.frequency.value = freq; filter.Q.value = q;
  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(vol, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
  noise.connect(filter); filter.connect(gain); gain.connect(audioCtx.destination);
  noise.start(now);
  noise.stop(now + dur);
}
document.querySelectorAll('a, .note-trigger').forEach(function (a) {
  a.addEventListener('mouseenter', function () { blip({ freq: 2200, dur: 0.02, vol: 0.12 }); });
  a.addEventListener('click',      function () { blip({ freq: 1500, dur: 0.04, vol: 0.25 }); });
});

// award-winning sidenote toggle
document.querySelectorAll('.note-trigger').forEach(function (btn) {
  btn.addEventListener('click', function () {
    const note = document.getElementById(btn.getAttribute('aria-controls'));
    if (note) note.hidden = !note.hidden;
  });
});
