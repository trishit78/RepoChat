import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/api/trpc";
import z from "zod";

export const projectRouter = createTRPCRouter({
  createProject: protectedProcedure
    .input(
      z.object({
        githubUrl: z.string().url(),
        githubToken: z.string().optional(),
        name: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const project = await ctx.db.project.create({
        data: {
          name: input.name,
          githubUrl: input.githubUrl,
          userToProject: {
            create: {
              userId: ctx.user.userId!,
            },
          },
        },
      });
      return project;
    }),
    getProjects: protectedProcedure.query(async({ctx})=>{
      const projects = await ctx.db.project.findMany({
        where:{
          userToProject:{
            some:{
              userId:ctx.user.userId!
            }
          },
          deletedAt:null
        }
      })
      return projects;
    })
});
