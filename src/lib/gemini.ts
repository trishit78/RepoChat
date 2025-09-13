
import { GoogleGenerativeAI } from "@google/generative-ai";

const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const model = genai.getGenerativeModel({
    model:'gemini-1.5-flash',
});


export const aiSummarizeCommit = async (diff: string) => {
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
you can return “no significant changes”.

Please summarize the following git diff:
\`\`\`diff
${diff}
\`\`\`
  `;

  const response = await model.generateContent([prompt]);
  return response.response.text();
};


//cmfhuyl2z0003tvu8xn02ubph