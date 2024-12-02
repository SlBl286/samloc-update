import { Download, Info, Plus, Settings, Upload } from "lucide-react";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { usePlayers } from "@/hooks/players";

export const SettingsDropdown = () => {
  const { players } = usePlayers();

  const onDownload = () => {
    const fileName = "my-file";
    const json = JSON.stringify(players, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const href = URL.createObjectURL(blob);

    // create "a" HTLM element with href to file
    const link = document.createElement("a");
    link.href = href;
    link.download = fileName + ".json";
    document.body.appendChild(link);
    link.click();

    // clean up "a" element & remove ObjectURL
    document.body.removeChild(link);
    URL.revokeObjectURL(href);
  };
  return (
    <div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant={"outline"} size="icon">
            <Settings />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>
            <Plus />
            Ván mới
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Upload />
            Tải lên ván cũ
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onDownload}>
              <Download />
              Tải xuống ván hiện tại
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Info />
            Thông tin<strong>@Qý</strong>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
