import { useEffect, useState } from "react";
import { LoaderCircle, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getCleaners, type Employee } from "@/lib/employee";
import { getSites, type Site } from "@/lib/sites";
import { correctShift, createShift, managerClock, removeShift, updateShift, type Shift, type ShiftFilter } from "@/lib/shifts";
import { calendarTime } from "@/lib/shiftCalendar";
import type { ManagerShiftContext } from "@/lib/managerShifts";

export interface ShiftEditorValue {
    shift?: Shift;
    start: string;
    end: string;
}

function employeeLabel(employee: Employee) {
    return `${employee.firstName} ${employee.lastName}`.trim() || employee.email;
}

function apiDateTime(value: string) {
    return value.length === 16 ? `${value}:00` : value;
}

export function ShiftEditorDialog({ value, filter, context, onClose, onSaved }: {
    value: ShiftEditorValue;
    filter: ShiftFilter;
    context: ManagerShiftContext;
    onClose: () => void;
    onSaved: () => void;
}) {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [sites, setSites] = useState<Site[]>([]);
    const [loadingOptions, setLoadingOptions] = useState(true);
    const [userId, setUserId] = useState(value.shift?.employee.id ?? filter.userId ?? "");
    const [siteId, setSiteId] = useState(value.shift?.site.id ?? filter.siteId ?? "");
    const [start, setStart] = useState(value.start);
    const [end, setEnd] = useState(value.end);
    const [actualStart, setActualStart] = useState(value.shift?.actualStart ? calendarTime(value.shift.actualStart).slice(0, 16) : value.start);
    const [actualEnd, setActualEnd] = useState(value.shift?.actualEnd ? calendarTime(value.shift.actualEnd).slice(0, 16) : value.end);
    const [reason, setReason] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const unstarted = value.shift?.status === "SCHEDULED" && !value.shift.actualStart && !value.shift.actualEnd;
    const managerClockInAvailable = Boolean(unstarted && value.shift && Date.parse(value.shift.scheduledStart) <= Date.now());
    const managerClockOutAvailable = value.shift?.status === "IN_PROGRESS" && Boolean(value.shift.actualStart) && !value.shift.actualEnd;
    const historical = value.shift !== undefined && !value.shift.managerEditable;
    const correcting = historical && value.shift?.status !== "CANCELLED";
    const readOnly = historical && !correcting;
    const startsInPast = !value.shift && start < calendarTime(Date.now()).slice(0, 16);
    const reschedulingLate = Boolean(value.shift && unstarted && Date.parse(value.shift.scheduledStart) <= Date.now());

    useEffect(() => {
        let active = true;
        Promise.all([getCleaners(), getSites()])
            .then(([nextEmployees, nextSites]) => {
                if (!active) return;
                setEmployees(nextEmployees);
                setSites(nextSites);
            })
            .catch(() => active && setError("Unable to load cleaners and sites."))
            .finally(() => active && setLoadingOptions(false));
        return () => { active = false; };
    }, []);

    async function save() {
        if (saving || historical || !userId || !siteId || !start || !end) return;
        if (end <= start) {
            setError("Shift end must be after its start.");
            return;
        }
        setSaving(true);
        setError("");
        try {
            const times = { scheduledStart: apiDateTime(start), scheduledEnd: apiDateTime(end) };
            if (value.shift) await updateShift(value.shift.id, { userId, ...times, reason: reschedulingLate ? reason.trim() : undefined });
            else await createShift({ siteId, userId, ...times });
            onSaved();
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : "Unable to save this shift.");
        } finally {
            setSaving(false);
        }
    }

    async function recordManagerClock(action: "in" | "out") {
        if (!value.shift || saving || !reason.trim()) return;
        setSaving(true);
        setError("");
        try {
            await managerClock(value.shift.id, action, reason.trim());
            onSaved();
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : "Unable to record manager attendance.");
        } finally {
            setSaving(false);
        }
    }

    async function correct() {
        if (!value.shift || saving || !userId || !actualStart || !actualEnd || !reason.trim()) return;
        if (actualEnd <= actualStart) {
            setError("Actual end must be after actual start.");
            return;
        }
        setSaving(true);
        setError("");
        try {
            await correctShift(value.shift.id, {
                userId, actualStart: apiDateTime(actualStart), actualEnd: apiDateTime(actualEnd), reason: reason.trim(),
            });
            onSaved();
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : "Unable to record this correction.");
        } finally {
            setSaving(false);
        }
    }

    async function remove() {
        if (!value.shift || saving || historical || !window.confirm("Remove this one-off shift occurrence? This will not change its schedule.")) return;
        setSaving(true);
        setError("");
        try {
            await removeShift(value.shift.id);
            onSaved();
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : "Unable to remove this shift.");
        } finally {
            setSaving(false);
        }
    }

    const inputClass = "mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-500";
    return (
        <Dialog open onOpenChange={(open) => { if (!open && !saving) onClose(); }}>
            <DialogContent className="bg-white text-slate-900 sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold">{value.shift ? correcting ? "Correct historical shift" : readOnly ? "Shift details" : reschedulingLate ? "Reschedule shift" : "Edit one-off shift" : "Add one-off shift"}</DialogTitle>
                    <DialogDescription>{correcting
                        ? "Record the cleaner and actual worked time. The original attendance evidence is retained with this manager correction."
                        : readOnly ? "Cancelled shifts cannot be changed."
                        : reschedulingLate ? "This shift has not started. Change its planned time and give a reason; it will remain scheduled."
                        : "This changes only this dated shift. Recurring schedules and rules are unaffected."}</DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 sm:grid-cols-2">
                    <label className="text-sm font-medium text-slate-700">Cleaner
                        <select value={userId} onChange={(event) => setUserId(event.target.value)} disabled={readOnly || saving || loadingOptions} required className={inputClass}>
                            <option value="">Select a cleaner</option>
                            {employees.map((employee) => <option key={employee.id} value={employee.id}>{employeeLabel(employee)}</option>)}
                        </select>
                    </label>
                    <label className="text-sm font-medium text-slate-700">Site
                        <select value={siteId} onChange={(event) => setSiteId(event.target.value)} disabled={readOnly || correcting || saving || loadingOptions || context === "site" || !!value.shift} required className={inputClass}>
                            <option value="">Select a site</option>
                            {sites.map((site) => <option key={site.id} value={site.id}>{site.name} — {site.postcode}</option>)}
                        </select>
                    </label>
                    <label className="text-sm font-medium text-slate-700">{correcting ? "Actual start" : "Start"}
                        <input type="datetime-local" value={correcting ? actualStart : start} onChange={(event) => correcting ? setActualStart(event.target.value) : setStart(event.target.value)} disabled={readOnly || saving} required className={inputClass} />
                    </label>
                    <label className="text-sm font-medium text-slate-700">{correcting ? "Actual end" : "End"}
                        <input type="datetime-local" value={correcting ? actualEnd : end} onChange={(event) => correcting ? setActualEnd(event.target.value) : setEnd(event.target.value)} disabled={readOnly || saving} required className={inputClass} />
                    </label>
                </div>
                {(correcting || reschedulingLate || managerClockInAvailable || managerClockOutAvailable) && <label className="mt-4 block text-sm font-medium text-slate-700">{correcting ? "Correction reason" : managerClockInAvailable ? "Manager clock-in reason" : managerClockOutAvailable ? "Manager clock-out reason" : "Rescheduling reason"}
                    <textarea value={reason} onChange={(event) => setReason(event.target.value)} disabled={saving} maxLength={1000} required rows={3} placeholder="For example: assigned to the wrong cleaner; 45 minutes overtime approved." className={inputClass} />
                </label>}
                {startsInPast && <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">This shift starts in the past. It will be added as a one-off shift, but the recorded attendance times will still determine its outcome.</p>}
                {value.shift?.origin === "ONE_OFF_OVERRIDE" && <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">One-off override of {value.shift.scheduleName || "a recurring schedule"}.</p>}
                {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

                <DialogFooter>
                    {value.shift && !historical && <button type="button" onClick={() => void remove()} disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2 font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60 sm:mr-auto"><Trash2 className="size-4" />Remove</button>}
                    <button type="button" onClick={onClose} disabled={saving} className="rounded-lg border border-slate-200 bg-white px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60">{readOnly ? "Close" : "Cancel"}</button>
                    {managerClockOutAvailable && <button type="button" onClick={() => void recordManagerClock("out")} disabled={saving || !reason.trim()} className="inline-flex items-center justify-center gap-2 rounded-lg border border-blue-200 bg-white px-4 py-2 font-semibold text-blue-700 hover:bg-blue-50 disabled:opacity-60">Manager clock out</button>}
                    {managerClockInAvailable && <button type="button" onClick={() => void recordManagerClock("in")} disabled={saving || !reason.trim()} className="inline-flex items-center justify-center gap-2 rounded-lg border border-blue-200 bg-white px-4 py-2 font-semibold text-blue-700 hover:bg-blue-50 disabled:opacity-60">Manager clock in</button>}
                    {correcting ? <button type="button" onClick={() => void correct()} disabled={saving || loadingOptions || !userId || !reason.trim()} className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-60">{saving && <LoaderCircle className="size-4 animate-spin" />}{saving ? "Recording…" : "Record correction"}</button>
                        : !readOnly && <button type="button" onClick={() => void save()} disabled={saving || loadingOptions || !userId || !siteId || (reschedulingLate && !reason.trim())} className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-60">{saving && <LoaderCircle className="size-4 animate-spin" />}{saving ? "Saving…" : reschedulingLate ? "Reschedule shift" : value.shift ? "Save shift" : "Add shift"}</button>}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
