import { Building2, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import type { Site } from "@/lib/sites";

interface SiteCardProps {
    site: Site;
}

export function SiteCard({ site }: SiteCardProps) {
    const location = [site.addressLine1, site.city, site.postcode]
        .filter(Boolean)
        .join(", ");

    return (
        <Link to={`/manager/sites/${site.id}`} className="group block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-900/5 focus:outline-none focus:ring-4 focus:ring-blue-100">
            <div className="mb-5 flex items-start justify-between gap-4">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <Building2 size={22} />
                </div>
                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                    Site
                </span>
            </div>
            <h2 className="text-lg font-semibold tracking-tight text-slate-900">
                {site.name}
            </h2>
            <div className="mt-3 flex gap-2 text-sm leading-6 text-slate-500">
                <MapPin className="mt-1 size-4 shrink-0 text-blue-500" aria-hidden="true" />
                <p>{location || "Address not yet provided"}</p>
            </div>
        </Link>
    );
}
