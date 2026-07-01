"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Facebook,
  Github,
  Instagram,
} from "lucide-react";

interface DeveloperCreditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeveloperCreditModal({
  open,
  onOpenChange,
}: DeveloperCreditModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
        <Button onClick={() => onOpenChange(false)}>Close</Button>
      </DialogContent>
    </Dialog>
  );
}
