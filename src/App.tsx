// src/App.tsx
import { useState, useEffect } from "react";
import { Header } from "./components/Header";
import { Metronome } from "./components/Metronome";

function App() {
  // State to hold the current theme. It reads from localStorage for persistence.
  const [theme, setTheme] = useState(() => {
    const savedTheme = window.localStorage.getItem("theme");
    return savedTheme || "light"; // Default to 'light' if nothing is saved
  });

  // Effect to apply the theme to the body and save it to localStorage
  useEffect(() => {
    document.body.setAttribute("data-theme", theme);
    window.localStorage.setItem("theme", theme);
  }, [theme]);

  // Function to toggle between 'light' and 'dark'
  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
  };

  return (
    <div className="app-container">
      <Header theme={theme} toggleTheme={toggleTheme} />
      <main className="content-wrapper">
        <Metronome />
      </main>
    </div>
  );
}

export default App;
