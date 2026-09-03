import { Mail, Phone, User } from "lucide-react";
import type { Employee } from "@/lib/employee.ts";

interface EmployeeCardProps {
    employee: Employee;
}

export function EmployeeCard({ employee }: EmployeeCardProps) {
    const fullName = [employee.firstName, employee.lastName]
        .filter(Boolean)
        .join(" ");

    return (
        <article className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-900/5">
            <div className="mb-5 flex items-start justify-between gap-4">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <User size={22} />
                </div>
                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                    Employee
                </span>
            </div>
            <h2 className="text-lg font-semibold tracking-tight text-slate-900">
                {fullName || "Unnamed employee"}
            </h2>
            <div className="mt-3 space-y-2 text-sm leading-6 text-slate-500">
                <div className="flex gap-2">
                    <Mail className="mt-1 size-4 shrink-0 text-blue-500" aria-hidden="true" />
                    <p>{employee.email || "Email not yet provided"}</p>
                </div>
                <div className="flex gap-2">
                    <Phone className="mt-1 size-4 shrink-0 text-blue-500" aria-hidden="true" />
                    <p>{employee.phone || "Phone not yet provided"}</p>
                </div>
            </div>
        </article>
    );
}