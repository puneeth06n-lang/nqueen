import React, { createContext, useContext, useState, useEffect } from "react";

interface TeamContextType {
  teamName: string | null;
  loginTeam: (name: string) => void;
  logoutTeam: () => void;
}

const TeamContext = createContext<TeamContextType | undefined>(undefined);

export const TEAM_STORAGE_KEY = "teamName";

export function TeamProvider({ children }: { children: React.ReactNode }) {
  const [teamName, setTeamName] = useState<string | null>(() => {
    try {
      return localStorage.getItem(TEAM_STORAGE_KEY);
    } catch {
      return null;
    }
  });

  useEffect(() => {
    // Keep in sync if changed across tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === TEAM_STORAGE_KEY) {
        setTeamName(e.newValue);
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const loginTeam = (name: string) => {
    const trimmed = name.trim();
    try {
      localStorage.setItem(TEAM_STORAGE_KEY, trimmed);
    } catch (e) {
      console.error("Failed to write to localStorage:", e);
    }
    setTeamName(trimmed);
  };

  const logoutTeam = () => {
    try {
      localStorage.removeItem(TEAM_STORAGE_KEY);
    } catch (e) {
      console.error("Failed to remove from localStorage:", e);
    }
    setTeamName(null);
  };

  return (
    <TeamContext.Provider value={{ teamName, loginTeam, logoutTeam }}>
      {children}
    </TeamContext.Provider>
  );
}

export function useTeam(): TeamContextType {
  const context = useContext(TeamContext);
  if (!context) {
    throw new Error("useTeam must be used within a TeamProvider");
  }
  return context;
}
