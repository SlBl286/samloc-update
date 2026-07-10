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
import { Input } from "./ui/input";
import { useState, useEffect } from "react";
import win from "@/assets/heart-eyes.png";
import { Label } from "./ui/label";
import { useForm } from "react-hook-form";
import fire from "@/assets/fire.png";
import { cn } from "@/lib/utils";

type WinGameModalProps = {
  id: number;
};
export const WinGameModal = ({ id }: WinGameModalProps) => {
  const [open, setOpen] = useState(false);
  const { players, setPoint, saveGame, multiplier } = usePlayers();
  const { register, handleSubmit, reset, unregister, setValue } =
    useForm();
  const [chopChains, setChopChains] = useState<number[][]>([]);
  const [chayPlayers, setChayPlayers] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!open) {
      setChopChains([]);
      setChayPlayers(new Set());
    }
  }, [open]);

  const toggleChay = (playerId: number) => {
    setChayPlayers((prev) => {
      const next = new Set(prev);
      if (next.has(playerId)) {
        next.delete(playerId);
        setValue(playerId.toString(), 0);
      } else {
        next.add(playerId);
        setValue(playerId.toString(), 15);
      }
      return next;
    });
  };

  const onSubmit = (values: Object) => {
    setOpen(false);
    
    // 1. Initialize changes for all players to 0
    const cardsChanges: { [playerId: number]: number } = {};
    const chopsChanges: { [playerId: number]: number } = {};
    players.forEach(p => {
      cardsChanges[p.id] = 0;
      chopsChanges[p.id] = 0;
    });

    // 2. Calculate card points changes
    var step1Value = Object.entries(values).filter(([k]) => {
      return !isNaN(parseInt(k));
    });

    var total: number = 0;
    for (const [key, value] of step1Value) {
      const pid = parseInt(key);
      const val = parseInt(value as string) || 0;
      total += val;
      cardsChanges[pid] -= val;
      unregister(key);
    }
    cardsChanges[id] += total;

    // 3. Calculate chop chains changes (only the last person who got over-chopped pays)
    for (const chain of chopChains) {
      const validChain = chain.filter((playerId) => playerId !== null && !isNaN(playerId));
      if (validChain.length < 2) continue;

      const N = validChain.length - 1; // Number of chop transactions
      const amount = 10 * Math.pow(2, N - 1);
      const payPlayerId = validChain[N - 1];
      const receivePlayerId = validChain[N];

      chopsChanges[payPlayerId] -= amount;
      chopsChanges[receivePlayerId] += amount;
    }

    // 4. Apply net point changes using setPoint (exactly once for every player in the game)
    const paidInChops = new Set<number>();
    players.forEach((p) => {
      if ((chopsChanges[p.id] || 0) < 0) {
        paidInChops.add(p.id);
      }
    });

    const matchRound = Math.max(...players.map(pl => pl.histories.length), 0) + 1;

    players.forEach((p) => {
      const cardsDelta = (cardsChanges[p.id] || 0) * multiplier;
      const chopsDelta = (chopsChanges[p.id] || 0) * multiplier;
      const change = cardsDelta + chopsDelta;
      const val = p.id === id ? total : (parseInt((values as any)[p.id.toString()] as string) || 0);
      
      setPoint(p.id, p.point + change, {
        gameNumber: matchRound,
        cardsCount: val,
        isChay: p.id !== id && chayPlayers.has(p.id),
        samStatus: "none",
        isChopped2: paidInChops.has(p.id),
        cardsDelta: cardsDelta,
        chopsDelta: chopsDelta,
      });
    });

    saveGame();
    reset();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="text-red-600">
          <img src={win} width={35} />
          Tính tiền
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-x-2">
            <span>Tính tiền</span>
            <span className="text-xs text-muted-foreground/80 font-normal">
              Ván {(players[0]?.histories.length ?? 0) + 1}
              {multiplier > 1 && ` (x${multiplier})`}
            </span>
          </DialogTitle>
          <DialogDescription className="pt-2">
            Người ko chơi là người thắng! Dừng lại trước khi quá muộn.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center justify-center w-full h-full">
          <form
            className="w-full flex flex-col"
            onSubmit={handleSubmit(onSubmit)}
          >
            <div className="flex flex-col w-full gap-y-2">
              {players
                .filter((p) => p.id !== id)
                .sort((a, b) => a.id - b.id)
                .map((p, i) => (
                  <div
                    key={p.id}
                    className="flex flex-col items-center gap-y-2 justify-center border rounded-md p-2 bg-muted"
                  >
                    <div className="flex items-center gap-x-3 w-full justify-between">
                      <Label className="flex flex-row items-center gap-x-2 min-w-[100px]">
                        <img src={p.image} width={28} className="rounded-sm" /> 
                        <span className="font-medium">{p.name}</span>
                      </Label>

                      <div className="flex items-center gap-x-2 grow max-w-[200px]">
                        <Input
                          {...register(p.id.toString(), { value: 0 })}
                          tabIndex={i + 1}
                          type="number"
                          className="border border-muted-foreground h-9"
                        />
                        <Button
                          type="button"
                          variant={chayPlayers.has(p.id) ? "default" : "outline"}
                          size="sm"
                          className={cn(
                            "h-9 gap-x-1 transition-all duration-200",
                            chayPlayers.has(p.id) ? "btn-chay-active" : "border-muted-foreground/40"
                          )}
                          onClick={() => toggleChay(p.id)}
                        >
                          <img 
                            src={fire} 
                            width={18} 
                            className={cn(
                              "transition-transform",
                              chayPlayers.has(p.id) ? "animate-flame-icon brightness-0 invert" : "opacity-80"
                            )} 
                          />
                          Cháy
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>

            <div className="mt-4 border-t pt-4 w-full">
              <h4 className="text-sm font-semibold mb-2 flex items-center justify-between">
                <span>Lượt chặt 2</span>
                <span className="text-xs font-normal text-muted-foreground">(Người chơi → bị chặt bởi)</span>
              </h4>
              <div className="max-h-[160px] overflow-y-auto pr-1">
                {chopChains.map((chain, chainIndex) => (
                  <div key={chainIndex} className="border border-dashed p-2 rounded-md mb-2 bg-background/50 flex flex-col gap-2 relative">
                    <button
                      type="button"
                      className="absolute top-1 right-1 text-red-500 hover:text-red-700 text-xs font-semibold px-1"
                      onClick={() => {
                        setChopChains(chopChains.filter((_, idx) => idx !== chainIndex));
                      }}
                    >
                      Xoá
                    </button>
                    <div className="flex flex-wrap items-center gap-2 pr-6">
                      <span className="text-xs font-bold text-primary">Lượt {chainIndex + 1}:</span>
                      {chain.map((playerId, playerIndex) => (
                        <div key={playerIndex} className="flex items-center gap-1">
                          {playerIndex > 0 && <span className="text-xs text-muted-foreground">→</span>}
                          <select
                            value={playerId ?? ""}
                            onChange={(e) => {
                              const val = e.target.value ? parseInt(e.target.value) : null;
                              const newChains = [...chopChains];
                              newChains[chainIndex][playerIndex] = val!;
                              setChopChains(newChains);
                            }}
                            className="p-1 rounded border text-xs bg-background text-foreground"
                          >
                            <option value="">Chọn...</option>
                            {players.map((p) => (
                              <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                          </select>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-[10px] text-blue-500"
                        onClick={() => {
                          const newChains = [...chopChains];
                          newChains[chainIndex].push(null as any);
                          setChopChains(newChains);
                        }}
                      >
                        + Chặt đè
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full text-xs mt-1"
                onClick={() => setChopChains([...chopChains, [null as any, null as any]])}
              >
                + Thêm lượt chặt 2
              </Button>
            </div>

            <div className="pt-4 w-full flex justify-end gap-x-2">
              <Button type="submit" className="w-full">
                Tính tiền
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};
