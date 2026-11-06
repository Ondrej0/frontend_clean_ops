import { useEffect, useState } from "react";
import type { ChangeEvent } from "react";
import { Building2, CalendarDays, CheckCircle2, Clock3, LoaderCircle, Mail, MapPin, Pencil, Phone, PoundSterling, Save, User, XCircle } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { PageBackLink } from "@/components/layout/PageBackLink";
import { editSite, getSite, type EditSiteRequest, type SiteDetails as SiteDetailsData } from "@/lib/sites";
import { config } from "@/config/config";

function formatDate(value: string) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("en-GB", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(date);
}

function formatHourlyRate(hourlyRate: number | null) {
    return hourlyRate === null ? "Not set" : new Intl.NumberFormat("en-GB", {
        style: "currency",
        currency: "GBP",
        minimumFractionDigits: 2,
    }).format(hourlyRate) + " / hour";
}

type EditableSiteFields = Omit<EditSiteRequest, "tenantId" | "siteId">;

function getEditableFields(site: SiteDetailsData): EditableSiteFields {
    return {
        name: site.name,
        addressLine1: site.addressLine1 ?? "",
        city: site.city ?? "",
        postcode: site.postcode ?? "",
        contactName: site.contactName ?? "",
        contactPhone: site.contactPhone ?? "",
        contactEmail: site.contactEmail ?? "",
        hourlyRate: site.hourlyRate,
    };
}

