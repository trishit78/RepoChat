import { db } from "@/server/db";
import axios, { AxiosError } from "axios";
import { Octokit } from "octokit";
import type { RestEndpointMethodTypes } from "@octokit/types";
import { aiSummarizeCommit } from "./gemini";

export const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

type RepoInfo = {
  commitHash: string;
  commitMessage: string;
  commitAuthorName: string;
  commitAuthorAvatar: string;
  commitDate: string;
};

type CommitResponse =
  RestEndpointMethodTypes["repos"]["listCommits"]["response"]["data"][number];

interface GitHubUrlParts {
  owner: string;
  repo: string;
}

/**
 * Validates and parses a GitHub URL into owner and repo parts
 * @param githubUrl - The GitHub repository URL
 * @returns Object containing owner and repo
 * @throws Error if URL is invalid
 */
function parseGitHubUrl(githubUrl: string): GitHubUrlParts {
  if (!githubUrl || typeof githubUrl !== "string") {
    throw new Error("GitHub URL must be a non-empty string");
  }

  const parts = githubUrl.split("/").filter(Boolean);
  const owner = parts[parts.length - 2];
  const repo = parts[parts.length - 1];

  if (!owner || !repo) {
    throw new Error(
      `Invalid GitHub URL format: ${githubUrl}. Expected format: https://github.com/owner/repo`
    );
  }

  return { owner, repo };
}

/**
 * Fetches the latest commit hashes and metadata from a GitHub repository
 * @param githubUrl - The GitHub repository URL
 * @returns Array of commit information (up to 10 most recent commits)
 */
