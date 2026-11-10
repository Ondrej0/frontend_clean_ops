import { AppNavigationMenu } from "./AppNavigationMenu"
import { QuickClock } from "./cleaner/QuickClock"

import {
    Building2,
    LayoutDashboard,
    ClipboardList,
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
        title: "My Work",
        url: "/cleaner/my-work",
        icon: ClipboardList,
    },
    {
        title: "My Sites",
        url: "/cleaner/my-sites",
        icon: Building2,
    },
    {
        title: "My Schedule",
        url: "/cleaner/schedule",
        icon: CalendarDays,
    },
    {
        title: "Opportunities",
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
    return <AppNavigationMenu items={items} quickAction={<QuickClock />} />
}
