// src/app/api/commits/[projectId]/route.ts
import { pollCommits } from "@/lib/github";
import { NextResponse } from "next/server";

export async function GET(req: Request, { params }: { params: { projectId: string } }) {
  const commits = await pollCommits(params.projectId);
  return NextResponse.json(commits);
}
