package com.ashfall.engine;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.util.ArrayList;
import java.util.List;

import org.junit.jupiter.api.Test;

class FixedTimestepLoopTest {
    @Test
    void processesOnlyCompleteTicks() {
        List<Long> ticks = new ArrayList<>();
        FixedTimestepLoop loop = new FixedTimestepLoop(20, ticks::add);

        assertEquals(0, loop.advance(49_000_000L));
        assertEquals(1, loop.advance(1_000_000L));
        assertEquals(List.of(0L), ticks);
        assertEquals(2, loop.advance(100_000_000L));
        assertEquals(List.of(0L, 1L, 2L), ticks);
    }
}