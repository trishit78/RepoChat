import { api } from '@/trpc/react'
import React, { useState } from 'react'

import {useLocalStorage} from 'usehooks-ts'

const useProject = () => {
 
 const {data:projects} = api.project.getProjects.useQuery()

 const [projectId,setProjectId] = useLocalStorage('repochatId','');
 const project = projects?.find((p)=>p.id===projectId)


    return {
 projects,
 project,
 projectId,
 setProjectId
    }
}

export default useProject