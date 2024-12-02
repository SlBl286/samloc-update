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
import trick from "@/assets/trick.png";
import { useForm } from "react-hook-form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
type WinGameModalProps = {
  id: number;
};
export const WinGameModal = ({ id }: WinGameModalProps) => {
  const [step, setStep] = useState(1);
  const [open, setOpen] = useState(false);
  const { players, setPoint, getPlayer, saveGame } = usePlayers();
  const { register, handleSubmit, reset, unregister, setValue, getValues } =
    useForm();
  const listFormStep2 = [1, 2, 3, 4];
  const onSubmit = (values: Object) => {
    //step 1
    var total: number = 0;
    var step1Value = Object.entries(values).filter(([k]) => {
      return !(k.includes("w-") || k.includes("l-"));
    });
    for (const [key, value] of step1Value) {
      var currentPlayer = getPlayer(parseInt(key));
      total += parseInt(value);
      setPoint(currentPlayer.id, currentPlayer.point - parseInt(value));
      unregister(key);
    }
    var winPlayer = getPlayer(id);

    setPoint(id, winPlayer.point + total);

    // step 2
    var step2Value = Object.entries(values).filter(([k]) => {
      return k.includes("w-") || k.includes("l-");
    });
    for (const [key, value] of step2Value) {
      if (key.includes("l-")) continue;
      else {
        console.log(key.split("-"))
        let pairIndex = key.split("-")[1];
        let lValue : string | undefined = step2Value.find(
          ([k]) => k === "l-" + pairIndex.toString()
        )?.[1];
        if (lValue && value) {
          console.log((parseInt(value)),parseInt(lValue.toString()))
          var lPlayer = getPlayer(parseInt(lValue.toString()));
          var wPlayer = getPlayer(parseInt(value));
          setPoint(parseInt(value), wPlayer.point + 10);
          setPoint(parseInt(lValue.toString()), lPlayer.point - 10);
        }
      }
    }

    saveGame();
    reset();
    setOpen(false);
    setStep(1);
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
            {step === 1 ? (
              <div className="flex flex-col  w-full gap-y-2">
                {players
                  .filter((p) => p.id !== id)
                  .sort((a, b) => a.id - b.id)
                  .map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center gap-x-2 justify-start"
                    >
                      <Label className="flex flex-row items-center justify-center gap-x-1 mr-3">
                        <img src={p.image} width={25} /> {p.name}
                      </Label>
                      <Input
                        {...register(p.id.toString(), { value: 0 })}
                        type="number"
                      />
                    </div>
                  ))}
              </div>
            ) : (
              <div className="flex flex-col gap-y-2 w-full">
                {listFormStep2.map((x, i) => (
                  <div className="flex" key={i}>
                    <div className="flex w-5/12">
                      <Select
                        {...(register("w-" + i.toString()),
                        { defaultValue: getValues("w-" + i.toString()) })}
                        onValueChange={(value) => {
                          setValue("w-" + i.toString(), value);
                        }}
                      >
                        <SelectTrigger className="w-full flex">
                          <SelectValue placeholder="người thắng" />
                        </SelectTrigger>
                        <SelectContent className="w-full flex">
                          {players.map((p) => (
                            <SelectItem
                              value={p.id.toString()}
                              key={p.id + p.name}
                            >
                              <div className="w-full flex gap-x-2">
                                <img src={p.image} width={20} />
                                {p.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex w-2/12 items-center justify-center ">
                      <img src={trick} alt="toh" width={25} height={25} />
                    </div>
                    <div className="flex w-5/12">
                      <Select
                        {...(register("l-" + i.toString()),
                        { defaultValue: getValues("l-" + i.toString()) })}
                        onValueChange={(value) => {
                          setValue("l-" + i.toString(), value);
                        }}
                      >
                        <SelectTrigger className="w-full flex">
                          <SelectValue placeholder="người thua" />
                        </SelectTrigger>
                        <SelectContent className="w-full flex">
                          {players.map((p) => (
                            <SelectItem
                              value={p.id.toString()}
                              key={p.id + p.name}
                            >
                              <div className="w-full flex gap-x-2">
                                <img src={p.image} width={20} />
                                {p.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="pt-4 w-full flex justify-end gap-x-2">
              <Button
                type="button"
                variant={"outline"}
                className="w-full"
                onClick={() => setStep(step === 1 ? 2 : 1)}
              >
                {step === 1 ? "Chặt 2" : "Tính lá"}
              </Button>
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
