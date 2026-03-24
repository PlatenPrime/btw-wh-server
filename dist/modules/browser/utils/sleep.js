/**
 * Асинхронная пауза между сетевыми операциями.
 */
export async function sleep(ms) {
    await new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}
