import { z } from "zod";
export const permissionListQuerySchema = z.object({
  moduleCode: z.string().trim().max(60).optional(),
  search: z.string().trim().max(120).optional(),
});
