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
import { Form, FormField, FormItem, FormLabel, FormMessage } from "./ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { addPlayerShema } from "@/schemas";
import { Input } from "./ui/input";
import { useState } from "react";
import blank from "@/assets/blank.png";
import win from "@/assets/win.png";
import { Label } from "./ui/label";
type WinGameModalProps = {
  id: number;
};
export const WinGameModal = ({ id }: WinGameModalProps) => {
  const [open, setOpen] = useState(false);
  const { add, LAST_ID, players } = usePlayers();
  const form = useForm<z.infer<typeof addPlayerShema>>({
    resolver: zodResolver(addPlayerShema),
    defaultValues: {
      name: "",
      image: blank,
    },
  });

  const onSubmit = (values: z.infer<typeof addPlayerShema>) => {
    add({
      id: LAST_ID,
      name: values.name,
      description: values.description,
      image: values.image,
      point: 0,
    });
    form.reset();
    if (players.length === 4) setOpen(false);
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
          <div className="w-full flex flex-col">
            <div className="flex flex-col  w-full gap-y-2">
            {players
            .filter(p=>p.id !== id)
            .sort((a, b) => a.id - b.id)
            .map((p) => (
             <div key={p.id} className="flex items-center gap-x-2 justify-start">
                <Label>{p.name}</Label>
                <Input type="number"/>
             </div>
            ))}
            </div>
            <div className="pt-4 w-full flex justify-end">
              <Button type="submit" className="w-full">
                Tính tiền
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
