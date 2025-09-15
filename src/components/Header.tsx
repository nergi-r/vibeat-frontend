// src/components/Header.tsx
import React from "react";
import { ThemeToggle } from "./ThemeToggle";

interface HeaderProps {
  theme: string;
  toggleTheme: () => void;
  openSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  theme,
  toggleTheme,
  openSidebar,
}) => {
  return (
    <header className="app-header">
      <h1 className="app-title">ViBeat</h1>
      <div className="header-actions">
        <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
        <button onClick={openSidebar} className="sidebar-toggle-button">
          Presets
        </button>
      </div>
    </header>
  );
};