export const getCommitHashes = async (
  githubUrl: string
): Promise<RepoInfo[]> => {
  const { owner, repo } = parseGitHubUrl(githubUrl);

  try {
    const { data } = await octokit.rest.repos.listCommits({
      owner,
      repo,
      per_page: 10,
    });

    const sortedData = [...data].sort(
      (a, b) =>
        new Date(b.commit.author?.date ?? 0).getTime() -
        new Date(a.commit.author?.date ?? 0).getTime()
    );

    return sortedData.map((commit: CommitResponse) => ({
      commitHash: commit.sha,
      commitMessage: commit.commit.message ?? "No commit message",
      commitAuthorName: commit.commit.author?.name ?? "Unknown",
      commitAuthorAvatar: commit.author?.avatar_url ?? "",
      commitDate: commit.commit.author?.date ?? new Date().toISOString(),
    }));
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      if (status === 404) {
        throw new Error(
          `Repository not found: ${owner}/${repo}. Please check if the repository exists and is accessible.`
        );
      } else if (status === 403) {
        throw new Error(
          `Access forbidden to ${owner}/${repo}. Check GitHub token permissions.`
        );
      }
    }
    throw new Error(
      `Failed to fetch commits from ${owner}/${repo}: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
};

/**
 * Polls for new commits and processes them with AI summaries
 * @param projectId - The project ID to poll commits for
 * @returns Array of created commit records or empty array if no new commits
 */
export const pollCommits = async (projectId: string) => {
  if (!projectId || typeof projectId !== "string") {
    throw new Error("Project ID must be a non-empty string");
  }

  try {
    const { githubUrl } = await fetchProjectGithubUrl(projectId);
    console.log("Fetching commits for:", githubUrl);

    const commitHashes = await getCommitHashes(githubUrl);
    console.log(`Found ${commitHashes.length} commits`);

    const unprocessedCommits = await filterUnprocessedCommits(
      projectId,
      commitHashes
    );
    console.log(`Processing ${unprocessedCommits.length} new commits`);

    if (unprocessedCommits.length === 0) {
      console.log("No new commits to process");
      return [];
    }

    const summaryResponses = await Promise.allSettled(
      unprocessedCommits.map(async (commit, index) => {
        console.log(
          `Summarizing commit ${index + 1}/${unprocessedCommits.length}: ${commit.commitHash.slice(0, 7)}`
        );
        return await summarizeCommit(githubUrl, commit.commitHash);
      })
    );

    const summaries = summaryResponses.map((res, index) => {
      if (res.status === "fulfilled" && res.value?.trim()) {
        console.log(`✅ Commit ${index + 1} summarized successfully`);
        return res.value;
      } else {
        const errorMsg =
          res.status === "rejected" ? String(res.reason) : "Empty summary";
        console.log(`❌ Commit ${index + 1} failed to summarize:`, errorMsg);
        return "Failed to generate summary";
      }
    });

    const commitData = summaries.map((summary, index) => {
      const commit = unprocessedCommits[index];
      if (!commit) {
        throw new Error(`Missing commit data at index ${index}`);
      }
      console.log(`💾 Saving commit ${index + 1} of ${summaries.length}`);
      return {
        projectId,
        commitHash: commit.commitHash,
        commitMessage: commit.commitMessage,
        commitAuthorName: commit.commitAuthorName,
        commitAuthorAvatar: commit.commitAuthorAvatar,
        commitDate: commit.commitDate,
        summary,
      };
    });

    const result = await db.commit.createMany({
      data: commitData,
    });

    console.log(`✅ Successfully processed ${summaries.length} commits`);
    return result;
  } catch (error) {
    console.error("❌ Error in pollCommits:", error);
    throw error;
  }
};

/**
 * Summarizes a commit by fetching its diff and using AI
 * @param githubUrl - The GitHub repository URL
 * @param commitHash - The commit SHA hash
 * @returns Summary string or error message
 */
async function summarizeCommit(
  githubUrl: string,
  commitHash: string
): Promise<string> {
  if (!commitHash || typeof commitHash !== "string") {
    return "Invalid commit hash provided";
  }

  try {
    console.log(`📥 Fetching diff for commit: ${commitHash.slice(0, 7)}`);

    const diffUrl = `${githubUrl}/commit/${commitHash}.diff`;
    console.log("Diff URL:", diffUrl);

    const response = await axios.get<string>(diffUrl, {
      headers: {
        Accept: "application/vnd.github.v3.diff",
        "User-Agent": "RepoChat-App",
      },
      timeout: 30000,
      validateStatus: (status) => status < 500,
    });

    if (response.status === 404) {
      return "Commit not found or repository is private";
    } else if (response.status === 403) {
      return "Access forbidden - check GitHub token permissions";
    } else if (response.status !== 200) {
      return `Failed to fetch diff: HTTP ${response.status}`;
    }

    if (!response.data || response.data.trim() === "") {
      console.log(`⚠️  Empty diff for commit ${commitHash.slice(0, 7)}`);
      return "No changes detected in diff";
    }

    console.log(`📊 Diff size: ${response.data.length} characters`);
    console.log("First 200 chars of diff:", response.data.substring(0, 200));

    const summary = await aiSummarizeCommit(response.data);

    if (!summary || summary.trim() === "") {
      console.log(
        `⚠️  AI returned empty summary for commit ${commitHash.slice(0, 7)}`
      );
      return "AI failed to generate summary";
    }

    console.log(`✅ Generated summary: ${summary.substring(0, 100)}...`);
    return summary;
  } catch (error) {
    console.error(
      `❌ Error summarizing commit ${commitHash.slice(0, 7)}:`,
      error
    );

    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      if (axiosError.code === "ECONNABORTED") {
        return "Request timeout while fetching commit diff";
      } else if (axiosError.code === "ENOTFOUND") {
        return "Network error: Unable to reach GitHub";
      }
    }

    return `Error: ${error instanceof Error ? error.message : "Unknown error"}`;
  }
}

/**
 * Fetches the GitHub URL for a project
 * @param projectId - The project ID
 * @returns Object containing project and githubUrl
 * @throws Error if project not found or URL missing
 */
async function fetchProjectGithubUrl(
  projectId: string
): Promise<{ project: { githubUrl: string }; githubUrl: string }> {
  const project = await db.project.findUnique({
    where: { id: projectId },
    select: { githubUrl: true },
  });

  if (!project?.githubUrl) {
    throw new Error(
      `Project not found or GitHub URL missing for project ID: ${projectId}`
    );
  }

  return { project, githubUrl: project.githubUrl };
}

/**
 * Filters out commits that have already been processed
 * @param projectId - The project ID
 * @param commitHashes - Array of commit information
 * @returns Array of unprocessed commits
 */
async function filterUnprocessedCommits(
  projectId: string,
  commitHashes: RepoInfo[]
): Promise<RepoInfo[]> {
  const processedCommits = await db.commit.findMany({
    where: { projectId },
    select: { commitHash: true },
  });

  const processedHashes = new Set(
    processedCommits.map((pc) => pc.commitHash)
  );
  const unprocessedCommits = commitHashes.filter(
    (commit) => !processedHashes.has(commit.commitHash)
  );

  return unprocessedCommits;
}
