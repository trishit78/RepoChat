import { db } from "@/server/db";
import axios from "axios";
import {Octokit} from "octokit";
import { aiSummarizeCommit } from "./gemini";

export const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN
});

const githubUrl = 'https://github.com/docker/genai-stack';
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
        commitAuthorAvatar: commit.author.avatar_url,
        commitDate: commit.commit.author.date
    }));
}



export const pollCommits = async(projectId:string)=>{
    const {project,githubUrl} = await fetchProjectGithubUrl(projectId);
    const commitHashes = await getCommitHashes(githubUrl);
    const unprocessedCommits = await filterUnprocessedCommits(projectId,commitHashes);
    const summaryResponses = await Promise.allSettled(unprocessedCommits.map(commit=>{
        return summarizeCommit(githubUrl,commit.commitHash);
    }));
    const summaries = summaryResponses.map((res)=>{
        if(res.status === 'fulfilled'){
            return res.value;
        }
        return 'No significant changes';
    })

    const commit = await db.commit.createMany({
        data:summaries.map((summary,index)=>{
            console.log(`processsing commit ${index+1} of ${summaries.length}`);
            return {
                projectId:projectId,
                commitHash:unprocessedCommits[index]!.commitHash,
                commitMessage:unprocessedCommits[index]!.commitMessage,
                commitAuthorName:unprocessedCommits[index]!.commitAuthorName,
                commitAuthorAvatar:unprocessedCommits[index]!.commitAuthorAvatar,
                commitDate:unprocessedCommits[index]!.commitDate,
                summary
            }
        })
    })
    return commit
    
}


async function summarizeCommit(githubUrl:string,commitHash:string){
    const {data} = await axios.get(`${githubUrl}/commit/${commitHash}.diff`,{
        headers:{
            'Accept':'application/vnd.github.v3.diff',
        }
    });
    console.log('data is',data)
    return await aiSummarizeCommit(data)|| 'No significant changes';

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
   const unprocessedCommits = commitHashes.filter(commit => !processedCommits.some(pc => pc.commitHash === commit.commitHash));
   return unprocessedCommits;
}