/**
 * Web Audio API beep generator for incident alerts.
 * AudioContext is lazy-created and must be unlocked by a user gesture first.
 */

let _ctx: AudioContext | null = null;

export function ensureAudioContext(): void {
  if (!_ctx) {
    _ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  }
  if (_ctx.state === "suspended") {
    _ctx.resume().catch(() => null);
  }
}

function playTone(freq: number, startTime: number, duration: number, gain: number): void {
  if (!_ctx) return;
  const osc = _ctx.createOscillator();
  const gainNode = _ctx.createGain();

  osc.type = "sine";
  osc.frequency.value = freq;

  gainNode.gain.setValueAtTime(0.0001, startTime);
  gainNode.gain.exponentialRampToValueAtTime(gain, startTime + 0.01);
  gainNode.gain.setValueAtTime(gain, startTime + duration - 0.02);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  osc.connect(gainNode);
  gainNode.connect(_ctx.destination);
  osc.start(startTime);
  osc.stop(startTime + duration + 0.01);
}

/** Two-tone urgent beep for critical severity. */
export function playCriticalBeep(): void {
  if (!_ctx || _ctx.state !== "running") return;
  const now = _ctx.currentTime;
  playTone(880, now, 0.09, 0.35);
  playTone(1175, now + 0.13, 0.09, 0.35);
}

/** Single softer beep for warning severity. */
export function playWarningBeep(): void {
  if (!_ctx || _ctx.state !== "running") return;
  const now = _ctx.currentTime;
  playTone(660, now, 0.12, 0.20);
}
