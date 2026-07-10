export type PlayerType = {
    id: number;
    name: string;
    description?: string;
    point: number;
    image?: string;
    histories: HistoryType[]
}

export type HistoryType = {
    gameNumber : number;
    state: "W" | "L" | "H" | "FL" | "FW" | "FLF";
    pointChange : number;
    block2 : number;
    isBlock2 : number;
    cardsCount?: number;
    isChay?: boolean;
    samStatus?: "none" | "success" | "fail" | "block" | "lost_to_sam";
    isChopped2?: boolean;
    pointDelta?: number;
    cardsDelta?: number;
    chopsDelta?: number;
    multiplier?: number;
}
export type PointSateType = {
    id: number;
    point: number;
}