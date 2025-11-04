# How Post Router Functions Work Without Context

## Overview

The maintainer asked: "How without context you are able to do the mutation and getLatest in src/server/api/routers/post.ts?"

This document explains how tRPC's architecture allows these functions to work without explicitly passing context around.

## The Post Router Implementation

Here's the implementation of the post router:

```typescript
// src/server/api/routers/post.ts
import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";

export const postRouter = createTRPCRouter({
  // getLatest query - no explicit context needed
  getLatest: publicProcedure.query(async ({ ctx }) => {
    const post = await ctx.db.post.findFirst({
      orderBy: { createdAt: "desc" },
    });
    return post ?? null;
  }),

  // create mutation - no explicit context needed
  create: publicProcedure
    .input(z.object({ name: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.post.create({
        data: {
          name: input.name,
        },
      });
    }),
});
```

## How Context is Automatically Provided

The magic happens in the tRPC setup:

1. **Context Creation**: In `src/server/api/trpc.ts`, the context is created with the database connection:

```typescript
// src/server/api/trpc.ts
export const createTRPCContext = async (opts: { headers: Headers }) => {
  return {
    db,  // Database is injected here
    ...opts,
  };
};
```

2. **Context Injection**: tRPC automatically injects this context into every procedure. The `ctx` parameter in each procedure function contains the database connection.

3. **Client Usage**: On the client side, you can call these functions without providing any context:

```typescript
// Client component example
"use client";
import { api } from "@/trpc/react";

// For queries - no context needed
const { data: latestPost } = api.post.getLatest.useQuery();

// For mutations - no context needed
const createPost = api.post.create.useMutation();
createPost.mutate({ name: "New Post" });
```

## The Flow of Context

1. **Server Setup**: The database connection is set up once in the tRPC context.
2. **API Routes**: When a request comes in, tRPC middleware creates the context.
3. **Procedure Execution**: The context is automatically passed to the procedure function.
4. **Client Calls**: The client doesn't need to know about the context - it just calls the procedures.

## Benefits of This Approach

1. **Clean Code**: No need to manually pass context around.
2. **Type Safety**: Everything is fully typed from client to server.
3. **Separation of Concerns**: Client code doesn't need to know about database connections.
4. **Reduced Boilerplate**: Less code to write and maintain.

This architecture is what allows the post router's mutation and getLatest functions to work without explicitly passing context around.