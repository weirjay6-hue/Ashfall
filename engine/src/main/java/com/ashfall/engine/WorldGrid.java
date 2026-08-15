package com.ashfall.engine;

/**
 * A finite, row-major address space over world cells.
 *
 * <p>The grid stores layout and bounds only. Cell contents belong to later
 * generation and storage jobs. The maximum boundary is exclusive, matching
 * the local-coordinate convention used by {@link WorldCoordinateSystem}.</p>
 */
public final class WorldGrid {
    private final WorldCoordinate origin;
    private final int width;
    private final int height;
    private final int cellCount;

    public WorldGrid(WorldCoordinate origin, int width, int height) {
        if (origin == null) {
            throw new NullPointerException("origin");
        }
        if (width <= 0) {
            throw new IllegalArgumentException("width must be positive");
        }
        if (height <= 0) {
            throw new IllegalArgumentException("height must be positive");
        }

        long totalCells = Math.multiplyExact((long) width, (long) height);
        if (totalCells > Integer.MAX_VALUE) {
            throw new IllegalArgumentException("grid cell count must fit an integer index");
        }

        this.origin = origin;
        this.width = width;
        this.height = height;
        this.cellCount = (int) totalCells;
    }

    public WorldCoordinate origin() {
        return origin;
    }

    public int width() {
        return width;
    }

    public int height() {
        return height;
    }

    public int cellCount() {
        return cellCount;
    }

    public WorldCoordinate maxExclusive() {
        return new WorldCoordinate(
            Math.addExact(origin.x(), width),
            Math.addExact(origin.y(), height)
        );
    }

    public boolean contains(WorldCoordinate coordinate) {
        if (coordinate == null) {
            return false;
        }
        WorldCoordinate maximum = maxExclusive();
        return coordinate.x() >= origin.x()
            && coordinate.x() < maximum.x()
            && coordinate.y() >= origin.y()
            && coordinate.y() < maximum.y();
    }

    public boolean containsChunk(
        WorldCoordinateSystem coordinates,
        ChunkCoordinate chunk
    ) {
        if (coordinates == null) {
            throw new NullPointerException("coordinates");
        }
        if (chunk == null) {
            throw new NullPointerException("chunk");
        }

        WorldCoordinate first = coordinates.chunkOrigin(chunk);
        WorldCoordinate last = new WorldCoordinate(
            Math.addExact(first.x(), coordinates.chunkSize() - 1L),
            Math.addExact(first.y(), coordinates.chunkSize() - 1L)
        );
        return contains(first) && contains(last);
    }

    public int indexOf(WorldCoordinate coordinate) {
        requireContained(coordinate);
        long column = coordinate.x() - origin.x();
        long row = coordinate.y() - origin.y();
        return Math.toIntExact(row * width + column);
    }

    public WorldCoordinate coordinateAt(int index) {
        if (index < 0 || index >= cellCount) {
            throw new IndexOutOfBoundsException(
                "index must be within [0, cellCount)"
            );
        }
        long row = index / (long) width;
        long column = index % (long) width;
        return new WorldCoordinate(
            Math.addExact(origin.x(), column),
            Math.addExact(origin.y(), row)
        );
    }

    private void requireContained(WorldCoordinate coordinate) {
        if (!contains(coordinate)) {
            throw new IndexOutOfBoundsException(
                "coordinate is outside the world grid: " + coordinate
            );
        }
    }
}