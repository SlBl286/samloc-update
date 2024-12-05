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
    state: "W" | "L" | "D";
    pointChange : number;
    block2 : number;
    isBlock2 : number;
}
export type PointSateType = {
    id: number;
    point: number;
}