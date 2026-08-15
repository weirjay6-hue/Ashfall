package com.ashfall.engine;

/**
 * Converts between the world's unbounded cell plane and chunk-local
 * coordinates.
 *
 * <p>Floor division is intentional: a world cell immediately west of the
 * origin belongs to chunk {@code -1}, with a local coordinate at the far
 * eastern edge of that chunk. This keeps every local coordinate in the
 * half-open range {@code [0, chunkSize)} even for negative world positions.</p>
 */
public final class WorldCoordinateSystem {
    private final int chunkSize;

    public WorldCoordinateSystem(int chunkSize) {
        if (chunkSize <= 0) {
            throw new IllegalArgumentException("chunkSize must be positive");
        }
        this.chunkSize = chunkSize;
    }

    public int chunkSize() {
        return chunkSize;
    }

    public WorldCoordinate toWorld(ChunkCoordinate chunk, LocalCoordinate local) {
        if (chunk == null) {
            throw new NullPointerException("chunk");
        }
        if (local == null) {
            throw new NullPointerException("local");
        }
        validateLocal(local);

        long worldX = Math.addExact(
            Math.multiplyExact(chunk.x(), (long) chunkSize),
            local.x()
        );
        long worldY = Math.addExact(
            Math.multiplyExact(chunk.y(), (long) chunkSize),
            local.y()
        );
        return new WorldCoordinate(worldX, worldY);
    }

    public CellAddress locate(WorldCoordinate world) {
        if (world == null) {
            throw new NullPointerException("world");
        }

        long chunkX = Math.floorDiv(world.x(), chunkSize);
        long chunkY = Math.floorDiv(world.y(), chunkSize);
        int localX = Math.floorMod(world.x(), chunkSize);
        int localY = Math.floorMod(world.y(), chunkSize);

        return new CellAddress(
            new ChunkCoordinate(chunkX, chunkY),
            new LocalCoordinate(localX, localY)
        );
    }

    public WorldCoordinate chunkOrigin(ChunkCoordinate chunk) {
        if (chunk == null) {
            throw new NullPointerException("chunk");
        }
        return new WorldCoordinate(
            Math.multiplyExact(chunk.x(), (long) chunkSize),
            Math.multiplyExact(chunk.y(), (long) chunkSize)
        );
    }

    private void validateLocal(LocalCoordinate local) {
        if (local.x() < 0 || local.x() >= chunkSize
            || local.y() < 0 || local.y() >= chunkSize) {
            throw new IllegalArgumentException(
                "local coordinate must be within [0, chunkSize)"
            );
        }
    }
}