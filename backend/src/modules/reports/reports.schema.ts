import { z } from "zod";

export const reportQuerySchema = z
  .object({
    from: z.coerce.date(),
    to: z.coerce.date(),
    branchId: z.string().uuid().optional(),
    departmentId: z.string().uuid().optional(),
    doctorId: z.string().uuid().optional(),
  })
  .refine((value) => value.from <= value.to, {
    message: "from must be before or equal to to",
    path: ["to"],
  })
  .refine(
    (value) =>
      value.to.getTime() - value.from.getTime() <=
      366 * 24 * 60 * 60 * 1000,
    {
      message: "Report date range cannot exceed 366 days",
      path: ["to"],
    },
  );

export const dailyMisQuerySchema = z.object({
  date: z.coerce.date().default(() => new Date()),
  branchId: z.string().uuid().optional(),
});

export type ReportQuery = z.infer<typeof reportQuerySchema>;
export type DailyMisQuery = z.infer<typeof dailyMisQuerySchema>;
