import { db } from "@/server/db";
import axios from "axios";
import {Octokit} from "octokit";
import { aiSummarizeCommit } from "./gemini";

export const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN
});

type RepoInfo = {
 commitHash: string;
 commitMessage: string;
 commitAuthorName: string;
 commitAuthorAvatar: string;
 commitDate: string;
}

export const getCommitHashes = async (githubUrl:string): Promise<RepoInfo[]> => {
    const [owner,repo] = githubUrl.split('/').slice(-2)

    if(!owner || !repo) throw new Error('Invalid github url');

    const {data} = await octokit.rest.repos.listCommits({
        owner,
        repo
    });
    
    const sortedData = data.sort((a:any, b:any) => new Date(b.commit.author.date).getTime() - new Date(a.commit.author.date).getTime())  as any;

    return sortedData.slice(0, 10).map((commit:any) => ({
        commitHash: commit.sha,
        commitMessage: commit.commit.message,
        commitAuthorName: commit.commit.author.name,
        commitAuthorAvatar: commit.author?.avatar_url || '',
        commitDate: commit.commit.author.date
    }));
}

export const pollCommits = async(projectId:string)=>{
    try {
        const {project,githubUrl} = await fetchProjectGithubUrl(projectId);
        console.log('Fetching commits for:', githubUrl);
        
        const commitHashes = await getCommitHashes(githubUrl);
        console.log(`Found ${commitHashes.length} commits`);
        
        const unprocessedCommits = await filterUnprocessedCommits(projectId,commitHashes);
        console.log(`Processing ${unprocessedCommits.length} new commits`);
        
        if (unprocessedCommits.length === 0) {
            console.log('No new commits to process');
            return [];
        }

        const summaryResponses = await Promise.allSettled(
            unprocessedCommits.map(async (commit, index) => {
                console.log(`Summarizing commit ${index + 1}/${unprocessedCommits.length}: ${commit.commitHash.slice(0, 7)}`);
                return await summarizeCommit(githubUrl, commit.commitHash);
            })
        );

        const summaries = summaryResponses.map((res, index) => {
            if(res.status === 'fulfilled' && res.value && res.value.trim() !== '') {
                console.log(`✅ Commit ${index + 1} summarized successfully`);
                return res.value;
            } else {
                console.log(`❌ Commit ${index + 1} failed to summarize:`, 
                    res.status === 'rejected' ? res.reason : 'Empty summary');
                return 'Failed to generate summary';
            }
        });

        const commit = await db.commit.createMany({
            data: summaries.map((summary, index) => {
                console.log(`💾 Saving commit ${index + 1} of ${summaries.length}`);
                return {
                    projectId: projectId,
                    commitHash: unprocessedCommits[index]!.commitHash,
                    commitMessage: unprocessedCommits[index]!.commitMessage,
                    commitAuthorName: unprocessedCommits[index]!.commitAuthorName,
                    commitAuthorAvatar: unprocessedCommits[index]!.commitAuthorAvatar,
                    commitDate: unprocessedCommits[index]!.commitDate,
                    summary
                }
            })
        });
        
        console.log(`✅ Successfully processed ${summaries.length} commits`);
        return commit;
        
    } catch (error) {
        console.error('❌ Error in pollCommits:', error);
        throw error;
    }
}

async function summarizeCommit(githubUrl: string, commitHash: string) {
    try {
        console.log(`📥 Fetching diff for commit: ${commitHash.slice(0, 7)}`);
        
        // Try different approaches to get the diff
        const diffUrl = `${githubUrl}/commit/${commitHash}.diff`;
        console.log('Diff URL:', diffUrl);
        
        const response = await axios.get(diffUrl, {
            headers: {
                'Accept': 'application/vnd.github.v3.diff',
                'User-Agent': 'RepoChat-App'
            },
            timeout: 30000 // 30 second timeout
        });

        if (!response.data || response.data.trim() === '') {
            console.log(`⚠️  Empty diff for commit ${commitHash.slice(0, 7)}`);
            return 'No changes detected in diff';
        }

        console.log(`📊 Diff size: ${response.data.length} characters`);
        console.log('First 200 chars of diff:', response.data.substring(0, 200));

        const summary = await aiSummarizeCommit(response.data);
        
        if (!summary || summary.trim() === '') {
            console.log(`⚠️  AI returned empty summary for commit ${commitHash.slice(0, 7)}`);
            return 'AI failed to generate summary';
        }

        console.log(`✅ Generated summary: ${summary.substring(0, 100)}...`);
        return summary;

    } catch (error) {
        console.error(`❌ Error summarizing commit ${commitHash.slice(0, 7)}:`, error);
        
        if (axios.isAxiosError(error)) {
            if (error.response?.status === 404) {
                return 'Commit not found or repository is private';
            } else if (error.response?.status === 403) {
                return 'Access forbidden - check GitHub token permissions';
            } else if (error.code === 'ECONNABORTED') {
                return 'Request timeout while fetching commit diff';
            }
        }
        
        return `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
}

async function fetchProjectGithubUrl(projectId:string){
    const project = await db.project.findUnique({
        where:{id:projectId},
        select:{
            githubUrl:true
        }
    });
    if(!project?.githubUrl) throw new Error('Project not found or githubUrl missing');
    return {project,githubUrl:project.githubUrl};
}

async function filterUnprocessedCommits(projectId:string,commitHashes:RepoInfo[]){
    const processedCommits = await db.commit.findMany({
        where:{
            projectId
        },
        select:{
            commitHash:true
        }
    });
    const processedHashes = new Set(processedCommits.map(pc => pc.commitHash));
    const unprocessedCommits = commitHashes.filter(commit => !processedHashes.has(commit.commitHash));
    return unprocessedCommits;
}