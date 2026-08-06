import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar"

import {
    LayoutDashboard,
    CalendarDays,
    Clock,
    User,
} from "lucide-react"


const items = [
    {
        title: "Dashboard",
        url: "/cleaner/dashboard",
        icon: LayoutDashboard,
    },
    {
        title: "My Schedule",
        url: "/cleaner/schedule",
        icon: CalendarDays,
    },
    {
        title: "Clock In",
        url: "/cleaner/clock-in",
        icon: Clock,
    },
    {
        title: "Profile",
        url: "/cleaner/profile",
        icon: User,
    },
]


export function CleanerSidebarMenu() {
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