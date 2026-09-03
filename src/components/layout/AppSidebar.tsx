import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupLabel,
} from "@/components/ui/sidebar"

import { ManagerSidebarMenu } from "./ManagerSidebarMenu.tsx"
import { CleanerSidebarMenu } from "./CleanerSidebarMenu.tsx"

import { mockUser } from "@/mock/mockUser"
import { Sparkles } from "lucide-react"


export function AppSidebar() {

    const isManager = mockUser.role === "MANAGER"


    return (
        <Sidebar className="border-r border-slate-200">

            <SidebarContent>

                <SidebarGroup>

                    <SidebarGroupLabel className="mb-5 mt-3 h-auto px-3 text-base font-bold tracking-tight text-slate-900">
                        <span className="mr-2 inline-flex size-7 items-center justify-center rounded-lg bg-blue-600 text-white">
                            <Sparkles size={15} />
                        </span>
                        CleanOps
                    </SidebarGroupLabel>


                    {isManager ? (
                        <ManagerSidebarMenu />
                    ) : (
                        <CleanerSidebarMenu />
                    )}

                </SidebarGroup>

            </SidebarContent>

        </Sidebar>
    )
}
