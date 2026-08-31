import { useState } from "react";
import type { ChangeEvent, SubmitEvent } from "react";

interface Site {
    tenantID: string | null;
    name: string;
    addressLine1: string;
    city: string;
    postcode: string;
}

export function CreateSiteForm() {
    const [site, setSite] = useState<Site>({
        tenantID: null,
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
            const response = await fetch("/api/sites", {
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
                tenantID: site.tenantID,
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
        <form onSubmit={handleSubmit}>
            <div>
                <label htmlFor="name">Site Name</label>
                <input
                    id="name"
                    name="name"
                    type="text"
                    value={site.name}
                    onChange={handleChange}
                    placeholder="Site name"
                    required
                    disabled={loading}
                />
            </div>

            <div>
                <label htmlFor="addressLine1">Address Line 1</label>
                <input
                    id="addressLine1"
                    name="addressLine1"
                    type="text"
                    value={site.addressLine1}
                    onChange={handleChange}
                    placeholder="Address Line 1"
                    required
                    disabled={loading}
                />
            </div>

            <div>
                <label htmlFor="city">City</label>
                <input
                    id="city"
                    name="city"
                    type="text"
                    value={site.city}
                    onChange={handleChange}
                    placeholder="City"
                    required
                    disabled={loading}
                />
            </div>

            <div>
                <label htmlFor="postcode">Postcode</label>
                <input
                    id="postcode"
                    name="postcode"
                    type="text"
                    value={site.postcode}
                    onChange={handleChange}
                    placeholder="Postcode"
                    required
                    disabled={loading}
                />
            </div>

            {error && (
                <p role="alert" style={{ color: "red" }}>
                    {error}
                </p>
            )}

            {success && (
                <p role="status" style={{ color: "green" }}>
                    Site created successfully.
                </p>
            )}

            <button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create Site"}
            </button>
        </form>
    );
}