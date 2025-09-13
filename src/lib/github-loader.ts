import { GithubRepoLoader } from "@langchain/community/document_loaders/web/github";
import type { Document } from "@langchain/core/documents";
import { generateEmbedding, summarizeCode } from "./gemini";
import { db } from "@/server/db";

export const loadGithubRepo = async (githubUrl:string,githubToken?:string)=>{
    const loader = new GithubRepoLoader(githubUrl,{
        accessToken:githubToken || '',
        branch:"main",
        recursive:true,
        unknown: "warn",
        ignoreFiles: [".gitignore", "node_modules/**",'package-lock.json','yarn.lock','.DS_Store','.git/**'],
        maxConcurrency:5
    });
    const docs = await loader.load();
    return docs;
}

export const indexGithubRepo = async(githubUrl:string,projectId:string,githubToken?:string)=>{
    const docs = await loadGithubRepo(githubUrl,githubToken);
    const allEmbeddings = await generateEmbeddings(docs);
    await Promise.allSettled(allEmbeddings.map(async (e,index)=>{
        console.log(`processing embedding ${index} of ${allEmbeddings.length }`);
        if(!e)return;
        const sourceCodeEmbedding = await  db.sourceCodeEmbedding.create({
            data:{
                summary:e.summary,
                sourceCode:e.sourceCode,
                fileName:e.fileName,
                projectId
            }
        })
        await db.$executeRaw`
        UPDATE "SourceCodeEmbedding" SET "summaryEmbedding" = ${e.embedding}::vector WHERE "id" = ${sourceCodeEmbedding.id}
        `    
    }))

}


const generateEmbeddings = async(docs:Document[])=>{
    return await Promise.all(docs.map(async(doc)=>{
        const summary = await summarizeCode(doc);
        const embedding = await generateEmbedding(summary);
        return {
            summary,embedding,
            sourceCode:JSON.parse(JSON.stringify(doc.pageContent)),
            fileName:doc.metadata.source
        }
    }))
}
