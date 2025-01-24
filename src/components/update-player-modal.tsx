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
import { addPlayerShema } from "@/common/schemas";
import { Input } from "./ui/input";
import { useEffect, useState } from "react";
import { AvatarPicker } from "./avatar-picker";
import { Pen } from "lucide-react";
type UpdatePlayerModalProps = {
  id: number;
  onDialogClose?: ()=> void
};
export const UpdatePlayerModal = ({ id,onDialogClose }: UpdatePlayerModalProps) => {
  const [open, setOpen] = useState(false);
  const { update } = usePlayers();
  const player = usePlayers(state=> state.getPlayer(id));
  const form = useForm<z.infer<typeof addPlayerShema>>({
    resolver: zodResolver(addPlayerShema),
    defaultValues: player ,
  });
  useEffect(()=> {
    form.setValue("image",player.image);
    form.setValue("name",player.name);
  },[player,form])
  const onSubmit = (values: z.infer<typeof addPlayerShema>) => {
    update(id, {
      id: id,
      name: values.name,
      description: values.description,
      image: values.image,
      point: 0,
      histories: []
    });
    form.reset();
    setOpen(false);
  };

  const onDialogChange = (open: boolean) => {
   
    setOpen(open);
    if (!open) {
      if(onDialogClose !== undefined) onDialogClose();
      form.reset();
    }
  };
  return (
    <Dialog open={open} onOpenChange={onDialogChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="text-blue-600">
          <Pen />
          Sửa
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Sửa thông tin</DialogTitle>
          <DialogDescription className="pt-2">
            Người ko chơi là người thắng! Dừng lại trước khi quá muộn.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center justify-center w-full h-full">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="w-full flex flex-col"
            >
              <div className="flex flex-col justify-center items-center w-full gap-y-2">
                <FormField
                  control={form.control}
                  name="image"
                  render={({ field }) => (
                    <div>
                      <FormItem className="w-full">
                        <AvatarPicker
                          selectedAvatar={field.value ?? ""}
                          onSelectAvatar={(avatar) => field.onChange(avatar)}
                        />
                      </FormItem>
                      <FormMessage />
                    </div>
                  )}
                />
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <div className="w-full">
                      <FormLabel>Tên người chơi</FormLabel>
                      <FormItem className="w-full">
                        <Input {...field} />
                      </FormItem>
                      <FormMessage />
                    </div>
                  )}
                />
              </div>
              <div className="pt-4 w-full flex justify-end">
                <Button type="submit" className="w-full">
                  Lưu lại
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
};
