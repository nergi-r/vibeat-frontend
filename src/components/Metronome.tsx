// src/components/Metronome.tsx
import React, { useEffect } from "react";
import type { Subdivision } from "../hooks/useMetronome";
import { useMetronome, subdivisions } from "../hooks/useMetronome";
import "../styles/main.css";

export const Metronome: React.FC = () => {
  const {
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
  } = useMetronome();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === "Space") {
        event.preventDefault();
        startStop();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [startStop]);

  const handleBpmChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setBpm(Number(e.target.value));
  const handleBeatsChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setBeats(Number(e.target.value));

  const containerClasses = `vibeat-container ${isPlaying ? "playing" : ""}`;

  // If beats > 8, the first row always contains 8 bars. Otherwise, it contains all the beats.
  const firstRowBeats = beats > 8 ? 8 : beats;
  // If beats > 8, the second row contains the remainder. Otherwise, it's empty.
  const secondRowBeats = beats > 8 ? beats - 8 : 0;

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
                onClick={() => setSelectedSubdivision(subName)}
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
      </div>
    </div>
  );
};
