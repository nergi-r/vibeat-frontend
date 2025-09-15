// src/hooks/useMetronome.ts
import { useState, useEffect, useRef, useCallback } from "react";

const audioContext = new (window.AudioContext ||
  (window as any).webkitAudioContext)();

export const subdivisions = {
  Quarter: 1.0,
  Eighth: 0.5,
  Sixteenth: 0.25,
  Triplet: 1.0 / 3.0,
};
export type Subdivision = keyof typeof subdivisions;

const ACCENT_LEVELS = [0, 1 / 3, 2 / 3, 1];
// This multiplier determines how loud a subdivision is relative to its parent beat.
const SUBDIVISION_VOLUME_MULTIPLIER = 0.5;

export const useMetronome = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(120);
  const [beats, setBeats] = useState(4);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [selectedSubdivision, setSelectedSubdivision] =
    useState<Subdivision>("Quarter");
  const [accents, setAccents] = useState<number[]>([
    ACCENT_LEVELS[3],
    ACCENT_LEVELS[2],
    ACCENT_LEVELS[2],
    ACCENT_LEVELS[2],
  ]);

  const timerRef = useRef<number | null>(null);
  const nextNoteTime = useRef(0.0);
  const beatRef = useRef(0);

  useEffect(() => {
    setAccents((currentAccents) => {
      const newAccents = new Array(beats).fill(ACCENT_LEVELS[2]);
      if (beats > 0) newAccents[0] = ACCENT_LEVELS[3];
      for (
        let i = 0;
        i < Math.min(currentAccents.length, newAccents.length);
        i++
      ) {
        newAccents[i] = currentAccents[i];
      }
      return newAccents;
    });
  }, [beats]);

  const scheduler = useCallback(() => {
    while (nextNoteTime.current < audioContext.currentTime + 0.1) {
      const secondsPerBeat = 60.0 / bpm;
      const subdivisionDuration =
        secondsPerBeat * subdivisions[selectedSubdivision];

      const mainBeatIndex =
        Math.floor(beatRef.current / (1 / subdivisions[selectedSubdivision])) %
        beats;
      const subdivisionIndex =
        Math.floor(beatRef.current) % (1 / subdivisions[selectedSubdivision]);

      setCurrentBeat(mainBeatIndex + 1);

      let volume = 0;
      let pitch = 0;

      const mainBeatVolume = accents[mainBeatIndex];

      // Only calculate volume and pitch if the main beat is NOT muted.
      // This is the key fix that silences subdivisions of muted beats.
      if (mainBeatVolume > 0) {
        if (subdivisionIndex === 0) {
          // This is a main beat
          volume = mainBeatVolume;
          pitch = mainBeatIndex === 0 ? 880.0 : 440.0;
        } else {
          // This is a subdivision. Its volume is derived from the parent beat.
          volume = mainBeatVolume * SUBDIVISION_VOLUME_MULTIPLIER;
          pitch = 220.0; // Lower pitch for all subdivisions
        }
      }

      // The sound playback logic only runs if volume was set to something > 0
      if (volume > 0) {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc.connect(gain);
        gain.connect(audioContext.destination);

        osc.frequency.setValueAtTime(pitch, nextNoteTime.current);
        gain.gain.setValueAtTime(volume, nextNoteTime.current);
        gain.gain.exponentialRampToValueAtTime(
          0.00001,
          nextNoteTime.current + 0.05
        );

        osc.start(nextNoteTime.current);
        osc.stop(nextNoteTime.current + 0.05);
      }

      nextNoteTime.current += subdivisionDuration;
      beatRef.current += 1;
    }

    timerRef.current = window.setTimeout(scheduler, 25.0);
  }, [bpm, selectedSubdivision, beats, accents]);

  useEffect(() => {
    if (isPlaying) {
      if (audioContext.state === "suspended") {
        audioContext.resume();
      }
      nextNoteTime.current = audioContext.currentTime;
      beatRef.current = 0;
      scheduler();
    } else {
      if (timerRef.current) clearTimeout(timerRef.current);
      setCurrentBeat(0);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isPlaying, scheduler]);

  const startStop = useCallback(() => setIsPlaying((p) => !p), []);

  const updateAccent = (beatIndex: number) => {
    setAccents((currentAccents) => {
      const newAccents = [...currentAccents];
      const currentLevelIndex = ACCENT_LEVELS.indexOf(newAccents[beatIndex]);
      const nextLevelIndex = (currentLevelIndex + 1) % ACCENT_LEVELS.length;
      newAccents[beatIndex] = ACCENT_LEVELS[nextLevelIndex];
      return newAccents;
    });
  };

  return {
    isPlaying,
    bpm,
    setBpm,
    startStop,
    currentBeat,
    accents,
    updateAccent,
    beats,
    setBeats,
    selectedSubdivision,
    setSelectedSubdivision,
  };
};
