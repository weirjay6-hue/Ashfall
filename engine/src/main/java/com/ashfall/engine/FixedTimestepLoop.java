package com.ashfall.engine;

import java.util.Objects;
import java.util.function.LongConsumer;

/**
 * Keeps simulation updates at a fixed interval independent of render timing.
 */
public final class FixedTimestepLoop {
    private final long tickNanos;
    private final LongConsumer tickConsumer;
    private long accumulatorNanos;
    private long tickIndex;

    public FixedTimestepLoop(int tickRate, LongConsumer tickConsumer) {
        if (tickRate <= 0) {
            throw new IllegalArgumentException("tickRate must be positive");
        }
        this.tickNanos = 1_000_000_000L / tickRate;
        this.tickConsumer = Objects.requireNonNull(tickConsumer, "tickConsumer");
    }

    public int advance(long elapsedNanos) {
        if (elapsedNanos < 0) {
            throw new IllegalArgumentException("elapsedNanos cannot be negative");
        }
        accumulatorNanos += elapsedNanos;
        int ticksProcessed = 0;
        while (accumulatorNanos >= tickNanos) {
            tickConsumer.accept(tickIndex++);
            accumulatorNanos -= tickNanos;
            ticksProcessed++;
        }
        return ticksProcessed;
    }

    public long tickIndex() {
        return tickIndex;
    }

    public long tickNanos() {
        return tickNanos;
    }
}