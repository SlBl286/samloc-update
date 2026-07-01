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
import { useState, useEffect } from "react";
import happy from "@/assets/happy.png";
import { Label } from "./ui/label";

type WinGameModalProps = {
  id: number;
  onCancel?: () => void;
  onConfirm?: () => void;
};

export const CheckGameModal = ({
  id,
  onCancel,
  onConfirm,
}: WinGameModalProps) => {
  const [open, setOpen] = useState(false);
  const { players, setPoint, saveGame, multiplier } = usePlayers();
  const [isSuccess, setIsSuccess] = useState(true);
  const [stopperId, setStopperId] = useState<number | null>(null);

  useEffect(() => {
    if (open) {
      setIsSuccess(true);
      const otherPlayers = players.filter((p) => p.id !== id);
      if (otherPlayers.length > 0) {
        setStopperId(otherPlayers[0].id);
      } else {
        setStopperId(null);
      }
    }
  }, [open, id, players]);

  const onModalClose = () => {
    if (onCancel) onCancel();
    setOpen(false);
  };

  const onSubmit = () => {
    const totalPlayers = players.length;
    const samPenalty = 20 * (totalPlayers - 1) * multiplier;
    const regularPenalty = 20 * multiplier;

    players.forEach((p) => {
      if (isSuccess) {
        if (p.id === id) {
          setPoint(p.id, p.point + samPenalty, {
            samStatus: "success",
            cardsCount: samPenalty,
          });
        } else {
          setPoint(p.id, p.point - regularPenalty, {
            samStatus: "lost_to_sam",
            cardsCount: regularPenalty,
          });
        }
      } else {
        // Announcer fails (đền sâm)
        if (p.id === id) {
          setPoint(p.id, p.point - samPenalty, {
            samStatus: "fail",
            cardsCount: samPenalty,
          });
        } else if (p.id === stopperId) {
          setPoint(p.id, p.point + samPenalty, {
            samStatus: "block",
            cardsCount: samPenalty,
          });
        } else {
          setPoint(p.id, p.point, {
            samStatus: "none",
            cardsCount: 0,
          });
        }
      }
    });

    if (onConfirm) onConfirm();
    saveGame();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="text-blue-500">
          <img src={happy} width={30} />
          Báo sâm
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Báo sâm</DialogTitle>
          <DialogDescription className="pt-2">
            Người ko chơi là người thắng! Dừng lại trước khi quá muộn.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center w-full h-full gap-y-4 pt-2">
          <div className="flex flex-col gap-y-2 w-full">
            <Label className="font-semibold text-sm">Trạng thái báo sâm:</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={isSuccess ? "default" : "outline"}
                className="w-full text-xs h-9"
                onClick={() => setIsSuccess(true)}
              >
                Thành công
              </Button>
              <Button
                type="button"
                variant={!isSuccess ? "default" : "outline"}
                className="w-full text-xs h-9"
                onClick={() => setIsSuccess(false)}
              >
                Thất bại (Đền sâm)
              </Button>
            </div>
          </div>

          {!isSuccess && (
            <div className="flex flex-col gap-y-2 w-full">
              <Label className="font-semibold text-sm">Người chặn:</Label>
              <select
                value={stopperId ?? ""}
                onChange={(e) => setStopperId(parseInt(e.target.value))}
                className="w-full p-2 border rounded-md bg-background text-foreground text-sm h-10"
              >
                {players
                  .filter((p) => p.id !== id)
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
              </select>
            </div>
          )}

          <div className="pt-4 w-full flex flex-col md:flex-row gap-y-2 gap-x-2 justify-end border-t mt-2">
            <Button
              onClick={onModalClose}
              className="w-full text-xs"
              variant="secondary"
            >
              Huỷ
            </Button>
            <Button onClick={onSubmit} className="w-full text-xs">
              Tính tiền
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
