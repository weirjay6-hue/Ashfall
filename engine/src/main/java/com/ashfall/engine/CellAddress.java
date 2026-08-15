package com.ashfall.engine;

import java.util.Objects;

/**
 * The chunk and local-cell address for a world coordinate.
 */
public record CellAddress(ChunkCoordinate chunk, LocalCoordinate local) {
    public CellAddress {
        Objects.requireNonNull(chunk, "chunk");
        Objects.requireNonNull(local, "local");
    }
}