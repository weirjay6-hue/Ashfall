package com.ashfall.engine;

/**
 * Headless-friendly entry point for local runs and future CI jobs.
 */
public final class Main {
    private Main() {
    }

    public static void main(String[] args) {
        boolean headless = false;
        int ticks = 60;
        int chunkSize = 32;
        int gridWidth = 128;
        int gridHeight = 128;
        long seed = 0x41534846414C4CL;

        for (String arg : args) {
            if (arg.equals("--headless")) {
                headless = true;
            } else if (arg.startsWith("--ticks=")) {
                ticks = Integer.parseInt(arg.substring("--ticks=".length()));
            } else if (arg.startsWith("--seed=")) {
                seed = parseSeed(arg.substring("--seed=".length()));
            } else if (arg.startsWith("--chunk-size=")) {
                chunkSize = Integer.parseInt(arg.substring("--chunk-size=".length()));
            } else if (arg.startsWith("--grid-width=")) {
                gridWidth = Integer.parseInt(arg.substring("--grid-width=".length()));
            } else if (arg.startsWith("--grid-height=")) {
                gridHeight = Integer.parseInt(arg.substring("--grid-height=".length()));
            } else {
                throw new IllegalArgumentException("Unknown argument: " + arg);
            }
        }

        Configuration configuration = new Configuration(
            seed,
            20,
            headless,
            chunkSize,
            gridWidth,
            gridHeight
        );
        Engine engine = new Engine(configuration);
        try {
            if (headless) {
                engine.runHeadless(ticks);
            } else {
                engine.start();
            }
        } finally {
            engine.stop();
        }
    }

    private static long parseSeed(String value) {
        try {
            return Long.parseLong(value);
        } catch (NumberFormatException ignored) {
            return value.hashCode();
        }
    }
}