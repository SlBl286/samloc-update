import { ThemeProvider } from "./components/theme-provider";
import { ModeToggle } from "./components/mode-toggle";
import { Player } from "./components/player";
import { AddPlayerModal } from "./components/add-player-modal";
import { usePlayers } from "./hooks/players";
import { useEffect, useState } from "react";
import { UpdatePlayerModal } from "./components/update-player-modal";
import { DeletePlayerDialog } from "./components/delete-player-modal";
import { WinGameModal } from "./components/win-game-modal";
import { CheckGameModal } from "./components/check-game-modal";
import { useToast } from "./hooks/use-toast";
import { SettingsDropdown } from "./components/setting-dropdown";
function App() {
  const { players, remove, getPlayer, loadGame } = usePlayers();
  const [idSelected, setIdSelected] = useState<number | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadGame();
  }, []);
  const onRemovePlayer = () => {
    const player = getPlayer(idSelected ?? 0);
    if (player.point !== 0) {
      toast({
        title: "Không thể xoá " + player.name,
        description: "Chưa đưa điểm về 0 nên ko thể xoá!",
        variant: "destructive",
      });
    } else {
      remove(idSelected ?? 0);
      setIdSelected(null);
    }
  };

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <div className="w-screen h-screen items-center justify-center flex">
        <div className="fixed top-4 left-4 ">
          <AddPlayerModal />
        </div>

        <div className="fixed top-4 right-4 flex gap-x-2">
          <ModeToggle />
          <SettingsDropdown />
        </div>
        <div className="flex flex-col relative  gap-y-4 w-screen md:w-[500px] items-center justify-center px-4">
          {idSelected !== null && (
            <div className=" absolute top-[-50px] gap-x-2 flex">
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
          {players
            .sort((a, b) => a.id - b.id)
            .map((p) => (
                <Player
                  id={p.id}
                  isSelected={idSelected === p.id}
                  onClick={() => {
                    setIdSelected(p.id);
                  }}
                  key={p.id}
                  name={p.name}
                  histories={p.histories}
                  image={p.image}
                  point={p.point}
                />
              )
            )}
        </div>
        {idSelected !== null && (
          <div className=" fixed bottom-10 flex gap-x-2">
            <WinGameModal id={idSelected} />
            <CheckGameModal id={idSelected} />
          </div>
        )}
      </div>
    </ThemeProvider>
  );
}

export default App;
