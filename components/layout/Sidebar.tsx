"use client";

import { useState } from "react";

export function Sidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="fixed top-20 left-4 z-40 w-10 h-10 bg-gray-900 bg-opacity-80 text-white rounded-lg flex items-center justify-center hover:bg-opacity-100 transition"
        aria-label="Меню"
      >
        ☰
      </button>

      {open && (
        <div className="fixed top-0 left-0 h-full w-64 bg-gray-900 border-r border-gray-800 z-50 p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-blue-400">Меню</h2>
            <button
              onClick={() => setOpen(false)}
              className="text-gray-400 hover:text-white"
              aria-label="Затвори меню"
            >
              ✕
            </button>
          </div>

          <nav className="space-y-2">
            <a href="/weather" className="block px-3 py-2 text-gray-200 hover:bg-gray-800 rounded">
              🌤️ Време
            </a>
            <a href="/community" className="block px-3 py-2 text-gray-200 hover:bg-gray-800 rounded">
              📍 Общност
            </a>
            <a href="/hotels" className="block px-3 py-2 text-gray-200 hover:bg-gray-800 rounded">
              🏨 Хотели
            </a>
            <a href="/profile" className="block px-3 py-2 text-gray-200 hover:bg-gray-800 rounded">
              👤 Профил
            </a>
          </nav>
        </div>
      )}
    </>
  );
}