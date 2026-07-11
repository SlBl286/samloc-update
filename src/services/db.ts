import { HistoryType } from "@/common/types";

const API_BASE = import.meta.env.VITE_API_URL || "";

export async function initDb(): Promise<void> {
  // Database is initialized on the backend. No action required on client.
  return Promise.resolve();
}

export async function getDbPlayers(): Promise<{ id: number; name: string; avatar: string }[]> {
  try {
    const res = await fetch(`${API_BASE}/api/players`);
    if (!res.ok) throw new Error("Failed to fetch players");
    return await res.json();
  } catch (e) {
    console.error("Failed to select players from backend:", e);
    return [];
  }
}

export async function createDbPlayer(name: string, avatar: string): Promise<number> {
  try {
    const res = await fetch(`${API_BASE}/api/players`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, avatar }),
    });
    if (!res.ok) throw new Error("Failed to create player");
    const data = await res.json();
    return data.id || 0;
  } catch (e) {
    console.error("Failed to create player on backend:", e);
    return 0;
  }
}

export type LeaderboardRow = {
  rank: number;
  name: string;
  avatar: string;
  totalPoints: number;
  totalGames: number;
  totalMatches: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
  efficiency: number;
};

export async function getLeaderboard(): Promise<LeaderboardRow[]> {
  try {
    const res = await fetch(`${API_BASE}/api/leaderboard`);
    if (!res.ok) throw new Error("Failed to fetch leaderboard");
    return await res.json();
  } catch (e) {
    console.error("Failed to fetch leaderboard from backend:", e);
    return [];
  }
}

export async function saveMatch(
  matchData: Array<{ name: string; image?: string; histories: HistoryType[] }>
): Promise<void> {
  const res = await fetch(`${API_BASE}/api/match`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(matchData),
  });
  if (!res.ok) {
    throw new Error("Failed to save match history");
  }
}

export async function updateDbPlayer(oldName: string, newName: string, avatar: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/players`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ oldName, newName, avatar }),
    });
    return res.ok;
  } catch (e) {
    console.error("Failed to update player on backend:", e);
    return false;
  }
}
