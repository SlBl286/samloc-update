import initSqlJs from "sql.js";
import { HistoryType } from "@/common/types";

let db: any = null;
let SQL: any = null;

export async function initDb() {
  if (db) return db;

  // Initialize sql.js using unpkg CDN for matching version 1.14.1
  SQL = await initSqlJs({
    locateFile: (file) => `https://unpkg.com/sql.js@1.14.1/dist/${file}`,
  });

  const savedDbBase64 = localStorage.getItem("sqlite_db_base64");
  if (savedDbBase64) {
    try {
      const binaryString = window.atob(savedDbBase64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      db = new SQL.Database(bytes);
    } catch (e) {
      console.error("Failed to load saved SQLite DB, creating new", e);
      db = new SQL.Database();
      createTables();
    }
  } else {
    db = new SQL.Database();
    createTables();
  }

  return db;
}

function createTables() {
  if (!db) return;
  db.run(`
    CREATE TABLE IF NOT EXISTS players (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      avatar TEXT NOT NULL
    );
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS match_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player_id INTEGER NOT NULL,
      game_number INTEGER NOT NULL,
      state TEXT NOT NULL,
      point_change INTEGER NOT NULL,
      point_delta INTEGER NOT NULL,
      cards_count INTEGER NOT NULL,
      is_chay INTEGER NOT NULL,
      sam_status TEXT NOT NULL,
      is_chopped2 INTEGER NOT NULL,
      cards_delta INTEGER NOT NULL,
      chops_delta INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
    );
  `);
  saveDb();
}

export function saveDb() {
  if (!db) return;
  const binaryArray = db.export();
  let binaryString = "";
  for (let i = 0; i < binaryArray.length; i++) {
    binaryString += String.fromCharCode(binaryArray[i]);
  }
  const base64 = window.btoa(binaryString);
  localStorage.setItem("sqlite_db_base64", base64);
}

export function getDbPlayers(): { id: number; name: string; avatar: string }[] {
  if (!db) return [];
  try {
    const res = db.exec("SELECT id, name, avatar FROM players ORDER BY name COLLATE NOCASE");
    if (res.length === 0) return [];
    const columns = res[0].columns;
    const values = res[0].values;
    return values.map((row: any) => {
      const obj: any = {};
      columns.forEach((col: string, idx: number) => {
        obj[col] = row[idx];
      });
      return obj;
    });
  } catch (e) {
    console.error("Failed to select players", e);
    return [];
  }
}

export function createDbPlayer(name: string, avatar: string): number {
  if (!db) return 0;
  try {
    db.run("INSERT OR IGNORE INTO players (name, avatar) VALUES (?, ?)", [name, avatar]);
    saveDb();
    const res = db.exec("SELECT id FROM players WHERE name = ?", [name]);
    if (res.length > 0 && res[0].values.length > 0) {
      return res[0].values[0][0] as number;
    }
    return 0;
  } catch (e) {
    console.error("Failed to create player", e);
    return 0;
  }
}

export function saveMatchRound(playerName: string, avatar: string | undefined, history: HistoryType) {
  if (!db) return;
  try {
    // Find player_id
    const res = db.exec("SELECT id FROM players WHERE name = ?", [playerName]);
    let playerId: number;
    if (res.length > 0 && res[0].values.length > 0) {
      playerId = res[0].values[0][0] as number;
      // Update avatar if empty
      const currentAvatarRes = db.exec("SELECT avatar FROM players WHERE id = ?", [playerId]);
      const currentAvatar = currentAvatarRes[0]?.values[0]?.[0];
      if (!currentAvatar && avatar) {
        db.run("UPDATE players SET avatar = ? WHERE id = ?", [avatar, playerId]);
        saveDb();
      }
    } else {
      playerId = createDbPlayer(playerName, avatar || "");
    }

    db.run(`
      INSERT INTO match_history (
        player_id, game_number, state, point_change, point_delta,
        cards_count, is_chay, sam_status, is_chopped2, cards_delta, chops_delta
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      playerId,
      history.gameNumber,
      history.state,
      history.pointChange,
      history.pointDelta ?? 0,
      history.cardsCount ?? 0,
      history.isChay ? 1 : 0,
      history.samStatus ?? "none",
      history.isChopped2 ? 1 : 0,
      history.cardsDelta ?? 0,
      history.chopsDelta ?? 0
    ]);
    saveDb();
  } catch (e) {
    console.error("Failed to save match round", e);
  }
}

export function deleteMatchRound(playerName: string, gameNumber: number) {
  if (!db) return;
  try {
    db.run(`
      DELETE FROM match_history 
      WHERE player_id = (SELECT id FROM players WHERE name = ?) AND game_number = ?
    `, [playerName, gameNumber]);
    saveDb();
  } catch (e) {
    console.error("Failed to delete match round", e);
  }
}

export type LeaderboardRow = {
  rank: number;
  name: string;
  avatar: string;
  totalPoints: number;
  totalGames: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
};

export function getLeaderboard(): LeaderboardRow[] {
  if (!db) return [];
  try {
    const sql = `
      SELECT 
        p.name,
        p.avatar,
        COALESCE(SUM(m.point_delta), 0) as total_points,
        COUNT(m.id) as total_games,
        SUM(CASE WHEN m.state = 'W' THEN 1 ELSE 0 END) as wins,
        SUM(CASE WHEN m.state = 'L' THEN 1 ELSE 0 END) as losses,
        SUM(CASE WHEN m.state = 'H' THEN 1 ELSE 0 END) as draws
      FROM players p
      LEFT JOIN match_history m ON p.id = m.player_id
      GROUP BY p.id
      ORDER BY total_points DESC
    `;
    const res = db.exec(sql);
    if (res.length === 0) return [];
    const columns = res[0].columns;
    const values = res[0].values;
    
    const list = values.map((row: any) => {
      const obj: any = {};
      columns.forEach((col: string, idx: number) => {
        obj[col] = row[idx];
      });
      return obj;
    });

    return list.map((item: any, idx: number) => {
      const total_games = item.total_games || 0;
      const wins = item.wins || 0;
      const winRate = total_games > 0 ? Math.round((wins / total_games) * 100) : 0;
      return {
        rank: idx + 1,
        name: item.name,
        avatar: item.avatar,
        totalPoints: item.total_points || 0,
        totalGames: total_games,
        wins: wins,
        losses: item.losses || 0,
        draws: item.draws || 0,
        winRate: winRate,
      };
    });
  } catch (e) {
    console.error("Failed to fetch leaderboard", e);
    return [];
  }
}
