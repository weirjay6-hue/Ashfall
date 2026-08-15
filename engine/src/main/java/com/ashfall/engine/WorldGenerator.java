package com.ashfall.engine;

    /**
    * Deterministic, on-demand terrain generation for the finite world grid.
    *
    * <p>Generation is derived from the world seed and world coordinates rather
    * than traversal order, so a chunk can be regenerated without storing the
    * complete world or depending on shared mutable random state.</p>
    */
    public final class WorldGenerator {
      public static final int TERRAIN_PLAINS = 1;
      public static final int TERRAIN_HILLS = 2;
      public static final int TERRAIN_FOREST = 3;
      public static final int TERRAIN_WATER = 4;

      private final long seed;
      private final WorldCoordinateSystem coordinates;
      private final WorldGrid grid;

      public WorldGenerator(
          long seed,
          WorldCoordinateSystem coordinates,
          WorldGrid grid
      ) {
          if (coordinates == null) {
              throw new NullPointerException("coordinates");
          }
          if (grid == null) {
              throw new NullPointerException("grid");
          }
          this.seed = seed;
          this.coordinates = coordinates;
          this.grid = grid;
      }

      public long seed() {
          return seed;
      }

      public int cellValue(WorldCoordinate world) {
          if (world == null) {
              throw new NullPointerException("world");
          }
          if (!grid.contains(world)) {
              throw new IndexOutOfBoundsException(
                  "world coordinate is outside the world grid: " + world
              );
          }
          return terrainFor(world.x(), world.y());
      }

      public Chunk generate(ChunkCoordinate coordinate) {
          if (coordinate == null) {
              throw new NullPointerException("coordinate");
          }
          if (!grid.containsChunk(coordinates, coordinate)) {
              throw new IndexOutOfBoundsException(
                  "chunk is outside the world grid: " + coordinate
              );
          }

          int chunkSize = coordinates.chunkSize();
          Chunk chunk = new Chunk(coordinate, chunkSize);
          for (int y = 0; y < chunkSize; y++) {
              for (int x = 0; x < chunkSize; x++) {
                  LocalCoordinate local = new LocalCoordinate(x, y);
                  chunk.setCellValue(local, cellValue(coordinates.toWorld(coordinate, local)));
              }
          }
          return chunk;
      }

      private int terrainFor(long x, long y) {
          long mixed = mix64(seed ^ (x * 0x9E3779B97F4A7C15L) ^ (y * 0xC2B2AE3D27D4EB4FL));
          return (int) Math.floorMod(mixed, 4L) + TERRAIN_PLAINS;
      }

      private static long mix64(long value) {
          value = (value ^ (value >>> 30)) * 0xBF58476D1CE4E5B9L;
          value = (value ^ (value >>> 27)) * 0x94D049BB133111EBL;
          return value ^ (value >>> 31);
      }
    }
    