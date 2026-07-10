import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  Trophy,
  Calendar,
  Flame,
  TrendingUp,
  Activity,
  Pen,
  Check,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import blank from "@/assets/blank.png";
import { updateDbPlayer } from "@/services/db";
import { usePlayers } from "@/hooks/players";
import { AvatarPicker } from "./avatar-picker";
import { Input } from "./ui/input";
import { Button } from "./ui/button";

type PlayerHistoryItem = {
  game_number: number;
  state: string;
  point_change: number;
  point_delta: number;
  cards_count: number;
  is_chay: number;
  sam_status: string;
  is_chopped2: number;
  cards_delta: number;
  chops_delta: number;
  multiplier: number;
  created_at: string;
};

type PlayerStats = {
  totalMatches: number;
  totalRounds: number;
  wins: number;
  losses: number;
  draws: number;
  totalChay: number;
  totalChopped2: number;
  samBao: number;
  samWin: number;
  samFail: number;
  totalPoints: number;
};

type GroupedMatch = {
  date: string;
  rounds: PlayerHistoryItem[];
  totalPoints: number;
  matchWins: number;
  matchLosses: number;
};

const getChopText = (chopsDelta: number, mult: number, isWinner: boolean) => {
  const basePoints = Math.abs(chopsDelta) / (mult || 1);
  let level = "";
  if (basePoints === 20) level = " x2";
  else if (basePoints === 40) level = " x3";
  else if (basePoints === 80) level = " x4";
  else if (basePoints > 10) {
    const logLvl = Math.log2(basePoints / 10) + 1;
    if (Number.isInteger(logLvl)) level = ` x${logLvl}`;
  }
  return isWinner ? `Chặt 2${level}` : `Bị chặt 2${level}`;
};

const getRoundDetailText = (round: PlayerHistoryItem) => {
  // If it's a Sâm round
  if (round.sam_status && round.sam_status !== "none") {
    const pDelta = round.point_delta;
    const deltaText = pDelta > 0 ? `+${pDelta}` : `${pDelta}`;

    if (round.sam_status === "success") {
      return (
        <span>
          Sâm thành công <span className="text-green-500 font-bold">({deltaText})</span> 👑
        </span>
      );
    }
    if (round.sam_status === "fail") {
      return (
        <span>
          Sâm đền / thất bại <span className="text-red-500 font-bold">({deltaText})</span> 💀
        </span>
      );
    }
    if (round.sam_status === "block") {
      return (
        <span>
          Bị chặn sâm <span className="text-red-500 font-bold">({deltaText})</span> 🚫
        </span>
      );
    }
    if (round.sam_status === "lost_to_sam") {
      return (
        <span>
          Thua đền sâm <span className="text-red-500 font-bold">({deltaText})</span>
        </span>
      );
    }
  }

  // Fallback: if cards_delta and chops_delta are both 0 but point_delta !== 0
  let cardsDelta = round.cards_delta ?? 0;
  let chopsDelta = round.chops_delta ?? 0;

  if (cardsDelta === 0 && chopsDelta === 0 && round.point_delta !== 0) {
    cardsDelta = round.point_delta;
  }

  const elements: React.ReactNode[] = [];

  // Cards part
  if (cardsDelta !== 0) {
    if (cardsDelta > 0) {
      elements.push(
        <span key="cards">
          Thắng bài <span className="text-green-500 font-bold">(+{cardsDelta})</span>
        </span>
      );
    } else {
      if (round.is_chay === 1) {
        elements.push(
          <span key="cards">
            Thua cháy <span className="text-red-500 font-bold">(-15)</span> 🔥
          </span>
        );
      } else {
        elements.push(
          <span key="cards">
            Thua bài <span className="text-red-500 font-bold">({cardsDelta})</span>
          </span>
        );
      }
    }
  }

  // Chops part
  if (chopsDelta !== 0) {
    if (chopsDelta > 0) {
      elements.push(
        <span key="chops">
          {getChopText(chopsDelta, round.multiplier, true)} <span className="text-green-500 font-bold">(+{chopsDelta})</span> 🪓
        </span>
      );
    } else {
      elements.push(
        <span key="chops">
          {getChopText(chopsDelta, round.multiplier, false)} <span className="text-red-500 font-bold">({chopsDelta})</span> 🪓
        </span>
      );
    }
  }

  if (elements.length > 0) {
    return (
      <span className="text-muted-foreground/75 flex items-center flex-wrap gap-x-1">
        {elements.map((el, i) => (
          <span key={i} className="flex items-center gap-x-1">
            {i > 0 && <span className="text-muted-foreground/30 mx-1">|</span>}
            {el}
          </span>
        ))}
      </span>
    );
  }

  return <span className="text-muted-foreground/75">Hòa (0 lá) 🤝</span>;
};

