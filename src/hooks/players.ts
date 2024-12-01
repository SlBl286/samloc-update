import { PlayerType } from "@/types";
import { create } from "zustand";
import panda from "@/assets/panda.png";
type PlayersStore = {
  LAST_ID: number;
  players: PlayerType[];
  add: (player: PlayerType) => void;
  remove: (id: number) => void;
  update: (id: number, data: PlayerType) => void;
  setPoint: (id: number, point: number) => void;
  getPlayer: (id: number) => PlayerType ;
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
      return { players: [...state.players.filter(p=> p.id !== id)] };
    });
  },
  update: (id, data) => {
    set((state) => {
      var currentPlayer = state.players.find((p) => p.id === id) ?? state.players[0]
      const updatedPlayer: PlayerType = {
        id: id,
        name: data.name,
        point: currentPlayer .point,
        image: data.image,
        description: currentPlayer.description,
      };
      const deletedPlayers = state.players.filter(p=> p.id !== id);
      return { players: [...deletedPlayers, updatedPlayer] };
    });
  },
  setPoint: (id, point) => {
    set((state) => {
      var currentPlayer = state.players.find((p) => p.id === id) ?? state.players[0]
      const updatedPlayer: PlayerType = {
        id: id,
        name: currentPlayer.name,
        point: point,
        image: currentPlayer.image,
        description: currentPlayer.description,
      };
      const deletedPlayers = state.players.filter(p=> p.id !== id);
      return { players: [...deletedPlayers, updatedPlayer] };
    });
  },
  getPlayer: (id) => {
    var player = get().players.find((p) => p.id === id);
    return player ?? get().players[0];
  },
}));
