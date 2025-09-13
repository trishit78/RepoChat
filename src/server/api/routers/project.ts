import { pollCommits } from "@/lib/github";
import { indexGithubRepo } from "@/lib/github-loader";

import {
  createTRPCRouter,
  protectedProcedure,
 
} from "@/server/api/trpc";
import z from "zod";

export const projectRouter = createTRPCRouter({
  createProject: protectedProcedure
    .input(
      z.object({
        githubUrl: z.string(),
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
     await indexGithubRepo(input.githubUrl,project.id,input.githubToken)
      await pollCommits(project.id);
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
    }),
    getCommits:protectedProcedure.input(z.object({
      projectId:z.string().cuid()
    })).query(async({ctx,input})=>{
      pollCommits(input.projectId).then().catch(console.error)
      return await ctx.db.commit.findMany({where:{projectId:input.projectId}})
    })
});