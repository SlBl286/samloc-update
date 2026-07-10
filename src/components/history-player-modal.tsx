import { usePlayers } from "@/hooks/players";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { useState } from "react";
import { History } from "lucide-react";
import { cn } from "@/lib/utils";

type HistoryPlayerModalProps = {
  id: number;
  onDialogClose?: () => void;
};

export const HistoryPlayerModal = ({ id, onDialogClose }: HistoryPlayerModalProps) => {
  const [open, setOpen] = useState(false);
  const player = usePlayers((state) => state.getPlayer(id));

  const onDialogChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen && onDialogClose) {
      onDialogClose();
    }
  };

  const getPointDelta = (h: any, index: number, histories: any[]) => {
    if (h.pointDelta !== undefined) return h.pointDelta;
    if (index === 0) return h.pointChange;
    return h.pointChange - histories[index - 1].pointChange;
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

  const getHistoryDetailText = (h: any) => {
    // 1. Handle Báo sâm events
    if (h.samStatus === "success") {
      return <span className="text-green-500 font-semibold">Báo sâm thành công 👑</span>;
    }
    if (h.samStatus === "fail") {
      return <span className="text-red-500 font-semibold">Đền sâm (Thất bại) ❌</span>;
    }
    if (h.samStatus === "block") {
      return <span className="text-emerald-500 font-semibold">Chặn sâm thành công 🛡️</span>;
    }
    if (h.samStatus === "lost_to_sam") {
      return (
        <span className="text-muted-foreground font-medium">
          Thua do bị báo sâm <span className="text-red-500 font-bold">(-{h.cardsCount ?? 20})</span> 💀
        </span>
      );
    }

    // 2. Handle normal game with separate Cards and Chop 2 points
    const cardsDelta = h.cardsDelta;
    const chopsDelta = h.chopsDelta;

    if (cardsDelta !== undefined || chopsDelta !== undefined) {
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
          if (h.isChay) {
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
      } else if (h.state === "H") {
        elements.push(<span key="cards">Hoà (0 lá) 🤝</span>);
      }

      // Chops part
      if (chopsDelta !== 0) {
        if (chopsDelta > 0) {
          elements.push(
            <span key="chops">
              {getChopText(chopsDelta, h.multiplier || 1, true)} <span className="text-green-500 font-bold">(+{chopsDelta})</span> 🪓
            </span>
          );
        } else {
          elements.push(
            <span key="chops">
              {getChopText(chopsDelta, h.multiplier || 1, false)} <span className="text-red-500 font-bold">({chopsDelta})</span> 🪓
            </span>
          );
        }
      }

      if (elements.length > 0) {
        return (
          <span className="text-muted-foreground flex items-center flex-wrap gap-x-1.5">
            {elements.map((el, i) => (
              <span key={i} className="flex items-center gap-x-1.5">
                {el}
                {i < elements.length - 1 && <span className="text-muted-foreground/30">|</span>}
              </span>
            ))}
          </span>
        );
      }
    }

    // 3. Fallback for older round records (before this update)
    if (h.isChopped2) {
      return <span className="text-amber-500 font-medium">Bị chặt 2 🪓</span>;
    }
    if (h.isChay) {
      return <span className="text-orange-500 font-medium">Thua cháy (15 lá) 🔥</span>;
    }
    if (h.state === "H") {
      return <span className="text-muted-foreground">Hoà (0 lá) 🤝</span>;
    }
    if (h.state === "W") {
      return (
        <span className="text-muted-foreground">
          Thắng (ăn <span className="text-green-500 font-bold">+{h.cardsCount ?? 0}</span> lá)
        </span>
      );
    } else {
      return (
        <span className="text-muted-foreground">
          Thua (<span className="text-red-500 font-bold">-{h.cardsCount ?? 0}</span> lá)
        </span>
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onDialogChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="text-yellow-600">
          <History size={16} className="mr-1" />
          Lịch sử
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-x-2">
            <img src={player.image} width={32} height={32} className="rounded-full bg-foreground/10 p-0.5 object-cover" alt="avatar" />
            <span>Lịch sử ván đấu - {player.name}</span>
          </DialogTitle>
          <DialogDescription className="pt-1">
            Tổng điểm hiện tại: <span className={cn("font-bold text-sm", player.point >= 0 ? "text-green-500" : "text-red-500")}>
              {player.point >= 0 ? "+" : ""}{player.point}
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="w-full mt-2">
          {player.histories.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Chưa có dữ liệu ván đấu nào.
            </div>
          ) : (
            <div className="border rounded-md overflow-hidden bg-background">
              <div className="grid grid-cols-12 bg-muted p-2 font-semibold text-xs text-muted-foreground border-b">
                <div className="col-span-2 text-center">Ván</div>
                <div className="col-span-3 text-right">Điểm</div>
                <div className="col-span-7 pl-4">Chi tiết</div>
              </div>
              <div className="max-h-[300px] overflow-y-auto divide-y">
                {player.histories.map((h, index, arr) => {
                  const delta = getPointDelta(h, index, arr);
                  return (
                    <div
                      key={index}
                      className="grid grid-cols-12 p-2.5 text-xs items-center hover:bg-muted/40 transition-colors"
                    >
                      <div className="col-span-2 text-center font-medium text-muted-foreground flex flex-col items-center justify-center gap-y-0.5">
                        <span>{index + 1}</span>
                        {h.multiplier && h.multiplier > 1 && (
                          <span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[8px] px-1 py-0.2 rounded font-extrabold">
                            x{h.multiplier}
                          </span>
                        )}
                      </div>
                      <div className="col-span-3 text-right pr-2 flex flex-col items-end justify-center">
                        <span
                          className={cn(
                            "font-bold text-sm",
                            delta > 0 ? "text-green-500" : delta < 0 ? "text-red-500" : "text-muted-foreground"
                          )}
                        >
                          {delta > 0 ? `+${delta}` : delta}
                        </span>
                        {h.cardsDelta !== undefined && h.chopsDelta !== undefined && h.chopsDelta !== 0 && (
                          <span className="text-[9px] text-muted-foreground leading-none mt-0.5 whitespace-nowrap">
                            ({h.cardsDelta > 0 ? `+${h.cardsDelta}` : h.cardsDelta} | {h.chopsDelta > 0 ? `+${h.chopsDelta}` : h.chopsDelta})
                          </span>
                        )}
                      </div>
                      <div className="col-span-7 pl-4 text-xs">
                        {getHistoryDetailText(h)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
