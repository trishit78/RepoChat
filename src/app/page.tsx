import { Button } from "@/components/ui/button";
import { generateEmbedding } from "@/lib/gemini";
import { loadGithubRepo } from "@/lib/github-loader";



export default async function Home() {


const res = await generateEmbedding('https://github.com/trishit78/algoquest')
//console.log(res)



  return (
    <>
    <h1 className="text-red-400">Hello</h1>
    <Button>CLick me</Button>

    </>

)
}














// 86
// : 
// Document
// metadata
// : 
// branch
// : 
// "main"
// repository
// : 
// "https://github.com/trishit78/algoquest"
// source
// : 
// "submissionService/src/validators/submission.validator.ts"
// [[Prototype]]
// : 
// Object
// pageContent
// : 
// "import { z } from \"zod\";\nimport { SubmissionLanguage, SubmissionStatus } from \"../models/submission.model\";\n\n// Schema for creating a new submission\nexport const createSubmissionSchema = z.object({\n    problemId: z.string().min(1, \"Problem ID is required\"),\n    code: z.string().min(1, \"Code is required\"),\n    language: z.nativeEnum(SubmissionLanguage, {\n        errorMap: () => ({ message: \"Language must be either 'cpp' or 'python'\" })\n    })\n});\n\n// Schema for updating submission status\nexport const updateSubmissionStatusSchema = z.object({\n    status: z.nativeEnum(SubmissionStatus, {\n        errorMap: () => ({ message: \"Status must be one of: pending, compiling, running, accepted, wrong_answer\" })\n    }),\n    submissionData: z.any()\n});\n\n// Schema for query parameters (if needed for filtering)\nexport const submissionQuerySchema = z.object({\n    status: z.nativeEnum(SubmissionStatus).optional(),\n    language: z.nativeEnum(SubmissionLanguage).optional(),\n    limit: z.string().transform(val => parseInt(val)).pipe(z.number().min(1).max(100)).optional(),\n    page: z.string().transform(val => parseInt(val)).pipe(z.number().min(1)).optional()\n});"
// [[Prototype]]
// : 
// Object
// length
// : 
// 87












