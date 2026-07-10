import { PlayerType, HistoryType } from "@/common/types";
import { create } from "zustand";
import { GAME_KEY, LAST_ID_KEY } from "@/common/contants";

const DEFAULT_PLAYER: PlayerType = {
  id: -1,
  name: "",
  point: 0,
  image: "",
  histories: []
};

export type RedoItem = {
  playerId: number;
  point: number;
  historyItem: HistoryType;
}[];

type PlayersStore = {
  LAST_ID: number;
  players: PlayerType[];
  redoStack: RedoItem[];
  multiplier: number;
  add: (player: PlayerType) => void;
  addMultiple: (newPlayers: Omit<PlayerType, "id">[]) => void;
  remove: (id: number) => void;
  update: (id: number, data: PlayerType) => void;
  setPoint: (id: number, point: number, historyDetails?: Partial<HistoryType>) => void;
  getPlayer: (id: number) => PlayerType;
  getHighestPointId : () => number;
  saveGame: () => void;
  loadGame: (lastId?: number, playersRestore?: PlayerType[], multiplierRestore?: number) => void;
  clearSaveGame: () => void;
  undo: () => void;
  redo: () => void;
  setMultiplier: (val: number) => void;
};

export const usePlayers = create<PlayersStore>((set, get) => ({
  LAST_ID: 0,
  players: [],
  redoStack: [],
  multiplier: 1,
  setMultiplier: (val) => {
    set({ multiplier: val });
    get().saveGame();
  },
  add: (player) => {
    set((state) => ({
      players: [...state.players, player],
      LAST_ID: state.LAST_ID + 1,
      redoStack: [],
    }));
    get().saveGame();
  },
  addMultiple: (newPlayers) => {
    set((state) => {
      let currentLastId = state.LAST_ID;
      const playersWithIds = newPlayers.map((p, idx) => ({
        ...p,
        id: currentLastId + idx
      }));
      return {
        players: [...state.players, ...playersWithIds],
        LAST_ID: currentLastId + newPlayers.length,
        redoStack: [],
      };
    });
    get().saveGame();
  },
  remove: (id) => {
    set((state) => {
      return { 
        players: [...state.players.filter((p) => p.id !== id)],
        redoStack: [],
      };
    });
    get().saveGame();
  },
  update: (id, data) => {
    set((state) => {
      var currentPlayer =
        state.players.find((p) => p.id === id) ?? state.players[0];
      const updatedPlayer: PlayerType = {
        id: id,
        name: data.name,
        point: currentPlayer.point,
        image: data.image,
        description: currentPlayer.description,
        histories : currentPlayer.histories
      };
      const deletedPlayers = state.players.filter((p) => p.id !== id);
      return { 
        players: [...deletedPlayers, updatedPlayer],
        redoStack: [],
      };
    });
    get().saveGame();
  },
  setPoint: (id, point, historyDetails) => {
    set((state) => {
      var currentPlayer =
        state.players.find((p) => p.id === id) ?? state.players[0];
      var histories = [...currentPlayer.histories];
      
      const gameNumber = historyDetails?.gameNumber ?? (histories.length + 1);
      const pointDelta = point - currentPlayer.point;
      const stateVal = historyDetails?.state ?? (pointDelta > 0 ? "W" : pointDelta < 0 ? "L" : "H");

      const newHistory = {
        gameNumber,
        state: stateVal,
        pointChange: point,
        pointDelta: pointDelta,
        cardsCount: historyDetails?.cardsCount ?? 0,
        isChay: historyDetails?.isChay ?? false,
        samStatus: historyDetails?.samStatus ?? "none",
        isChopped2: historyDetails?.isChopped2 ?? false,
        block2: historyDetails?.block2 ?? 0,
        isBlock2: historyDetails?.isBlock2 ?? 0,
        cardsDelta: historyDetails?.cardsDelta,
        chopsDelta: historyDetails?.chopsDelta,
        multiplier: state.multiplier,
      };
      histories.push(newHistory);

      const updatedPlayer: PlayerType = {
        id: id,
        name: currentPlayer.name,
        point: point,
        image: currentPlayer.image,
        description: currentPlayer.description,
        histories: histories
      };
      const deletedPlayers = state.players.filter((p) => p.id !== id);
      return { 
        players: [...deletedPlayers, updatedPlayer],
        redoStack: [],
      };
    });
  },
  getPlayer: (id) => {
    var player = get().players.find((p) => p.id === id);
    return player || DEFAULT_PLAYER;
  },
  saveGame: () => {
    localStorage.setItem(GAME_KEY, JSON.stringify(get().players));
    localStorage.setItem(LAST_ID_KEY, JSON.stringify(get().LAST_ID));
    localStorage.setItem("redo_stack", JSON.stringify(get().redoStack));
    localStorage.setItem("game_multiplier", JSON.stringify(get().multiplier));
  },
  loadGame: (lastId, playersRestore, multiplierRestore) => {
    set((_) => {
      if (lastId && playersRestore) {
        return { 
          players: playersRestore, 
          LAST_ID: lastId, 
          multiplier: multiplierRestore ?? 1,
          redoStack: [] 
        };
      } else {
        let playersStr = localStorage.getItem(GAME_KEY);
        let lastIdStr = localStorage.getItem(LAST_ID_KEY);
        let redoStackStr = localStorage.getItem("redo_stack");
        let multiplierStr = localStorage.getItem("game_multiplier");

        let playersBackup: PlayerType[] = [];
        let lastIdBackup = 0;
        let redoStackBackup: RedoItem[] = [];
        let multiplierBackup = 1;

        if (playersStr) {
          try {
            const parsed = JSON.parse(playersStr);
            if (Array.isArray(parsed)) {
              playersBackup = parsed;
            }
          } catch (e) {
            console.error("Failed to parse players from localStorage", e);
          }
        }
        if (lastIdStr) {
          lastIdBackup = JSON.parse(lastIdStr);
        }
        if (redoStackStr) {
          try {
            redoStackBackup = JSON.parse(redoStackStr);
          } catch (e) {
            redoStackBackup = [];
          }
        }
        if (multiplierStr) {
          try {
            multiplierBackup = JSON.parse(multiplierStr);
          } catch (e) {
            multiplierBackup = 1;
          }
        }

        return { 
          players: playersBackup, 
          LAST_ID: lastIdBackup, 
          redoStack: redoStackBackup, 
          multiplier: multiplierBackup 
        };
      }
    });
  },
  getHighestPointId:()=> {
    var players =[...get().players]
    return players.sort((a,b)=> b.point - a.point)[0].id;
  },
  clearSaveGame: () => {
    set({
      LAST_ID: 0,
      players: [],
      redoStack: [],
      multiplier: 1,
    });
    localStorage.setItem(GAME_KEY, JSON.stringify([]));
    localStorage.setItem(LAST_ID_KEY, "0");
    localStorage.setItem("redo_stack", "[]");
    localStorage.setItem("game_multiplier", "1");
  },
  undo: () => {
    set((state) => {
      if (state.players.length === 0) return {};
      const maxHistoryLen = Math.max(...state.players.map((p) => p.histories.length));
      if (maxHistoryLen <= 0) return {};

      // 1. Capture redo item
      const redoItem: RedoItem = state.players.map((p) => {
        const lastHistory = p.histories[p.histories.length - 1];
        return {
          playerId: p.id,
          point: p.point,
          historyItem: lastHistory,
        };
      });

      const updatedPlayers = state.players.map((p) => {
        const histories = [...p.histories];
        if (histories.length === 0) return p;

        const popped = histories.pop()!;
        let prevPoint = 0;
        if (popped.pointDelta !== undefined) {
          prevPoint = p.point - popped.pointDelta;
        } else if (histories.length > 0) {
          prevPoint = histories[histories.length - 1].pointChange;
        } else {
          prevPoint = 0;
        }

        return {
          ...p,
          point: prevPoint,
          histories: histories,
        };
      });

      return { 
        players: updatedPlayers,
        redoStack: [...state.redoStack, redoItem]
      };
    });
    get().saveGame();
  },
  redo: () => {
    set((state) => {
      if (state.redoStack.length === 0) return {};

      const nextRedoStack = [...state.redoStack];
      const redoItem = nextRedoStack.pop()!;

      const updatedPlayers = state.players.map((p) => {
        const target = redoItem.find((item) => item.playerId === p.id);
        if (!target || !target.historyItem) return p;

        return {
          ...p,
          point: target.point,
          histories: [...p.histories, target.historyItem],
        };
      });

      return {
        players: updatedPlayers,
        redoStack: nextRedoStack,
      };
    });
    get().saveGame();
  },
}));
