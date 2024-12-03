"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Facebook,
  Github,
  Info,
  Instagram,
} from "lucide-react";

export function DeveloperCreditModal() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <div className="flex w-full items-center px-1.5 py-1 rounded text-sm gap-x-2 hover:cursor-default hover:bg-foreground/10">
          <Info width={20} />
          Thông tin<strong>@Qý</strong>
        </div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader className="mt-2">
          <DialogTitle>Thông tin người phát triển</DialogTitle>
          <DialogDescription>
            Thông tin và liên hệ của người tạo ra sản phẩm.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <h4 className="font-medium text-lg">Qý</h4>
            <p className="text-sm text-muted-foreground">
              Full Stack Developer
            </p>
          </div>
          <div>
            <p className="">Bỏ qua cái tôi của đôi mình.</p>
            <p className="">Để nếm vị tình của đôi môi!</p>
          </div>
          <div className="flex space-x-4">
            <a
              href="https://github.com/slbl286"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground"
            >
              <Github size={24} />
              <span className="sr-only">GitHub</span>
            </a>
            <a
              href="https://www.facebook.com/epdiusicay"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground"
            >
              <Facebook size={24} />
              <span className="sr-only">Facebook</span>
            </a>
            <a
              href="https://www.instagram.com/slbl286"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground"
            >
              <Instagram size={24} />
              <span className="sr-only">Instagram</span>
            </a>
          </div>
        </div>
        <Button onClick={() => setOpen(false)}>Close</Button>
      </DialogContent>
    </Dialog>
  );
}
