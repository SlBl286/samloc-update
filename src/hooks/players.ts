import { PlayerType } from "@/types";
import { create } from "zustand";
import a from "@/assets/capybara.png";
type PlayersStore = {
  LAST_ID: number;
  players: PlayerType[];
  add: (player: PlayerType) => void;
  remove: (id: number) => void;
  update: (id: number, data: PlayerType) => void;
  getPlayer: (id: number) => PlayerType ;
};

export const usePlayers = create<PlayersStore>((set, get) => ({
  LAST_ID: 1,
  players: [
    {
      id: 0,
      name: "Qý",
      point: 0,
      image: a,
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
      const updatedPlayer: PlayerType = {
        id: id,
        name: data.name,
        point: data.point,
        image: data.image,
        description: data.description,
      };
      const deletedPlayers = state.players.filter(p=> p.id !== id);
      console.log(deletedPlayers);
      return { players: [...deletedPlayers, updatedPlayer] };
    });
  },
  getPlayer: (id) => {
    var player = get().players.find((p) => p.id === id);
    return player ?? get().players[0];
  },
}));
