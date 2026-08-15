package com.ashfall.engine;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

class EngineTest {
    @Test
    void headlessRunHasLifecycleAndCounters() {
        Engine engine = new Engine(Configuration.defaults(7L, true));

        assertFalse(engine.running());
        assertEquals(32, engine.worldCoordinates().chunkSize());
        assertEquals(128, engine.worldGrid().width());
        assertEquals(128, engine.worldGrid().height());
        assertEquals(0, engine.chunkStore().size());
        engine.runHeadless(12);
        assertTrue(engine.running());
        assertEquals(12, engine.counters().ticks());
        engine.stop();
        assertFalse(engine.running());
    }
}