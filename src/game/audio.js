// Procedural WebAudio: all SFX + music are synthesised (no external assets).
const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);

const PROG = [
  { bass: 33, notes: [57, 60, 64] }, // Am
  { bass: 29, notes: [53, 57, 60] }, // F
  { bass: 36, notes: [55, 60, 64] }, // C
  { bass: 31, notes: [55, 59, 62] }, // G
];

export class Sound {
  constructor(settings) {
    this.s = settings || {};
    this.ctx = null;
    this.ready = false;
    this.musicPlaying = false;
    this.intensity = 1;
    this.step = 0;
    this.nextTime = 0;
    this.timer = null;
  }

  init() {
    if (this.ready) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try {
      this.ctx = new AC();
    } catch (e) { return; }
    const ctx = this.ctx;
    this.master = ctx.createGain();
    this.master.gain.value = 0.9;
    this.master.connect(ctx.destination);
    this.sfxGain = ctx.createGain();
    this.sfxGain.gain.value = 1;
    this.sfxGain.connect(this.master);
    this.musicGain = ctx.createGain();
    this.musicGain.gain.value = 0;
    this.musicGain.connect(this.master);
    this.noiseBuf = this.makeNoise();
    this.ready = true;
  }

  makeNoise() {
    const len = this.ctx.sampleRate * 0.6;
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  }

