import { useEffect, useState } from "react";
import { Plus, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { EmployeeCard } from "@/components/layout/manager/employee/EmployeeCard";
import { getCleaners, type Employee } from "@/lib/employee.ts";

export function Employees() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let active = true;

        getCleaners()
            .then((employeeList) => active && setEmployees(employeeList))
            .catch(() => active && setError("We couldn't load your employees. Please try again."))
            .finally(() => active && setLoading(false));

        return () => {
            active = false;
        };
    }, []);

    return (
        <main className="min-h-full p-6 sm:p-10">
            <div className="mx-auto max-w-6xl">
                <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
                    <div>
                        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">Operations</p>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-950">Employees</h1>
                        <p className="mt-2 text-slate-500">Manage the cleaners on your team.</p>
                    </div>
                    <Link to="/manager/employees/create" className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-600/25 transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100">
                        <Plus size={18} />
                        Create employee
                    </Link>
                </div>

                {loading && <p className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-500">Loading employees…</p>}
                {error && <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">{error}</p>}

                {!loading && !error && employees.length === 0 && (
                    <div className="rounded-2xl border border-dashed border-blue-200 bg-blue-50/50 px-6 py-14 text-center">
                        <Users className="mx-auto size-9 text-blue-500" />
                        <h2 className="mt-4 text-lg font-semibold text-slate-900">No employees yet</h2>
                        <p className="mt-1 text-sm text-slate-500">Add your first employee to get started.</p>
                    </div>
                )}

                {!loading && !error && employees.length > 0 && (
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        {employees.map((employee) => <EmployeeCard key={employee.id} employee={employee} />)}
                    </div>
                )}
            </div>
        </main>
    );
}