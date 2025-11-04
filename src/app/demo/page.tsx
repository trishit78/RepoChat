"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/trpc/react";

// This demo shows how tRPC procedures work without explicit context
export default function DemoPage() {
  // State for the new post name
  const [name, setName] = useState("");
  
  // Using tRPC's getLatest query - no explicit context needed
  const { data: latestPost, refetch, isLoading } = api.post.getLatest.useQuery();
  
  // Using tRPC's create mutation - no explicit context needed
  const createPost = api.post.create.useMutation({
    onSuccess: () => {
      setName("");
      refetch();
    }
  });

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Post Router Demo (Real tRPC)</h1>
      
      <div className="bg-slate-100 p-6 rounded-lg mb-6">
        <h2 className="text-lg font-semibold mb-2">Latest Post</h2>
        <Button 
          onClick={() => refetch()} 
          disabled={isLoading}
          className="mb-4"
        >
          {isLoading ? "Loading..." : "Refresh Latest Post"}
        </Button>
        
        {isLoading ? (
          <p>Loading...</p>
        ) : latestPost ? (
          <div>
            <p><span className="font-medium">Name:</span> {latestPost.name}</p>
            <p><span className="font-medium">Created:</span> {new Date(latestPost.createdAt).toLocaleString()}</p>
          </div>
        ) : (
          <p>No posts found. Create a new post below.</p>
        )}
      </div>
      
      <div className="bg-slate-100 p-6 rounded-lg">
        <h2 className="text-lg font-semibold mb-4">Create New Post</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createPost.mutate({ name });
          }}
          className="flex flex-col gap-4"
        >
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1">
              Post Name
            </label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter post name"
              className="w-full"
            />
          </div>
          
          <Button 
            type="submit" 
            disabled={createPost.isLoading || name.length === 0}
            className="w-full"
          >
            {createPost.isLoading ? "Creating..." : "Create Post"}
          </Button>
        </form>
      </div>
      
      <div className="mt-8 p-6 bg-slate-50 rounded-lg border border-slate-200">
        <h2 className="text-lg font-semibold mb-4">How It Works (No Context Needed)</h2>
        <p className="mb-4">
          In a real application, the post router's mutation and getLatest functions work without explicitly passing context:
        </p>
        <div className="bg-gray-800 text-white p-4 rounded-md overflow-auto mb-4">
          <pre className="text-sm">
{`// In the post router (server-side)
export const postRouter = createTRPCRouter({
  // No context needed in the definition
  getLatest: publicProcedure.query(async ({ ctx }) => {
    const post = await ctx.db.post.findFirst({
      orderBy: { createdAt: "desc" },
    });
    return post ?? null;
  }),

  // No context needed in the definition
  create: publicProcedure
    .input(z.object({ name: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.post.create({
        data: { name: input.name },
      });
    }),
});`}
          </pre>
        </div>
        
        <div className="bg-gray-800 text-white p-4 rounded-md overflow-auto mb-4">
          <pre className="text-sm">
{`// In a client component (client-side)
// No need to pass context manually
const { data: latestPost } = api.post.getLatest.useQuery();

// No need to pass context manually
const createPost = api.post.create.useMutation();
createPost.mutate({ name: "New Post" });`}
          </pre>
        </div>
        
        <p className="mt-4">
          The context (database connection, etc.) is automatically provided by tRPC's context system.
          This is defined in <code>src/server/api/trpc.ts</code> where the database is injected into the context.
        </p>
      </div>
    </div>
  );
}