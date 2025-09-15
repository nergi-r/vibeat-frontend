// src/components/Sidebar.tsx
import React, { useState } from "react";
import type { Preset } from "../hooks/types";

interface SidebarProps {
  isOpen: boolean;
  presets: Preset[];
  onClose: () => void;
  onSave: (name: string) => void;
  onLoad: (preset: Preset) => void;
  onDelete: (id: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  presets,
  onClose,
  onSave,
  onLoad,
  onDelete,
}) => {
  const [presetName, setPresetName] = useState("");

  const handleSave = () => {
    if (presetName.trim()) {
      onSave(presetName.trim());
      setPresetName("");
    }
  };

  return (
    <>
      <div
        className={`sidebar-overlay ${isOpen ? "open" : ""}`}
        onClick={onClose}
      ></div>
      <aside className={`sidebar ${isOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <h2>Presets</h2>
          <button onClick={onClose} className="close-button">
            &times;
          </button>
        </div>
        <div className="sidebar-content">
          <div className="save-preset-section">
            <input
              type="text"
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              placeholder="New preset name..."
            />
            <button onClick={handleSave}>Save</button>
          </div>
          <div className="preset-list">
            {presets.length === 0 ? (
              <p className="no-presets">No presets saved yet.</p>
            ) : (
              presets.map((preset) => (
                <div key={preset.id} className="preset-item">
                  <span className="preset-name">{preset.name}</span>
                  <div className="preset-actions">
                    <button onClick={() => onLoad(preset)}>Load</button>
                    <button
                      onClick={() => onDelete(preset.id)}
                      className="delete"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
