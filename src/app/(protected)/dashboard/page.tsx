"use client";

import useProject from "@/hooks/use-project";

import { ExternalLink, Github } from "lucide-react";
import Link from "next/link";

import React, { useEffect, useState } from "react";


export default function Dashboard() {

  const { project } = useProject();

  //console.log('project id is',project?.id)   //cmfhwcb410003tvzogzijhi7j
const [commits, setCommits] = useState([]);

  useEffect(() => {
    fetch("/api/commits/cmfhwcb410003tvzogzijhi7j")
      .then(res => res.json())
      .then(setCommits);
  }, []);



  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-y-4">

        {/* gh link */}
        <div className="bg-primary w-fit rounded-md px-4 py-3">
          <div className="flex items-center">
            <Github className="size-5 text-white" />
            <div className="ml-2">
              <p className="text-sm font-medium text-white">
                This project is linked to{" "}
                <Link
                  href={project?.githubUrl ?? ""}
                  className="inline-flex items-center text-white/80 hover:underline"
                >
                  {project?.githubUrl}
                  <ExternalLink className="ml-1 size-4" />
                </Link>
              </p>
            </div>
          </div>
        </div>


        <div className="h-4"></div>

        <div className="flex items-center gap-4">

        </div>
      </div>


      <div className="mt-4">
        <div className="grid grid-cols-1 gapp-4 sm:grid-cols-5">
          AskQuestion
          MeetingCard
        </div>
      </div>

      <div className="mt-8"></div>




    </div>
  );
};