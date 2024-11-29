import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Trash } from "lucide-react";
type DeletePlayerDialogProps = {
    playerName: string;
    onConfirm: ()=> void;
    onCancel: ()=> void;
}
export function DeletePlayerDialog({onCancel,onConfirm,playerName}:DeletePlayerDialogProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant={"outline"}
          className="text-red-600"
        >
          <Trash />
          Xoá
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle> Xác nhận xoá người chơi <strong>{playerName}</strong> ?</AlertDialogTitle>
          <AlertDialogDescription>
            Thao tác không thể phục hồi! Hãy chắc chắn đưa điểm về 0 trước khi xoá.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Huỷ bỏ</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Xác nhận</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
