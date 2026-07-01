import { ThemeProvider } from "./components/theme-provider";
import { ModeToggle } from "./components/mode-toggle";
import { initDb, getLeaderboard, saveMatchRound, LeaderboardRow } from "./services/db";
import { Player } from "./components/player";
import { AddPlayerModal } from "./components/add-player-modal";
import { usePlayers } from "./hooks/players";
import { useEffect, useState } from "react";
import { UpdatePlayerModal } from "./components/update-player-modal";
import { DeletePlayerDialog } from "./components/delete-player-modal";
import { HistoryPlayerModal } from "./components/history-player-modal";
import { WinGameModal } from "./components/win-game-modal";
import { CheckGameModal } from "./components/check-game-modal";
import { useToast } from "./hooks/use-toast";
import { SettingsDropdown } from "./components/setting-dropdown";
import { Flipper, Flipped } from "react-flip-toolkit";
import { Button } from "./components/ui/button";
import { Undo2, Redo2, Trophy, Crown, Medal, Plus, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import blank from "@/assets/blank.png";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function App() {
  const { players, remove, getPlayer, loadGame, undo, redo, redoStack, clearSaveGame } = usePlayers();
  const [idSelected, setIdSelected] = useState<number | null>(null);
  const { toast } = useToast();
  const sortedPlayers = [...players].sort((a, b) => b.point - a.point);

  const [dbLoaded, setDbLoaded] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([]);
  const [gameState, setGameState] = useState<"menu" | "playing">(() => {
    return (localStorage.getItem("game_state") as any) ?? "menu";
  });

  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const hasActiveMatch = players.length > 1 || (players[0]?.histories.length > 0);

  useEffect(() => {
    const startDb = async () => {
      try {
        await initDb();
        loadGame();
        setLeaderboard(getLeaderboard());
      } catch (e) {
        console.error(e);
      } finally {
        setDbLoaded(true);
      }
    };
    startDb();
  }, []);

  const changeGameState = (state: "menu" | "playing") => {
    setGameState(state);
    localStorage.setItem("game_state", state);
    if (state === "menu") {
      setLeaderboard(getLeaderboard());
    }
  };

  const handleCreateNewMatch = () => {
    if (hasActiveMatch) {
      setShowResetConfirm(true);
    } else {
      clearSaveGame();
      setIdSelected(null);
      changeGameState("playing");
    }
  };

  const handleConfirmReset = () => {
    clearSaveGame();
    setIdSelected(null);
    changeGameState("playing");
    setShowResetConfirm(false);
  };

  const handleEndMatch = (save: boolean) => {
    if (save) {
      // Save all active player histories to SQLite
      players.forEach((p) => {
        p.histories.forEach((h) => {
          saveMatchRound(p.name, p.image, h);
        });
      });
      toast({
        title: "Trận đấu kết thúc",
        description: "Đã lưu kết quả thi đấu vào cơ sở dữ liệu SQLite thành công!",
      });
    } else {
      toast({
        title: "Đã huỷ trận đấu",
        description: "Đã hủy trận đấu hiện tại, kết quả không được lưu.",
        variant: "destructive",
      });
    }
    clearSaveGame();
    setIdSelected(null);
    changeGameState("menu");
    setShowEndConfirm(false);
  };

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

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return <Crown className="h-5 w-5 text-yellow-500 fill-yellow-500/20 animate-pulse" />;
    }
    if (rank === 2) {
      return <Trophy className="h-5 w-5 text-slate-400 fill-slate-400/20" />;
    }
    if (rank === 3) {
      return <Medal className="h-5 w-5 text-amber-600 fill-amber-600/20" />;
    }
    return <span className="font-semibold text-muted-foreground w-5 text-center">{rank}</span>;
  };

  if (!dbLoaded) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-y-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
          <span className="text-sm font-medium text-amber-500/80 animate-pulse">
            Đang tải dữ liệu SQLite...
          </span>
        </div>
      </div>
    );
  }

  // --- 1. RENDER LANDING LEADERBOARD VIEW ---
  if (gameState === "menu") {
    return (
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <div className="w-full min-h-screen items-center justify-center flex py-8 bg-background">
          <div className="fixed top-4 right-4 z-50">
            <ModeToggle />
          </div>
          <div className="flex flex-col relative gap-y-6 w-full max-w-[500px] px-4">
            <div className="text-center flex flex-col items-center gap-y-2 mt-4">
              <Trophy className="h-12 w-12 text-yellow-500" />
              <h1 className="text-2xl font-bold tracking-tight">Sâm Lốc Cao Thủ 🏆</h1>
              <p className="text-xs text-muted-foreground">
                Bảng xếp hạng tổng điểm thi đấu của tất cả người chơi.
              </p>
            </div>

            <div className="border rounded-md overflow-hidden bg-background shadow-md">
              {/* Header row */}
              <div className="grid grid-cols-12 bg-muted p-2.5 font-bold text-xs text-muted-foreground border-b uppercase tracking-wider">
                <div className="col-span-2 text-center">Hạng</div>
                <div className="col-span-5 pl-2">Người chơi</div>
                <div className="col-span-3 text-right">Tổng điểm</div>
                <div className="col-span-2 text-center">Tỷ lệ</div>
              </div>

              {/* List */}
              <div className="max-h-[380px] overflow-y-auto divide-y">
                {leaderboard.length === 0 ? (
                  <div className="py-16 text-center text-sm text-muted-foreground">
                    Chưa có người chơi nào. Hãy tạo trận mới!
                  </div>
                ) : (
                  leaderboard.map((row) => (
                    <div
                      key={row.name}
                      className="grid grid-cols-12 p-3 text-xs items-center hover:bg-muted/40 transition-colors"
                    >
                      <div className="col-span-2 flex items-center justify-center">
                        {getRankBadge(row.rank)}
                      </div>
                      <div className="col-span-5 pl-2 flex items-center gap-x-2.5 min-w-0">
                        <img
                          src={row.avatar || blank}
                          className="w-7 h-7 rounded-full object-cover bg-foreground/10"
                          alt=""
                        />
                        <span className="font-semibold text-sm truncate">{row.name}</span>
                      </div>
                      <div className="col-span-3 text-right pr-2 flex flex-col items-end justify-center">
                        <span
                          className={cn(
                            "font-bold text-sm",
                            row.totalPoints > 0
                              ? "text-green-500"
                              : row.totalPoints < 0
                              ? "text-red-500"
                              : "text-muted-foreground"
                          )}
                        >
                          {row.totalPoints > 0 ? `+${row.totalPoints}` : row.totalPoints}
                        </span>
                        <span className="text-[9px] text-muted-foreground mt-0.5">
                          {row.wins}T - {row.losses}B - {row.draws}H
                        </span>
                      </div>
                      <div className="col-span-2 text-center font-medium text-muted-foreground">
                        <span className="font-bold text-foreground">{row.winRate}%</span>
                        <span className="block text-[8px] text-muted-foreground/60">
                          {row.totalGames} ván
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex flex-col gap-y-3 pt-2">
              <Button
                className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-bold text-sm rounded-lg flex items-center justify-center gap-x-2 shadow-sm"
                onClick={handleCreateNewMatch}
              >
                <Plus className="h-5 w-5" /> Tạo trận đấu mới
              </Button>
              {hasActiveMatch && (
                <Button
                  variant="outline"
                  className="w-full h-12 border-amber-500/30 text-amber-500 hover:bg-amber-500/10 font-bold text-sm rounded-lg flex items-center justify-center gap-x-2 shadow-sm"
                  onClick={() => changeGameState("playing")}
                >
                  Tiếp tục trận đang chơi
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* RESET CONFIRM DIALOG */}
        <Dialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Xác nhận tạo trận đấu mới</DialogTitle>
              <DialogDescription className="pt-2 text-xs">
                Đang có một trận đấu dang dở. Tạo trận mới sẽ xóa toàn bộ tiến trình của trận hiện tại mà không lưu vào lịch sử. Bạn có chắc chắn?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex gap-y-2 sm:gap-x-2 mt-4">
              <Button variant="outline" className="flex-1" onClick={() => setShowResetConfirm(false)}>
                Quay lại
              </Button>
              <Button variant="destructive" className="flex-1" onClick={handleConfirmReset}>
                Xóa & Tạo mới
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </ThemeProvider>
    );
  }

  // --- 2. RENDER ACTIVE PLAYING SCORING VIEW ---
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <div className="w-full min-h-screen items-center justify-center flex py-20 bg-background">
        {/* RESPONSIVE TOP HEADER BAR */}
        <header className="fixed top-0 left-0 right-0 h-14 bg-background/85 backdrop-blur-md border-b border-border/40 z-50 flex items-center justify-between px-4">
          {/* Left Part */}
          <div className="flex items-center gap-x-1.5">
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 text-muted-foreground hover:text-foreground"
              onClick={() => changeGameState("menu")}
              title="Quay lại Bảng xếp hạng"
            >
              <ChevronLeft size={16} />
            </Button>
            <AddPlayerModal />
          </div>

          {/* Center Round Indicator */}
          <div className="bg-background/50 px-3.5 py-1 rounded-full border border-border/40 text-xs font-bold text-primary">
            {"Ván " + ((players[0]?.histories.length ?? 0) + 1)}
          </div>

          {/* Right Part */}
          <div className="flex items-center gap-x-1.5">
            {players.length > 0 && players[0].histories.length > 0 && (
              <Button
                variant="outline"
                size="icon"
                className="text-amber-500 border-amber-500/20 bg-background/50 hover:bg-amber-500/10 hover:text-amber-600 h-9 w-9 flex items-center justify-center p-0 rounded-md"
                onClick={() => {
                  undo();
                  toast({
                    title: "Hoàn tác",
                    description: "Đã hoàn tác ván đấu vừa rồi thành công!",
                  });
                }}
                title="Hoàn tác ván đấu"
              >
                <Undo2 size={15} />
              </Button>
            )}
            {redoStack && redoStack.length > 0 && (
              <Button
                variant="outline"
                size="icon"
                className="text-green-500 border-green-500/20 bg-background/50 hover:bg-green-500/10 hover:text-green-600 h-9 w-9 flex items-center justify-center p-0 rounded-md"
                onClick={() => {
                  redo();
                  toast({
                    title: "Làm lại",
                    description: "Đã làm lại ván đấu vừa hoàn tác thành công!",
                  });
                }}
                title="Làm lại ván đấu"
              >
                <Redo2 size={15} />
              </Button>
            )}
            <ModeToggle />
            <SettingsDropdown onEndMatch={() => setShowEndConfirm(true)} />
          </div>
        </header>
        <div className="flex flex-col relative gap-y-4 w-full max-w-[500px] items-center justify-center px-4">
          {idSelected !== null && (
            <div className=" absolute top-[-50px] gap-x-2 flex">
              <UpdatePlayerModal
                id={idSelected}
                onDialogClose={() => {
                  setIdSelected(null);
                }}
              />
              <HistoryPlayerModal
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
          <Flipper
            flipKey={sortedPlayers.map((p) => p.point).join("")}
            spring="gentle"
            className="flex flex-col gap-y-2 w-full"
          >
            {sortedPlayers.map((p) => (
              <Flipped key={p.id} flipId={p.point}>
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
              </Flipped>
            ))}
          </Flipper>
        </div>
        {idSelected !== null && (
          <div className=" fixed bottom-10 left-1/2 -translate-x-1/2 flex gap-x-2 z-50">
            <WinGameModal id={idSelected} />
            <CheckGameModal id={idSelected} />
          </div>
        )}

        {/* END ACTIVE MATCH CONFIRM DIALOG */}
        <Dialog open={showEndConfirm} onOpenChange={setShowEndConfirm}>
          <DialogContent className="sm:max-w-[420px]">
            <DialogHeader>
              <DialogTitle>Kết thúc trận đấu hiện tại</DialogTitle>
              <DialogDescription className="pt-2 text-xs">
                Chọn cách bạn muốn kết thúc trận đấu. Kết thúc & Lưu sẽ ghi nhận toàn bộ kết quả ván đấu của trận này vào lịch sử xếp hạng SQLite.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex flex-col gap-y-2 sm:flex-row sm:gap-x-2 mt-4">
              <Button variant="outline" className="sm:flex-1" onClick={() => setShowEndConfirm(false)}>
                Quay lại ván chơi
              </Button>
              <Button variant="destructive" className="sm:flex-1" onClick={() => handleEndMatch(false)}>
                Huỷ ván (Không lưu)
              </Button>
              <Button className="sm:flex-1 bg-green-600 hover:bg-green-700 text-white" onClick={() => handleEndMatch(true)}>
                Lưu & Kết thúc
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ThemeProvider>
  );
}

export default App;
