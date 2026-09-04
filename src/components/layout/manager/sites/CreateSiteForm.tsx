import { useState } from "react";
import type { ChangeEvent, SubmitEvent } from "react";
import {config} from "@/config/config.ts";

interface Site {
    tenantId: string | null;
    name: string;
    addressLine1: string;
    city: string;
    postcode: string;
}

export function CreateSiteForm() {
    const [site, setSite] = useState<Site>({
        tenantId: config.testTenant,
        name: "",
        addressLine1: "",
        city: "",
        postcode: "",
    });

    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [success, setSuccess] = useState<boolean>(false);

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;

        setSite((previousSite) => ({
            ...previousSite,
            [name]: value,
        }));

        setError(null);
        setSuccess(false);
    };

    const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();

        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            // TODO: Move the base URL into a config/environment variable.
            const response = await fetch(`${config.apiBaseUrl}/api/sites`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(site),
            });

            if (!response.ok) {
                let errorMessage = "Failed to create site.";

                try {
                    const data = await response.json();

                    if (data.message) {
                        errorMessage = data.message;
                    }
                } catch (jsonError) {
                    console.error("Failed to parse error response:", jsonError);
                }

                setError(errorMessage);
                return;
            }

            setSuccess(true);

            setSite({
                tenantId: site.tenantId,
                name: "",
                addressLine1: "",
                city: "",
                postcode: "",
            });
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Something went wrong while creating the site."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-full p-6 sm:p-10">
            <form onSubmit={handleSubmit} className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <div className="mb-8">
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">Operations</p>
                    <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">Create a site</h1>
                    <p className="mt-2 text-sm text-slate-500">Add a location for your cleaning teams and schedules.</p>
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="name">Site Name</label>
                <input
                    id="name"
                    name="name"
                    type="text"
                    value={site.name}
                    onChange={handleChange}
                    placeholder="Site name"
                    required
                    disabled={loading}
                    className="w-full rounded-lg border px-3 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-3 focus:ring-blue-100"
                />
            </div>

            <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="addressLine1">Address Line 1</label>
                <input
                    id="addressLine1"
                    name="addressLine1"
                    type="text"
                    value={site.addressLine1}
                    onChange={handleChange}
                    placeholder="Address Line 1"
                    required
                    disabled={loading}
                    className="w-full rounded-lg border px-3 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-3 focus:ring-blue-100"
                />
            </div>

            <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="city">City</label>
                <input
                    id="city"
                    name="city"
                    type="text"
                    value={site.city}
                    onChange={handleChange}
                    placeholder="City"
                    required
                    disabled={loading}
                    className="w-full rounded-lg border px-3 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-3 focus:ring-blue-100"
                />
            </div>

            <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="postcode">Postcode</label>
                <input
                    id="postcode"
                    name="postcode"
                    type="text"
                    value={site.postcode}
                    onChange={handleChange}
                    placeholder="Postcode"
                    required
                    disabled={loading}
                    className="w-full rounded-lg border px-3 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-3 focus:ring-blue-100"
                />
            </div>
            </div>

            {error && (
                <p role="alert" className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                    {error}
                </p>
            )}

            {success && (
                <p role="status" className="mt-5 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">
                    Site created successfully.
                </p>
            )}

            <button className="mt-6 inline-flex rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-600/25 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60" type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create Site"}
            </button>
            </form>
        </main>
    );
}
