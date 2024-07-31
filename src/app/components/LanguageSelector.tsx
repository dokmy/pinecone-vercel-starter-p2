"use client";

import React, { useState } from "react";

const LanguageSelector = ({
  userId,
  initialLanguage,
}: {
  userId: string;
  initialLanguage: string;
}) => {
  const [language, setLanguage] = useState(initialLanguage);
  const [notification, setNotification] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLanguageChange = async (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const newLanguage = e.target.value;
    setLanguage(newLanguage);
    setIsLoading(true);

    try {
      const response = await fetch("/api/language-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, outputLanguage: newLanguage }),
      });

      if (response.ok) {
        setNotification("Settings updated successfully");
      } else {
        throw new Error("Failed to update settings");
      }
    } catch (error) {
      console.error("Error updating settings:", error);
      setNotification("Failed to update settings");
    } finally {
      setIsLoading(false);
      setTimeout(() => setNotification(""), 3000);
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <label htmlFor="language-select">Output Language:</label>
      <select
        id="language-select"
        value={language}
        onChange={handleLanguageChange}
        className="border rounded px-2 py-1"
        disabled={isLoading}
      >
        <option value="English">English</option>
        <option value="Chinese">Chinese</option>
      </select>
      {isLoading && (
        <svg
          className="animate-spin h-5 w-5 text-gray-500"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      )}
      {notification && (
        <span className="text-sm text-green-500">{notification}</span>
      )}
    </div>
  );
};

export default LanguageSelector;
