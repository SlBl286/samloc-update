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
import happy from "@/assets/happy.png";
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
  const { players, setPoint } = usePlayers();
  const onModalClose = () => {
    if (onCancel) onCancel();
    setOpen(false);
  };
  const onSubmit = () => {
    players.forEach((p) => {
      if (p.id === id) setPoint(p.id, p.point + 20 * (players.length - 1));
      else setPoint(p.id, p.point - 20);
    });
    if (onConfirm) onConfirm();
    setOpen(false);
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="">
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
        <div className="flex items-center justify-center w-full h-full">
          <div className="pt-4 w-full flex flex-col md:flex-row gap-y-2 gap-x-2 justify-end">
            <Button
              onClick={onModalClose}
              className="w-full"
              variant={"secondary"}
            >
              Huỷ
            </Button>
            <Button onClick={onSubmit} className="w-full">
              Tính tiền
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
