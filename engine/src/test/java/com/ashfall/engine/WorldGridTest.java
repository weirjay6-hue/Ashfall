package com.ashfall.engine;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

class WorldGridTest {
    private final WorldGrid grid = new WorldGrid(
        new WorldCoordinate(-2, 10),
        3,
        2
    );

    @Test
    void usesAnInclusiveOriginAndExclusiveMaximumBoundary() {
        assertTrue(grid.contains(new WorldCoordinate(-2, 10)));
        assertTrue(grid.contains(new WorldCoordinate(0, 11)));
        assertFalse(grid.contains(new WorldCoordinate(1, 11)));
        assertFalse(grid.contains(new WorldCoordinate(-2, 12)));
    }

    @Test
    void mapsCoordinatesToStableRowMajorIndexes() {
        assertEquals(0, grid.indexOf(new WorldCoordinate(-2, 10)));
        assertEquals(2, grid.indexOf(new WorldCoordinate(0, 10)));
        assertEquals(3, grid.indexOf(new WorldCoordinate(-2, 11)));
        assertEquals(5, grid.indexOf(new WorldCoordinate(0, 11)));
    }

    @Test
    void mapsEveryIndexBackToItsCoordinate() {
        for (int index = 0; index < grid.cellCount(); index++) {
            assertEquals(index, grid.indexOf(grid.coordinateAt(index)));
        }
    }

    @Test
    void rejectsOutOfBoundsCoordinatesAndIndexes() {
        assertThrows(
            IndexOutOfBoundsException.class,
            () -> grid.indexOf(new WorldCoordinate(1, 10))
        );
        assertThrows(
            IndexOutOfBoundsException.class,
            () -> grid.coordinateAt(-1)
        );
        assertThrows(
            IndexOutOfBoundsException.class,
            () -> grid.coordinateAt(grid.cellCount())
        );
    }

    @Test
    void rejectsInvalidDimensions() {
        assertThrows(
            IllegalArgumentException.class,
            () -> new WorldGrid(new WorldCoordinate(0, 0), 0, 2)
        );
        assertThrows(
            IllegalArgumentException.class,
            () -> new WorldGrid(new WorldCoordinate(0, 0), 2, 0)
        );
    }

    @Test
    void recognizesChunksOnlyWhenTheirFullFootprintFits() {
        WorldGrid chunkAlignedGrid = new WorldGrid(
            new WorldCoordinate(0, 0),
            64,
            64
        );
        WorldCoordinateSystem coordinates = new WorldCoordinateSystem(32);

        assertTrue(
            chunkAlignedGrid.containsChunk(coordinates, new ChunkCoordinate(0, 0))
        );
        assertTrue(
            chunkAlignedGrid.containsChunk(coordinates, new ChunkCoordinate(1, 1))
        );
        assertFalse(
            chunkAlignedGrid.containsChunk(coordinates, new ChunkCoordinate(2, 0))
        );
    }
}