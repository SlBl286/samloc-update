import { PlayerType } from "@/common/types";
import { create } from "zustand";
import panda from "@/assets/panda.png";
import { GAME_KEY, LAST_ID_KEY } from "@/common/contants";
type PlayersStore = {
  LAST_ID: number;
  players: PlayerType[];
  add: (player: PlayerType) => void;
  remove: (id: number) => void;
  update: (id: number, data: PlayerType) => void;
  setPoint: (id: number, point: number) => void;
  getPlayer: (id: number) => PlayerType;
  saveGame: () => void;
  loadGame: (lastId?: number, playersRestore?: PlayerType[]) => void;
  clearSaveGame: () => void;
};

export const usePlayers = create<PlayersStore>((set, get) => ({
  LAST_ID: 1,
  players: [
    {
      id: 0,
      name: "Qý",
      point: 0,
      image: panda,
    },
  ],
  add: (player) => {
    set((state) => ({
      players: [...state.players, player],
      LAST_ID: state.LAST_ID + 1,
    }));
  },
  remove: (id) => {
    set((state) => {
      return { players: [...state.players.filter((p) => p.id !== id)] };
    });
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
      };
      const deletedPlayers = state.players.filter((p) => p.id !== id);
      return { players: [...deletedPlayers, updatedPlayer] };
    });
  },
  setPoint: (id, point) => {
    set((state) => {
      var currentPlayer =
        state.players.find((p) => p.id === id) ?? state.players[0];
      const updatedPlayer: PlayerType = {
        id: id,
        name: currentPlayer.name,
        point: point,
        image: currentPlayer.image,
        description: currentPlayer.description,
      };
      const deletedPlayers = state.players.filter((p) => p.id !== id);
      return { players: [...deletedPlayers, updatedPlayer] };
    });
  },
  getPlayer: (id) => {
    var player = get().players.find((p) => p.id === id);
    return player ?? get().players[0];
  },
  saveGame: () => {
    localStorage.setItem(GAME_KEY, JSON.stringify(get().players));
    localStorage.setItem(LAST_ID_KEY, JSON.stringify(get().LAST_ID));
  },
  loadGame: (lastId, playersRestore) => {
    set((_) => {
      if (lastId && playersRestore) {
        return { players: playersRestore, LAST_ID: lastId };

      } else {
        let playersStr = localStorage.getItem(GAME_KEY);
        let lastIdStr = localStorage.getItem(LAST_ID_KEY);
        let playersBackup: PlayerType[] = [
          {
            id: 0,
            name: "Qý",
            point: 0,
            image: panda,
          },
        ];
        let lastIdBackup = 1;
        if (playersStr) {
          playersBackup = JSON.parse(playersStr);
        }
        if (lastIdStr) {
          lastIdBackup = JSON.parse(lastIdStr);
        }

        return { players: playersBackup, LAST_ID: lastIdBackup };
      }
    });
  },

  clearSaveGame: () => {
    set((_) => {
      return {
        LAST_ID: 1,
        players: [
          {
            id: 0,
            name: "Qý",
            point: 0,
            image: panda,
          },
        ],
      };
    });
  },
}));
