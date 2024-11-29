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
import { useState } from "react";
import win from "@/assets/win.png";
import { Label } from "./ui/label";

import { useForm } from "react-hook-form";
type WinGameModalProps = {
  id: number;
};
export const WinGameModal = ({ id }: WinGameModalProps) => {
  const [open, setOpen] = useState(false);
  const { players, setPoint, getPlayer } = usePlayers();
  const { register, handleSubmit, reset, unregister } = useForm();
  const onSubmit = (values: Object) => {
    console.log(values);
    var total: number = 0;
    for (const [key, value] of Object.entries(values)) {
      var currentPlayer = getPlayer(parseInt(key));
      console.log(parseInt(value));
      total += parseInt(value);
      setPoint(currentPlayer.id, currentPlayer.point - parseInt(value));
      unregister(key);
    }
    var winPlayer = getPlayer(id);

    setPoint(id, winPlayer.point + total);
    reset();
    setOpen(false);
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
          <DialogTitle>Tính tiền</DialogTitle>
          <DialogDescription className="pt-2">
            Người ko chơi là người thắng! Dừng lại trước khi quá muộn.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center justify-center w-full h-full">
          <form
            className="w-full flex flex-col"
            onSubmit={handleSubmit(onSubmit)}
          >
            <div className="flex flex-col  w-full gap-y-2">
              {players
                .filter((p) => p.id !== id)
                .sort((a, b) => a.id - b.id)
                .map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-x-2 justify-start"
                  >
                    <Label className="flex flex-row items-center justify-center gap-x-1 mr-3"><img src={p.image}  width={25}/> {p.name}</Label>
                    <Input {...register(p.id.toString(),{value:0})} type="number" />
                  </div>
                ))}
            </div>
            <div className="pt-4 w-full flex justify-end">
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
