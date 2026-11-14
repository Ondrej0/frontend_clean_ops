import { identity } from "@/lib/sessionIdentity";
import { useEffect, useState } from "react";
import type { SubmitEvent } from "react";
import { Building2, CalendarDays, LoaderCircle, Pencil, Save, User } from "lucide-react";
import { Link } from "react-router-dom";
import { getCleaner, type Cleaner } from "@/lib/employee";
import { getProfileFields, saveCleanerProfile, validateProfile, type CleanerProfileFields } from "@/lib/cleanerProfile";

const inputClass = "mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:bg-slate-50 disabled:opacity-60";
const buttonClass = "inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60";
const fields = [
    { name: "firstName", label: "First name", type: "text", autoComplete: "given-name", maxLength: 100, required: true },
    { name: "lastName", label: "Last name", type: "text", autoComplete: "family-name", maxLength: 100, required: true },
    { name: "email", label: "Email", type: "email", autoComplete: "email", maxLength: 255, required: true },
    { name: "phone", label: "Contact number", type: "tel", autoComplete: "tel", maxLength: 50, required: false },
] as const;

export function CleanerProfile() {
    const [cleaner, setCleaner] = useState<Cleaner | null>(null);
    const [draft, setDraft] = useState<CleanerProfileFields | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);
    const [attempt, setAttempt] = useState(0);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState("");
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        let active = true;
        getCleaner(identity.userId)
            .then((data) => {
                if (active) {
                    setCleaner(data);
                    setDraft(getProfileFields(data));
                }
            })
            .catch(() => active && setLoadError(true))
            .finally(() => active && setLoading(false));
        return () => { active = false; };
    }, [attempt]);

    function changeField(name: keyof CleanerProfileFields, value: string) {
        setDraft((current) => current && { ...current, [name]: value });
        setSaveError("");
    }

    async function save(event: SubmitEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!draft || saving) return;
        const validationError = validateProfile(draft);
        if (validationError) {
            setSaveError(validationError);
            return;
        }
        setSaving(true);
        setSaveError("");
        try {
            const updated = await saveCleanerProfile(draft);
            setCleaner(updated);
            setDraft(getProfileFields(updated));
            setEditing(false);
            setSaved(true);
        } catch {
            // Do not expose backend messages that may contain internal identifiers.
            setSaveError("We couldn't save your profile. Please try again. If the problem continues, contact your manager.");
        } finally {
            setSaving(false);
        }
    }

    const hasChanges = cleaner && draft && JSON.stringify(draft) !== JSON.stringify(getProfileFields(cleaner));

    return (
        <main className="min-h-full p-6 sm:p-10">
            <div className="mx-auto max-w-4xl">
                <header className="mb-8">
                    <p className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">Cleaner</p>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-950">My profile</h1>
                    <p className="mt-2 text-slate-500">Keep your personal and contact details up to date.</p>
                </header>

                {loading && <p role="status" className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-6 text-slate-500"><LoaderCircle className="size-5 animate-spin text-blue-600" aria-hidden="true" />Loading your profile…</p>}
                {!loading && (loadError || !cleaner || !draft) && (
                    <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
                        <p>We couldn't load your profile. Please try again.</p>
                        <button type="button" className={`${buttonClass} mt-4 bg-white`} onClick={() => { setLoading(true); setLoadError(false); setAttempt((value) => value + 1); }}>Try again</button>
                    </div>
                )}
                {!loading && !loadError && cleaner && draft && (
                    <div className="space-y-6">
                        <section aria-labelledby="personal-details" className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                            <div className="flex flex-wrap items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex size-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><User className="size-5" aria-hidden="true" /></div>
                                    <h2 id="personal-details" className="text-lg font-semibold text-slate-900">Personal details</h2>
                                </div>
                                {!editing && <button type="button" className={buttonClass} onClick={() => { setEditing(true); setSaved(false); setSaveError(""); }}><Pencil className="size-4" aria-hidden="true" />Edit profile</button>}
                            </div>
                            {editing ? (
                                <form onSubmit={save} className="mt-6 border-t border-slate-100 pt-6" aria-busy={saving}>
                                    <fieldset disabled={saving} className="grid gap-5 sm:grid-cols-2">
                                        <legend className="sr-only">Edit personal details</legend>
                                        {fields.map((field) => (
                                            <div key={field.name}>
                                                <label htmlFor={`profile-${field.name}`} className="text-sm font-medium text-slate-700">{field.label}</label>
                                                <input {...field} id={`profile-${field.name}`} value={draft[field.name]} onChange={(event) => changeField(field.name, event.target.value)} className={inputClass} />
                                            </div>
                                        ))}
                                        <div className="sm:col-span-2">
                                            <label htmlFor="profile-address" className="text-sm font-medium text-slate-700">Home address</label>
                                            <textarea id="profile-address" name="address" autoComplete="street-address" rows={3} maxLength={500} value={draft.address} onChange={(event) => changeField("address", event.target.value)} className={inputClass} aria-describedby="address-help" />
                                            <p id="address-help" className="mt-1.5 text-sm text-slate-500">Include your town or city and postcode.</p>
                                        </div>
                                    </fieldset>
                                    {saveError && <p role="alert" className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-700">{saveError}</p>}
                                    <div className="mt-6 flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-5">
                                        <button type="button" disabled={saving} className={buttonClass} onClick={() => { setDraft(getProfileFields(cleaner)); setEditing(false); setSaveError(""); }}>Cancel</button>
                                        <button type="submit" disabled={saving || !hasChanges} className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60">
                                            {saving ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <Save className="size-4" aria-hidden="true" />}{saving ? "Saving…" : "Save changes"}
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <dl className="mt-6 grid gap-5 border-t border-slate-100 pt-6 sm:grid-cols-2">
                                    {fields.map((field) => <div key={field.name}><dt className="text-sm text-slate-500">{field.label}</dt><dd className="mt-1.5 break-words font-medium text-slate-800">{cleaner[field.name] || "Not provided"}</dd></div>)}
                                    <div className="sm:col-span-2"><dt className="text-sm text-slate-500">Home address</dt><dd className="mt-1.5 whitespace-pre-line break-words font-medium text-slate-800">{cleaner.address || "Not provided"}</dd></div>
                                </dl>
                            )}
                            {saved && <p role="status" className="mt-5 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">Your profile has been updated.</p>}
                        </section>

                        <div className="grid gap-6 sm:grid-cols-2">
                            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                                <h2 className="flex items-center gap-2 font-semibold text-slate-900"><CalendarDays className="size-5 text-blue-600" aria-hidden="true" />My schedules</h2>
                                {(cleaner.assignedSchedules ?? []).length === 0 ? <p className="mt-4 text-sm text-slate-500">No schedules assigned yet.</p> : <><ul className="mt-4 space-y-2">{cleaner.assignedSchedules.map((schedule) => <li key={schedule.id} className="break-words rounded-lg bg-slate-50 p-3 text-sm font-medium text-slate-700">{schedule.name || "Unnamed schedule"}</li>)}</ul><Link to="/cleaner/schedule" className="mt-4 inline-block text-sm font-semibold text-blue-700 underline underline-offset-4">View my schedule</Link></>}
                            </section>
                            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                                <h2 className="flex items-center gap-2 font-semibold text-slate-900"><Building2 className="size-5 text-blue-600" aria-hidden="true" />My sites</h2>
                                {(cleaner.assignedSites ?? []).length === 0 ? <p className="mt-4 text-sm text-slate-500">No sites assigned yet.</p> : <ul className="mt-4 space-y-2">{cleaner.assignedSites.map((site) => <li key={site.id}><Link to={`/cleaner/my-sites/${encodeURIComponent(site.id)}`} className="block rounded-lg bg-slate-50 p-3 transition hover:bg-blue-50 focus:outline-none focus:ring-4 focus:ring-blue-100"><p className="break-words text-sm font-medium text-slate-700">{site.name || "Unnamed site"}</p><p className="mt-1 break-words text-sm text-slate-500">{[site.addressLine1, site.postcode].filter(Boolean).join(", ") || "Address not provided"}</p></Link></li>)}</ul>}
                            </section>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
