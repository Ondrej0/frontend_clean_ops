import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar"

import {
    LayoutDashboard,
    Users,
    Building2,
    CalendarDays,
    FileText,
} from "lucide-react"


const items = [
    {
        title: "Dashboard",
        url: "/manager/dashboard",
        icon: LayoutDashboard,
    },
    {
        title: "Employees",
        url: "/manager/employees",
        icon: Users,
    },
    {
        title: "Sites",
        url: "/manager/sites",
        icon: Building2,
    },
    {
        title: "Schedules",
        url: "/manager/schedules",
        icon: CalendarDays,
    },
    {
        title: "Reports",
        url: "/manager/reports",
        icon: FileText,
    },
]


export function ManagerSidebarMenu() {
    return (
        <SidebarMenu>
            {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                        onClick={() => {
                            window.location.href = item.url
                        }}
                    >
                        <item.icon />
                        <span>{item.title}</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            ))}
        </SidebarMenu>
    )
}