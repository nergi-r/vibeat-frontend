/**
 * @file Manages the core audio scheduling and timing logic for the ViBeat metronome.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import type { Subdivision } from "./types";
import { subdivisions } from "./types";

/**
 * The Web Audio API context, providing a high-resolution timer for precise audio scheduling.
 * Initialized once to be reused throughout the application's lifecycle.
 */
const audioContext = new (window.AudioContext ||
  (window as any).webkitAudioContext)();

const ACCENT_LEVELS = [0, 1 / 3, 2 / 3, 1];
const SUBDIVISION_VOLUME_MULTIPLIER = 0.5;

/**
 * Defines the state properties that the metronome engine requires to operate.
 */
interface MetronomeProps {
  isPlaying: boolean;
  bpm: number;
  beats: number;
  accents: number[];
  selectedSubdivision: Subdivision;
}

/**
 * A React hook that handles the precise audio scheduling for the metronome.
 * It takes the metronome's state as props and provides the currently active beat as its output.
 * This hook does not manage state itself, but acts as the audio "engine".
 *
 * @param {MetronomeProps} props - The current state of the metronome.
 * @returns {{ currentBeat: number }} An object containing the currently active beat (1-indexed).
 */
export const useMetronome = ({
  isPlaying,
  bpm,
  beats,
  accents,
  selectedSubdivision,
}: MetronomeProps) => {
  const [currentBeat, setCurrentBeat] = useState(0);

  // Refs are used to store values that need to persist across re-renders without causing them.
  const timerRef = useRef<number | null>(null);
  const nextNoteTime = useRef(0.0);
  const beatRef = useRef(0);

  /**
   * The core scheduling function. It looks ahead in time and schedules audio events
   * in small batches, ensuring the rhythm is accurate and does not drift.
   */
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

      // Update the UI state with the current beat number.
      setCurrentBeat(mainBeatIndex + 1);

      let volume = 0;
      let pitch = 0;
      const mainBeatVolume = accents[mainBeatIndex];

      // Only produce sound if the parent beat is not muted.
      if (mainBeatVolume > 0) {
        if (subdivisionIndex === 0) {
          // This is a main beat.
          volume = mainBeatVolume;
          pitch = mainBeatIndex === 0 ? 880.0 : 440.0; // Higher pitch for the downbeat.
        } else {
          // This is a subdivision.
          volume = mainBeatVolume * SUBDIVISION_VOLUME_MULTIPLIER;
          pitch = 220.0; // Lower pitch for subdivisions.
        }
      }

      // If a volume was set, schedule the sound to play.
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

      // Advance the timer and beat counter for the next note.
      nextNoteTime.current += subdivisionDuration;
      beatRef.current += 1;
    }

    // The scheduler calls itself recursively via setTimeout for continuous playback.
    timerRef.current = window.setTimeout(scheduler, 25.0);
  }, [bpm, selectedSubdivision, beats, accents]);

  /**
   * Effect hook to start or stop the metronome scheduler based on the `isPlaying` prop.
   * Also handles cleanup to prevent memory leaks.
   */
  useEffect(() => {
    if (isPlaying) {
      if (audioContext.state === "suspended") {
        audioContext.resume();
      }
      nextNoteTime.current = audioContext.currentTime;
      beatRef.current = 0;
      scheduler();
    } else {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      setCurrentBeat(0); // Reset beat display when stopped.
    }

    // Cleanup function to stop the timer when the component unmounts or props change.
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [isPlaying, scheduler]);

  return { currentBeat };
};
