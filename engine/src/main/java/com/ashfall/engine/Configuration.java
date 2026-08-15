package com.ashfall.engine;

/**
 * Immutable runtime settings for the engine foundation.
 */
public record Configuration(
    long seed,
    int tickRate,
    boolean headless
) {
    public Configuration {
        if (tickRate <= 0) {
            throw new IllegalArgumentException("tickRate must be positive");
        }
    }

    public static Configuration defaults(long seed, boolean headless) {
        return new Configuration(seed, 20, headless);
    }
}