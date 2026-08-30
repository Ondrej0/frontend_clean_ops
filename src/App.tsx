import { BrowserRouter, Routes, Route } from "react-router-dom"

import { AppSidebar } from "@/components/layout/AppSidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

function App() {
    return (
        <BrowserRouter>
            <SidebarProvider>
                <AppSidebar />

                <SidebarInset>
                    <Routes>
                        <Route
                            path="/manager/dashboard"
                            element={<h1>Manager - Dashboard</h1>}
                        />

                        <Route
                            path="/manager/employees"
                            element={<h1>Manager - Employees</h1>}
                        />

                        <Route
                            path="/manager/sites"
                            element={<h1>Manager - Sites</h1>}
                        />

                        <Route
                            path="/manager/schedules"
                            element={<h1>Manager - Schedules</h1>}
                        />

                        <Route
                            path="/manager/reports"
                            element={<h1>Manager - Reports</h1>}
                        />

                        <Route
                            path="/cleaner/dashboard"
                            element={<h1>Cleaner - Dashboard</h1>}
                        />

                        <Route
                            path="/cleaner/schedule"
                            element={<h1>Cleaner - My Schedule</h1>}
                        />

                        <Route
                            path="/cleaner/clock-in"
                            element={<h1>Cleaner - Clock In</h1>}
                        />

                        <Route
                            path="/cleaner/profile"
                            element={<h1>Cleaner - Profile</h1>}
                        />
                    </Routes>
                </SidebarInset>

            </SidebarProvider>
        </BrowserRouter>
    )
}

export default App
