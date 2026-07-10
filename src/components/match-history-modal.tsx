import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { History, ChevronLeft, Calendar, Trophy, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type MatchPlayer = {
  name: string;
  avatar: string | null;
  points: number;
};

type MatchSummary = {
  timestamp: string;
  totalRounds: number;
  players: MatchPlayer[];
};

type RoundScore = {
  state: string;
  pointChange: number;
  pointDelta: number;
  cardsCount: number;
  isChay: boolean;
  samStatus: string;
  isChopped2: boolean;
  cardsDelta: number;
  chopsDelta: number;
};

type MatchDetail = {
  timestamp: string;
  players: string[];
  rounds: Array<{
    gameNumber: number;
    multiplier: number;
    scores: Record<string, RoundScore>;
  }>;
};

export const MatchHistoryModal = () => {
  const [open, setOpen] = useState(false);
  const [matches, setMatches] = useState<MatchSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTimestamp, setSelectedTimestamp] = useState<string | null>(null);
  const [detail, setDetail] = useState<MatchDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const API_BASE = import.meta.env.VITE_API_URL || "";

  useEffect(() => {
    if (open) {
      loadMatches();
    }
  }, [open]);

  const loadMatches = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/matches?t=${Date.now()}`);
      if (!res.ok) throw new Error("Failed to fetch matches");
      const data = await res.json();
      setMatches(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadDetail = async (timestamp: string) => {
    setSelectedTimestamp(timestamp);
    setLoadingDetail(true);
    try {
      const res = await fetch(
        `${API_BASE}/api/matches/detail?timestamp=${encodeURIComponent(timestamp)}&t=${Date.now()}`
      );
      if (!res.ok) throw new Error("Failed to fetch details");
      const data = await res.json();
      setDetail(data);
    } catch (e) {
      console.error(e);
      setSelectedTimestamp(null);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleBack = () => {
    setSelectedTimestamp(null);
    setDetail(null);
  };

  const formatDateTime = (timestamp: string) => {
    try {
      const parts = timestamp.split(" ");
      if (parts.length < 2) return timestamp;
      const dateParts = parts[0].split("-");
      const timeParts = parts[1].split(":");
      return `${dateParts[2]}/${dateParts[1]}/${dateParts[0]} - ${timeParts[0]}:${timeParts[1]}`;
    } catch (e) {
      return timestamp;
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="w-full h-12 border-muted text-muted-foreground hover:bg-muted/10 font-bold text-sm rounded-lg flex items-center justify-center gap-x-2 shadow-sm"
        >
          <History className="h-5 w-5" /> Lịch sử & Xem lại trận
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] sm:max-w-[600px] h-[85vh] flex flex-col p-4 sm:p-6">
        <DialogHeader className="border-b pb-4">
          <div className="flex items-center gap-x-2">
            {selectedTimestamp && (
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 text-muted-foreground"
                onClick={handleBack}
              >
                <ChevronLeft size={16} />
              </Button>
            )}
            <div>
              <DialogTitle>
                {selectedTimestamp ? "Bảng điểm chi tiết" : "Lịch sử trận đấu"}
              </DialogTitle>
              <DialogDescription className="text-xs mt-1">
                {selectedTimestamp
                  ? `Chi tiết trận đấu lúc ${formatDateTime(selectedTimestamp)}`
                  : "Danh sách các trận đấu đã được lưu trong SQLite."}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto mt-4 pr-1">
          {selectedTimestamp ? (
            // --- VIEW DETAIL SCOREBOARD ---
            loadingDetail ? (
              <div className="flex flex-col items-center justify-center h-full gap-y-2 py-20">
                <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
                <span className="text-sm text-muted-foreground">Đang tải bảng điểm...</span>
              </div>
            ) : detail ? (
              <div className="flex flex-col gap-y-4">
                <div className="max-h-[52vh] overflow-y-auto overflow-x-auto border rounded-xl bg-muted/10 relative">
                  <table className="w-full text-xs border-collapse min-w-[500px]">
                    <thead>
                      <tr className="bg-muted border-b">
                        <th className="p-1.5 sm:p-2.5 text-center font-bold text-muted-foreground w-12 border-r sticky top-0 left-0 bg-muted z-30">Ván</th>
                        {detail.players.map((pName) => (
                          <th key={pName} className="p-1.5 sm:p-2.5 text-center font-bold border-r last:border-r-0 sticky top-0 bg-muted z-20 text-[10px] sm:text-xs min-w-[80px]">
                            {pName}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {detail.rounds.map((round) => (
                        <tr key={round.gameNumber} className="hover:bg-muted/30 transition-colors">
                          <td className="p-1.5 sm:p-2.5 text-center border-r font-medium text-muted-foreground bg-muted sticky left-0 z-10 text-[10px] sm:text-xs">
                            #{round.gameNumber}
                            {round.multiplier > 1 && (
                              <span className="block text-[8px] font-extrabold text-amber-500 leading-none mt-0.5">
                                x{round.multiplier}
                              </span>
                            )}
                          </td>
                          {detail.players.map((pName) => {
                            const score = round.scores[pName];
                            if (!score) {
                              return (
                                <td key={pName} className="p-1.5 sm:p-2.5 text-center border-r last:border-r-0 text-muted-foreground/30 font-medium text-[10px] sm:text-xs">
                                  -
                                </td>
                              );
                            }

                            const isChay = score.isChay;
                            const pointDelta = score.pointDelta;
                            const deltaStr = pointDelta > 0 ? `+${pointDelta}` : pointDelta;

                            // Custom Badge label
                            let badgeText = "";
                            if (score.samStatus === "success") badgeText = "Sâm 👑";
                            else if (score.samStatus === "fail" || score.samStatus === "block") badgeText = "Đền ❌";
                            else if (score.samStatus === "lost_to_sam") badgeText = "Thua sâm 💀";
                            else if (score.isChopped2) {
                              const basePoints = Math.abs(score.chopsDelta) / (round.multiplier || 1);
                              let level = "";
                              if (basePoints === 20) level = " x2";
                              else if (basePoints === 40) level = " x3";
                              else if (basePoints === 80) level = " x4";
                              else if (basePoints > 10) {
                                const logLvl = Math.log2(basePoints / 10) + 1;
                                if (Number.isInteger(logLvl)) level = ` x${logLvl}`;
                              }
                              badgeText = `Bị chặt${level} 🪓`;
                            } else if (score.cardsDelta > 0 && score.chopsDelta > 0) {
                              const basePoints = Math.abs(score.chopsDelta) / (round.multiplier || 1);
                              let level = "";
                              if (basePoints === 20) level = " x2";
                              else if (basePoints === 40) level = " x3";
                              else if (basePoints === 80) level = " x4";
                              else if (basePoints > 10) {
                                const logLvl = Math.log2(basePoints / 10) + 1;
                                if (Number.isInteger(logLvl)) level = ` x${logLvl}`;
                              }
                              badgeText = `Chặt${level} 🪓`;
                            } else if (isChay) badgeText = "Cháy 💀";

                            return (
                              <td key={pName} className="p-1.5 sm:p-2.5 text-center border-r last:border-r-0">
                                <span
                                  className={cn(
                                    "font-bold text-xs sm:text-sm block leading-tight",
                                    pointDelta > 0
                                      ? "text-green-500"
                                      : pointDelta < 0
                                      ? "text-red-500"
                                      : "text-muted-foreground"
                                  )}
                                >
                                  {deltaStr}
                                </span>
                                {badgeText && (
                                  <span className="inline-block text-[7px] sm:text-[8px] text-muted-foreground/75 font-bold leading-none mt-0.5 px-1 py-0.2 rounded border bg-muted/40 whitespace-nowrap scale-95">
                                    {badgeText}
                                  </span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}

                      {/* Total summary row */}
                      <tr className="sticky bottom-0 bg-muted border-t-2 font-bold text-foreground z-20 shadow-[0_-2px_4px_rgba(0,0,0,0.08)]">
                        <td className="p-1.5 sm:p-2.5 text-center border-r font-extrabold text-amber-500 text-[10px] sm:text-[11px] uppercase bg-muted sticky left-0 z-30">
                          Tổng
                        </td>
                        {detail.players.map((pName) => {
                          const total = detail.rounds.reduce((sum, r) => {
                            const s = r.scores[pName];
                            return sum + (s ? s.pointDelta : 0);
                          }, 0);
                          return (
                            <td key={pName} className="p-1.5 sm:p-2.5 text-center border-r last:border-r-0 text-xs sm:text-sm bg-muted">
                              <span
                                className={cn(
                                  "font-extrabold",
                                  total > 0
                                    ? "text-green-500"
                                    : total < 0
                                    ? "text-red-500"
                                    : "text-muted-foreground"
                                )}
                              >
                                {total > 0 ? `+${total}` : total}
                              </span>
                            </td>
                          );
                        })}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center py-10 text-muted-foreground">Không tìm thấy trận đấu này.</div>
            )
          ) : (
            // --- VIEW MATCHES LIST ---
            loading ? (
              <div className="flex flex-col items-center justify-center h-full gap-y-2 py-20">
                <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
                <span className="text-sm text-muted-foreground">Đang tải lịch sử...</span>
              </div>
            ) : matches.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground text-sm">
                Chưa có dữ liệu trận đấu nào được ghi nhận.
              </div>
            ) : (
              <div className="flex flex-col gap-y-3">
                {matches.map((match) => (
                  <div
                    key={match.timestamp}
                    className="border rounded-xl p-4 bg-muted/15 flex flex-col gap-y-3 hover:bg-muted/30 cursor-pointer transition-colors shadow-sm"
                    onClick={() => loadDetail(match.timestamp)}
                  >
                    {/* Timestamp & Round count */}
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-x-2 text-xs font-semibold text-muted-foreground">
                        <Calendar size={13} className="text-amber-500" />
                        <span>{formatDateTime(match.timestamp)}</span>
                      </div>
                      <span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[9px] px-2 py-0.5 rounded-full font-bold">
                        {match.totalRounds} ván
                      </span>
                    </div>

                    {/* Players summaries */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {match.players.map((player) => (
                        <div
                          key={player.name}
                          className="flex items-center gap-x-1.5 px-2 py-1 rounded-lg bg-background border text-[10px] font-medium"
                        >
                          <Trophy size={10} className={cn(player.points > 0 ? "text-yellow-500" : "text-muted-foreground/60")} />
                          <span className="font-semibold text-foreground">{player.name}</span>
                          <span
                            className={cn(
                              "font-bold",
                              player.points > 0 ? "text-green-500" : player.points < 0 ? "text-red-500" : "text-muted-foreground"
                            )}
                          >
                            {player.points > 0 ? `+${player.points}` : player.points}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
