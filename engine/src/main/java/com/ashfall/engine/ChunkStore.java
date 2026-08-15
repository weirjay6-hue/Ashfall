package com.ashfall.engine;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Sparse in-memory storage for chunks that belong to a world grid.
 *
 * <p>Insertion order is preserved when listing loaded coordinates so headless
 * inspection and later streaming decisions remain deterministic.</p>
 */
public final class ChunkStore {
    private final WorldGrid grid;
    private final WorldCoordinateSystem coordinates;
    private final Map<ChunkCoordinate, Chunk> chunks = new LinkedHashMap<>();

    public ChunkStore(WorldGrid grid, WorldCoordinateSystem coordinates) {
        if (grid == null) {
            throw new NullPointerException("grid");
        }
        if (coordinates == null) {
            throw new NullPointerException("coordinates");
        }
        this.grid = grid;
        this.coordinates = coordinates;
    }

    public void put(Chunk chunk) {
        if (chunk == null) {
            throw new NullPointerException("chunk");
        }
        validateChunk(chunk.coordinate(), chunk.chunkSize());
        chunks.put(chunk.coordinate(), chunk);
    }

    public Chunk getOrCreate(ChunkCoordinate coordinate) {
        if (coordinate == null) {
            throw new NullPointerException("coordinate");
        }
        Chunk existing = chunks.get(coordinate);
        if (existing != null) {
            return existing;
        }

        validateChunk(coordinate, coordinates.chunkSize());
        Chunk created = new Chunk(coordinate, coordinates.chunkSize());
        chunks.put(coordinate, created);
        return created;
    }

    public Optional<Chunk> find(ChunkCoordinate coordinate) {
        if (coordinate == null) {
            return Optional.empty();
        }
        return Optional.ofNullable(chunks.get(coordinate));
    }

    public Optional<Chunk> remove(ChunkCoordinate coordinate) {
        if (coordinate == null) {
            return Optional.empty();
        }
        return Optional.ofNullable(chunks.remove(coordinate));
    }

    public boolean contains(ChunkCoordinate coordinate) {
        return coordinate != null && chunks.containsKey(coordinate);
    }

    public int size() {
        return chunks.size();
    }

    public List<ChunkCoordinate> loadedCoordinates() {
        return List.copyOf(new ArrayList<>(chunks.keySet()));
    }

    public void clear() {
        chunks.clear();
    }

    private void validateChunk(ChunkCoordinate coordinate, int chunkSize) {
        if (chunkSize != coordinates.chunkSize()) {
            throw new IllegalArgumentException(
                "chunk size does not match the world coordinate system"
            );
        }
        if (!grid.containsChunk(coordinates, coordinate)) {
            throw new IndexOutOfBoundsException(
                "chunk is outside the world grid: " + coordinate
            );
        }
    }
}