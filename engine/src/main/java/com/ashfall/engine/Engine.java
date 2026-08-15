package com.ashfall.engine;

import java.util.logging.Logger;

/**
 * Lifecycle shell for the engine. Gameplay systems attach to this shell in
 * later jobs.
 */
public final class Engine {
    private static final Logger LOGGER = Logger.getLogger(Engine.class.getName());

    private final Configuration configuration;
    private final DeterministicRng rng;
    private final WorldCoordinateSystem worldCoordinates;
    private final PerformanceCounters counters = new PerformanceCounters();
    private final FixedTimestepLoop loop;
    private boolean running;

    public Engine(Configuration configuration) {
        this.configuration = configuration;
        this.rng = new DeterministicRng(configuration.seed());
        this.worldCoordinates = new WorldCoordinateSystem(configuration.chunkSize());
        this.loop = new FixedTimestepLoop(configuration.tickRate(), this::tick);
    }

    public void start() {
        if (running) {
            return;
        }
        running = true;
        LOGGER.info(() -> "ASHFALL engine started seed=" + configuration.seed()
            + " tickRate=" + configuration.tickRate()
            + " chunkSize=" + configuration.chunkSize()
            + " headless=" + configuration.headless());
    }

    public void runHeadless(int ticks) {
        if (ticks < 0) {
            throw new IllegalArgumentException("ticks cannot be negative");
        }
        start();
        for (int i = 0; i < ticks; i++) {
            long started = System.nanoTime();
            tick(i);
            counters.recordTick(System.nanoTime() - started);
        }
    }

    public void stop() {
        if (!running) {
            return;
        }
        running = false;
        LOGGER.info(() -> "ASHFALL engine stopped ticks=" + counters.ticks()
            + " averageTickMs=" + String.format("%.4f", counters.averageTickMillis()));
    }

    public boolean running() {
        return running;
    }

    public Configuration configuration() {
        return configuration;
    }

    public DeterministicRng rng() {
        return rng;
    }

    public WorldCoordinateSystem worldCoordinates() {
        return worldCoordinates;
    }

    public PerformanceCounters counters() {
        return counters;
    }

    public FixedTimestepLoop loop() {
        return loop;
    }

    private void tick(long tickIndex) {
        if (!running) {
            return;
        }
        // Deliberately empty in Job 001: this is the lifecycle seam for
        // world, simulation, and gameplay systems added by later jobs.
    }
}