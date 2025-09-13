import { db } from "@/server/db";
import {Octokit} from "octokit";

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
    return unprocessedCommits;

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