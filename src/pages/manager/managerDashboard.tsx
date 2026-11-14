import { EmployeeFlagsSection } from "@/components/layout/manager/EmployeeFlagsSection";

export function ManagerDashboard() {
    return <main className="min-h-full p-6 sm:p-10">
        <div className="mx-auto max-w-6xl">
            <div className="mb-8"><p className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">Operations</p><h1 className="text-3xl font-bold tracking-tight text-slate-950">Dashboard</h1><p className="mt-2 text-slate-500">Review issues reported by your team.</p></div>
            <EmployeeFlagsSection />
        </div>
    </main>;
}
