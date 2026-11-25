// Wok Rush — all sound is synthesized live with WebAudio. No audio files,
// no network: the sizzle, pops and chimes are built from oscillators and
// filtered noise at play time.
export function createAudio() {
  let ctx = null;
  let muted = false;
  let sizzleNodes = null;

  function ensure() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  }

  function tone(freq, dur, type, gain, when = 0, slideTo = null) {
    if (muted) return;
    const ac = ensure();
    if (!ac) return;
    const t0 = ac.currentTime + when;
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g).connect(ac.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  function noiseBurst(dur, filterFreq, gain, when = 0) {
    if (muted) return;
    const ac = ensure();
    if (!ac) return;
    const t0 = ac.currentTime + when;
    const len = Math.max(1, Math.floor(ac.sampleRate * dur));
    const buf = ac.createBuffer(1, len, ac.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ac.createBufferSource();
    src.buffer = buf;
    const filter = ac.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = filterFreq;
    filter.Q.value = 0.8;
    const g = ac.createGain();
    g.gain.setValueAtTime(gain, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(filter).connect(g).connect(ac.destination);
    src.start(t0);
  }

  return {
    unlock() { ensure(); },
    get muted() { return muted; },
    toggleMute() {
      muted = !muted;
      if (muted) this.stopSizzle();
      return muted;
    },
    // A short pop when an ingredient lands in the wok.
    add() { noiseBurst(0.12, 900, 0.25); tone(320, 0.1, 'triangle', 0.12, 0, 520); },
    // The wok's constant sizzle while food cooks; call with the cook level.
    startSizzle() {
      if (muted || sizzleNodes) return;
      const ac = ensure();
      if (!ac) return;
      const len = ac.sampleRate;
      const buf = ac.createBuffer(1, len, ac.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
      const src = ac.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      const filter = ac.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 4200;
      const g = ac.createGain();
      g.gain.value = 0.045;
      src.connect(filter).connect(g).connect(ac.destination);
      src.start();
      sizzleNodes = { src, g };
    },
    stopSizzle() {
      if (!sizzleNodes) return;
      try { sizzleNodes.src.stop(); } catch { /* already stopped */ }
      sizzleNodes = null;
    },
    // A whoosh-toss when the cook stirs.
    stir() { noiseBurst(0.22, 1600, 0.2); tone(220, 0.16, 'sine', 0.1, 0, 420); },
    // A bright ding when a dish is ready to plate.
    ready() { tone(880, 0.22, 'sine', 0.16); tone(1318, 0.3, 'sine', 0.12, 0.09); },
    // A coin chime when a customer is served (higher with the combo).
    serve(combo = 1) {
      const base = 660 + Math.min(combo, 8) * 40;
      tone(base, 0.14, 'triangle', 0.18);
      tone(base * 1.5, 0.2, 'triangle', 0.14, 0.07);
      noiseBurst(0.08, 5200, 0.1, 0.02);
    },
    // A low buzz when food burns or a customer storms off.
    bad() { tone(180, 0.3, 'sawtooth', 0.1, 0, 110); tone(140, 0.35, 'square', 0.06, 0.05, 90); },
    // A little fanfare when a shift ends.
    shiftDone() {
      [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.28, 'triangle', 0.15, i * 0.11));
    },
    click() { tone(700, 0.06, 'square', 0.06); },
  };
}
