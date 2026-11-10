import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Clock3, LoaderCircle, ScanLine } from "lucide-react";
import { Link } from "react-router-dom";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { clockInCountdown, quickClockState } from "@/lib/quickClock";
import type { AttendanceAction } from "@/lib/attendance";
import { formatShiftDateTime, getShifts, nextShiftRefresh, type Shift, type ShiftsResponse } from "@/lib/shifts";
import { AttendanceScanner } from "./myWork/AttendanceScanner";

export function QuickClock() {
    const [open, setOpen] = useState(false);
    const trigger = useRef<HTMLButtonElement>(null);

    function close() {
        setOpen(false);
        // Refresh My Work as well, including after an uncertain attendance response.
        window.dispatchEvent(new Event("attendance-updated"));
        requestAnimationFrame(() => trigger.current?.focus());
    }

    return (
        <>
            <button ref={trigger} type="button" className="app-navigation-clock-in" aria-label="Clock in or out" title="Clock in or out" aria-haspopup="dialog" onClick={() => setOpen(true)}>
                <ScanLine aria-hidden="true" />
                <span>In / Out</span>
            </button>
            {open && <QuickClockDialog onClose={close} />}
        </>
    );
}

function QuickClockDialog({ onClose }: { onClose: () => void }) {
    const [data, setData] = useState<ShiftsResponse | null>(null);
    const [error, setError] = useState("");
    const [now, setNow] = useState(Date.now);
    const [attempt, setAttempt] = useState(0);
    const [scanner, setScanner] = useState<{ shift: Shift; action: AttendanceAction } | null>(null);
    const [recorded, setRecorded] = useState(false);

    useEffect(() => {
        if (recorded) return;
        let active = true;
        let request: AbortController | undefined;
        let timer: ReturnType<typeof setTimeout>;

        async function refresh() {
            clearTimeout(timer);
            request?.abort();
            const controller = new AbortController();
            request = controller;
            const requestedAt = Date.now();
            const timeout = setTimeout(() => controller.abort(), 15_000);
            try {
                const result = await getShifts(controller.signal);
                if (!active || request !== controller) return;
                setData(result);
                setError("");
                setNow(Date.now());
                const state = quickClockState(result.shifts, Date.now());
                // Keep the selected shift and action stable while scanning/submitting.
                if (state.kind === "available") setScanner((current) => current ?? { shift: state.shift, action: state.action });
                timer = setTimeout(() => void refresh(), Math.max(0, Math.min(30_000, nextShiftRefresh(result, requestedAt) - Date.now())));
            } catch (cause) {
                if (!active || request !== controller) return;
                setError(controller.signal.aborted ? "Checking availability took too long. Please try again." : cause instanceof Error ? cause.message : "We couldn't check clocking availability. Please try again.");
                setData(null);
                timer = setTimeout(() => void refresh(), 30_000);
            } finally {
                clearTimeout(timeout);
            }
        }

        const onFocus = () => { void refresh(); };
        const onVisibility = () => { if (document.visibilityState === "visible") void refresh(); };
        void refresh();
        const tick = setInterval(() => setNow(Date.now()), 1000);
        window.addEventListener("focus", onFocus);
        document.addEventListener("visibilitychange", onVisibility);
        return () => {
            active = false;
            request?.abort();
            clearTimeout(timer);
            clearInterval(tick);
            window.removeEventListener("focus", onFocus);
            document.removeEventListener("visibilitychange", onVisibility);
        };
    }, [attempt, recorded]);

    if (scanner && !recorded) {
        const current = !error && data?.shifts.find((shift) => shift.id === scanner.shift.id);
        return <AttendanceScanner
            shift={current || { ...scanner.shift, canClockIn: false, canClockOut: false }}
            action={scanner.action}
            onClose={onClose}
            onRecorded={() => {
                setRecorded(true);
                window.dispatchEvent(new Event("attendance-updated"));
            }}
        />;
    }

    const state = data ? quickClockState(data.shifts, now) : null;
    const loading = !data && !error && !recorded;
    let title = "Clock in or out";
    let message = "Checking clock-in and clock-out availability…";
    if (recorded) {
        const clockedOut = scanner?.action === "clockOut";
        title = clockedOut ? "You're clocked out" : "You're clocked in";
        message = `${clockedOut ? "Clock-out" : "Clock-in"} recorded for ${scanner?.shift.site.name}. You can view your updated shifts in My Work.`;
    } else if (error) {
        title = "Couldn't check availability";
        message = error;
    } else if (state?.kind === "waiting") {
        title = `Clock-in available in ${clockInCountdown(state.opensAt, now)}`;
        message = `${state.shift.site.name} · Opens ${formatShiftDateTime(state.shift.clockInOpensAt)} (London time).`;
    } else if (state?.kind === "unavailable") {
        const closed = now > Date.parse(state.shift.clockInDeadline);
        title = closed ? "Clock-in window closed" : "Clock-in isn't available yet";
        message = closed
            ? "The clock-in window has closed. Check My Work or contact your manager."
            : "We're checking for updated availability. You can also check this shift in My Work.";
    } else if (state?.kind === "in-progress") {
        title = "You're already clocked in";
        message = "Clock-out isn't available right now. Check My Work for your current shift's details or try again when clock-out opens.";
    } else if (state?.kind === "empty") {
        title = "No upcoming shift to clock into";
        message = "There are no shifts available for clock-in in your loaded schedule. Check My Work for details.";
    }

    return (
        <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
            <DialogContent className="rounded-3xl bg-white p-6 text-slate-900 sm:max-w-md">
                <div className="flex size-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                    {loading ? <LoaderCircle className="size-7 animate-spin" aria-hidden="true" /> : recorded ? <CheckCircle2 className="size-7" aria-hidden="true" /> : <Clock3 className="size-7" aria-hidden="true" />}
                </div>
                <DialogTitle className="pr-4 text-xl leading-snug font-bold">{title}</DialogTitle>
                <DialogDescription className="leading-relaxed text-slate-600">{message}</DialogDescription>
                {error && <button type="button" onClick={() => { setError(""); setAttempt((value) => value + 1); }} className="min-h-11 rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white hover:bg-emerald-700">Try again</button>}
                {!loading && <Link to="/cleaner/my-work" onClick={onClose} className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 px-4 py-3 font-semibold text-slate-700 hover:bg-slate-50">View My Work</Link>}
            </DialogContent>
        </Dialog>
    );
}
