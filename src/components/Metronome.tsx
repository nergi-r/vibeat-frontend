// src/components/Metronome.tsx
import React, { useEffect } from "react";
import { useMetronome } from "../hooks/useMetronome";
import type { Subdivision, MetronomeSettings } from "../hooks/types";
import { subdivisions } from "../hooks/types";

interface MetronomeProps {
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  settings: MetronomeSettings;
  setSettings: (settings: MetronomeSettings) => void;
  onShare: () => void;
}

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

  const startStop = () => setIsPlaying(!isPlaying);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
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
        <div className="bpm-display">
          {bpm} <span className="bpm-label">BPM</span>
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
        {/* New Share Button */}
        <button onClick={onShare} className="share-button">
          Share
        </button>
      </div>
    </div>
  );
};
