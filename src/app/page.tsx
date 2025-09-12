import { Button } from "@/components/ui/button";
import { getCommitHashes } from "@/lib/github";

export default async function Home() {


const res =await getCommitHashes('https://github.com/docker/genai-stack');
console.log('res',res);


  return (
    <>
    <h1 className="text-red-400">Hello</h1>
    <Button>CLick me</Button>

    </>

)
}
