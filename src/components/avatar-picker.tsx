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
        <Button className="w-32 h-32 p-0 rounded-md bg-foreground/75">
          <img
            src={selectedAvatar}
            alt="Selected avatar"
            width={96}
            height={96}
            className="rounded-md"
          />
          <span className="sr-only">Change avatar</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Choose an avatar</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-3 gap-4 py-4">
          {AVATAR_LIST.map((avatar, index) => (
            <Button
              key={avatar}
              variant="outline"
              autoFocus={false}
              className={cn(
                "w-20 h-20 p-0 rounded-md",
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
                width={96}
                height={96}
                className="rounded-md "
              />
              <span className="sr-only">Select avatar {index + 1}</span>
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
