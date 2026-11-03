"use client"

/**
 * Chime lembut Timer Melayang di menit 80 ("10 menit tersisa").
 * Dibangkitkan dengan Web Audio (tanpa berkas audio). Hanya audio: pengumuman untuk
 * screen reader ditangani terpisah lewat region status sekali-pakai di FloatingTimer.
 */

const MUTE_STORAGE_KEY = "solulu.timer.chimeMuted"

export function readChimeMuted(): boolean {
  try {
    return window.localStorage.getItem(MUTE_STORAGE_KEY) === "1"
  } catch {
    return false
  }
}

export function writeChimeMuted(muted: boolean): void {
  try {
    window.localStorage.setItem(MUTE_STORAGE_KEY, muted ? "1" : "0")
  } catch {
    // penyimpanan tidak tersedia; preferensi hanya berlaku selama sesi halaman
  }
}

/** Dua nada sinus pendek dengan envelope halus. Mengembalikan false bila audio tidak tersedia. */
export function playChime(): boolean {
  try {
    const Ctx: typeof AudioContext | undefined =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctx) return false
    const ctx = new Ctx()
    const now = ctx.currentTime
    const notes: Array<{ freq: number; start: number }> = [
      { freq: 659.25, start: 0 },
      { freq: 880, start: 0.28 },
    ]
    for (const { freq, start } of notes) {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = "sine"
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0.0001, now + start)
      gain.gain.exponentialRampToValueAtTime(0.12, now + start + 0.04)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + start + 0.9)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now + start)
      osc.stop(now + start + 1)
    }
    window.setTimeout(() => void ctx.close().catch(() => {}), 1800)
    return true
  } catch {
    return false
  }
}
