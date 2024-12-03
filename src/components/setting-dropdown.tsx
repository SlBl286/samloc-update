import { Download, Plus, Settings, Upload } from "lucide-react";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { usePlayers } from "@/hooks/players";
import { useRef } from "react";
import { DeveloperCreditModal } from "./developer-credit-modal";

export const SettingsDropdown = () => {
  const { players, LAST_ID, clearSaveGame,loadGame } = usePlayers();
  const inputRef = useRef<HTMLInputElement>(null);
  const onNewGame = () => {
    clearSaveGame();
  };

  const onDownload = () => {
    const fileName = "samloc-"+ Date();
    const json = JSON.stringify(
      {
        LAST_ID: LAST_ID,
        players: players,
      },
      null,
      2
    );
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

  const onUpload = () => {
    inputRef.current?.click();
  };
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (file) {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const content = JSON.parse(e.target?.result as string);
          loadGame(content.LAST_ID, content.players)
        } catch (err) {
          console.log(err);

        }
      };

      reader.onerror = () => {};

      reader.readAsText(file);
    }
  };
  return (
    <div>
      <input
        type="file"
        accept=".json"
        onChange={handleFileUpload}
        className="hidden"
        ref={inputRef}
      />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant={"outline"} size="icon">
            <Settings />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={onNewGame}>
            <Plus />
            Ván mới
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onUpload}>
            <Upload />
            Tải lên ván cũ
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onDownload}>
            <Download />
            Tải xuống ván hiện tại
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <DeveloperCreditModal />
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
