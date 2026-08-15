package com.ashfall.engine;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;
import org.junit.jupiter.api.Test;

class ChunkStoreTest {
    private final WorldCoordinateSystem coordinates = new WorldCoordinateSystem(4);
    private final WorldGrid grid = new WorldGrid(
        new WorldCoordinate(0, 0),
        8,
        8
    );
    private final ChunkStore store = new ChunkStore(grid, coordinates);

    @Test
    void createsAndFindsChunksByCoordinate() {
        ChunkCoordinate coordinate = new ChunkCoordinate(1, 0);
        Chunk chunk = store.getOrCreate(coordinate);
        chunk.setCellValue(new LocalCoordinate(2, 3), 17);

        assertSame(chunk, store.getOrCreate(coordinate));
        assertEquals(17, store.find(coordinate).orElseThrow()
            .cellValue(new LocalCoordinate(2, 3)));
        assertEquals(1, store.size());
    }

    @Test
    void preservesInsertionOrderWhenListingLoadedChunks() {
        ChunkCoordinate first = new ChunkCoordinate(1, 0);
        ChunkCoordinate second = new ChunkCoordinate(0, 1);

        store.getOrCreate(first);
        store.getOrCreate(second);

        assertEquals(List.of(first, second), store.loadedCoordinates());
    }

    @Test
    void replacesAndRemovesChunksExplicitly() {
        ChunkCoordinate coordinate = new ChunkCoordinate(0, 0);
        Chunk first = new Chunk(coordinate, 4);
        Chunk replacement = new Chunk(coordinate, 4);

        store.put(first);
        store.put(replacement);

        assertSame(replacement, store.find(coordinate).orElseThrow());
        assertSame(replacement, store.remove(coordinate).orElseThrow());
        assertFalse(store.contains(coordinate));
        assertEquals(0, store.size());
    }

    @Test
    void rejectsMismatchedOrOutOfBoundsChunks() {
        assertThrows(
            IllegalArgumentException.class,
            () -> store.put(new Chunk(new ChunkCoordinate(0, 0), 8))
        );
        assertThrows(
            IndexOutOfBoundsException.class,
            () -> store.getOrCreate(new ChunkCoordinate(2, 0))
        );
    }

    @Test
    void rejectsInvalidLocalCellCoordinates() {
        Chunk chunk = new Chunk(new ChunkCoordinate(0, 0), 4);

        assertThrows(
            IndexOutOfBoundsException.class,
            () -> chunk.cellValue(new LocalCoordinate(4, 0))
        );
    }
}