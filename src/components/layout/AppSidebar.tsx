import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupLabel,
} from "@/components/ui/sidebar"

import { ManagerSidebarMenu } from "./ManagerSidebarMenu.tsx"
import { CleanerSidebarMenu } from "./CleanerSidebarMenu.tsx"

import { mockUser } from "@/mock/mockUser"


export function AppSidebar() {

    const isManager = mockUser.role === "MANAGER"


    return (
        <Sidebar>

            <SidebarContent>

                <SidebarGroup>

                    <SidebarGroupLabel>
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