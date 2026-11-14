import type { SessionUser } from './session.ts';
let current: SessionUser | null = null;
export function setSessionIdentity(user: SessionUser | null) { current = user; }
function requireIdentity(): SessionUser {
    if (!current) throw new Error('Please sign in to continue.');
    return current;
}
export const identity = {
    get userId() { return requireIdentity().id; },
    get tenantId() { return requireIdentity().tenantId; },
};
