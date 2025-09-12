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
    const {data} = await octokit.rest.repos.listCommits({
        owner: 'docker',
        repo: 'genai-stack',
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

