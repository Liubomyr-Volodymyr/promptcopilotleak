export function buildQuery(params: Record<string, any>) {
    const qs = Object.entries(params)
        .filter(([, v]) => v !== undefined && v !== '' && v !== null)
        .map(
            ([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`,
        )
        .join('&');
    return qs ? `?${qs}` : '';
}