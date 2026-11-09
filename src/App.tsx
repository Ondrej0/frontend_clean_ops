import { BrowserRouter, Routes, Route } from "react-router-dom"

import { AppSidebar } from "@/components/layout/AppSidebar"
import { ManagerDashboard} from "@/pages/manager/managerDashboard.tsx";
import {Employees} from "@/pages/manager/employees.tsx";
import {ManagerSites} from "@/pages/manager/managerSites.tsx";
import {Schedules} from "@/pages/manager/schedules.tsx";
import {Payroll} from "@/pages/manager/payroll.tsx";
import {CreateEmployee} from "@/pages/manager/createEmployee.tsx";
import {CreateSitePage} from "@/pages/manager/createSite.tsx";
import {CreateSchedule} from "@/pages/manager/createSchedule.tsx";
import {EditSchedule} from "@/pages/manager/editSchedule.tsx";
import {EmployeeDetails} from "@/pages/manager/employeeDetails.tsx";
import {SiteDetails} from "@/pages/manager/siteDetails.tsx";
import {MyWork} from "@/pages/cleaner/myWork.tsx";
import {CleanerSites} from "@/pages/cleaner/sites.tsx";
import {CleanerSiteDetails} from "@/pages/cleaner/siteDetails.tsx";
import {MySchedule} from "@/pages/cleaner/schedule.tsx";

function App() {
    return (
        <BrowserRouter>
            <div className="app-shell">
                <AppSidebar />

                <div className="app-content bg-slate-50">
                    <Routes>
                        <Route path="/cleaner/my-work" element={<MyWork />} />
                        <Route path="/cleaner/my-sites" element={<CleanerSites />} />
                        <Route path="/cleaner/my-sites/:siteId" element={<CleanerSiteDetails />} />
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
                            path="/manager/employees/:cleanerId"
                            element={<EmployeeDetails />}
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
                            path="/manager/sites/:siteId"
                            element={<SiteDetails />}
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
                            path="/manager/schedules/:scheduleId/edit"
                            element={<EditSchedule />}
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
                            element={<MySchedule />}
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
                </div>

            </div>
        </BrowserRouter>
    )
}

export default App
