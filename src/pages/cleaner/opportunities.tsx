import { Building2, CalendarDays, Clock3, RefreshCw, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { claimShiftOffer, formatShiftDateTime, getShiftOffers, type ShiftOffer } from "@/lib/shifts";

function cleanerName(offer: ShiftOffer) {
    return `${offer.offeredBy.firstName} ${offer.offeredBy.lastName}`.trim() || "Another cleaner";
}

export function Opportunities() {
    const [offers, setOffers] = useState<ShiftOffer[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [claiming, setClaiming] = useState<string | null>(null);
    const [attempt, setAttempt] = useState(0);

    useEffect(() => {
        const controller = new AbortController();
        void getShiftOffers(controller.signal)
            .then((result) => setOffers(result.offers))
            .catch((cause) => { if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "We couldn't load available shifts. Please try again."); })
            .finally(() => { if (!controller.signal.aborted) setLoading(false); });
        return () => controller.abort();
    }, [attempt]);

    async function claim(offer: ShiftOffer) {
        if (claiming) return;
        setClaiming(offer.shift.id);
        setNotice("");
        try {
            await claimShiftOffer(offer.shift.id);
            setOffers((current) => current.filter((item) => item.shift.id !== offer.shift.id));
            setNotice(`You've taken the ${offer.shift.site.name} shift. It now appears in My Work and My Schedule.`);
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : "This shift is no longer available. Refresh opportunities and try again.");
        } finally {
            setClaiming(null);
        }
    }

    function retry() {
        setLoading(true);
        setError("");
        setAttempt((value) => value + 1);
    }

    return <main className="mx-auto max-w-5xl p-4 sm:p-6 lg:p-8">
        <header className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">Available cover</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">Shift opportunities</h1>
            <p className="mt-2 text-slate-500">Take a specific shift offered by another cleaner. Opportunities close one hour before they start.</p>
        </header>
        {notice && <p role="status" className="mb-5 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice}</p>}
        {loading && <p role="status" className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-500 shadow-sm">Loading opportunities…</p>}
        {!loading && error && <div role="alert" className="rounded-2xl bg-red-50 p-5 text-red-800"><p>{error}</p><button type="button" onClick={retry} className="mt-3 inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-semibold shadow-sm hover:bg-red-100"><RefreshCw className="size-4" aria-hidden="true" />Try again</button></div>}
        {!loading && !error && offers.length === 0 && <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm"><CalendarDays className="mx-auto size-9 text-slate-400" aria-hidden="true" /><h2 className="mt-3 text-lg font-semibold text-slate-900">No shifts available</h2><p className="mt-1 text-sm text-slate-500">When another cleaner offers a future shift, it will appear here.</p></div>}
        {!loading && !error && offers.length > 0 && <div className="grid gap-4 lg:grid-cols-2">{offers.map((offer) => <article key={offer.shift.id} className="rounded-2xl border border-yellow-300 bg-yellow-50/60 p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900"><Building2 className="size-5 text-blue-600" aria-hidden="true" />{offer.shift.site.name}</h2><span className="rounded-full bg-yellow-200 px-3 py-1 text-xs font-semibold text-yellow-900">Available</span></div><dl className="mt-4 space-y-3 text-sm text-slate-700"><div className="flex gap-2"><Clock3 className="mt-0.5 size-4 shrink-0 text-blue-600" aria-hidden="true" /><div><dt className="sr-only">Shift time</dt><dd>{formatShiftDateTime(offer.shift.scheduledStart)} – {formatShiftDateTime(offer.shift.scheduledEnd)}</dd></div></div><div className="flex gap-2"><UserRound className="mt-0.5 size-4 shrink-0 text-blue-600" aria-hidden="true" /><div><dt className="sr-only">Offered by</dt><dd>Offered by {cleanerName(offer)}</dd></div></div>{offer.shift.scheduleName && <div><dt className="font-medium text-slate-900">Schedule</dt><dd>{offer.shift.scheduleName}</dd></div>}</dl><button type="button" disabled={claiming !== null} onClick={() => void claim(offer)} className="mt-5 min-h-11 w-full rounded-xl bg-blue-700 px-4 py-3 font-semibold text-white transition hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 disabled:opacity-60">{claiming === offer.shift.id ? "Taking shift…" : "Take this shift"}</button></article>)}</div>}
    </main>;
}
