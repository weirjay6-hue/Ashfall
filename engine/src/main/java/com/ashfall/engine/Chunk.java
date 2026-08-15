package com.ashfall.engine;

/**
 * A fixed-size chunk of opaque cell values.
 *
 * <p>Cell value {@code 0} is the initial empty value. Its meaning is
 * intentionally not defined until terrain generation introduces a cell
 * vocabulary.</p>
 */
public final class Chunk {
    private final ChunkCoordinate coordinate;
    private final int chunkSize;
    private final int[] cellValues;

    public Chunk(ChunkCoordinate coordinate, int chunkSize) {
        if (coordinate == null) {
            throw new NullPointerException("coordinate");
        }
        if (chunkSize <= 0) {
            throw new IllegalArgumentException("chunkSize must be positive");
        }

        long cellCount = Math.multiplyExact((long) chunkSize, (long) chunkSize);
        if (cellCount > Integer.MAX_VALUE) {
            throw new IllegalArgumentException("chunk cell count must fit an integer index");
        }

        this.coordinate = coordinate;
        this.chunkSize = chunkSize;
        this.cellValues = new int[(int) cellCount];
    }

    public ChunkCoordinate coordinate() {
        return coordinate;
    }

    public int chunkSize() {
        return chunkSize;
    }

    public int cellCount() {
        return cellValues.length;
    }

    public int cellValue(LocalCoordinate local) {
        return cellValues[indexOf(local)];
    }

    public void setCellValue(LocalCoordinate local, int value) {
        cellValues[indexOf(local)] = value;
    }

    private int indexOf(LocalCoordinate local) {
        if (local == null) {
            throw new NullPointerException("local");
        }
        if (local.x() < 0 || local.x() >= chunkSize
            || local.y() < 0 || local.y() >= chunkSize) {
            throw new IndexOutOfBoundsException(
                "local coordinate must be within [0, chunkSize)"
            );
        }
        return local.y() * chunkSize + local.x();
    }
}