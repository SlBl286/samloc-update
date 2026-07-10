import { useState } from "react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Trophy, Medal, Crown } from "lucide-react";
import { getLeaderboard, LeaderboardRow } from "@/services/db";
import { cn } from "@/lib/utils";
import blank from "@/assets/blank.png";
import { PlayerDetailModal } from "./player-detail-modal";

type LeaderboardModalProps = {
  trigger?: React.ReactNode;
};

export const LeaderboardModal = ({ trigger }: LeaderboardModalProps) => {
  const [open, setOpen] = useState(false);
  const [boardData, setBoardData] = useState<LeaderboardRow[]>([]);
  const [selectedDetailPlayer, setSelectedDetailPlayer] = useState<{ name: string; avatar: string | null } | null>(null);

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      // Reload leaderboard data from backend SQLite DB
      getLeaderboard().then(setBoardData).catch(console.error);
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

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          {trigger || (
            <Button variant="outline" size="icon" className="text-yellow-500 border-yellow-500/30 hover:bg-yellow-500/10 hover:text-yellow-600">
              <Trophy size={18} />
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-x-2 text-xl font-bold">
              <Trophy className="text-yellow-500 h-6 w-6" />
              <span>Bảng Xếp Hạng Cao Thủ</span>
            </DialogTitle>
            <DialogDescription className="text-xs pt-1">
              Xếp hạng dựa trên tổng điểm tích luỹ qua tất cả các ván đấu đã ghi vào SQLite.
            </DialogDescription>
          </DialogHeader>

          <div className="w-full mt-3">
            {boardData.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                Chưa có dữ liệu thi đấu nào trong cơ sở dữ liệu.
              </div>
            ) : (
              <div className="border rounded-md overflow-hidden bg-background">
                {/* Header row */}
                <div className="grid grid-cols-12 bg-muted p-2.5 font-bold text-xs text-muted-foreground border-b uppercase tracking-wider">
                  <div className="col-span-2 text-center">Hạng</div>
                  <div className="col-span-5 pl-2">Người chơi</div>
                  <div className="col-span-3 text-right">Tổng điểm</div>
                  <div className="col-span-2 text-center">Tỷ lệ thắng</div>
                </div>

                {/* Data rows */}
                <div className="max-h-[350px] overflow-y-auto divide-y">
                  {boardData.map((row) => (
                    <div
                      key={row.name}
                      className="grid grid-cols-12 p-3 text-xs items-center hover:bg-muted/60 cursor-pointer transition-colors"
                      onClick={() => setSelectedDetailPlayer({ name: row.name, avatar: row.avatar })}
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
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Embedded Player Detail Portal */}
      <PlayerDetailModal
        playerName={selectedDetailPlayer?.name || null}
        avatar={selectedDetailPlayer?.avatar || null}
        onClose={() => setSelectedDetailPlayer(null)}
        onPlayerUpdated={async (_, newName, newAvatar) => {
          setSelectedDetailPlayer({ name: newName, avatar: newAvatar });
          const board = await getLeaderboard();
          setBoardData(board);
        }}
      />
    </>
  );
};
