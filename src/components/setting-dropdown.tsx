import { Download, Plus, Settings, Upload, LogOut, Info } from "lucide-react";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { usePlayers } from "@/hooks/players";
import { useRef, useState } from "react";
import { DeveloperCreditModal } from "./developer-credit-modal";

type SettingsDropdownProps = {
  onEndMatch?: () => void;
};

export const SettingsDropdown = ({ onEndMatch }: SettingsDropdownProps) => {
  const { players, LAST_ID, multiplier, setMultiplier, clearSaveGame, loadGame } = usePlayers();
  const inputRef = useRef<HTMLInputElement>(null);
  const [showCredit, setShowCredit] = useState(false);
  
  const onNewGame = () => {
    clearSaveGame();
  };

  const onDownload = () => {
    const fileName = "samloc-" + Date();
    const json = JSON.stringify(
      {
        LAST_ID: LAST_ID,
        players: players,
        multiplier: multiplier,
      },
      null,
      2
    );
    const blob = new Blob([json], { type: "application/json" });
    const href = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = href;
    link.download = fileName + ".json";
    document.body.appendChild(link);
    link.click();

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
          loadGame(content.LAST_ID, content.players, content.multiplier);
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
        <DropdownMenuContent className="w-56" align="end">
          <div 
            className="p-3 border-b border-border/40 flex items-center justify-between gap-x-2"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="text-xs font-semibold text-muted-foreground">Hệ số tính tiền:</span>
            <input
              type="number"
              min={1}
              value={multiplier}
              onChange={(e) => {
                const val = parseInt(e.target.value) || 1;
                setMultiplier(val);
              }}
              className="w-16 h-8 text-center text-sm font-bold bg-muted border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          {onEndMatch && (
            <DropdownMenuItem 
              className="text-red-500 focus:text-red-500 focus:bg-red-500/10 font-bold"
              onClick={() => {
                setTimeout(() => {
                  if (onEndMatch) onEndMatch();
                }, 150);
              }}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Kết thúc trận đấu
            </DropdownMenuItem>
          )}
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
          <DropdownMenuItem 
            onClick={() => {
              setTimeout(() => {
                setShowCredit(true);
              }, 150);
            }}
          >
            <Info className="h-4 w-4 mr-2" />
            <span>Thông tin</span>
            <strong className="ml-auto text-xs text-muted-foreground">@Qý</strong>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DeveloperCreditModal open={showCredit} onOpenChange={setShowCredit} />
    </div>
  );
};
