package com.ashfall.engine;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import org.junit.jupiter.api.Test;

class WorldCoordinateSystemTest {
    private final WorldCoordinateSystem coordinates = new WorldCoordinateSystem(32);

    @Test
    void locatesPositiveBoundaryInTheNextChunk() {
        CellAddress address = coordinates.locate(new WorldCoordinate(32, 64));

        assertEquals(new ChunkCoordinate(1, 2), address.chunk());
        assertEquals(new LocalCoordinate(0, 0), address.local());
    }

    @Test
    void locatesNegativeCellsWithFloorDivision() {
        CellAddress address = coordinates.locate(new WorldCoordinate(-1, -33));

        assertEquals(new ChunkCoordinate(-1, -2), address.chunk());
        assertEquals(new LocalCoordinate(31, 31), address.local());
    }

    @Test
    void conversionRoundTripsAcrossChunkBoundaries() {
        WorldCoordinate world = coordinates.toWorld(
            new ChunkCoordinate(-3, 4),
            new LocalCoordinate(31, 0)
        );

        assertEquals(new WorldCoordinate(-65, 128), world);
        assertEquals(world, coordinates.toWorld(
            coordinates.locate(world).chunk(),
            coordinates.locate(world).local()
        ));
    }

    @Test
    void rejectsLocalCoordinatesOutsideTheChunk() {
        assertThrows(
            IllegalArgumentException.class,
            () -> coordinates.toWorld(
                new ChunkCoordinate(0, 0),
                new LocalCoordinate(32, 0)
            )
        );
        assertThrows(
            IllegalArgumentException.class,
            () -> coordinates.toWorld(
                new ChunkCoordinate(0, 0),
                new LocalCoordinate(-1, 0)
            )
        );
    }

    @Test
    void rejectsInvalidChunkSize() {
        assertThrows(
            IllegalArgumentException.class,
            () -> new WorldCoordinateSystem(0)
        );
    }
}