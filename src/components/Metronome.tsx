// src/components/Metronome.tsx
import React, { useState, useEffect, useRef } from "react";
import { useMetronome, audioContext } from "../hooks/useMetronome";
import type { Subdivision, MetronomeSettings } from "../hooks/types";
import { subdivisions } from "../hooks/types";

interface MetronomeProps {
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  settings: MetronomeSettings;
  setSettings: (settings: MetronomeSettings) => void;
  onShare: () => void;
}

/**
 * Plays a short, distinct "tick" sound for tap tempo feedback.
 */
const playTapSound = () => {
  if (audioContext.state === "suspended") {
    audioContext.resume();
  }
  const now = audioContext.currentTime;
  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();
  osc.connect(gain);
  gain.connect(audioContext.destination);

  osc.frequency.setValueAtTime(1200, now); // High pitch for a clear "tick"
  gain.gain.setValueAtTime(0.5, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);

  osc.start(now);
  osc.stop(now + 0.05);
};

export const Metronome: React.FC<MetronomeProps> = ({
  isPlaying,
  setIsPlaying,
  settings,
  setSettings,
  onShare,
}) => {
  const { bpm, beats, accents, selectedSubdivision } = settings;
  const { currentBeat } = useMetronome({
    isPlaying,
    bpm,
    beats,
    accents,
    selectedSubdivision,
  });

  // --- Tap Tempo State and Logic ---
  const [tapTimestamps, setTapTimestamps] = useState<number[]>([]);
  const tapTimeoutRef = useRef<number | null>(null);
  const [isTapping, setIsTapping] = useState(false); // State for visual feedback
  const tappingTimeoutRef = useRef<number | null>(null);

  const handleTap = () => {
    // 1. Play immediate sound feedback
    playTapSound();

    // 2. Trigger visual flash feedback
    setIsTapping(true);
    if (tappingTimeoutRef.current) clearTimeout(tappingTimeoutRef.current);
    tappingTimeoutRef.current = window.setTimeout(
      () => setIsTapping(false),
      100
    );

    // 3. Calculate BPM
    const now = performance.now();
    const newTimestamps = [...tapTimestamps, now].slice(-5);
    setTapTimestamps(newTimestamps);

    if (newTimestamps.length > 1) {
      const deltas = [];
      for (let i = 1; i < newTimestamps.length; i++) {
        deltas.push(newTimestamps[i] - newTimestamps[i - 1]);
      }
      const averageDelta = deltas.reduce((a, b) => a + b, 0) / deltas.length;

      if (averageDelta > 0) {
        const newBpm = Math.round(60000 / averageDelta);
        const clampedBpm = Math.max(20, Math.min(newBpm, 500));
        setSettings({ ...settings, bpm: clampedBpm });
      }
    }

    if (tapTimeoutRef.current) clearTimeout(tapTimeoutRef.current);
    tapTimeoutRef.current = window.setTimeout(() => setTapTimestamps([]), 2000);
  };

  const startStop = () => setIsPlaying(!isPlaying);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      // If the event originated from an input field, do nothing.
      if (target.tagName.toLowerCase() === "input") {
        return;
      }
      if (event.code === "KeyT") {
        event.preventDefault();
        handleTap();
      }
      if (event.code === "Space") {
        event.preventDefault();
        startStop();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [startStop]);

  const handleBpmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSettings({ ...settings, bpm: Number(e.target.value) });
  };
  const handleBeatsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newBeats = Number(e.target.value);
    const newAccents = new Array(newBeats).fill(2 / 3);
    if (newBeats > 0) newAccents[0] = 1;
    for (let i = 0; i < Math.min(accents.length, newAccents.length); i++) {
      newAccents[i] = accents[i];
    }
    setSettings({ ...settings, beats: newBeats, accents: newAccents });
  };
  const handleSubdivisionChange = (sub: Subdivision) => {
    setSettings({ ...settings, selectedSubdivision: sub });
  };
  const updateAccent = (index: number) => {
    const newAccents = [...accents];
    const ACCENT_LEVELS = [0, 1 / 3, 2 / 3, 1];
    const currentLevelIndex = ACCENT_LEVELS.findIndex(
      (level) => Math.abs(level - newAccents[index]) < 0.001
    );
    const nextLevelIndex = (currentLevelIndex + 1) % ACCENT_LEVELS.length;
    newAccents[index] = ACCENT_LEVELS[nextLevelIndex];
    setSettings({ ...settings, accents: newAccents });
  };

  const firstRowBeats = beats > 8 ? 8 : beats;
  const secondRowBeats = beats > 8 ? beats - 8 : 0;
  const containerClasses = `vibeat-container ${isPlaying ? "playing" : ""}`;

  return (
    <div className={containerClasses}>
      <div className="accent-bars-container">
        <div className="accent-bar-row">
          {accents.slice(0, firstRowBeats).map((accentLevel, index) => (
            <div
              key={index}
              className={`accent-bar ${
                currentBeat === index + 1 ? "active" : ""
              }`}
              onClick={() => updateAccent(index)}
            >
              <div
                className="accent-bar-inner"
                style={{ height: `${accentLevel * 100}%` }}
              ></div>
            </div>
          ))}
        </div>
        {secondRowBeats > 0 && (
          <div className="accent-bar-row">
            {accents.slice(firstRowBeats).map((accentLevel, index) => {
              const actualIndex = index + firstRowBeats;
              return (
                <div
                  key={actualIndex}
                  className={`accent-bar ${
                    currentBeat === actualIndex + 1 ? "active" : ""
                  }`}
                  onClick={() => updateAccent(actualIndex)}
                >
                  <div
                    className="accent-bar-inner"
                    style={{ height: `${accentLevel * 100}%` }}
                  ></div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="settings-grid">
        <div className="setting-control beats-control">
          <label htmlFor="beats">
            Beats: <span className="beats-value">{beats}</span>
          </label>
          <input
            type="range"
            id="beats"
            value={beats}
            onChange={handleBeatsChange}
            min="1"
            max="16"
            className="beats-slider"
          />
        </div>
        <div className="setting-control subdivision-control">
          <label>Note</label>
          <div className="subdivision-selector">
            {(Object.keys(subdivisions) as Subdivision[]).map((subName) => (
              <button
                key={subName}
                onClick={() => handleSubdivisionChange(subName)}
                className={selectedSubdivision === subName ? "active" : ""}
              >
                {subName}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="controls">
        <div className="bpm-control-wrapper">
          <div className={`bpm-display ${isTapping ? "tapping" : ""}`}>
            {bpm} <span className="bpm-label">BPM</span>
          </div>
          <button onClick={handleTap} className="tap-tempo-button">
            Tap
          </button>
        </div>
        <input
          type="range"
          min="20"
          max="500"
          value={bpm}
          onChange={handleBpmChange}
          className="bpm-slider"
        />
        <button
          onClick={startStop}
          className={`play-pause-button ${isPlaying ? "playing" : ""}`}
        >
          {isPlaying ? "Stop" : "Start"}
        </button>
        <button onClick={onShare} className="share-button">
          Share
        </button>
      </div>
    </div>
  );
};
