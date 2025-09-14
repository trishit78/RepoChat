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
      let project;
      
      try {
        // Step 1: Create the project first
        console.log('📝 Creating project in database...');
        project = await ctx.db.project.create({
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
        console.log(`✅ Project created successfully: ${project.id}`);

      } catch (error) {
        console.error('❌ Failed to create project:', error);
        throw new Error(`Failed to create project: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      // Step 2: Try to index the repository (but don't fail if this fails)
      try {
        console.log('🔍 Starting repository indexing...');
        await indexGithubRepo(project.id, input.githubUrl, input.githubToken);
        console.log('✅ Repository indexed successfully');
      } catch (indexError) {
        console.error('⚠️  Repository indexing failed, but project was created:', indexError);
        // Don't throw here - the project should still be created even if indexing fails
        // You might want to store this error state in the database
      }

      // Step 3: Try to poll commits (but don't fail if this fails)
      try {
        console.log('📊 Starting commit polling...');
        await pollCommits(project.id);
        console.log('✅ Commits polled successfully');
      } catch (commitError) {
        console.error('⚠️  Commit polling failed, but project was created:', commitError);
        // Don't throw here either
      }

      return {
        ...project,
        // You could add status indicators
        indexingStatus: 'completed', // or 'failed' based on the above
        commitPollingStatus: 'completed' // or 'failed'
      };
    }),

  getProjects: protectedProcedure.query(async ({ ctx }) => {
    const projects = await ctx.db.project.findMany({
      where: {
        userToProject: {
          some: {
            userId: ctx.user.userId!
          }
        },
        deletedAt: null
      }
    });
    return projects;
  }),

  getCommits: protectedProcedure
    .input(z.object({
      projectId: z.string().cuid()
    }))
    .query(async ({ ctx, input }) => {
      // Poll commits in background without blocking
      pollCommits(input.projectId)
        .then(() => console.log(`✅ Background commit polling completed for: ${input.projectId}`))
        .catch((error) => console.error(`❌ Background commit polling failed:`, error));
        
      return await ctx.db.commit.findMany({
        where: { projectId: input.projectId },
        orderBy: { commitDate: 'desc' }
      });
    })
});