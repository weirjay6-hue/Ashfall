package com.ashfall.engine;

/**
 * Immutable runtime settings for the engine.
 */
public record Configuration(
    long seed,
    int tickRate,
    boolean headless,
    int chunkSize,
    int gridWidth,
    int gridHeight
) {
    public Configuration(long seed, int tickRate, boolean headless) {
        this(seed, tickRate, headless, 32, 128, 128);
    }

    public Configuration(long seed, int tickRate, boolean headless, int chunkSize) {
        this(seed, tickRate, headless, chunkSize, 128, 128);
    }

    public Configuration {
        if (tickRate <= 0) {
            throw new IllegalArgumentException("tickRate must be positive");
        }
        if (chunkSize <= 0) {
            throw new IllegalArgumentException("chunkSize must be positive");
        }
        if (gridWidth <= 0) {
            throw new IllegalArgumentException("gridWidth must be positive");
        }
        if (gridHeight <= 0) {
            throw new IllegalArgumentException("gridHeight must be positive");
        }
        try {
            Math.multiplyExact((long) gridWidth, (long) gridHeight);
        } catch (ArithmeticException exception) {
            throw new IllegalArgumentException("grid cell count is too large", exception);
        }
    }

    public static Configuration defaults(long seed, boolean headless) {
        return new Configuration(seed, 20, headless, 32, 128, 128);
    }
}