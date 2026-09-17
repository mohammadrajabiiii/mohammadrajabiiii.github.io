// relative time on any .ago element (status box, playground, notes…)
(function () {
  document.querySelectorAll('.ago').forEach(function (el) {
    var iso = el.dataset.date || el.getAttribute('datetime');
    if (!iso) return;
    var then = new Date(iso);
    var days = Math.floor((Date.now() - then) / 86400000);
    if (days < 1)        el.textContent = 'today';
    else if (days < 7)   el.textContent = days + (days === 1 ? ' day ago' : ' days ago');
    else if (days < 30)  { var w = Math.floor(days / 7);   el.textContent = w + (w === 1 ? ' week ago'  : ' weeks ago'); }
    else if (days < 365) { var m = Math.floor(days / 30);  el.textContent = m + (m === 1 ? ' month ago' : ' months ago'); }
    else                 { var y = Math.floor(days / 365); el.textContent = y + (y === 1 ? ' year ago'  : ' years ago'); }
  });
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
['pointerdown', 'keydown', 'touchstart', 'wheel'].forEach(function (evt) {
  window.addEventListener(evt, ensureAudio, { once: true, passive: true });
});


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

// stagger the load animation, line by line, for any number of items
if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  document.querySelectorAll('main > *, .notes > *, footer').forEach(function (el, i) {
    el.style.animationDelay = (i * 0.06) + 's';
  });
}




// voice narration player with decorative waveform
document.querySelectorAll('.voice').forEach(function (v) {
  var audio = v.querySelector('.voice-audio');
  var btn   = v.querySelector('.voice-play');
  var wave  = v.querySelector('.voice-wave');
  var time  = v.querySelector('.voice-time');

  // build a stable waveform (same shape every load, no random jitter)
  var BARS = 50, bars = [];
  for (var i = 0; i < BARS; i++) {
    var b = document.createElement('span');
    var h = 0.25 + Math.abs(Math.sin(i * 1.7) * Math.cos(i * 0.6)) * 0.75;  // 25%–100%
    b.style.height = (h * 100) + '%';
    wave.appendChild(b);
    bars.push(b);
  }

  function fmt(s) {
    if (!isFinite(s)) return '00:00';
    var m = Math.floor(s / 60), sec = Math.floor(s % 60);
    return (m < 10 ? '0' : '') + m + ':' + (sec < 10 ? '0' : '') + sec;
  }

  audio.addEventListener('loadedmetadata', function () {
    time.textContent = fmt(audio.duration);          // total at rest: "02:23"
  });

  btn.addEventListener('click', function () {
    if (audio.paused) { audio.play();  v.classList.add('playing'); }
    else              { audio.pause(); v.classList.remove('playing'); }
  });

  audio.addEventListener('timeupdate', function () {
    var ratio  = audio.currentTime / audio.duration || 0;
    var played = Math.round(ratio * bars.length);
    bars.forEach(function (b, i) { b.classList.toggle('played', i < played); });
    time.textContent = fmt(audio.currentTime) + ' - ' + fmt(audio.duration);  // "00:14 - 02:23"
  });

  audio.addEventListener('ended', function () {
    v.classList.remove('playing');
    bars.forEach(function (b) { b.classList.remove('played'); });
    time.textContent = fmt(audio.duration);
  });

  wave.addEventListener('click', function (e) {                 // click waveform to seek
    var rect = wave.getBoundingClientRect();
    audio.currentTime = (e.clientX - rect.left) / rect.width * audio.duration;
  });

  // horizontal-only hover line
var cursor = document.createElement('div');
cursor.className = 'voice-cursor';
wave.appendChild(cursor);

wave.addEventListener('mousemove', function (e) {
  var rect = wave.getBoundingClientRect();
  cursor.style.left = (e.clientX - rect.left) + 'px';   // X only
  cursor.style.opacity = '1';
});
wave.addEventListener('mouseleave', function () {
  cursor.style.opacity = '0';
});

});
