import { ArrowRight, Building2, Clock3, LogOut, ScanLine } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { canRecordAttendance, type AttendanceAction } from "@/lib/attendance";
import { clockingInformation, formatShiftDateTime, formatShiftTime, londonDate, type Shift, type ShiftStatus } from "@/lib/shifts";

const statuses: Record<ShiftStatus, { label: string; className: string }> = {
    COMPLETED: { label: "Completed", className: "bg-green-50 text-green-700" },
    CANCELLED: { label: "Cancelled", className: "bg-slate-100 text-slate-600" },
    NO_SHOW: { label: "No show", className: "bg-red-50 text-red-700" },
    IN_PROGRESS: { label: "In progress", className: "bg-blue-50 text-blue-700" },
    SCHEDULED: { label: "Scheduled", className: "bg-slate-50 text-slate-700" },
};

export function ShiftCard({ shift, now, onClock }: { shift: Shift; now: number; onClock: (action: AttendanceAction) => void }) {
    const status = statuses[shift.status];
    const overnight = londonDate(shift.scheduledStart) !== londonDate(shift.scheduledEnd);
    const information = clockingInformation(shift, now);
    const actions = (["clockIn", "clockOut"] as const).filter((action) => canRecordAttendance(shift, action));
    return (
        <article className={`rounded-2xl border bg-white p-5 shadow-sm ${actions.length ? "border-emerald-200 ring-1 ring-emerald-100" : "border-slate-200"}`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
                <h3 className="flex min-w-0 items-center gap-2 text-lg font-semibold text-slate-900">
                    <Building2 className="size-5 shrink-0 text-blue-600" aria-hidden="true" />
                    <span className="break-words">{shift.site.name}</span>
                </h3>
                <Badge className={status.className}>{status.label}</Badge>
            </div>
            <p className="mt-3 flex items-start gap-2 text-sm font-medium text-slate-700">
                <Clock3 className="mt-0.5 size-4 shrink-0 text-blue-500" aria-hidden="true" />
                <span>Scheduled: {overnight
                    ? `${formatShiftDateTime(shift.scheduledStart)} – ${formatShiftDateTime(shift.scheduledEnd)} (overnight)`
                    : `${formatShiftTime(shift.scheduledStart)}–${formatShiftTime(shift.scheduledEnd)}`}</span>
            </p>
            {(shift.actualStart || shift.actualEnd) && (
                <div className="mt-3 space-y-1 text-sm text-slate-500">
                    {shift.actualStart && <p>Actual start: {formatShiftDateTime(shift.actualStart)}</p>}
                    {shift.actualEnd && <p>Actual end: {formatShiftDateTime(shift.actualEnd)}</p>}
                </div>
            )}
            {information.length > 0 && (
                <div className={`mt-4 space-y-1 rounded-xl p-3 text-sm ${shift.requiresManagerCorrection ? "border border-red-200 bg-red-50 text-red-700" : "bg-blue-50 text-blue-700"}`}>
                    {information.map((text, index) => <p key={text} className={index === 0 ? "font-semibold" : ""}>{text}</p>)}
                </div>
            )}
            {actions.map((action) => (
                <button key={action} type="button" onClick={() => onClock(action)} className="group mt-4 flex min-h-14 w-full items-center gap-3 rounded-xl bg-emerald-600 px-4 py-3 text-left text-white shadow-sm shadow-emerald-600/20 transition hover:bg-emerald-700 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 active:bg-emerald-800">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/15">{action === "clockIn" ? <ScanLine className="size-5" aria-hidden="true" /> : <LogOut className="size-5" aria-hidden="true" />}</span>
                    <span className="flex-1"><span className="block font-semibold">{action === "clockIn" ? "Clock in" : "Clock out"}</span><span className="block text-xs text-emerald-50">Scan your site's QR code</span></span>
                    <ArrowRight className="size-5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                </button>
            ))}
        </article>
    );
}
