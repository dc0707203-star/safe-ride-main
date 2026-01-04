import { useCallback, useEffect, useRef } from "react";

/**
 * Reliable WebAudio siren that can be started/stopped repeatedly.
 * Uses a single AudioContext (suspend/resume) to avoid "too many AudioContexts"
 * and intermittent playback failures on subsequent alerts.
 */
export function useEmergencySiren() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const osc1Ref = useRef<OscillatorNode | null>(null);
  const osc2Ref = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const intervalRef = useRef<number | null>(null);
  const isPlayingRef = useRef(false);
  const phaseRef = useRef<0 | 1>(0);

  const ensureContext = useCallback(() => {
    if (!audioContextRef.current || audioContextRef.current.state === "closed") {
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new Ctx();
    }
    return audioContextRef.current;
  }, []);

  const stop = useCallback(async () => {
    isPlayingRef.current = false;

    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    try {
      if (osc1Ref.current) {
        osc1Ref.current.stop();
        osc1Ref.current.disconnect();
      }
      if (osc2Ref.current) {
        osc2Ref.current.stop();
        osc2Ref.current.disconnect();
      }
      if (gainRef.current) {
        gainRef.current.disconnect();
      }
    } catch {
      // no-op
    } finally {
      osc1Ref.current = null;
      osc2Ref.current = null;
      gainRef.current = null;
    }

    const ctx = audioContextRef.current;
    if (ctx && ctx.state !== "closed") {
      try {
        await ctx.suspend();
      } catch {
        // no-op
      }
    }
  }, []);

  const start = useCallback(async () => {
    if (isPlayingRef.current) return;
    isPlayingRef.current = true;

    const ctx = ensureContext();

    try {
      await ctx.resume();
    } catch {
      // If the browser blocks autoplay, the UI still opens; sound may start after a user gesture.
    }

    // Fresh nodes every start (oscillators cannot be restarted after stop)
    const gain = ctx.createGain();
    gain.gain.value = 0.14;
    gain.connect(ctx.destination);
    gainRef.current = gain;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();

    osc1.type = "square";
    osc2.type = "sawtooth";

    osc1.connect(gain);
    osc2.connect(gain);

    osc1Ref.current = osc1;
    osc2Ref.current = osc2;

    // Start immediately
    const now = ctx.currentTime;
    osc1.frequency.setValueAtTime(880, now);
    osc2.frequency.setValueAtTime(440, now);
    osc1.start();
    osc2.start();

    // Toggle between hi/lo every 250ms for a classic two-tone siren
    phaseRef.current = 0;
    intervalRef.current = window.setInterval(() => {
      if (!audioContextRef.current || audioContextRef.current.state === "closed") return;
      const t = audioContextRef.current.currentTime;

      phaseRef.current = phaseRef.current === 0 ? 1 : 0;
      const hi = phaseRef.current === 0;

      osc1Ref.current?.frequency.setValueAtTime(hi ? 880 : 660, t);
      osc2Ref.current?.frequency.setValueAtTime(hi ? 440 : 330, t);
    }, 250);
  }, [ensureContext]);

  useEffect(() => {
    return () => {
      stop();
      const ctx = audioContextRef.current;
      if (ctx && ctx.state !== "closed") {
        ctx.close().catch(() => {});
      }
      audioContextRef.current = null;
    };
  }, [stop]);

  return { start, stop, isPlayingRef };
}
