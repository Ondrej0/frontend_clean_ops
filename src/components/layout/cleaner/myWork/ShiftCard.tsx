import { Building2, Clock3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { clockingInformation, formatShiftDateTime, formatShiftTime, londonDate, type Shift, type ShiftStatus } from "@/lib/shifts";

const statuses: Record<ShiftStatus, { label: string; className: string }> = {
    COMPLETED: { label: "Completed", className: "bg-green-50 text-green-700" },
    CANCELLED: { label: "Cancelled", className: "bg-slate-100 text-slate-600" },
    NO_SHOW: { label: "No show", className: "bg-red-50 text-red-700" },
    IN_PROGRESS: { label: "In progress", className: "bg-blue-50 text-blue-700" },
    SCHEDULED: { label: "Scheduled", className: "bg-slate-50 text-slate-700" },
};

export function ShiftCard({ shift, now }: { shift: Shift; now: number }) {
    const status = statuses[shift.status];
    const overnight = londonDate(shift.scheduledStart) !== londonDate(shift.scheduledEnd);
    const information = clockingInformation(shift, now);
    return (
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
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
        </article>
    );
}
