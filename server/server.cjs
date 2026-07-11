const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

app.set('trust proxy', true);
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Disable caching for API responses
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  next();
});

// SQLite Database Setup
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
const dbFile = path.join(DATA_DIR, 'samloc.db');
const oldDbFile = path.join(__dirname, 'samloc.db');

// Migration: If database exists in old path but not in the new path, move it
if (fs.existsSync(oldDbFile) && !fs.existsSync(dbFile)) {
  try {
    fs.renameSync(oldDbFile, dbFile);
    console.log('Migrated database from server/samloc.db to server/data/samloc.db');
  } catch (err) {
    console.error('Failed to migrate database to server/data:', err);
  }
}

// Check if database needs to be initialized from base64 file
if (!fs.existsSync(dbFile)) {
  const base64File = path.join(__dirname, '../sqllite_base64');
  if (fs.existsSync(base64File)) {
    try {
      const base64Content = fs.readFileSync(base64File, 'utf8').trim();
      const buffer = Buffer.from(base64Content, 'base64');
      fs.writeFileSync(dbFile, buffer);
      console.log('Successfully decoded sqlite_base64 file into server/data/samloc.db');
    } catch (err) {
      console.error('Failed to decode sqllite_base64 file:', err);
    }
  }
}

// Connect to SQLite
const db = new sqlite3.Database(dbFile, (err) => {
  if (err) {
    console.error('Failed to connect to SQLite database:', err);
  } else {
    console.log('Connected to SQLite database at:', dbFile);
    createTables();
  }
});

// Helper functions to wrap sqlite3 with promises
const runQuery = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
};

const getQuery = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const allQuery = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

function createTables() {
  db.serialize(() => {
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
        multiplier INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
      );
    `);

    // Migration: Add multiplier column if it does not exist
    db.run("ALTER TABLE match_history ADD COLUMN multiplier INTEGER DEFAULT 1", (err) => {
      if (err && !err.message.includes("duplicate column name")) {
        console.error("Migration warning for multiplier column:", err.message);
      }
    });
  });
}

// Helper functions for saving base64 avatars and handling URLs
function saveAvatarFile(avatarData) {
  if (!avatarData || typeof avatarData !== 'string') {
    return avatarData || '';
  }

  // Strip backend host / domain prefix to store relative path in the database
  const uploadsIndex = avatarData.indexOf('/uploads/');
  if (uploadsIndex !== -1) {
    return avatarData.substring(uploadsIndex);
  }

  // Match base64 Data URLs
  const base64Regex = /^data:([^;]+);base64,/;
  const match = avatarData.match(base64Regex);
  if (!match) {
    return avatarData; // Presets or existing standard URL
  }

  const mimeType = match[1];
  let ext = 'png';
  if (mimeType.startsWith('image/')) {
    ext = mimeType.split('/')[1];
    if (ext === 'jpeg') ext = 'jpg';
    ext = ext.replace(/[^a-zA-Z0-9]/g, '');
  }

  const base64Data = avatarData.replace(base64Regex, '');
  const buffer = Buffer.from(base64Data, 'base64');

  const uploadsDir = path.join(DATA_DIR, 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}.${ext}`;
  const filePath = path.join(uploadsDir, filename);

  try {
    fs.writeFileSync(filePath, buffer);
    return `/uploads/${filename}`;
  } catch (err) {
    console.error('Failed to save uploaded image file:', err);
    return '';
  }
}

function deleteOldAvatar(oldAvatarPath) {
  if (oldAvatarPath && oldAvatarPath.startsWith('/uploads/')) {
    const filename = oldAvatarPath.replace('/uploads/', '');
    const filePath = path.join(DATA_DIR, 'uploads', filename);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
        console.log('Successfully deleted old avatar file:', filePath);
      } catch (err) {
        console.error('Failed to delete old avatar file:', err);
      }
    }
  }
}

function resolveAvatarUrl(req, avatarPath) {
  if (!avatarPath || !avatarPath.startsWith('/uploads/')) {
    return avatarPath || '';
  }
  const baseUrl = process.env.BACKEND_URL || `${req.protocol}://${req.get('host')}`;
  return `${baseUrl}${avatarPath}`;
}

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(DATA_DIR, 'uploads')));

