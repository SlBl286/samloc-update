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
import { useState, useEffect } from "react";
import { AvatarPicker } from "./avatar-picker";
import blank from "@/assets/blank.png";
import { Plus } from "lucide-react";
import { getDbPlayers, createDbPlayer } from "@/services/db";
import { Label } from "./ui/label";


export const AddPlayerModal = () => {
  const [open, setOpen] = useState(false);
  const { add, addMultiple, LAST_ID, players } = usePlayers();
  const [tab, setTab] = useState<"existing" | "new">("existing");
  const [selectedDbPlayerIds, setSelectedDbPlayerIds] = useState<string[]>([]);

  const dbPlayers = getDbPlayers() || [];
  const activePlayers = players || [];
  const availableDbPlayers = dbPlayers.filter(
    (dbP) => dbP && !activePlayers.some((p) => p && p.name === dbP.name)
  );

  const form = useForm<z.infer<typeof addPlayerShema>>({
    resolver: zodResolver(addPlayerShema),
    defaultValues: {
      name: "",
      image: blank,
    },
  });

  useEffect(() => {
    if (open) {
      setSelectedDbPlayerIds([]);
      if (availableDbPlayers.length > 0) {
        setTab("existing");
      } else {
        setTab("new");
      }
    }
  }, [open, players]);

  const handleTogglePlayer = (id: string) => {
    setSelectedDbPlayerIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const onSubmitNew = (values: z.infer<typeof addPlayerShema>) => {
    const avatar = values.image || blank;
    // 1. Save to SQLite DB
    createDbPlayer(values.name, avatar);

    // 2. Add to active game session
    add({
      id: LAST_ID,
      name: values.name,
      description: values.description,
      image: avatar,
      point: 0,
      histories: []
    });

    form.reset();
    setOpen(false);
  };

  const onSubmitExisting = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedDbPlayerIds.length === 0) return;

    // Find all selected database players
    const selectedPlayers = availableDbPlayers
      .filter((dbP) => selectedDbPlayerIds.includes(dbP.id.toString()))
      .map((dbP) => ({
        name: dbP.name,
        image: dbP.avatar,
        point: 0,
        histories: []
      }));

    // Batch add to active game session
    addMultiple(selectedPlayers);

    setSelectedDbPlayerIds([]);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="text-green-600 h-9 w-9 sm:w-auto p-0 sm:px-3 flex items-center justify-center">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline sm:ml-1">Thêm người chơi</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Thêm người chơi</DialogTitle>
          <DialogDescription className="pt-2 text-xs">
            Chọn một hoặc nhiều người chơi cũ từ cơ sở dữ liệu hoặc tạo người chơi mới.
          </DialogDescription>
        </DialogHeader>

        {/* Tab segmented controls */}
        <div className="flex gap-x-2 border-b border-border/40 pb-3 mb-2 mt-2">
          {availableDbPlayers.length > 0 && (
            <Button
              type="button"
              variant={tab === "existing" ? "default" : "outline"}
              className="flex-1 text-xs h-8"
              onClick={() => setTab("existing")}
            >
              Chọn từ danh sách
            </Button>
          )}
          <Button
            type="button"
            variant={tab === "new" ? "default" : "outline"}
            className="flex-1 text-xs h-8"
            onClick={() => setTab("new")}
          >
            Tạo người chơi mới
          </Button>
        </div>

        <div className="w-full mt-2">
          {tab === "existing" ? (
            <form onSubmit={onSubmitExisting} className="space-y-4">
              <div className="space-y-2.5">
                <Label className="text-sm font-semibold">Chọn tài khoản cũ</Label>
                <div className="max-h-[220px] overflow-y-auto border border-border/45 rounded-md divide-y bg-background">
                  {availableDbPlayers.map((dbP) => {
                    const isChecked = selectedDbPlayerIds.includes(dbP.id.toString());
                    return (
                      <label
                        key={dbP.id}
                        className="flex items-center justify-between p-3 hover:bg-muted/40 cursor-pointer transition-colors select-none"
                      >
                        <div className="flex items-center gap-x-2.5">
                          <img
                            src={dbP.avatar || blank}
                            className="w-7 h-7 rounded-full object-cover bg-foreground/10"
                            alt=""
                          />
                          <span className="font-medium text-sm text-foreground">{dbP.name}</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleTogglePlayer(dbP.id.toString())}
                          className="h-4.5 w-4.5 rounded border-border bg-background accent-amber-500 cursor-pointer"
                        />
                      </label>
                    );
                  })}
                </div>
              </div>
              <div className="pt-4 flex justify-end">
                <Button 
                  type="submit" 
                  disabled={selectedDbPlayerIds.length === 0} 
                  className="w-full h-10 font-bold"
                >
                  Thêm {selectedDbPlayerIds.length > 0 ? `(${selectedDbPlayerIds.length})` : ""} vào ván
                </Button>
              </div>
            </form>
          ) : (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmitNew)}
                className="w-full flex flex-col space-y-4"
              >
                <div className="flex flex-col justify-center items-center w-full gap-y-3">
                  <FormField
                    control={form.control}
                    name="image"
                    render={({ field }) => (
                      <div>
                        <FormItem className="w-full flex justify-center">
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
                        <FormItem className="w-full mt-1.5">
                          <Input {...field} placeholder="Nhập tên người chơi mới..." className="h-10" />
                        </FormItem>
                        <FormMessage />
                      </div>
                    )}
                  />
                </div>
                <div className="pt-2 w-full flex justify-end">
                  <Button type="submit" className="w-full h-10 font-bold">Tạo & Thêm vào ván</Button>
                </div>
              </form>
            </Form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
