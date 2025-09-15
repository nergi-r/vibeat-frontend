// src/components/Header.tsx
import React from "react";
import { ThemeToggle } from "./ThemeToggle";

// The header now needs to know about the theme to pass it down
interface HeaderProps {
  theme: string;
  toggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({ theme, toggleTheme }) => {
  return (
    <header className="app-header">
      <h1 className="app-title">ViBeat</h1>
      <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
    </header>
  );
};