  tone(o) {
    if (!this.ready) return;
    const ctx = this.ctx;
    const t0 = ctx.currentTime + (o.delay || 0);
    const osc = ctx.createOscillator();
    osc.type = o.type || 'sine';
    osc.frequency.setValueAtTime(o.freq, t0);
    if (o.to) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.to), t0 + o.dur);
    const g = ctx.createGain();
    const peak = Math.max(0.0001, o.gain == null ? 0.12 : o.gain);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(peak, t0 + (o.attack || 0.005));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + o.dur);
    let node = osc;
    if (o.filter) {
      const f = ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = o.filter;
      osc.connect(f);
      node = f;
    }
    node.connect(g);
    g.connect(o.bus === 'music' ? this.musicGain : this.sfxGain);
    osc.start(t0);
    osc.stop(t0 + o.dur + 0.03);
  }

  noise(o) {
    if (!this.ready) return;
    const ctx = this.ctx;
    const t0 = ctx.currentTime + (o.delay || 0);
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const f = ctx.createBiquadFilter();
    f.type = o.filterType || 'bandpass';
    f.frequency.setValueAtTime(o.freq || 800, t0);
    if (o.to) f.frequency.exponentialRampToValueAtTime(Math.max(60, o.to), t0 + o.dur);
    f.Q.value = o.q == null ? 1.1 : o.q;
    const g = ctx.createGain();
    const peak = o.gain == null ? 0.1 : o.gain;
    g.gain.setValueAtTime(peak, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + o.dur);
    src.connect(f); f.connect(g);
    g.connect(o.bus === 'music' ? this.musicGain : this.sfxGain);
    src.start(t0);
    src.stop(t0 + o.dur + 0.02);
  }

  sfx(name) {
    if (!this.ready || this.s.sfx === false) return;
    switch (name) {
      case 'switch':
        this.tone({ type: 'square', freq: 420, to: 980, dur: 0.13, gain: 0.075, filter: 2600 });
        this.noise({ freq: 1800, to: 4200, dur: 0.1, gain: 0.035, filterType: 'highpass' });
        break;
      case 'land':
        this.tone({ type: 'sine', freq: 150, to: 60, dur: 0.16, gain: 0.11 });
        this.noise({ freq: 420, to: 160, dur: 0.1, gain: 0.05 });
        break;
      case 'death':
        this.noise({ freq: 1600, to: 90, dur: 0.42, gain: 0.2, filterType: 'lowpass', q: 0.8 });
        this.tone({ type: 'triangle', freq: 320, to: 48, dur: 0.5, gain: 0.16 });
        this.tone({ type: 'square', freq: 180, to: 40, dur: 0.3, gain: 0.07, delay: 0.04 });
        break;
      case 'checkpoint':
        [660, 880, 1320].forEach((f, i) => this.tone({ type: 'triangle', freq: f, dur: 0.22, gain: 0.09, delay: i * 0.06 }));
        break;
      case 'portal':
        this.tone({ type: 'sine', freq: 260, to: 1500, dur: 0.35, gain: 0.1 });
        this.noise({ freq: 500, to: 5000, dur: 0.35, gain: 0.07, filterType: 'bandpass', q: 2 });
        break;
      case 'complete':
        [523, 659, 784, 1046, 1318].forEach((f, i) => this.tone({ type: 'triangle', freq: f, dur: 0.5, gain: 0.1, delay: i * 0.08 }));
        this.tone({ type: 'sine', freq: 130, dur: 0.9, gain: 0.1 });
        break;
      case 'star':
        this.tone({ type: 'triangle', freq: 1046, to: 1568, dur: 0.25, gain: 0.09 });
        break;
      case 'click':
        this.tone({ type: 'square', freq: 900, to: 1250, dur: 0.05, gain: 0.05, filter: 3200 });
        break;
      case 'unlock':
        this.tone({ type: 'triangle', freq: 440, to: 880, dur: 0.35, gain: 0.1 });
        break;
      case 'spawn':
        this.tone({ type: 'triangle', freq: 220, to: 660, dur: 0.18, gain: 0.08 });
        this.tone({ type: 'sine', freq: 440, to: 880, dur: 0.12, gain: 0.05, delay: 0.06 });
        break;
      case 'gem':
        this.tone({ type: 'triangle', freq: 880, to: 1320, dur: 0.12, gain: 0.07 });
        this.tone({ type: 'sine', freq: 1320, to: 1760, dur: 0.08, gain: 0.04, delay: 0.03 });
        break;
      default: break;
    }
  }

  startMusic() {
    if (!this.ready || this.s.music === false || this.musicPlaying) return;
    this.musicPlaying = true;
    this.step = 0;
    this.nextTime = this.ctx.currentTime + 0.08;
    this.musicGain.gain.cancelScheduledValues(this.ctx.currentTime);
    this.musicGain.gain.setValueAtTime(0.0001, this.ctx.currentTime);
    this.musicGain.gain.linearRampToValueAtTime(0.5, this.ctx.currentTime + 0.8);
    this.timer = setInterval(() => this.schedule(), 30);
  }

  stopMusic() {
    this.musicPlaying = false;
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    if (this.ready) {
      this.musicGain.gain.cancelScheduledValues(this.ctx.currentTime);
      this.musicGain.gain.linearRampToValueAtTime(0.0001, this.ctx.currentTime + 0.3);
    }
  }

  setIntensity(i) { this.intensity = i; }

  schedule() {
    if (!this.musicPlaying || !this.ready) return;
    const ctx = this.ctx;
    const bpm = 108 + this.intensity * 9;
    const stepDur = 60 / bpm / 4; // 16th notes
    while (this.nextTime < ctx.currentTime + 0.2) {
      this.playStep(this.step, this.nextTime, stepDur);
      this.step = (this.step + 1) % 64;
      this.nextTime += stepDur;
    }
  }

  playStep(i, t, stepDur) {
    const ch = PROG[Math.floor((i % 32) / 8) % 4];
    const delay = Math.max(0, t - this.ctx.currentTime);
    if (i % 8 === 0) {
      this.tone({ bus: 'music', type: 'triangle', freq: midi(ch.bass), dur: stepDur * 6, gain: 0.16, delay, attack: 0.01 });
    }
    if (i % 4 === 2) {
      this.noise({ bus: 'music', freq: 320, to: 140, dur: 0.09, gain: 0.05, delay, filterType: 'lowpass' });
    }
    const arp = ch.notes[i % ch.notes.length];
    if (i % 2 === 0) {
      this.tone({ bus: 'music', type: 'square', freq: midi(arp + 12), dur: stepDur * 1.6, gain: 0.028, delay, filter: 2400 });
    }
    if (this.intensity > 1 && i % 4 === 1) {
      this.noise({ bus: 'music', freq: 6800, dur: 0.045, gain: 0.022, delay, filterType: 'highpass' });
    }
  }
}