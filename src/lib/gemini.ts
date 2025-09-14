import { GoogleGenerativeAI } from "@google/generative-ai";
import type { Document } from "@langchain/core/documents";

if (!process.env.GEMINI_API_KEY) {
    console.warn('⚠️  GEMINI_API_KEY is not set in environment variables');
}

const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const model = genai.getGenerativeModel({
    model:'gemini-1.5-flash',
});

export const aiSummarizeCommit = async (diff: string) => {
    try {
        if (!diff || diff.trim() === '') {
            console.log('⚠️  Empty diff provided to aiSummarizeCommit');
            return 'No changes in diff';
        }

        // Truncate very large diffs to avoid token limits
        const maxDiffLength = 50000; // Adjust based on your needs
        const truncatedDiff = diff.length > maxDiffLength 
            ? diff.substring(0, maxDiffLength) + '\n... (diff truncated)'
            : diff;

        console.log(`🤖 Sending diff to AI (${truncatedDiff.length} chars)`);

        const prompt = `
You are an expert programmer and you are trying to summarize a git diff.

Every line of the diff starts with a prefix. There can be 3 different prefixes:
- a line that starts with 'diff' is a metadata line (for example: 'diff --git a/lib/index.js b/lib/index.js')
- a line that starts with '+' was added in this commit
- a line that starts with '-' was deleted in this commit
- a line that starts with neither '+' nor '-' is code that was unchanged and is only provided for context

EXAMPLE SUMMARY COMMENTS:
- Raised the amount of returned post padding from .10 to .12
- Fixed a typo on the fifth column of the table
- Added an optional API for completion
- Widened numeric tolerances for testing

Note that this is only an example. The comments will have the same format as the examples above.
Because there are more than 100,000 javascript files in the world, you should not try to summarize
significant amounts of context that were not part of the diff. If no part of the diff makes sense,
you can return "no significant changes".

Please provide a concise summary (1-2 sentences) of the following git diff:
\`\`\`diff
${truncatedDiff}
\`\`\`
        `;

        const response = await model.generateContent([prompt]);
        const result = response.response.text();

        if (!result || result.trim() === '') {
            console.log('⚠️  AI returned empty response');
            return 'AI failed to generate summary';
        }

        // Clean up the response
        const cleanResult = result.trim()
            .replace(/^[\"`']+|[\"`']+$/g, '') // Remove surrounding quotes
            .replace(/\n+/g, ' ') // Replace multiple newlines with space
            .trim();

        console.log(`✅ AI summary generated: ${cleanResult.substring(0, 100)}...`);
        return cleanResult;

    } catch (error) {
        console.error('❌ Error in aiSummarizeCommit:', error);
        
        if (error instanceof Error) {
            if (error.message.includes('API key')) {
                return 'AI service unavailable: Invalid API key';
            } else if (error.message.includes('quota')) {
                return 'AI service unavailable: Quota exceeded';
            } else if (error.message.includes('timeout')) {
                return 'AI service timeout';
            }
        }
        
        return `AI error: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
};

export async function summarizeCode(doc:Document){
    try {
        console.log('🤖 Getting summary for doc:', doc.metadata.source);
        
        const code = doc.pageContent.slice(0, 10000);
        if (!code || code.trim() === '') {
            console.log('⚠️  Empty code content for:', doc.metadata.source);
            return 'Empty file';
        }

        const response = await model.generateContent([
            `You are an expert senior software engineer, who specializes in onboarding new developers to existing codebases.`,
            `You are onboarding a junior developer to a new codebase. You are trying to explain the following ${doc.metadata.source} to them:`,
            `Here is the code:
            \`\`\`
            ${code}
            \`\`\`

            Give a summary no more than 100 words of the code above. Focus on what this code does and its main purpose.
            `
        ]); 

        const result = response.response.text();
        if (!result || result.trim() === '') {
            console.log('⚠️  AI returned empty summary for:', doc.metadata.source);
            return 'Failed to generate code summary';
        }

        return result.trim();
    } catch (error) {
        console.error('❌ Error summarizing code for:', doc.metadata.source, error);
        return 'Error generating summary';
    }
}

export async function generateEmbedding(summary: string) {
    try {
        if (!summary || summary.trim() === '') {
            console.log('⚠️  Empty summary provided for embedding');
            return [];
        }

        const model = genai.getGenerativeModel({
            model: 'text-embedding-004',
        });
        
        const res = await model.embedContent(summary);
        const embedding = res.embedding;
        
        if (!embedding || !embedding.values || embedding.values.length === 0) {
            console.log('⚠️  Empty embedding returned');
            return [];
        }

        console.log(`✅ Generated embedding with ${embedding.values.length} dimensions`);
        return embedding.values;
    } catch (error) {
        console.error('❌ Error generating embedding:', error);
        return [];
    }
}