import { useEffect, useState } from "react";
import { LoaderCircle, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getCleaners, type Employee } from "@/lib/employee";
import { getSites, type Site } from "@/lib/sites";
import { createShift, removeShift, updateShift, type Shift, type ShiftFilter } from "@/lib/shifts";
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
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const readOnly = value.shift !== undefined && !value.shift.managerEditable;
    const startsInPast = !value.shift && start < calendarTime(Date.now()).slice(0, 16);

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
        if (saving || readOnly || !userId || !siteId || !start || !end) return;
        if (end <= start) {
            setError("Shift end must be after its start.");
            return;
        }
        setSaving(true);
        setError("");
        try {
            const times = { scheduledStart: apiDateTime(start), scheduledEnd: apiDateTime(end) };
            if (value.shift) await updateShift(value.shift.id, { userId, ...times });
            else await createShift({ siteId, userId, ...times });
            onSaved();
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : "Unable to save this shift.");
        } finally {
            setSaving(false);
        }
    }

    async function remove() {
        if (!value.shift || saving || readOnly || !window.confirm("Remove this one-off shift occurrence? This will not change its schedule.")) return;
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
                    <DialogTitle className="text-xl font-bold">{value.shift ? readOnly ? "Shift details" : "Edit one-off shift" : "Add one-off shift"}</DialogTitle>
                    <DialogDescription>{readOnly
                        ? "This shift cannot be changed because it has started, is in the past, or contains attendance history."
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
                        <select value={siteId} onChange={(event) => setSiteId(event.target.value)} disabled={readOnly || saving || loadingOptions || context === "site" || !!value.shift} required className={inputClass}>
                            <option value="">Select a site</option>
                            {sites.map((site) => <option key={site.id} value={site.id}>{site.name} — {site.postcode}</option>)}
                        </select>
                    </label>
                    <label className="text-sm font-medium text-slate-700">Start
                        <input type="datetime-local" value={start} onChange={(event) => setStart(event.target.value)} disabled={readOnly || saving} required className={inputClass} />
                    </label>
                    <label className="text-sm font-medium text-slate-700">End
                        <input type="datetime-local" value={end} onChange={(event) => setEnd(event.target.value)} disabled={readOnly || saving} required className={inputClass} />
                    </label>
                </div>
                {startsInPast && <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">This shift starts in the past. It will be added as a one-off shift, but the recorded attendance times will still determine its outcome.</p>}
                {value.shift?.origin === "ONE_OFF_OVERRIDE" && <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">One-off override of {value.shift.scheduleName || "a recurring schedule"}.</p>}
                {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

                <DialogFooter>
                    {value.shift && !readOnly && <button type="button" onClick={() => void remove()} disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2 font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60 sm:mr-auto"><Trash2 className="size-4" />Remove</button>}
                    <button type="button" onClick={onClose} disabled={saving} className="rounded-lg border border-slate-200 bg-white px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60">{readOnly ? "Close" : "Cancel"}</button>
                    {!readOnly && <button type="button" onClick={() => void save()} disabled={saving || loadingOptions || !userId || !siteId} className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-60">{saving && <LoaderCircle className="size-4 animate-spin" />}{saving ? "Saving…" : value.shift ? "Save shift" : "Add shift"}</button>}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
