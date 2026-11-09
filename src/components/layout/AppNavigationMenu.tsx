import type { LucideIcon } from "lucide-react"
import { NavLink } from "react-router-dom"

type NavigationItem = {
    title: string
    url: string
    icon: LucideIcon
}

export function AppNavigationMenu({ items }: { items: NavigationItem[] }) {
    return (
        <ul className="app-navigation-menu">
            {items.map((item) => (
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
            ))}
        </ul>
    )
}
