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
  const {getHighestPointId} = usePlayers();
  return (
    <div
      className={cn(
        isSelected ? "bg-foreground/50" : "bg-foreground/10",
        "flex gap-x-4 h-[70px] w-full p-2 rounded-md relative"
      )}
      onClick={onClick}
    >
      { (id === getHighestPointId() && point !== 0 )&&(
        <div className="absolute -rotate-12 top-[-10px] -left-1">
          <img src={crown} width={30} />
        </div>
      )}
      <div className="flex flex-col justify-center items-center h-full flex-none bg-foreground/75 rounded-md p-1 pb-0">
        <img src={image} alt="avatar" className="object-cover h-full w-full " />
      </div>
      <div className="flex flex-col justify-center items-start grow">
        <p className=" font-bold text-lg">{name}</p>
        <div className="flex gap-x-1 overflow-hidden w-[99px]">{
      
      histories.slice((histories.length-5),histories.length).map(h => (
        <p className={cn(h.state == "W" ? "text-green-500": "text-red-500","text-sm")}>{h.state}</p>
      ))
      }</div>
      </div>
      <div className="flex justify-center items-center flex-none object-fit">
        <p
          className={cn(
            point < 0 ? "text-red-500" : "text-green-500",
            point === 0 && "text-primary",
            "font-bold text-3xl"
          )}
        >
          {Math.abs(point)}
        </p>
        <img src={aoh} className="h-[25px]" />
      </div>
    </div>
  );
};
