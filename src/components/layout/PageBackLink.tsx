import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";

interface PageBackLinkProps {
    to: string;
    children: ReactNode;
}

export function PageBackLink({ to, children }: PageBackLinkProps) {
    return (
        <Link
            to={to}
            className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-blue-700"
        >
            <ArrowLeft className="size-4" />
            {children}
        </Link>
    );
}
