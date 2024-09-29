import StatsD from "hot-shots";

export const metrics = new StatsD({
    host: "graphite",
    port: 8125,
    prefix: "nodeapi.",
    errorHandler: (error) => {
        console.error("Error logging to stats: ", error);
    },
});

export async function measureTime(metricName, callback) {
    const start = process.hrtime.bigint();
    try {
        const result = await callback();
        return result;
    } catch (error) {
        throw error;
    } finally {
        const end = process.hrtime.bigint();
        metrics.gauge(metricName, Number(end - start) / 1_000_000);
    }
}