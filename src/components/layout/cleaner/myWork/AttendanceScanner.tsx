import { useRef, useState } from "react";
import { ArrowRight, LoaderCircle, RotateCcw, ScanLine, ShieldCheck, TriangleAlert, X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { recordAttendance, type AttendanceAction } from "@/lib/attendance";
import { formatShiftTime, type Shift } from "@/lib/shifts";
import { QrCamera } from "./QrCamera";

export function AttendanceScanner({ shift, action, onClose, onRecorded }: {
    shift: Shift;
    action: AttendanceAction;
    onClose: () => void;
    onRecorded: () => void;
}) {
    const [phase, setPhase] = useState<"scanning" | "submitting" | "error">("scanning");
    const [error, setError] = useState("");
    const [cameraAttempt, setCameraAttempt] = useState(0);
    const submitted = useRef(false);
    const label = action === "clockIn" ? "Clock in" : "Clock out";

    async function onScan(siteId: string) {
        if (submitted.current) return;
        submitted.current = true;
        setPhase("submitting");
        try {
            await recordAttendance(action, shift, siteId);
            onRecorded();
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : "We couldn't confirm your attendance. Check your shifts before scanning again.");
            setPhase("error");
        }
    }

    return (
        <Dialog open onOpenChange={(open) => { if (!open && (phase === "error" || !submitted.current)) onClose(); }}>
            <DialogContent showCloseButton={false} className="top-0 left-0 flex h-dvh max-h-dvh max-w-none translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-none bg-white p-0 text-slate-900 sm:top-1/2 sm:left-1/2 sm:h-auto sm:max-h-[90dvh] sm:max-w-lg sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl">
                <div className="flex shrink-0 items-start gap-3 border-b border-slate-100 px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-5 sm:px-6">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600"><ScanLine className="size-6" aria-hidden="true" /></div>
                    <div className="min-w-0 flex-1">
                        <DialogTitle className="text-xl font-bold">Scan to {label.toLowerCase()}</DialogTitle>
                        <DialogDescription className="mt-1 break-words text-slate-500">{shift.site.name} · {formatShiftTime(shift.scheduledStart)}–{formatShiftTime(shift.scheduledEnd)}</DialogDescription>
                    </div>
                    <button type="button" aria-label="Close scanner" disabled={phase === "submitting"} onClick={onClose} className="flex size-10 shrink-0 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-emerald-600 disabled:opacity-40"><X className="size-5" aria-hidden="true" /></button>
                </div>

                {phase === "scanning" ? <QrCamera key={cameraAttempt} onScan={(siteId) => { void onScan(siteId); }} /> : (
                    <div className="flex min-h-80 flex-1 flex-col items-center justify-center gap-4 px-6 py-12 text-center" role={phase === "error" ? "alert" : "status"}>
                        {phase === "submitting" ? <LoaderCircle className="size-12 animate-spin text-emerald-600" aria-hidden="true" /> : <TriangleAlert className="size-12 text-amber-500" aria-hidden="true" />}
                        <h2 className="text-lg font-semibold">{phase === "submitting" ? `Submitting ${action === "clockIn" ? "clock-in" : "clock-out"}…` : "Attendance not confirmed"}</h2>
                        <p className="max-w-sm text-sm leading-relaxed text-slate-500">{phase === "submitting" ? "QR code scanned. Please wait while we record your attendance." : error}</p>
                        {phase === "error" && <button type="button" onClick={onClose} className="mt-2 inline-flex min-h-11 items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2">Check my shifts <ArrowRight className="size-4" aria-hidden="true" /></button>}
                    </div>
                )}

                <div className="shrink-0 space-y-4 border-t border-slate-100 bg-white px-5 pt-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:px-6">
                    <p className="flex items-start gap-2 text-xs leading-relaxed text-slate-500"><ShieldCheck className="size-4 shrink-0 text-emerald-600" aria-hidden="true" />Scan the QR code displayed at your site to record your attendance. Camera images are not uploaded.</p>
                    {phase === "scanning" && <button type="button" onClick={() => setCameraAttempt((value) => value + 1)} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-emerald-600"><RotateCcw className="size-4" aria-hidden="true" />Restart camera</button>}
                </div>
            </DialogContent>
        </Dialog>
    );
}
