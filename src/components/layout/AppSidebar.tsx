import { Sparkles } from "lucide-react"
import { ManagerSidebarMenu } from "./ManagerSidebarMenu"
import { CleanerSidebarMenu } from "./CleanerSidebarMenu"
import { mockUser } from "@/mock/mockUser"

export function AppSidebar() {
    const isManager = mockUser.role === "MANAGER"

    return (
        <nav className="app-navigation" aria-label="Main navigation">
            <div className="app-navigation-brand">
                <span className="inline-flex size-7 items-center justify-center rounded-lg bg-blue-600 text-white">
                    <Sparkles size={15} aria-hidden="true" />
                </span>
                CleanOps
            </div>
            {isManager ? <ManagerSidebarMenu /> : <CleanerSidebarMenu />}
        </nav>
    )
}
