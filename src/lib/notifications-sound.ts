// Web Audio API Synthesizer for high-fidelity notifications without external asset files
export type SoundTone = "chime" | "ping" | "bell" | "marimba";

export function playNotificationSound(tone: SoundTone = "chime", volume = 0.8) {
  if (typeof window === "undefined") return;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === "suspended") {
      ctx.resume();
    }
    const gainNode = ctx.createGain();
    const safeVol = Math.min(Math.max(volume, 0), 1) * 0.2;
    gainNode.gain.setValueAtTime(safeVol, ctx.currentTime);
    gainNode.connect(ctx.destination);

    if (tone === "ping") {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.08);
      osc.connect(gainNode);
      osc.start();
      gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
      osc.stop(ctx.currentTime + 0.4);
    } else if (tone === "bell") {
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.05);
        osc.connect(gainNode);
        osc.start(ctx.currentTime + i * 0.05);
        osc.stop(ctx.currentTime + 0.5);
      });
      gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6);
    } else if (tone === "marimba") {
      [440, 554.37, 659.25].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.08);
        osc.connect(gainNode);
        osc.start(ctx.currentTime + i * 0.08);
        osc.stop(ctx.currentTime + i * 0.08 + 0.25);
      });
      gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);
    } else {
      // Modern Chime (Default)
      [587.33, 880].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.12);
        osc.connect(gainNode);
        osc.start(ctx.currentTime + i * 0.12);
        osc.stop(ctx.currentTime + i * 0.12 + 0.4);
      });
      gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.7);
    }
  } catch (err) {
    console.warn("[audio] Could not play notification sound:", err);
  }
}
