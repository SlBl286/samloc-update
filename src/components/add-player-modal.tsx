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
import { useState } from "react";
import { AvatarPicker } from "./avatar-picker";
import blank from "@/assets/blank.png"
import { Plus } from "lucide-react";
export const AddPlayerModal = () => {
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
        <Button variant="outline" className="text-green-600"><Plus/> Thêm</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Thêm người chơi</DialogTitle>
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
                <Button type="submit" className="w-full">Thêm mới</Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
};
