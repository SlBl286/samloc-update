import aoh from "@/assets/aoh.png";
import crown from "@/assets/crown.png";
import { HistoryType } from "@/common/types";
import { usePlayers } from "@/hooks/players";
import { cn } from "@/lib/utils";

type PlayerProps = {
  id: number;
  name: string;
  point: number;
  image?: string;
  histories: HistoryType[];
  onClick: () => void;
  isSelected: boolean;
};

export const Player = ({
  id,
  image,
  name,
  point,
  histories,
  onClick,
  isSelected,
}: PlayerProps) => {
  const { getHighestPointId } = usePlayers();
  return (
    <div
      className={cn(
        isSelected ? "bg-foreground/50" : "bg-foreground/10",
        "flex gap-x-4 h-[70px] w-full min-w-0 p-2 rounded-md relative",
      )}
      onClick={onClick}
    >
      {id === getHighestPointId() && point !== 0 && (
        <div className="absolute -rotate-12 top-[-10px] -left-1">
          <img src={crown} width={30} />
        </div>
      )}
      <div className="flex flex-col justify-center items-center h-full w-[54px] flex-none bg-foreground/75 rounded-md p-1 pb-0">
        <img src={image} alt="avatar" className="object-cover h-full w-full rounded-sm" />
      </div>
      <div className="flex flex-col justify-center items-start grow min-w-0">
        <p className=" font-bold text-lg truncate w-full">{name}</p>
        {(() => {
          if (!histories || histories.length === 0) return null;
          const lastIndex = histories.length - 1;
          const lastGame = histories[lastIndex];
          const lastState = lastGame.state;
          let streak = 0;
          for (let i = lastIndex; i >= 0; i--) {
            if (histories[i].state === lastState) {
              streak++;
            } else {
              break;
            }
          }
          if (streak >= 2 && lastState !== "H") {
            return lastState === "W" ? (
              <span className="text-[10px] text-green-500 font-bold bg-green-500/10 px-1.5 py-0.5 rounded mt-0.5">
                🔥 Chuỗi thắng {streak}
              </span>
            ) : (
              <span className="text-[10px] text-red-500 font-bold bg-red-500/10 px-1.5 py-0.5 rounded mt-0.5">
                💀 Chuỗi thua {streak}
              </span>
            );
          } else {
            const delta = lastGame.pointDelta !== undefined 
              ? lastGame.pointDelta 
              : (histories.length === 1 
                  ? lastGame.pointChange 
                  : lastGame.pointChange - histories[lastIndex - 1].pointChange);
            if (delta > 0) {
              return (
                <span className="text-[10px] text-green-500 font-semibold bg-green-500/5 px-1.5 py-0.5 rounded mt-0.5">
                  Ván trước: +{delta}
                </span>
              );
            } else if (delta < 0) {
              return (
                <span className="text-[10px] text-red-500 font-semibold bg-red-500/5 px-1.5 py-0.5 rounded mt-0.5">
                  Ván trước: {delta}
                </span>
              );
            } else {
              return (
                <span className="text-[10px] text-muted-foreground font-semibold bg-muted px-1.5 py-0.5 rounded mt-0.5">
                  Ván trước: Hoà
                </span>
              );
            }
          }
        })()}
      </div>
      <div className="flex justify-center items-center flex-none gap-x-1">  
        <p
          className={cn(
            point < 0 ? "text-red-500" : "text-green-500",
            point === 0 && "text-primary",
            "font-bold text-2xl truncate",
          )}
        >
          { Intl.NumberFormat("vi", { notation: "compact" }).format(Math.abs(point)) }
        </p>
        <img src={aoh} className="h-[25px] w-auto flex-none" alt="aoh" />
      </div>
    </div>
  );
};
