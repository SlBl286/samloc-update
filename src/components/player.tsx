import aoh from "@/assets/aoh.png"
import { cn } from "@/lib/utils";

type PlayerProps = {
    name: string;
    point: number;
    image?: string;
    description? : string;
    onClick : ()=> void
    isSelected : boolean;
}

export const Player = ({image,name,point,description,onClick,isSelected}:PlayerProps)=> {
    return (
        <div className={cn(isSelected ? "bg-foreground/50" : "bg-foreground/10",
          "flex gap-x-4 h-[70px] w-full p-2 rounded-md")}
           onClick={onClick}>
          <div className="flex flex-col justify-center items-center h-full flex-none bg-foreground/75 rounded-md">
            <img src={image} alt="avatar" className="object-cover h-full w-full "/>
          </div>
          <div className="flex flex-col justify-center items-start grow">
            <p className=" font-bold text-lg">{name}</p>
            <p className="text-muted-foreground">{description}</p>
          </div>
          <div className="flex justify-center items-center flex-none">
            <p className="font-bold text-3xl">{point}</p>
            <img src={aoh} className="h-[25px]"/>
          </div>
        </div>
    )
}