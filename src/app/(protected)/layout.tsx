import { SidebarProvider } from "@/components/ui/sidebar"
import { UserButton } from "@clerk/nextjs"
import type { ReactNode } from "react"
import { AppSidebar } from "./app-sidebar"

type Props={
    children:ReactNode
}
const SidebarLayout = ({children}:Props) =>{
    return (
        <SidebarProvider>
            <AppSidebar />
            <main className="w-full m-2">
                <div className="flex items-center gap-2 border-sidebar bg-sidebar border shadow rounded-md p-2 px-4">
                    {/* <SearchBar />  */}
                    <div className="ml-auto">

                    </div>
                    <UserButton />
                </div>
                {/* main content */}
                <div className="border-sidebar-border bg-sidebar shadow rounded-md overflow-y-scroll h-[calc(100vh-6rem)] p-4">
                        {children}
                </div>

            </main>
        </SidebarProvider>
    )
}

export default SidebarLayout