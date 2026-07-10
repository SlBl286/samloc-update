"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { AVATAR_LIST } from "@/common/avatar-list";
import { Upload } from "lucide-react";

interface AvatarPickerProps {
  selectedAvatar: string;
  onSelectAvatar: (avatar: string) => void;
}

export function AvatarPicker({
  selectedAvatar,
  onSelectAvatar,
}: AvatarPickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="w-32 h-32 p-0 rounded-md bg-foreground/75 overflow-hidden">
          <img
            src={selectedAvatar}
            alt="Selected avatar"
            width={128}
            height={128}
            className="rounded-md object-cover w-full h-full"
          />
          <span className="sr-only">Change avatar</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Chọn hình đại diện</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-y-4 py-2">
          <div className="grid grid-cols-3 gap-4 max-h-[220px] overflow-y-auto p-1">
            {AVATAR_LIST.map((avatar, index) => (
              <Button
                key={avatar}
                variant="outline"
                autoFocus={false}
                className={cn(
                  "w-20 h-20 p-0 rounded-md overflow-hidden",
                  selectedAvatar === avatar && "ring-2 ring-primary"
                )}
                onClick={() => {
                  onSelectAvatar(avatar);
                  setIsOpen(false);
                }}
              >
                <img
                  src={avatar}
                  alt={`Avatar option ${index + 1}`}
                  width={80}
                  height={80}
                  className="rounded-md object-cover w-full h-full"
                />
                <span className="sr-only">Select avatar {index + 1}</span>
              </Button>
            ))}
          </div>

          <div className="border-t pt-4 flex flex-col items-center gap-y-2">
            <span className="text-xs text-muted-foreground font-medium">Hoặc tải lên ảnh từ máy của bạn</span>
            <input
              type="file"
              accept="image/*"
              id="custom-avatar-upload"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    if (event.target?.result) {
                      onSelectAvatar(event.target.result as string);
                      setIsOpen(false);
                    }
                  };
                  reader.readAsDataURL(file);
                }
              }}
            />
            <Button
              variant="outline"
              type="button"
              className="w-full flex items-center justify-center gap-x-2 text-xs"
              onClick={() => {
                document.getElementById("custom-avatar-upload")?.click();
              }}
            >
              <Upload className="h-4 w-4" />
              Tải ảnh lên
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
