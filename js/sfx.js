// Sound design — synthesized with Web Audio, no files needed.
// Cute & gentle: kalimba/bell timbre (sine + soft overtones), pentatonic
// intervals, soft attacks, water-drop taps. Muted via the Tweaks menu.

const SFX = (() => {
  let ctx = null;

  function ac() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  // unlock on the first gesture (browser autoplay policy)
  document.addEventListener('pointerdown', () => ac(), { once: true, capture: true });

  function muted() { return typeof state !== 'undefined' && state.muted; }

  // one soft bell/kalimba note: fundamental + quiet octave + faint 3rd partial
  function note(freq, { delay = 0, dur = 0.32, vol = 0.09, bend = 0 } = {}) {
    if (muted()) return;
    const c = ac();
    const t0 = c.currentTime + delay;
    [[1, 1], [2, 0.28], [3, 0.08]].forEach(([mult, mix]) => {
      const osc = c.createOscillator();
      const g = c.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq * mult, t0);
      if (bend) osc.frequency.exponentialRampToValueAtTime((freq + bend) * mult, t0 + dur * 0.5);
      g.gain.setValueAtTime(0, t0);
      g.gain.linearRampToValueAtTime(vol * mix, t0 + 0.014);
      g.gain.setTargetAtTime(0, t0 + 0.03, dur / 3.2);
      osc.connect(g).connect(c.destination);
      osc.start(t0);
      osc.stop(t0 + dur + 0.4);
    });
  }

  // quick rising "water drop" blip — the cutest tap there is
  function drop(from, to, { delay = 0, dur = 0.06, vol = 0.07 } = {}) {
    if (muted()) return;
    const c = ac();
    const t0 = c.currentTime + delay;
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(from, t0);
    osc.frequency.exponentialRampToValueAtTime(to, t0 + dur);
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(vol, t0 + 0.01);
    g.gain.setTargetAtTime(0, t0 + dur * 0.7, 0.035);
    osc.connect(g).connect(c.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.2);
  }

  // pentatonic pitches (C major pentatonic, gentle register)
  const P = { C5: 523, D5: 587, E5: 659, G5: 784, A5: 880, C6: 1046, D6: 1175, E6: 1318, G6: 1568 };

  return {
    // tap: tiny water-drop "plip"
    tap()    { drop(430, 700, { vol: 0.055 }); },
    // equip / try-on: warm kalimba pair, rising
    equip()  { note(P.G5, { dur: 0.22, vol: 0.07 });
               note(P.C6, { delay: 0.09, dur: 0.3, vol: 0.08 }); },
    // reward: gentle bell arpeggio
    coin()   { note(P.C6, { dur: 0.22, vol: 0.06 });
               note(P.E6, { delay: 0.09, dur: 0.22, vol: 0.06 });
               note(P.G6, { delay: 0.18, dur: 0.34, vol: 0.07 }); },
    // one tick of the star counter: featherweight pip
    tick()   { drop(1300, 1500, { dur: 0.03, vol: 0.016 }); },
    // not enough stars: soft sympathetic "aw..." (two gentle falling notes)
    denied() { note(P.E5, { dur: 0.26, vol: 0.07 });
               note(P.C5, { delay: 0.16, dur: 0.4, vol: 0.07 }); },
    // popup opens: round little pop
    popup()  { drop(300, 520, { dur: 0.07, vol: 0.05 });
               note(P.G5, { delay: 0.03, dur: 0.16, vol: 0.03 }); },
    // tutor chosen: warm slow harp roll — soft major chord, nothing hurried
    choose() { note(262,  { dur: 0.7, vol: 0.045 });             // C4 warm base
               note(P.C5, { delay: 0.16, dur: 0.6, vol: 0.05 });
               note(P.E5, { delay: 0.34, dur: 0.6, vol: 0.05 });
               note(P.G5, { delay: 0.52, dur: 0.9, vol: 0.055 }); },
    // speech bubble: friendly rising "du-du?"
    hello()  { note(P.G5, { dur: 0.18, vol: 0.06, bend: 30 });
               note(P.A5, { delay: 0.12, dur: 0.26, vol: 0.07, bend: 40 }); },
  };
})();
