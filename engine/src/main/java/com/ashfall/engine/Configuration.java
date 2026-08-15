package com.ashfall.engine;

/**
 * Immutable runtime settings for the engine.
 */
public record Configuration(
    long seed,
    int tickRate,
    boolean headless,
    int chunkSize
) {
    public Configuration(long seed, int tickRate, boolean headless) {
        this(seed, tickRate, headless, 32);
    }

    public Configuration {
        if (tickRate <= 0) {
            throw new IllegalArgumentException("tickRate must be positive");
        }
        if (chunkSize <= 0) {
            throw new IllegalArgumentException("chunkSize must be positive");
        }
    }

    public static Configuration defaults(long seed, boolean headless) {
        return new Configuration(seed, 20, headless, 32);
    }
}