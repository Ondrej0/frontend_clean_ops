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
                            element={<h1>Dashboard</h1>}
                        />

                        <Route
                            path="/manager/employees"
                            element={<h1>Employees</h1>}
                        />

                        <Route
                            path="/manager/sites"
                            element={<h1>Sites</h1>}
                        />

                        <Route
                            path="/manager/schedules"
                            element={<h1>Schedules</h1>}
                        />

                        <Route
                            path="/manager/reports"
                            element={<h1>Reports</h1>}
                        />

                        <Route
                            path="/cleaner/dashboard"
                            element={<h1>Dashboard</h1>}
                        />

                        <Route
                            path="/cleaner/schedule"
                            element={<h1>My Schedule</h1>}
                        />

                        <Route
                            path="/cleaner/clock-in"
                            element={<h1>Clock In</h1>}
                        />

                        <Route
                            path="/cleaner/profile"
                            element={<h1>Profile</h1>}
                        />
                    </Routes>
                </SidebarInset>

            </SidebarProvider>
        </BrowserRouter>
    )
}

export default App
