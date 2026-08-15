package com.ashfall.engine;

/**
 * Small allocation-free counters for early headless and benchmark work.
 */
public final class PerformanceCounters {
    private long ticks;
    private long simulationNanos;

    public void recordTick(long elapsedNanos) {
        ticks++;
        simulationNanos += Math.max(0, elapsedNanos);
    }

    public long ticks() {
        return ticks;
    }

    public long simulationNanos() {
        return simulationNanos;
    }

    public double averageTickMillis() {
        return ticks == 0 ? 0.0 : simulationNanos / 1_000_000.0 / ticks;
    }
}