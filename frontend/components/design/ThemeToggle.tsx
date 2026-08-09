"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export default function ThemeToggle() {
  const [isLight, setIsLight] = useState(false);

  useEffect(() => {
    // Check local storage or system preference on mount
    const saved = localStorage.getItem("climalenz-theme");
    if (saved === "light") {
      setIsLight(true);
      document.documentElement.setAttribute("data-theme", "light");
    }
  }, []);

  const toggleTheme = () => {
    if (isLight) {
      document.documentElement.removeAttribute("data-theme");
      localStorage.setItem("climalenz-theme", "dark");
      setIsLight(false);
    } else {
      document.documentElement.setAttribute("data-theme", "light");
      localStorage.setItem("climalenz-theme", "light");
      setIsLight(true);
    }
  };

  return (
    <button
      onClick={toggleTheme}
      className="relative p-2 rounded-full transition-colors hover:bg-white/5 border border-transparent hover:border-line flex items-center justify-center text-text-2 hover:text-text"
      aria-label="Toggle theme"
    >
      {isLight ? (
        <Moon className="w-[18px] h-[18px]" />
      ) : (
        <Sun className="w-[18px] h-[18px]" />
      )}
    </button>
  );
}