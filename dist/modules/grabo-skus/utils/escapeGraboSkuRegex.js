export function escapeGraboSkuRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
