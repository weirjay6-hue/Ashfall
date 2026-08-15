package com.ashfall.engine;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;

class DeterministicRngTest {
    @Test
    void sameSeedProducesSameSequence() {
        DeterministicRng first = new DeterministicRng(42L);
        DeterministicRng second = new DeterministicRng(42L);

        for (int i = 0; i < 20; i++) {
            assertEquals(first.nextLong(0, Long.MAX_VALUE), second.nextLong(0, Long.MAX_VALUE));
            assertEquals(first.nextDouble(), second.nextDouble());
        }
    }
}