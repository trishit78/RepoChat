import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";

export const postRouter = createTRPCRouter({
  create: publicProcedure
    .input(z.object({ name: z.string().min(1) }))
    .mutation(async ({ input }) => {
      return { name: input.name };
    }),

  getLatest: publicProcedure.query(async () => {
    return { name: "placeholder" };
  }),
});
