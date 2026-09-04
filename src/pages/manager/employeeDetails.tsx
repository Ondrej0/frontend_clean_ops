import { useEffect, useState } from "react";
import { Building2, CalendarDays, CheckCircle2, Clock3, LoaderCircle, Mail, MapPin, Phone, PoundSterling, User, XCircle } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { PageBackLink } from "@/components/layout/PageBackLink";
import { getCleaner, type Cleaner } from "@/lib/employee";

function formatDate(value: string) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("en-GB", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(date);
}

function formatPayRate(payRate: number | null) {
    return payRate === null ? "Not set" : new Intl.NumberFormat("en-GB", {
        style: "currency",
        currency: "GBP",
        minimumFractionDigits: 2,
    }).format(payRate) + " / hour";
}

export function EmployeeDetails() {
    const { cleanerId = "" } = useParams();
    const [cleaner, setCleaner] = useState<Cleaner | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    async function loadCleaner() {
        if (!cleanerId) {
            setLoading(false);
            setError("No employee was selected.");
            return;
        }

        setLoading(true);
        setError("");
        try {
            setCleaner(await getCleaner(cleanerId));
        } catch (loadError) {
            setError(loadError instanceof Error ? loadError.message : "Unable to load this employee.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        let active = true;

        getCleaner(cleanerId)
            .then((data) => active && setCleaner(data))
            .catch((loadError: unknown) => active && setError(loadError instanceof Error ? loadError.message : "Unable to load this employee."))
            .finally(() => active && setLoading(false));

        return () => { active = false; };
    }, [cleanerId]);

    if (loading) {
        return <main className="min-h-full p-6 sm:p-10"><div className="mx-auto flex max-w-6xl items-center gap-3 rounded-2xl border border-slate-200 bg-white p-6 text-slate-500 shadow-sm"><LoaderCircle className="size-5 animate-spin text-blue-600" />Loading employee…</div></main>;
    }

    if (!cleaner) {
        return <main className="min-h-full p-6 sm:p-10"><div className="mx-auto max-w-6xl rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700"><p>{error || "Employee not found."}</p><button type="button" onClick={() => void loadCleaner()} className="mt-4 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-red-700 shadow-sm">Try again</button></div></main>;
    }

    const fullName = [cleaner.firstName, cleaner.lastName].filter(Boolean).join(" ") || "Unnamed employee";
    const assignedSchedules = cleaner.assignedSchedules ?? [];
    const assignedSites = cleaner.assignedSites ?? [];

    return (
        <main className="min-h-full p-6 sm:p-10">
            <div className="mx-auto max-w-6xl">
                <PageBackLink to="/manager/employees">Back to employees</PageBackLink>
                <div className="mb-8">
                    <p className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">People</p>
                    <div className="flex flex-wrap items-center gap-3">
                        <h1 className="text-3xl font-bold tracking-tight text-slate-950">{fullName}</h1>
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ${cleaner.active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                            {cleaner.active ? <CheckCircle2 className="size-4" /> : <XCircle className="size-4" />}
                            {cleaner.active ? "Active" : "Inactive"}
                        </span>
                    </div>
                    <p className="mt-2 text-slate-500">Employee details are currently read-only.</p>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
                        <div className="flex items-center gap-3"><div className="flex size-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><User className="size-5" /></div><div><h2 className="font-semibold text-slate-900">Employee information</h2><p className="text-sm text-slate-500">Contact and account details</p></div></div>
                        <dl className="mt-6 grid gap-5 border-t border-slate-100 pt-5 sm:grid-cols-2">
                            <div><dt className="flex items-center gap-2 text-sm text-slate-400"><Mail className="size-4" />Email</dt><dd className="mt-1.5 break-all font-medium text-slate-800">{cleaner.email || "Not provided"}</dd></div>
                            <div><dt className="flex items-center gap-2 text-sm text-slate-400"><Phone className="size-4" />Phone</dt><dd className="mt-1.5 font-medium text-slate-800">{cleaner.phone || "Not provided"}</dd></div>
                            <div><dt className="text-sm text-slate-400">Role</dt><dd className="mt-1.5 font-medium text-slate-800">{cleaner.role || "Not set"}</dd></div>
                            <div><dt className="flex items-center gap-2 text-sm text-slate-400"><PoundSterling className="size-4" />Pay rate</dt><dd className="mt-1.5 font-medium text-slate-800">{formatPayRate(cleaner.payRate)}</dd></div>
                        </dl>
                    </section>

                    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-center gap-2"><Clock3 className="size-5 text-blue-600" /><h2 className="font-semibold text-slate-900">Record</h2></div><dl className="mt-5 space-y-4 text-sm"><div><dt className="text-slate-400">Employee ID</dt><dd className="mt-1 break-all font-medium text-slate-700">{cleaner.id}</dd></div><div><dt className="text-slate-400">Created</dt><dd className="mt-1 font-medium text-slate-700">{formatDate(cleaner.createdAt)}</dd></div><div><dt className="text-slate-400">Last updated</dt><dd className="mt-1 font-medium text-slate-700">{formatDate(cleaner.updatedAt)}</dd></div></dl></section>

                    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2"><div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><CalendarDays className="size-5 text-blue-600" /><h2 className="font-semibold text-slate-900">Assigned schedules</h2></div><span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">{assignedSchedules.length}</span></div>{assignedSchedules.length === 0 ? <p className="mt-5 text-sm text-slate-500">No schedules assigned yet.</p> : <ul className="mt-4 space-y-2">{assignedSchedules.map((schedule) => <li key={schedule.id}><Link to={`/manager/schedules/${schedule.id}/edit`} className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 px-4 py-3 transition hover:bg-blue-50 focus:outline-none focus:ring-4 focus:ring-blue-100"><span className="font-medium text-slate-800">{schedule.name || "Unnamed schedule"}</span><span className="text-sm font-semibold text-blue-700">Edit schedule</span></Link></li>)}</ul>}</section>

                    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><Building2 className="size-5 text-blue-600" /><h2 className="font-semibold text-slate-900">Assigned sites</h2></div><span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">{assignedSites.length}</span></div>{assignedSites.length === 0 ? <p className="mt-5 text-sm text-slate-500">No sites assigned yet.</p> : <ul className="mt-4 space-y-3">{assignedSites.map((site) => <li key={site.id} className="rounded-xl bg-slate-50 p-4"><p className="font-medium text-slate-800">{site.name || "Unnamed site"}</p><p className="mt-1 flex items-start gap-1.5 text-sm text-slate-500"><MapPin className="mt-0.5 size-3.5 shrink-0 text-blue-500" />{[site.addressLine1, site.postcode].filter(Boolean).join(", ") || "Address not provided"}</p></li>)}</ul>}</section>
                </div>
            </div>
        </main>
    );
}
