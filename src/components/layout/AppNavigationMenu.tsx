import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"
import { NavLink } from "react-router-dom"

type NavigationItem = {
    title: string
    url: string
    icon: LucideIcon
}

export function AppNavigationMenu({ items, quickAction, trailingAction }: { items: NavigationItem[]; quickAction?: ReactNode; trailingAction?: ReactNode }) {
    const renderItem = (item: NavigationItem) => (
        <li className="app-navigation-item" key={item.url}>
            <NavLink
                to={item.url}
                aria-label={item.title}
                title={item.title}
                className={({ isActive }) =>
                    `app-navigation-link${isActive ? " is-active" : ""}`
                }
            >
                <item.icon aria-hidden="true" />
                <span className="app-navigation-label">{item.title}</span>
            </NavLink>
        </li>
    )
    return (
        <ul className={`app-navigation-menu${quickAction ? " has-quick-action" : ""}`}>
            {items.slice(0, 3).map(renderItem)}
            {quickAction && <li className="app-navigation-item app-navigation-quick-action">{quickAction}</li>}
            {items.slice(3).map(renderItem)}
            {trailingAction && <li className="app-navigation-item">{trailingAction}</li>}
        </ul>
    )
}
