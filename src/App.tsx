// src/App.tsx
import { useState, useEffect } from "react";
import { Header } from "./components/Header";
import { Metronome } from "./components/Metronome";
import { Sidebar } from "./components/Sidebar";
import type { MetronomeSettings, Preset } from "./hooks/types";

const defaultSettings: MetronomeSettings = {
  bpm: 120,
  beats: 4,
  selectedSubdivision: "Quarter",
  accents: [1, 2 / 3, 2 / 3, 2 / 3],
};

// --- HELPER FUNCTIONS FOR ENCODING/DECODING ---
const ACCENT_LEVELS = [0, 1 / 3, 2 / 3, 1];

/**
 * Converts the internal fractional accent values (e.g., 0.666) to simple integers (e.g., 3) for storage.
 */
const encodeAccents = (accents: number[]): number[] => {
  return accents.map((value) => {
    const index = ACCENT_LEVELS.findIndex(
      (level) => Math.abs(level - value) < 0.001
    );
    return index + 1; // Map to 1, 2, 3, 4
  });
};

/**
 * Converts stored integer accent levels (e.g., 3) back to the fractional values the engine uses (e.g., 0.666).
 */
const decodeAccents = (encodedAccents: number[]): number[] => {
  return encodedAccents.map((level) => ACCENT_LEVELS[level - 1] || 0); // Default to 0 if invalid
};
// ---------------------------------------------

function App() {
  const [theme, setTheme] = useState(
    () => window.localStorage.getItem("theme") || "light"
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [settings, setSettings] = useState<MetronomeSettings>(defaultSettings);
  const [presets, setPresets] = useState<Preset[]>(() => {
    const savedPresets = window.localStorage.getItem("presets");
    return savedPresets ? JSON.parse(savedPresets) : [];
  });
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const config = params.get("config");
    if (config) {
      try {
        const decodedSettings = JSON.parse(atob(config));
        if (decodedSettings.bpm && decodedSettings.beats) {
          // Decode the accents from integers back to fractions
          decodedSettings.accents = decodeAccents(decodedSettings.accents);
          setSettings(decodedSettings);
        }
      } catch (e) {
        console.error("Failed to parse settings from URL", e);
      }
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("presets", JSON.stringify(presets));
  }, [presets]);

  useEffect(() => {
    document.body.setAttribute("data-theme", theme);
    window.localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () =>
    setTheme((prev) => (prev === "light" ? "dark" : "light"));

  const savePreset = (name: string) => {
    // Encode the accents to integers before saving
    const settingsToSave = {
      ...settings,
      accents: encodeAccents(settings.accents),
    };
    const newPreset: Preset = {
      ...settingsToSave,
      id: crypto.randomUUID(),
      name,
    };
    setPresets((prev) => [...prev, newPreset]);
  };

  const loadPreset = (preset: Preset) => {
    setIsPlaying(false);
    // Decode the accents from integers back to fractions
    const settingsToLoad = {
      ...preset,
      accents: decodeAccents(preset.accents),
    };
    setSettings(settingsToLoad);
    setSidebarOpen(false);
  };

  const deletePreset = (id: string) => {
    setPresets((prev) => prev.filter((p) => p.id !== id));
  };

  const shareSettings = () => {
    // Encode the accents to integers before creating the link
    const settingsToShare = {
      ...settings,
      accents: encodeAccents(settings.accents),
    };
    const config = btoa(JSON.stringify(settingsToShare));
    const url = `${window.location.origin}${window.location.pathname}?config=${config}`;
    navigator.clipboard
      .writeText(url)
      .then(() => {
        alert("Shareable link copied to clipboard!");
      })
      .catch((err) => {
        console.error("Failed to copy link: ", err);
        alert("Could not copy link to clipboard.");
      });
  };

  return (
    <div className="app-container">
      <Header
        theme={theme}
        toggleTheme={toggleTheme}
        openSidebar={() => setSidebarOpen(true)}
      />
      <main className="content-wrapper">
        <Metronome
          isPlaying={isPlaying}
          setIsPlaying={setIsPlaying}
          settings={settings}
          setSettings={setSettings}
          onShare={shareSettings}
        />
      </main>
      <Sidebar
        isOpen={isSidebarOpen}
        presets={presets}
        onClose={() => setSidebarOpen(false)}
        onSave={savePreset}
        onLoad={loadPreset}
        onDelete={deletePreset}
      />
    </div>
  );
}

export default App;
