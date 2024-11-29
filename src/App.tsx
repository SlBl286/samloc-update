import { ThemeProvider } from "./components/theme-provider";
import { ModeToggle } from "./components/mode-toggle";
import { Player } from "./components/player";
import { AddPlayerModal } from "./components/add-player-modal";
import { usePlayers } from "./hooks/players";
import { useState } from "react";
import { UpdatePlayerModal } from "./components/update-player-modal";
import { DeletePlayerDialog } from "./components/delete-player-modal";
import { WinGameModal } from "./components/win-game-modal";
import { CheckGameModal } from "./components/check-game-modal";
function App() {
  const { players, remove, getPlayer } = usePlayers();
  const [idSelected, setIdSelected] = useState<number | null>(null);

  const onRemovePlayer = () => {
    remove(idSelected ?? 0);
    setIdSelected(null);
  };

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <div className="w-screen h-screen items-center justify-center flex">
        <div className="fixed top-4 left-4 flex gap-x-2">
          <AddPlayerModal />
          {idSelected !== null && (
            <div className="inline-flex gap-x-2">
              <UpdatePlayerModal
                id={idSelected}
                onDialogClose={() => {
                  setIdSelected(null);
                }}
              />
              <DeletePlayerDialog
                playerName={getPlayer(idSelected).name}
                onConfirm={onRemovePlayer}
                onCancel={() => {}}
              />
            </div>
          )}
        </div>
        <div className="fixed top-4 right-4">
          <ModeToggle />
        </div>
        <div className="flex flex-col gap-y-4 w-screen md:w-[500px] items-center justify-center px-4">
          {players
            .sort((a, b) => a.id - b.id)
            .map((p) => (
              <Player
                isSelected={idSelected === p.id}
                onClick={() => {
                  setIdSelected(p.id);
                }}
                key={p.id}
                name={p.name}
                description={p.description}
                image={p.image}
                point={p.point}
              />
            ))}
        </div>
        {idSelected !== null && (
          <div className=" fixed bottom-10 flex gap-x-2">
            <WinGameModal id={idSelected}/>
            <CheckGameModal id={idSelected} />
          </div>
        )}
      </div>
    </ThemeProvider>
  );
}

export default App;
