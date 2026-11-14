import { useEffect, useState } from "react";
import { getSession, type SessionUser } from "./session";
import { setSessionIdentity } from "./sessionIdentity";

export function useSession() {
    const [user, setUser] = useState<SessionUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    useEffect(() => {
        let controller: AbortController;
        const refresh = () => {
            controller?.abort();
            const request = new AbortController();
            controller = request;
            setLoading(true);
            setError("");
            getSession(request.signal)
                .then((result) => { if (!request.signal.aborted) { setSessionIdentity(result); setUser(result); } })
                .catch((cause: unknown) => { if (!request.signal.aborted) { setSessionIdentity(null); setUser(null); setError(cause instanceof Error ? cause.message : "Unable to check your session."); } })
                .finally(() => { if (!request.signal.aborted) setLoading(false); });
        };
        refresh();
        window.addEventListener("session-changed", refresh);
        return () => { controller.abort(); window.removeEventListener("session-changed", refresh); };
    }, []);
    return { user, loading, error };
}
