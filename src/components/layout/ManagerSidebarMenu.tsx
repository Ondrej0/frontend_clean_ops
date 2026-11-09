import { AppNavigationMenu } from "./AppNavigationMenu"

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
        title: "Payroll",
        url: "/manager/payroll",
        icon: FileText,
    },
]


export function ManagerSidebarMenu() {
    return <AppNavigationMenu items={items} />
}