export function SiteDetails() {
    const { siteId = "" } = useParams();
    const [site, setSite] = useState<SiteDetailsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [editableFields, setEditableFields] = useState<EditableSiteFields | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState("");

    async function loadSite() {
        if (!siteId) {
            setLoading(false);
            setError("No site was selected.");
            return;
        }

        setLoading(true);
        setError("");
        try {
            const data = await getSite(siteId);
            setSite(data);
            setEditableFields(getEditableFields(data));
        } catch (loadError) {
            setError(loadError instanceof Error ? loadError.message : "Unable to load this site.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        let active = true;

        getSite(siteId)
            .then((data) => {
                if (active) {
                    setSite(data);
                    setEditableFields(getEditableFields(data));
                }
            })
            .catch((loadError: unknown) => active && setError(loadError instanceof Error ? loadError.message : "Unable to load this site."))
            .finally(() => active && setLoading(false));

        return () => { active = false; };
    }, [siteId]);

    if (loading) {
        return <main className="min-h-full p-6 sm:p-10"><div className="mx-auto flex max-w-6xl items-center gap-3 rounded-2xl border border-slate-200 bg-white p-6 text-slate-500 shadow-sm"><LoaderCircle className="size-5 animate-spin text-blue-600" />Loading site…</div></main>;
    }

    if (!site) {
        return <main className="min-h-full p-6 sm:p-10"><div className="mx-auto max-w-6xl rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700"><p>{error || "Site not found."}</p><button type="button" onClick={() => void loadSite()} className="mt-4 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-red-700 shadow-sm">Try again</button></div></main>;
    }

    const originalFields = getEditableFields(site);
    const hasChanges = editableFields !== null && JSON.stringify(editableFields) !== JSON.stringify(originalFields);
    const address = [site.addressLine1, site.addressLine2, site.city, site.postcode].filter(Boolean).join(", ") || "Address not provided";
    const isActive = site.status?.toUpperCase() === "ACTIVE";
    const assignedSchedules = site.assignedSchedules ?? [];
    const assignedCleaners = site.assignedCleaners ?? [];

    function handleFieldChange(event: ChangeEvent<HTMLInputElement>) {
        const { name, value } = event.target;
        setEditableFields((current) => current && {
            ...current,
            [name]: name === "hourlyRate" ? (value === "" ? null : Number(value)) : value,
        });
        setSaveError("");
    }

    async function handleEditAction() {
        if (!isEditing) {
            setIsEditing(true);
            setSaveError("");
            return;
        }

        if (!hasChanges) {
            setIsEditing(false);
            return;
        }

        if (!editableFields) return;

        if (!editableFields.name.trim()) {
            setSaveError("Site name is required.");
            return;
        }

        setSaving(true);
        setSaveError("");
        try {
            await editSite(siteId, { tenantId: config.testTenant, siteId, ...editableFields, name: editableFields.name.trim() });
            await loadSite();
            setIsEditing(false);
        } catch (saveFailure) {
            setSaveError(saveFailure instanceof Error ? saveFailure.message : "Unable to save site changes.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <main className="min-h-full p-6 sm:p-10">
            <div className="mx-auto max-w-6xl">
                <PageBackLink to="/manager/sites">Back to sites</PageBackLink>
                <div className="mb-8">
                    <p className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">Operations</p>
                    <div className="flex flex-wrap items-center gap-3">
                        <h1 className="text-3xl font-bold tracking-tight text-slate-950">{site.name || "Unnamed site"}</h1>
                        {site.status && <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ${isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                            {isActive ? <CheckCircle2 className="size-4" /> : <XCircle className="size-4" />}
                            {site.status}
                        </span>}
                    </div>
                    <p className="mt-2 text-slate-500">Edit the location, contact details, and hourly rate.</p>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
                        <div className="flex items-start justify-between gap-3"><div className="flex items-center gap-3"><div className="flex size-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><Building2 className="size-5" /></div><div><h2 className="font-semibold text-slate-900">Site information</h2><p className="text-sm text-slate-500">Location and contact details</p></div></div><button type="button" onClick={() => void handleEditAction()} disabled={saving} className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60">{saving ? <LoaderCircle className="size-4 animate-spin" /> : hasChanges ? <Save className="size-4" /> : <Pencil className="size-4" />}{saving ? "Saving..." : hasChanges ? "Save" : "Edit"}</button></div>
                        <dl className="mt-6 grid gap-5 border-t border-slate-100 pt-5 sm:grid-cols-2">
                            {isEditing && editableFields ? <><div className="sm:col-span-2"><label className="flex items-center gap-2 text-sm text-slate-400" htmlFor="name"><Building2 className="size-4" />Site name</label><input id="name" name="name" value={editableFields.name} onChange={handleFieldChange} required className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-3 focus:ring-blue-100" /></div><div className="sm:col-span-2"><label className="flex items-center gap-2 text-sm text-slate-400" htmlFor="addressLine1"><MapPin className="size-4" />Address line 1</label><input id="addressLine1" name="addressLine1" value={editableFields.addressLine1} onChange={handleFieldChange} className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-3 focus:ring-blue-100" /></div><div><label className="text-sm text-slate-400" htmlFor="city">City</label><input id="city" name="city" value={editableFields.city} onChange={handleFieldChange} className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-3 focus:ring-blue-100" /></div><div><label className="text-sm text-slate-400" htmlFor="postcode">Postcode</label><input id="postcode" name="postcode" value={editableFields.postcode} onChange={handleFieldChange} className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-3 focus:ring-blue-100" /></div><div><label className="flex items-center gap-2 text-sm text-slate-400" htmlFor="contactName"><User className="size-4" />Contact name</label><input id="contactName" name="contactName" value={editableFields.contactName} onChange={handleFieldChange} className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-3 focus:ring-blue-100" /></div><div><label className="flex items-center gap-2 text-sm text-slate-400" htmlFor="contactPhone"><Phone className="size-4" />Contact phone</label><input id="contactPhone" name="contactPhone" type="tel" value={editableFields.contactPhone} onChange={handleFieldChange} className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-3 focus:ring-blue-100" /></div><div><label className="flex items-center gap-2 text-sm text-slate-400" htmlFor="contactEmail"><Mail className="size-4" />Contact email</label><input id="contactEmail" name="contactEmail" type="email" value={editableFields.contactEmail} onChange={handleFieldChange} className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-3 focus:ring-blue-100" /></div><div><label className="flex items-center gap-2 text-sm text-slate-400" htmlFor="hourlyRate"><PoundSterling className="size-4" />Hourly rate</label><input id="hourlyRate" name="hourlyRate" type="number" min="0" step="0.01" value={editableFields.hourlyRate ?? ""} onChange={handleFieldChange} className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-3 focus:ring-blue-100" /></div></> : <><div className="sm:col-span-2"><dt className="flex items-center gap-2 text-sm text-slate-400"><MapPin className="size-4" />Address</dt><dd className="mt-1.5 font-medium text-slate-800">{address}</dd></div><div><dt className="flex items-center gap-2 text-sm text-slate-400"><User className="size-4" />Contact name</dt><dd className="mt-1.5 font-medium text-slate-800">{site.contactName || "Not provided"}</dd></div><div><dt className="flex items-center gap-2 text-sm text-slate-400"><Phone className="size-4" />Contact phone</dt><dd className="mt-1.5 font-medium text-slate-800">{site.contactPhone || "Not provided"}</dd></div><div><dt className="flex items-center gap-2 text-sm text-slate-400"><Mail className="size-4" />Contact email</dt><dd className="mt-1.5 break-all font-medium text-slate-800">{site.contactEmail || "Not provided"}</dd></div><div><dt className="flex items-center gap-2 text-sm text-slate-400"><PoundSterling className="size-4" />Hourly rate</dt><dd className="mt-1.5 font-medium text-slate-800">{formatHourlyRate(site.hourlyRate)}</dd></div></>}
                        </dl>
                        {saveError && <p role="alert" className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-700">{saveError}</p>}
                    </section>

                    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-center gap-2"><Clock3 className="size-5 text-blue-600" /><h2 className="font-semibold text-slate-900">Record</h2></div><dl className="mt-5 space-y-4 text-sm"><div><dt className="text-slate-400">Site ID</dt><dd className="mt-1 break-all font-medium text-slate-700">{site.siteId}</dd></div><div><dt className="text-slate-400">Created</dt><dd className="mt-1 font-medium text-slate-700">{formatDate(site.createdAt)}</dd></div><div><dt className="text-slate-400">Last updated</dt><dd className="mt-1 font-medium text-slate-700">{formatDate(site.updatedAt)}</dd></div></dl></section>

                    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2"><div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><CalendarDays className="size-5 text-blue-600" /><h2 className="font-semibold text-slate-900">Schedules</h2></div><span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">{assignedSchedules.length}</span></div>{assignedSchedules.length === 0 ? <p className="mt-5 text-sm text-slate-500">No schedules assigned yet.</p> : <ul className="mt-4 space-y-2">{assignedSchedules.map((schedule) => <li key={schedule.scheduleId}><Link to={`/manager/schedules/${schedule.scheduleId}/edit`} className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 px-4 py-3 transition hover:bg-blue-50 focus:outline-none focus:ring-4 focus:ring-blue-100"><span className="font-medium text-slate-800">{schedule.name || "Unnamed schedule"}</span><span className="text-sm font-semibold text-blue-700">Edit schedule</span></Link></li>)}</ul>}</section>

                    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><User className="size-5 text-blue-600" /><h2 className="font-semibold text-slate-900">Assigned cleaners</h2></div><span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">{assignedCleaners.length}</span></div>{assignedCleaners.length === 0 ? <p className="mt-5 text-sm text-slate-500">No cleaners assigned yet.</p> : <ul className="mt-4 space-y-2">{assignedCleaners.map((cleaner) => <li key={cleaner.cleanerId}><Link to={`/manager/employees/${cleaner.cleanerId}`} className="block rounded-xl bg-slate-50 px-4 py-3 transition hover:bg-blue-50 focus:outline-none focus:ring-4 focus:ring-blue-100"><p className="font-medium text-slate-800">{[cleaner.firstName, cleaner.lastName].filter(Boolean).join(" ") || "Unnamed employee"}</p><p className="mt-1 text-sm font-semibold text-blue-700">View employee</p></Link></li>)}</ul>}</section>
                </div>
            </div>
        </main>
    );
}
