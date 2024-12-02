
import { z } from "zod";
export const addPlayerShema = z.object({
    name : z.string().min(1,"Chưa nhập tên người chơi"),
    description : z.string().optional(),
    image : z.string().optional(),
})