type PlayerDetailModalProps = {
  playerName: string | null;
  avatar: string | null;
  onClose: () => void;
  onPlayerUpdated?: (oldName: string, newName: string, newAvatar: string) => void;
};

export const PlayerDetailModal = ({
  playerName,
  avatar,
  onClose,
  onPlayerUpdated,
}: PlayerDetailModalProps) => {
  const { players, update } = usePlayers();

  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [history, setHistory] = useState<PlayerHistoryItem[]>([]);
  const [expandedMatches, setExpandedMatches] = useState<string[]>([]);

  // Editing States
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editAvatar, setEditAvatar] = useState("");
  const [editError, setEditError] = useState("");

  useEffect(() => {
    if (playerName) {
      setLoading(true);
      setEditName(playerName);
      setEditAvatar(avatar || "");
      setIsEditing(false);
      setEditError("");
      
      const API_BASE = import.meta.env.VITE_API_URL || "";
      fetch(`${API_BASE}/api/players/${encodeURIComponent(playerName)}/history?t=${Date.now()}`)
        .then((res) => {
          if (!res.ok) throw new Error("Failed to fetch history");
          return res.json();
        })
        .then((data) => {
          setStats(data.stats);
          setHistory(data.history);
          // Expand the most recent match by default
          const grouped = groupHistoryIntoMatches(data.history);
          if (grouped.length > 0) {
            setExpandedMatches([grouped[0].date]);
          }
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    } else {
      setStats(null);
      setHistory([]);
      setExpandedMatches([]);
    }
  }, [playerName, avatar]);

  const groupHistoryIntoMatches = (historyList: PlayerHistoryItem[]): GroupedMatch[] => {
    const groups: { [key: string]: PlayerHistoryItem[] } = {};
    historyList.forEach((item) => {
      const key = item.created_at;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);
    });

    return Object.keys(groups)
      .map((key) => {
        const rounds = groups[key].sort((a, b) => a.game_number - b.game_number);
        const totalPoints = rounds.reduce((sum, r) => sum + r.point_delta, 0);
        const matchWins = rounds.filter((r) => r.state === "W").length;
        const matchLosses = rounds.filter((r) => r.state === "L").length;
        return {
          date: key,
          rounds,
          totalPoints,
          matchWins,
          matchLosses,
        };
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("vi-VN", {
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  const getRankTitle = (points: number) => {
    if (points >= 150) return { title: "Huyền Thoại 👑", color: "text-yellow-500 bg-yellow-500/10 border-yellow-500/30" };
    if (points >= 50) return { title: "Cao Thủ 🏆", color: "text-orange-500 bg-orange-500/10 border-orange-500/30" };
    if (points >= 0) return { title: "Tập Sự 🃏", color: "text-green-500 bg-green-500/10 border-green-500/30" };
    return { title: "Hắc Thần 💀", color: "text-red-500 bg-red-500/10 border-red-500/30" };
  };

  const toggleMatch = (date: string) => {
    setExpandedMatches((prev) =>
      prev.includes(date) ? prev.filter((d) => d !== date) : [...prev, date]
    );
  };

  const handleSaveEdit = async () => {
    if (!editName.trim()) {
      setEditError("Tên không được bỏ trống");
      return;
    }
    setEditError("");
    const success = await updateDbPlayer(playerName || "", editName.trim(), editAvatar);
    if (!success) {
      setEditError("Tên có thể đã tồn tại");
      return;
    }

    // Update locally in active match session if the player is in it
    const active = players.find((p) => p.name === playerName);
    if (active) {
      update(active.id, {
        ...active,
        name: editName.trim(),
        image: editAvatar,
      });
    }

    // Refresh details modal view
    if (onPlayerUpdated) {
      onPlayerUpdated(playerName || "", editName.trim(), editAvatar);
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditName(playerName || "");
    setEditAvatar(avatar || "");
    setEditError("");
    setIsEditing(false);
  };

  const groupedMatches = groupHistoryIntoMatches(history);

  return (
    <Dialog open={!!playerName} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] max-h-[85vh] flex flex-col p-6 overflow-hidden">
        <DialogHeader className="pb-4 border-b flex flex-row items-center gap-x-4 space-y-0 relative">
          {/* Avatar Area */}
          {isEditing ? (
            <AvatarPicker
              selectedAvatar={editAvatar}
              onSelectAvatar={setEditAvatar}
            />
          ) : (
            <img
              src={avatar || blank}
              className="w-16 h-16 rounded-full object-cover border-2 border-primary/20 bg-muted"
              alt={playerName || ""}
            />
          )}

          {/* Name & Title Area */}
          <div className="flex-1 flex flex-col gap-y-1">
            {isEditing ? (
              <div className="flex flex-col gap-y-1.5 max-w-[240px]">
                <div className="flex items-center gap-x-2">
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="h-8 py-0.5 text-sm font-semibold"
                    placeholder="Nhập tên người chơi"
                  />
                  <Button size="icon" className="h-8 w-8 bg-green-600 hover:bg-green-700 text-white" onClick={handleSaveEdit}>
                    <Check size={14} />
                  </Button>
                  <Button size="icon" variant="outline" className="h-8 w-8 text-muted-foreground" onClick={handleCancelEdit}>
                    <X size={14} />
                  </Button>
                </div>
                {editError && <span className="text-[10px] text-red-500 font-bold">{editError}</span>}
              </div>
            ) : (
              <div className="flex items-center gap-x-2">
                <DialogTitle className="text-xl font-bold">{playerName}</DialogTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-primary"
                  onClick={() => setIsEditing(true)}
                >
                  <Pen size={12} />
                </Button>
              </div>
            )}
            
            {stats && !isEditing && (
              <div className="flex items-center gap-x-2">
                <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full border", getRankTitle(stats.totalPoints).color)}>
                  {getRankTitle(stats.totalPoints).title}
                </span>
                <span className="text-xs text-muted-foreground">
                  Tổng điểm: <strong className={stats.totalPoints >= 0 ? "text-green-500" : "text-red-500"}>
                    {stats.totalPoints > 0 ? `+${stats.totalPoints}` : stats.totalPoints}
                  </strong>
                </span>
              </div>
            )}
          </div>
        </DialogHeader>

        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-16 gap-y-2">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
            <span className="text-xs text-muted-foreground font-medium">Đang tải số liệu thống kê...</span>
          </div>
        ) : stats ? (
          <div className="flex-1 overflow-y-auto pt-4 pr-1 flex flex-col gap-y-4">
            {/* Stats Dashboard Grid */}
            <div className="grid grid-cols-2 gap-3">
              {/* Box 1: Game Counts */}
              <div className="border rounded-xl p-3 bg-muted/20 flex items-start gap-x-2.5">
                <Calendar className="h-5 w-5 text-blue-500 mt-0.5" />
                <div className="flex flex-col">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Trận & Ván</span>
                  <span className="text-sm font-bold mt-0.5">{stats.totalMatches} Trận / {stats.totalRounds} Ván</span>
                  <span className="text-[9px] text-muted-foreground">Trung bình {stats.totalMatches > 0 ? (stats.totalRounds / stats.totalMatches).toFixed(1) : 0} ván/trận</span>
                </div>
              </div>

              {/* Box 2: Win rate */}
              <div className="border rounded-xl p-3 bg-muted/20 flex items-start gap-x-2.5">
                <Trophy className="h-5 w-5 text-yellow-500 mt-0.5" />
                <div className="flex flex-col">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Thắng / Thua</span>
                  <span className="text-sm font-bold mt-0.5 text-yellow-600 dark:text-yellow-400">
                    {stats.totalRounds > 0 ? Math.round((stats.wins / stats.totalRounds) * 100) : 0}% Thắng
                  </span>
                  <span className="text-[9px] text-muted-foreground">{stats.wins}T - {stats.losses}B - {stats.draws}H</span>
                </div>
              </div>

              {/* Box 3: Sâm status */}
              <div className="border rounded-xl p-3 bg-muted/20 flex items-start gap-x-2.5 col-span-2">
                <TrendingUp className="h-5 w-5 text-emerald-500 mt-0.5" />
                <div className="flex-1 grid grid-cols-3 gap-x-2">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Báo Sâm</span>
                    <span className="text-xs font-bold mt-0.5">{stats.samBao} lần</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider text-green-500">Thành Công</span>
                    <span className="text-xs font-bold mt-0.5 text-green-500">{stats.samWin} lần</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider text-red-500">Bị Đền</span>
                    <span className="text-xs font-bold mt-0.5 text-red-500">{stats.samFail} lần</span>
                  </div>
                </div>
              </div>

              {/* Box 4: Cháy & Chặt 2 */}
              <div className="border rounded-xl p-3 bg-muted/20 flex items-start gap-x-2.5 col-span-2">
                <Flame className="h-5 w-5 text-red-500 mt-0.5" />
                <div className="flex-1 grid grid-cols-2 gap-x-2">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Bị Cháy</span>
                    <span className="text-xs font-bold mt-0.5 text-orange-500">{stats.totalChay} lần</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Đụng Chặt 2</span>
                    <span className="text-xs font-bold mt-0.5 text-red-500">{stats.totalChopped2} lần</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Grouped Match Timeline */}
            <div className="flex flex-col gap-y-2 mt-2">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-x-1.5">
                <Activity size={14} className="text-primary/70" />
                <span>Lịch Sử Đấu Theo Trận</span>
              </h3>
              
              <div className="border rounded-lg divide-y bg-background p-1">
                {groupedMatches.length === 0 ? (
                  <div className="text-center py-10 text-xs text-muted-foreground">
                    Chưa có lịch sử trận đấu nào.
                  </div>
                ) : (
                  groupedMatches.map((match) => {
                    const isExpanded = expandedMatches.includes(match.date);
                    const matchPointText = match.totalPoints >= 0 ? `+${match.totalPoints}` : `${match.totalPoints}`;
                    const isWin = match.totalPoints > 0;
                    const isLoss = match.totalPoints < 0;

                    return (
                      <div key={match.date} className="flex flex-col">
                        {/* Match Header Row */}
                        <div
                          className="flex items-center justify-between p-3 hover:bg-muted/40 cursor-pointer transition-colors select-none text-xs"
                          onClick={() => toggleMatch(match.date)}
                        >
                          <div className="flex items-center gap-x-2.5">
                            <div className={cn(
                              "h-7 w-7 rounded-lg flex items-center justify-center text-[10px] font-bold shadow-sm border",
                              isWin ? "bg-green-500/10 text-green-600 border-green-500/20" :
                              isLoss ? "bg-red-500/10 text-red-500 border-red-500/20" :
                              "bg-slate-100 text-slate-600 border-slate-200"
                            )}>
                              {isWin ? "T" : isLoss ? "B" : "H"}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-semibold text-xs text-foreground">Trận đấu ngày {formatDate(match.date)}</span>
                              <span className="text-[10px] text-muted-foreground">
                                {match.rounds.length} ván ({match.matchWins} thắng - {match.matchLosses} thua)
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-x-2">
                            <span className={cn("font-bold text-sm", isWin ? "text-green-500" : isLoss ? "text-red-500" : "text-muted-foreground")}>
                              {matchPointText}
                            </span>
                            <span className="text-[9px] text-muted-foreground">
                              {isExpanded ? "▲" : "▼"}
                            </span>
                          </div>
                        </div>

                        {/* Expandable Rounds List */}
                        {isExpanded && (
                          <div className="bg-muted/15 border-t divide-y pl-4 pr-3 py-1">
                            {match.rounds.map((round, idx) => {
                              const isRoundWin = round.state === "W";
                              const isRoundLoss = round.state === "L";
                              const roundPointText = round.point_delta >= 0 ? `+${round.point_delta}` : `${round.point_delta}`;

                              return (
                                <div key={idx} className="flex items-center justify-between py-2 text-[11px] border-b last:border-b-0">
                                  <div className="flex flex-col gap-y-0.5">
                                    <div className="flex items-center gap-x-2">
                                      {isRoundWin ? (
                                        <span className="text-green-500 font-bold">Thắng</span>
                                      ) : isRoundLoss ? (
                                        <span className="text-red-500 font-bold">Thua</span>
                                      ) : (
                                        <span className="text-muted-foreground font-bold">Hòa</span>
                                      )}
                                      <span className="text-muted-foreground/60 flex items-center gap-x-1">
                                        Ván #{round.game_number}
                                        {round.multiplier > 1 && (
                                          <span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[8px] px-1 py-0.2 rounded font-extrabold">
                                            x{round.multiplier}
                                          </span>
                                        )}
                                      </span>
                                    </div>
                                    <div className="text-[10px] mt-0.5">
                                      {getRoundDetailText(round)}
                                    </div>
                                  </div>

                                  {/* Event pills */}
                                  <div className="flex items-center gap-x-1.5 ml-auto mr-4">
                                    {round.sam_status === "success" && (
                                      <span className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/30 text-[8px] px-1 py-0.5 rounded font-bold">Sâm Thành Công</span>
                                    )}
                                    {(round.sam_status === "fail" || round.sam_status === "block") && (
                                      <span className="bg-red-500/10 text-red-500 border border-red-500/30 text-[8px] px-1 py-0.5 rounded font-bold">Đền Sâm</span>
                                    )}
                                    {round.is_chay === 1 && (
                                      <span className="bg-orange-500/10 text-orange-500 border border-orange-500/30 text-[8px] px-1 py-0.5 rounded font-bold">Bị Cháy 🔥</span>
                                    )}
                                    {round.is_chopped2 === 1 && (
                                      <span className="bg-red-500/10 text-red-500 border border-red-500/30 text-[8px] px-1 py-0.5 rounded font-bold">Chặt 2 🪓</span>
                                    )}
                                  </div>

                                  <div className="text-right">
                                    <span className={cn("font-bold text-sm", isRoundWin ? "text-green-500" : isRoundLoss ? "text-red-500" : "text-muted-foreground")}>
                                      {roundPointText}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="py-12 text-center text-sm text-muted-foreground">
            Không tìm thấy thông tin người chơi.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
