import { BrowserRouter, Routes, Route } from "react-router-dom"

import { AppSidebar } from "@/components/layout/AppSidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { ManagerDashboard} from "@/pages/manager/managerDashboard.tsx";
import {Employees} from "@/pages/manager/employees.tsx";
import {ManagerSites} from "@/pages/manager/managerSites.tsx";
import {Schedules} from "@/pages/manager/schedules.tsx";
import {Payroll} from "@/pages/manager/payroll.tsx";
import {CreateEmployee} from "@/pages/manager/createEmployee.tsx";
import {CreateSitePage} from "@/pages/manager/createSite.tsx";
import {CreateSchedule} from "@/pages/manager/createSchedule.tsx";

function App() {
    return (
        <BrowserRouter>
            <SidebarProvider>
                <AppSidebar />

                <SidebarInset>
                    <Routes>
                        <Route
                            path="/manager/dashboard"
                            element={<ManagerDashboard />}
                        />

                        <Route
                            path="/manager/employees"
                            element={<Employees />}
                        />

                        <Route
                            path="/manager/employees/create"
                            element={<CreateEmployee/>}
                        />

                        <Route
                            path="/manager/sites"
                            element={<ManagerSites />}
                        />

                        <Route
                            path="/manager/sites/create"
                            element={<CreateSitePage />}
                        />

                        <Route
                            path="/manager/schedules"
                            element={<Schedules />}
                        />

                        <Route
                            path="/manager/schedules/create"
                            element={<CreateSchedule />}
                        />

                        <Route
                            path="/manager/payroll"
                            element={<Payroll />}
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
