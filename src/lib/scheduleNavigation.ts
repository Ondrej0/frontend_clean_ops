export function createSchedulePathForSite(siteId: string) {
    return `/manager/schedules/create?siteId=${encodeURIComponent(siteId)}`;
}

export function getPreselectedSiteId(searchParams: URLSearchParams) {
    return searchParams.get("siteId") ?? "";
}
