import { useEffect, useRef, useState } from "react";
import { Check, Flag, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getEmployeeFlags, resolveEmployeeFlag, type EmployeeFlag, type EmployeeFlagStatus } from "@/lib/employeeFlags";
import { formatShiftDateTime } from "@/lib/shifts";

export function EmployeeFlagsSection({ employeeId }: { employeeId?: string }) {
    const [status, setStatus] = useState<EmployeeFlagStatus | "">("OPEN");
    const [result, setResult] = useState<{ key: string; flags: EmployeeFlag[]; error: string } | null>(null);
    const [actionError, setActionError] = useState("");
    const [notice, setNotice] = useState("");
    const [attempt, setAttempt] = useState(0);
    const [resolving, setResolving] = useState<string | null>(null);
    const resolvingRef = useRef(false);
    const requestKey = `${employeeId ?? ""}:${status}:${attempt}`;
    const loading = result?.key !== requestKey;
    const flags = loading ? [] : result.flags;
    const error = actionError || (loading ? "" : result.error);

    useEffect(() => {
        const controller = new AbortController();
        getEmployeeFlags(status || undefined, employeeId, controller.signal)
            .then((flags) => { if (!controller.signal.aborted) setResult({ key: requestKey, flags, error: "" }); })
            .catch((cause: unknown) => { if (!controller.signal.aborted) setResult({ key: requestKey, flags: [], error: cause instanceof Error ? cause.message : "Unable to load employee flags." }); });
        return () => controller.abort();
    }, [status, employeeId, requestKey]);

    function refresh() {
        setActionError("");
        setAttempt((value) => value + 1);
    }

    async function resolve(id: string) {
        if (resolvingRef.current) return;
        resolvingRef.current = true;
        setResolving(id);
        setActionError("");
        setNotice("");
        try {
            await resolveEmployeeFlag(id);
            setNotice("Flag resolved. The report is preserved in resolved flags.");
            setAttempt((value) => value + 1);
        } catch (cause) {
            setActionError(cause instanceof Error ? cause.message : "Unable to resolve this flag.");
        } finally {
            resolvingRef.current = false;
            setResolving(null);
        }
    }

    return <section aria-labelledby="employee-flags-heading" className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 p-5 sm:p-6">
            <div><h2 id="employee-flags-heading" className="flex items-center gap-2 text-lg font-semibold text-slate-950"><Flag className="size-5 text-red-600" aria-hidden="true" />Employee Flags</h2><p className="mt-1 text-sm text-slate-500">Review reported schedule overlaps. Resolving a flag does not change the schedule.</p></div>
            <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm font-medium">Status
                    <select className="rounded-lg border border-slate-200 bg-white px-3 py-2" value={status} disabled={!!resolving} onChange={(event) => { setStatus(event.target.value as EmployeeFlagStatus | ""); setNotice(""); setActionError(""); }}>
                        <option value="OPEN">Open</option><option value="RESOLVED">Resolved</option><option value="">All</option>
                    </select>
                </label>
                <Button variant="outline" aria-label="Refresh employee flags" disabled={loading || !!resolving} onClick={refresh}><RefreshCw aria-hidden="true" /></Button>
            </div>
        </div>
        <div className="space-y-4 p-5 sm:p-6">
            {notice && <p role="status" className="rounded-lg bg-green-50 p-3 text-sm text-green-800">{notice}</p>}
            {error && <div role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800"><p>{error}</p><Button variant="outline" className="mt-2" disabled={!!resolving} onClick={refresh}>Try again</Button></div>}
            {loading && <p role="status" className="text-sm text-slate-500">Loading employee flags…</p>}
            {!loading && !error && flags.length === 0 && <p className="py-8 text-center text-slate-500">No {status ? status.toLowerCase() + " " : ""}employee flags.</p>}
            {!loading && flags.map((flag) => <article key={flag.id} className={`rounded-xl border p-4 sm:p-5 ${flag.status === "OPEN" ? "border-red-200 bg-red-50/40" : "border-slate-200 bg-slate-50"}`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div><h3 className="font-semibold text-slate-900">{flag.employeeName}</h3><p className="mt-1 text-xs font-medium text-slate-500">{flag.type === "SCHEDULE_OVERLAP" ? "Schedule overlap" : flag.type}</p></div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${flag.status === "OPEN" ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}`}>{flag.status === "OPEN" ? "Open" : "Resolved"}</span>
                </div>
                <p className="mt-3 break-words text-sm leading-relaxed text-slate-700">{flag.message}</p>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="text-xs text-slate-500"><p>Reported <time dateTime={flag.createdAt}>{formatShiftDateTime(flag.createdAt)}</time> (London)</p>{flag.resolvedAt && <p className="mt-1">Resolved <time dateTime={flag.resolvedAt}>{formatShiftDateTime(flag.resolvedAt)}</time> (London)</p>}</div>
                    {flag.status === "OPEN" && <Button variant="outline" disabled={!!resolving} onClick={() => void resolve(flag.id)} aria-label={`Resolve schedule overlap reported by ${flag.employeeName}`}><Check aria-hidden="true" />{resolving === flag.id ? "Resolving…" : "Resolve flag"}</Button>}
                </div>
            </article>)}
        </div>
    </section>;
}
