import { useEffect, useState } from "react";
import { Building2, LoaderCircle, Mail, MapPin, Phone, PoundSterling, RefreshCw, User } from "lucide-react";
import { useParams } from "react-router-dom";
import { PageBackLink } from "@/components/layout/PageBackLink";
import { getSite, type SiteDetails } from "@/lib/sites";

export function CleanerSiteDetails() {
    const { siteId = "" } = useParams();
    return <CleanerSiteDetailsContent key={siteId} siteId={siteId} />;
}

function CleanerSiteDetailsContent({ siteId }: { siteId: string }) {
    const [site, setSite] = useState<SiteDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [attempt, setAttempt] = useState(0);

    useEffect(() => {
        let active = true;
        getSite(siteId)
            .then((data) => active && setSite(data))
            .catch(() => active && setError("We couldn't load this site. Please try again."))
            .finally(() => active && setLoading(false));
        return () => { active = false; };
    }, [siteId, attempt]);

    function retry() {
        setLoading(true);
        setError("");
        setAttempt((value) => value + 1);
    }

    const address = site && [site.addressLine1, site.addressLine2, site.city, site.postcode].filter(Boolean).join(", ");
    const hourlyRate = site?.hourlyRate == null ? "Not set" : new Intl.NumberFormat("en-GB", {
        style: "currency", currency: "GBP", minimumFractionDigits: 2,
    }).format(site.hourlyRate) + " / hour";

    return (
        <main className="min-h-full p-6 sm:p-10">
            <div className="mx-auto max-w-6xl">
                <PageBackLink to="/cleaner/my-sites">Back to my sites</PageBackLink>
                {loading && <div role="status" className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-6 text-slate-500 shadow-sm"><LoaderCircle className="size-5 animate-spin text-blue-600" aria-hidden="true" />Loading site…</div>}
                {!loading && (error || !site) && (
                    <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
                        <p>{error || "Site not found."}</p>
                        <button type="button" onClick={retry} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-semibold shadow-sm transition hover:bg-red-100 focus:outline-none focus:ring-4 focus:ring-red-100">
                            <RefreshCw className="size-4" aria-hidden="true" />Try again
                        </button>
                    </div>
                )}
                {!loading && !error && site && (
                    <>
                        <div className="mb-8">
                            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">Cleaner</p>
                            <h1 className="break-words text-3xl font-bold tracking-tight text-slate-950">{site.name || "Unnamed site"}</h1>
                            <p className="mt-2 text-slate-500">Location, contact details, and your hourly pay rate.</p>
                        </div>
                        <div className="grid items-start gap-6 lg:grid-cols-3">
                            <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
                                <div className="flex items-center gap-3">
                                    <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><Building2 className="size-5" aria-hidden="true" /></div>
                                    <div><h2 className="font-semibold text-slate-900">Site information</h2><p className="text-sm text-slate-500">Location and contact details</p></div>
                                </div>
                                <dl className="mt-6 grid gap-5 border-t border-slate-100 pt-5 sm:grid-cols-2">
                                    <div className="sm:col-span-2">
                                        <dt className="flex items-center gap-2 text-sm text-slate-500"><MapPin className="size-4" aria-hidden="true" />Address</dt>
                                        <dd className="mt-1.5 break-words font-medium text-slate-800">{address || "Address not provided"}</dd>
                                    </div>
                                    <div>
                                        <dt className="flex items-center gap-2 text-sm text-slate-500"><User className="size-4" aria-hidden="true" />Contact name</dt>
                                        <dd className="mt-1.5 break-words font-medium text-slate-800">{site.contactName || "Not provided"}</dd>
                                    </div>
                                    <div>
                                        <dt className="flex items-center gap-2 text-sm text-slate-500"><Phone className="size-4" aria-hidden="true" />Contact phone</dt>
                                        <dd className="mt-1.5 break-words font-medium text-slate-800">{site.contactPhone ? <a href={`tel:${site.contactPhone}`} className="rounded text-blue-700 underline-offset-4 hover:underline focus:outline-none focus:ring-4 focus:ring-blue-100">{site.contactPhone}</a> : "Not provided"}</dd>
                                    </div>
                                    <div className="sm:col-span-2">
                                        <dt className="flex items-center gap-2 text-sm text-slate-500"><Mail className="size-4" aria-hidden="true" />Contact email</dt>
                                        <dd className="mt-1.5 break-all font-medium text-slate-800">{site.contactEmail ? <a href={`mailto:${site.contactEmail}`} className="rounded text-blue-700 underline-offset-4 hover:underline focus:outline-none focus:ring-4 focus:ring-blue-100">{site.contactEmail}</a> : "Not provided"}</dd>
                                    </div>
                                </dl>
                            </section>
                            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><PoundSterling className="size-5" aria-hidden="true" /></div>
                                    <h2 className="font-semibold text-slate-900">Pay rate</h2>
                                </div>
                                <dl className="mt-6 border-t border-slate-100 pt-5">
                                    <dt className="text-sm text-slate-500">Hourly rate</dt>
                                    <dd className="mt-1.5 text-xl font-semibold tracking-tight text-slate-900">{hourlyRate}</dd>
                                </dl>
                            </section>
                        </div>
                    </>
                )}
            </div>
        </main>
    );
}
