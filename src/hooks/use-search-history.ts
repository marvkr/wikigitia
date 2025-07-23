import { useState, useEffect } from "react";

interface SearchHistoryItem {
  id: string;
  repositoryId: string;
  url: string;
  owner: string;
  name: string;
  description?: string;
  language?: string;
  stars?: string;
  analyzedAt: string;
}

const STORAGE_KEY = "wikigitia-search-history";
const MAX_HISTORY_ITEMS = 10;

export const useSearchHistory = () => {
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setHistory(parsed);
      }
    } catch (error) {
      console.error("Failed to load search history:", error);
    }
  }, []);

  // Save history to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch (error) {
      console.error("Failed to save search history:", error);
    }
  }, [history]);

  const addToHistory = (item: Omit<SearchHistoryItem, "id" | "analyzedAt">) => {
    console.log("Adding to history:", item);
    const newItem: SearchHistoryItem = {
      ...item,
      id: `${item.owner}-${item.name}-${Date.now()}`,
      analyzedAt: new Date().toISOString(),
    };

    setHistory((prev) => {
      // Remove any existing entry for the same repository
      const filtered = prev.filter(
        (h) => h.owner !== item.owner || h.name !== item.name
      );

      // Add new item to the beginning and limit to MAX_HISTORY_ITEMS
      const newHistory = [newItem, ...filtered].slice(0, MAX_HISTORY_ITEMS);
      console.log("New history after adding:", newHistory);
      return newHistory;
    });
  };

  const removeFromHistory = (id: string) => {
    setHistory((prev) => prev.filter((item) => item.id !== id));
  };

  const clearHistory = () => {
    setHistory([]);
  };

  return {
    history,
    addToHistory,
    removeFromHistory,
    clearHistory,
  };
};