// API Routes

// 1. Get all players
app.get('/api/players', async (req, res) => {
  try {
    const rows = await allQuery('SELECT id, name, avatar FROM players ORDER BY name COLLATE NOCASE');
    const processed = rows.map(r => ({
      ...r,
      avatar: resolveAvatarUrl(req, r.avatar)
    }));
    res.json(processed);
  } catch (err) {
    console.error('Failed to get players:', err);
    res.status(500).json({ error: 'Failed to retrieve players' });
  }
});

// 2. Create/register a new player
app.post('/api/players', async (req, res) => {
  const { name, avatar } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }
  try {
    const finalAvatar = saveAvatarFile(avatar);
    await runQuery('INSERT OR IGNORE INTO players (name, avatar) VALUES (?, ?)', [name, finalAvatar]);
    const row = await getQuery('SELECT id FROM players WHERE name = ?', [name]);
    res.json({ id: row ? row.id : 0 });
  } catch (err) {
    console.error('Failed to create player:', err);
    res.status(500).json({ error: 'Failed to create player' });
  }
});

// 3. Get leaderboard stats
app.get('/api/leaderboard', async (req, res) => {
  try {
    const sql = `
      SELECT 
        p.name,
        p.avatar,
        COALESCE(SUM(m.point_delta), 0) as total_points,
        COUNT(m.id) as total_games,
        SUM(CASE WHEN m.game_number = 1 THEN 1 ELSE 0 END) as total_matches,
        SUM(CASE WHEN m.state = 'W' THEN 1 ELSE 0 END) as wins,
        SUM(CASE WHEN m.state = 'L' THEN 1 ELSE 0 END) as losses,
        SUM(CASE WHEN m.state = 'H' THEN 1 ELSE 0 END) as draws
      FROM players p
      LEFT JOIN match_history m ON p.id = m.player_id
      GROUP BY p.id
    `;
    const rows = await allQuery(sql);
    
    const list = rows.map((item) => {
      const total_games = item.total_games || 0;
      const total_points = item.total_points || 0;
      const total_matches = item.total_matches || (total_games > 0 ? 1 : 0);
      const efficiency = total_games > 0 ? Number((total_points / total_games).toFixed(2)) : 0;
      const wins = item.wins || 0;
      const winRate = total_games > 0 ? Math.round((wins / total_games) * 100) : 0;
      return {
        name: item.name,
        avatar: resolveAvatarUrl(req, item.avatar),
        totalPoints: total_points,
        totalGames: total_games,
        totalMatches: total_matches,
        wins: wins,
        losses: item.losses || 0,
        draws: item.draws || 0,
        winRate: winRate,
        efficiency: efficiency
      };
    });
    
    // Sort by efficiency descending, then totalPoints descending, then totalGames descending, then alphabetically by name
    list.sort((a, b) => {
      if (b.efficiency !== a.efficiency) {
        return b.efficiency - a.efficiency;
      }
      if (b.totalPoints !== a.totalPoints) {
        return b.totalPoints - a.totalPoints;
      }
      if (b.totalGames !== a.totalGames) {
        return b.totalGames - a.totalGames;
      }
      return a.name.localeCompare(b.name);
    });

    const rankedList = list.map((item, idx) => ({
      ...item,
      rank: idx + 1
    }));
    
    res.json(rankedList);
  } catch (err) {
    console.error('Failed to compute leaderboard:', err);
    res.status(500).json({ error: 'Failed to compute leaderboard' });
  }
});

