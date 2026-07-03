// Tutor liveliness: looped idle animations (real animated GIFs from the Figma
// source) + per-character voices via the Web Speech API. Speech respects the
// Tweaks sound toggle; the speech bubble stays on screen as subtitles.

const TUTOR_FX = (() => {
  // Masha's own animation GIFs, optimized for web (assets/characters/loop-*.gif)
  const LOOPS = ['pandy', 'redpandy', 'barsu', 'duck', 'aliencat', 'unicorn', 'glazy']
    .reduce((m, k) => (m[k] = `assets/characters/loop-${k}.gif`, m), {});

  // voice personality per character: pitch/rate shape the character read
  const VOICES = {
    pandy:    { pitch: 0.7,  rate: 0.95 },  // calm, cuddly bear
    redpandy: { pitch: 1.3,  rate: 1.15 },  // energetic
    barsu:    { pitch: 0.5,  rate: 0.85 },  // grumpy and slow
    duck:     { pitch: 1.8,  rate: 1.25 },  // quacky and quick
    aliencat: { pitch: 1.5,  rate: 1.1 },
    unicorn:  { pitch: 1.35, rate: 0.95 },  // dreamy
    glazy:    { pitch: 1.6,  rate: 1.05 },  // sweet
  };

  let voiceCache = null;
  function pickVoice() {
    if (voiceCache !== null) return voiceCache;
    const all = window.speechSynthesis ? speechSynthesis.getVoices() : [];
    voiceCache =
      all.find(v => /Google US English/i.test(v.name)) ||
      all.find(v => v.lang === 'en-US' && /female|Samantha/i.test(v.name)) ||
      all.find(v => v.lang && v.lang.startsWith('en')) || null;
    return voiceCache;
  }
  if (window.speechSynthesis) speechSynthesis.onvoiceschanged = () => { voiceCache = null; };

  function speak(key, phrase) {
    if (!window.speechSynthesis || (typeof state !== 'undefined' && state.muted)) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(phrase);
    const p = VOICES[key] || { pitch: 1, rate: 1 };
    u.pitch = p.pitch;
    u.rate = p.rate;
    u.volume = 0.9;
    const v = pickVoice();
    if (v) u.voice = v;
    speechSynthesis.speak(u);
  }

  function stop() {
    if (window.speechSynthesis) speechSynthesis.cancel();
  }

  // looped animation src for a tutor (falls back to the static pose)
  function loopSrc(key) {
    return LOOPS[key] || (CHARACTERS.tutors[key] && CHARACTERS.tutors[key].idle);
  }

  // lazy preload of the heavy loop GIFs, one by one when the browser is idle
  function preloadLoops() {
    const keys = Object.keys(LOOPS);
    const next = () => {
      const k = keys.shift();
      if (!k) return;
      const i = new Image();
      i.onload = i.onerror = () => (window.requestIdleCallback || setTimeout)(next);
      i.src = LOOPS[k];
    };
    (window.requestIdleCallback || setTimeout)(next);
  }

  return { speak, stop, loopSrc, preloadLoops };
})();
