package com.ashfall.engine;

import java.util.SplittableRandom;

/**
 * Explicit seeded RNG. Systems should receive one rather than using global
 * randomness, so a seed and input sequence can be replayed.
 */
public final class DeterministicRng {
    private final SplittableRandom random;

    public DeterministicRng(long seed) {
        this.random = new SplittableRandom(seed);
    }

    public int nextInt(int origin, int bound) {
        return random.nextInt(origin, bound);
    }

    public long nextLong(long origin, long bound) {
        return random.nextLong(origin, bound);
    }

    public double nextDouble() {
        return random.nextDouble();
    }
}