// 4. Batch save match round histories
app.post('/api/match', async (req, res) => {
  const matchData = req.body;
  if (!Array.isArray(matchData)) {
    return res.status(400).json({ error: 'Invalid match data format' });
  }

  try {
    // Generate a single shared timestamp in Vietnam timezone (Asia/Ho_Chi_Minh)
    const vnDate = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    const parts = formatter.formatToParts(vnDate);
    const partMap = {};
    for (const p of parts) {
      partMap[p.type] = p.value;
    }
    const createdAt = `${partMap.year}-${partMap.month}-${partMap.day} ${partMap.hour}:${partMap.minute}:${partMap.second}`;

    await runQuery('BEGIN TRANSACTION');

    for (const player of matchData) {
      const { name, image, histories } = player;

      // Find or create player
      let dbPlayer = await getQuery('SELECT id, avatar FROM players WHERE name = ?', [name]);
      let playerId;

      if (dbPlayer) {
        playerId = dbPlayer.id;
        // Update avatar if a new one is provided and it is different
        const finalImage = saveAvatarFile(image);
        if (finalImage && dbPlayer.avatar !== finalImage) {
          await runQuery('UPDATE players SET avatar = ? WHERE id = ?', [finalImage, playerId]);
          if (dbPlayer.avatar) {
            deleteOldAvatar(dbPlayer.avatar);
          }
        }
      } else {
        const finalImage = saveAvatarFile(image);
        const insertRes = await runQuery('INSERT INTO players (name, avatar) VALUES (?, ?)', [name, finalImage || '']);
        playerId = insertRes.lastID;
      }

      // Insert histories
      for (const history of histories) {
        await runQuery(`
          INSERT INTO match_history (
            player_id, game_number, state, point_change, point_delta,
            cards_count, is_chay, sam_status, is_chopped2, cards_delta, chops_delta,
            multiplier, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          playerId,
          history.gameNumber,
          history.state,
          history.pointChange,
          history.pointDelta ?? 0,
          history.cardsCount ?? 0,
          history.isChay ? 1 : 0,
          history.samStatus ?? 'none',
          history.isChopped2 ? 1 : 0,
          history.cardsDelta ?? 0,
          history.chopsDelta ?? 0,
          history.multiplier ?? 1,
          createdAt
        ]);
      }
    }

    await runQuery('COMMIT');
    res.json({ success: true });
  } catch (err) {
    console.error('Error saving match rounds:', err);
    try {
      await runQuery('ROLLBACK');
    } catch (rollbackErr) {
      console.error('Failed to rollback transaction:', rollbackErr);
    }
    res.status(500).json({ error: 'Failed to save match history' });
  }
});

// 5. Update a player's name and/or avatar
app.put('/api/players', async (req, res) => {
  const { oldName, newName, avatar } = req.body;
  if (!oldName || !newName) {
    return res.status(400).json({ error: 'Both oldName and newName are required' });
  }
  try {
    const player = await getQuery('SELECT avatar FROM players WHERE name = ?', [oldName]);
    const finalAvatar = saveAvatarFile(avatar);

    await runQuery(
      'UPDATE players SET name = ?, avatar = ? WHERE name = ?',
      [newName, finalAvatar, oldName]
    );

    if (player && player.avatar && player.avatar !== finalAvatar) {
      deleteOldAvatar(player.avatar);
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Failed to update player:', err);
    if (err.message && err.message.includes('UNIQUE constraint failed')) {
      res.status(400).json({ error: 'Tên người chơi mới đã tồn tại!' });
    } else {
      res.status(500).json({ error: 'Failed to update player' });
    }
  }
});

// 6. Get player details and detailed timeline history
app.get('/api/players/:name/history', async (req, res) => {
  const { name } = req.params;
  try {
    const player = await getQuery('SELECT id FROM players WHERE name = ?', [name]);
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }
    
    const history = await allQuery(`
      SELECT 
        game_number, state, point_change, point_delta, cards_count,
        is_chay, sam_status, is_chopped2, cards_delta, chops_delta, multiplier, created_at
      FROM match_history 
      WHERE player_id = ?
      ORDER BY created_at DESC, game_number DESC
    `, [player.id]);

    const totalRounds = history.length;
    // Estimate matches by occurrences of game_number = 1
    const totalMatches = history.filter(h => h.game_number === 1).length || (totalRounds > 0 ? 1 : 0);

    const wins = history.filter(h => h.state === 'W').length;
    const losses = history.filter(h => h.state === 'L').length;
    const draws = history.filter(h => h.state === 'H').length;

    const totalChay = history.filter(h => h.is_chay === 1).length;
    const totalChopped2 = history.filter(h => h.is_chopped2 === 1).length;

    const samBao = history.filter(h => h.sam_status === 'success' || h.sam_status === 'fail' || h.sam_status === 'block').length;
    const samWin = history.filter(h => h.sam_status === 'success').length;
    const samFail = history.filter(h => h.sam_status === 'fail' || h.sam_status === 'block').length;

    const totalPoints = history.reduce((sum, h) => sum + h.point_delta, 0);

    res.json({
      stats: {
        totalMatches,
        totalRounds,
        wins,
        losses,
        draws,
        totalChay,
        totalChopped2,
        samBao,
        samWin,
        samFail,
        totalPoints
      },
      history
    });
  } catch (err) {
    console.error('Failed to get player history:', err);
    res.status(500).json({ error: 'Failed to retrieve player history' });
  }
});
// 7. Get list of all matches
app.get('/api/matches', async (req, res) => {
  try {
    const rows = await allQuery(`
      SELECT 
        m.created_at,
        p.name,
        p.avatar,
        m.game_number,
        m.point_delta
      FROM match_history m
      JOIN players p ON m.player_id = p.id
      ORDER BY m.created_at DESC, m.game_number ASC
    `);

    // Group rows by created_at in Javascript
    const matchesMap = new Map();
    for (const r of rows) {
      if (!matchesMap.has(r.created_at)) {
        matchesMap.set(r.created_at, {
          timestamp: r.created_at,
          totalRounds: 0,
          playersMap: new Map()
        });
      }
      const match = matchesMap.get(r.created_at);
      
      // Track total rounds (max game_number seen)
      if (r.game_number > match.totalRounds) {
        match.totalRounds = r.game_number;
      }

      // Sum point_delta per player in this match
      if (!match.playersMap.has(r.name)) {
        match.playersMap.set(r.name, {
          name: r.name,
          avatar: resolveAvatarUrl(req, r.avatar),
          points: 0
        });
      }
      match.playersMap.get(r.name).points += r.point_delta;
    }

    // Convert Map to array and format
    const matches = Array.from(matchesMap.values()).map(m => ({
      timestamp: m.timestamp,
      totalRounds: m.totalRounds,
      players: Array.from(m.playersMap.values()).sort((a, b) => b.points - a.points)
    }));

    res.json(matches);
  } catch (err) {
    console.error('Failed to get matches list:', err);
    res.status(500).json({ error: 'Failed to retrieve matches list' });
  }
});

// 8. Get detail of a specific match by timestamp
app.get('/api/matches/detail', async (req, res) => {
  const { timestamp } = req.query;
  if (!timestamp) {
    return res.status(400).json({ error: 'Timestamp is required' });
  }
  try {
    const rows = await allQuery(`
      SELECT 
        m.game_number,
        m.state,
        m.point_change,
        m.point_delta,
        m.cards_count,
        m.is_chay,
        m.sam_status,
        m.is_chopped2,
        m.cards_delta,
        m.chops_delta,
        m.multiplier,
        p.name,
        p.avatar
      FROM match_history m
      JOIN players p ON m.player_id = p.id
      WHERE m.created_at = ?
      ORDER BY m.game_number ASC, p.name ASC
    `, [timestamp]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Match not found' });
    }

    // Get unique player names list in this match
    const playersSet = new Set();
    for (const r of rows) {
      playersSet.add(r.name);
    }
    const players = Array.from(playersSet);

    // Group rows by game_number (round)
    const roundsMap = new Map();
    for (const r of rows) {
      if (!roundsMap.has(r.game_number)) {
        roundsMap.set(r.game_number, {
          gameNumber: r.game_number,
          multiplier: r.multiplier || 1,
          scores: {}
        });
      }
      roundsMap.get(r.game_number).scores[r.name] = {
        state: r.state,
        pointChange: r.point_change,
        pointDelta: r.point_delta,
        cardsCount: r.cards_count,
        isChay: r.is_chay === 1,
        samStatus: r.sam_status,
        isChopped2: r.is_chopped2 === 1,
        cardsDelta: r.cards_delta,
        chopsDelta: r.chops_delta
      };
    }

    const rounds = Array.from(roundsMap.values());

    res.json({
      timestamp,
      players,
      rounds
    });
  } catch (err) {
    console.error('Failed to get match details:', err);
    res.status(500).json({ error: 'Failed to retrieve match details' });
  }
});


// Serve built frontend assets in production if they exist
const distPath = path.join(__dirname, '../dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get(/.*/, (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Backend server is running on http://localhost:${PORT}`);
});
