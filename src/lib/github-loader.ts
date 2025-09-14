// import { GithubRepoLoader } from "@langchain/community/document_loaders/web/github";
// import type { Document } from "@langchain/core/documents";
// import { generateEmbedding, summarizeCode } from "./gemini";
// import { db } from "@/server/db";

// export const loadGithubRepo = async (githubUrl:string,githubToken?:string)=>{
//     const loader = new GithubRepoLoader(githubUrl,{
//         accessToken:githubToken || '',
//         branch:"main",
//         recursive:true,
//         unknown: "warn",
//         ignoreFiles: [".gitignore", "node_modules/**",'package-lock.json','yarn.lock','.DS_Store','.git/**'],
//         maxConcurrency:5
//     });
//     const docs = await loader.load();
//     return docs;
// }

// export const indexGithubRepo = async(projectId:string,githubUrl:string,githubToken?:string)=>{
//     const docs = await loadGithubRepo(githubUrl,githubToken);
//     const allEmbeddings = await generateEmbeddings(docs);
//     await Promise.allSettled(allEmbeddings.map(async (e,index)=>{
//         console.log(`processing embedding ${index} of ${allEmbeddings.length }`);
//         if(!e)return;
//         const sourceCodeEmbedding = await  db.sourceCodeEmbedding.create({
//             data:{
//                 summary:e.summary,
//                 sourceCode:e.sourceCode,
//                 fileName:e.fileName,
//                 projectId
//             }
//         })
//         await db.$executeRaw`
//         UPDATE "SourceCodeEmbedding" SET "summaryEmbedding" = ${e.embedding}::vector WHERE "id" = ${sourceCodeEmbedding.id}
//         `    
//     }))

// }


// const generateEmbeddings = async(docs:Document[])=>{
//     return await Promise.all(docs.map(async(doc)=>{
//         const summary = await summarizeCode(doc);
//         const embedding = await generateEmbedding(summary);
//         return {
//             summary,embedding,
//             sourceCode:JSON.parse(JSON.stringify(doc.pageContent)),
//             fileName:doc.metadata.source
//         }
//     }))
// }


import { GithubRepoLoader } from "@langchain/community/document_loaders/web/github";
import type { Document } from "@langchain/core/documents";
import { generateEmbedding, summarizeCode } from "./gemini";
import { db } from "@/server/db";

export const loadGithubRepo = async (githubUrl: string, githubToken?: string) => {
    // Use provided token or fall back to environment variable
    const token = process.env.GITHUB_TOKEN;
    console.log('🔑 Using GitHub token from', githubToken ? 'input parameter' : 'environment variable');
   
  if (!token) {
        console.error('❌ No GitHub token provided');
        throw new Error('GitHub token is required to access repository');
    }
   // console.log('🔑 Using GitHub token:', token.substring(0, 8) + '...');
    console.log('📂 Loading repository:', githubUrl);

    try {
        const loader = new GithubRepoLoader(githubUrl, {
            accessToken: token,
            branch: "main",
            recursive: true,
            unknown: "warn",
            ignoreFiles: [
                ".gitignore", 
                "node_modules/**", 
                "package-lock.json", 
                "yarn.lock", 
                ".DS_Store", 
                ".git/**",
                "*.png",
                "*.jpg",
                "*.jpeg",
                "*.gif",
                "*.svg",
                "*.ico",
                "*.pdf",
                "*.zip",
                "*.tar.gz"
            ],
            maxConcurrency: 3 // Reduced to avoid rate limits
        });
        
        //const docs = await loader.load();


        const docs = await loader.load().catch(err => {
  if (err.message.includes("HTTP/1.1 403")) {
    throw new Error("GitHub API rate limit or forbidden. Use a valid token.");
  }
  if (err.message.includes("HTTP/1.1 404")) {
    throw new Error("Repository not found or inaccessible.");
  }
  throw err;
});
        console.log(`✅ Successfully loaded ${docs.length} documents`);
        return docs;
        
    } catch (error) {
        console.error('❌ Error loading GitHub repository:', error);
        
        if (error instanceof Error) {
            if (error.message.includes('401') || error.message.includes('Bad credentials')) {
                throw new Error('Invalid GitHub token. Please check your GITHUB_TOKEN or provide a valid token.');
            } else if (error.message.includes('404')) {
                throw new Error('Repository not found. Please check the URL or ensure the repository is accessible.');
            } else if (error.message.includes('403')) {
                throw new Error('Access forbidden. The token may not have sufficient permissions.');
            }
        }
        
        throw new Error(`Failed to load repository: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};

export const indexGithubRepo = async (projectId: string, githubUrl: string, githubToken?: string) => {
    try {
        console.log(`🚀 Starting indexing for project: ${projectId}`);
        console.log(`📍 Repository URL: ${githubUrl}`);
        
        const docs = await loadGithubRepo(githubUrl, githubToken);
        
        if (docs.length === 0) {
            console.log('⚠️  No documents found in repository');
            return;
        }

        console.log(`📊 Processing ${docs.length} documents for embeddings...`);
        const allEmbeddings = await generateEmbeddings(docs);
        
        let successCount = 0;
        let errorCount = 0;
        
        await Promise.allSettled(
            allEmbeddings.map(async (embedding, index) => {
                try {
                    console.log(`💾 Processing embedding ${index + 1} of ${allEmbeddings.length}`);
                    
                    if (!embedding) {
                        console.log(`⚠️  Skipping empty embedding ${index + 1}`);
                        return;
                    }

                    const sourceCodeEmbedding = await db.sourceCodeEmbedding.create({
                        data: {
                            summary: embedding.summary,
                            sourceCode: embedding.sourceCode,
                            fileName: embedding.fileName,
                            projectId
                        }
                    });

                    // Only update with embedding if we have valid embedding data
                    if (embedding.embedding && embedding.embedding.length > 0) {
                        await db.$executeRaw`
                            UPDATE "SourceCodeEmbedding" 
                            SET "summaryEmbedding" = ${embedding.embedding}::vector 
                            WHERE "id" = ${sourceCodeEmbedding.id}
                        `;
                    }
                    
                    successCount++;
                    
                } catch (error) {
                    console.error(`❌ Failed to save embedding ${index + 1}:`, error);
                    errorCount++;
                }
            })
        );

        console.log(`✅ Indexing completed for project ${projectId}:`);
        console.log(`   - Successfully processed: ${successCount} files`);
        console.log(`   - Failed: ${errorCount} files`);
        
    } catch (error) {
        console.error(`❌ Failed to index repository for project ${projectId}:`, error);
        throw error;
    }
};

const generateEmbeddings = async (docs: Document[]) => {
    console.log(`🤖 Generating embeddings for ${docs.length} documents...`);
    
    return await Promise.all(
        docs.map(async (doc, index) => {
            try {
                console.log(`📝 Processing document ${index + 1}/${docs.length}: ${doc.metadata.source}`);
                
                const summary = await summarizeCode(doc);
                const embedding = await generateEmbedding(summary);
                
                return {
                    summary,
                    embedding,
                    sourceCode: JSON.parse(JSON.stringify(doc.pageContent)),
                    fileName: doc.metadata.source
                };
                
            } catch (error) {
                console.error(`❌ Failed to process document ${doc.metadata.source}:`, error);
                
                // Return a minimal embedding for failed documents
                return {
                    summary: `Error processing ${doc.metadata.source}`,
                    embedding: [],
                    sourceCode: doc.pageContent || '',
                    fileName: doc.metadata.source
                };
            }
        })
    );
};
