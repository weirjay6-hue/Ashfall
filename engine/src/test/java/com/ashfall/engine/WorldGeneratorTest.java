package com.ashfall.engine;

    import static org.junit.jupiter.api.Assertions.assertEquals;
    import static org.junit.jupiter.api.Assertions.assertNotEquals;
    import static org.junit.jupiter.api.Assertions.assertThrows;
    import static org.junit.jupiter.api.Assertions.assertTrue;

    import org.junit.jupiter.api.Test;

    class WorldGeneratorTest {
      private static final WorldCoordinateSystem COORDINATES = new WorldCoordinateSystem(4);
      private static final WorldGrid GRID = new WorldGrid(
          new WorldCoordinate(-8, -8),
          16,
          16
      );

      @Test
      void sameSeedAndCoordinateProduceTheSameChunk() {
          WorldGenerator first = new WorldGenerator(42L, COORDINATES, GRID);
          WorldGenerator second = new WorldGenerator(42L, COORDINATES, GRID);

          Chunk firstChunk = first.generate(new ChunkCoordinate(0, 0));
          Chunk secondChunk = second.generate(new ChunkCoordinate(0, 0));

          for (int y = 0; y < 4; y++) {
              for (int x = 0; x < 4; x++) {
                  LocalCoordinate local = new LocalCoordinate(x, y);
                  assertEquals(firstChunk.cellValue(local), secondChunk.cellValue(local));
              }
          }
      }

      @Test
      void differentSeedsCanProduceDifferentTerrain() {
          Chunk first = new WorldGenerator(42L, COORDINATES, GRID).generate(new ChunkCoordinate(0, 0));
          Chunk second = new WorldGenerator(43L, COORDINATES, GRID).generate(new ChunkCoordinate(0, 0));

          boolean anyDifference = false;
          for (int y = 0; y < 4; y++) {
              for (int x = 0; x < 4; x++) {
                  LocalCoordinate local = new LocalCoordinate(x, y);
                  if (first.cellValue(local) != second.cellValue(local)) {
                      anyDifference = true;
                  }
              }
          }
          assertTrue(anyDifference);
      }

      @Test
      void generatedValuesUseTheTerrainVocabulary() {
          WorldGenerator generator = new WorldGenerator(42L, COORDINATES, GRID);
          int value = generator.cellValue(new WorldCoordinate(0, 0));

          assertTrue(value >= WorldGenerator.TERRAIN_PLAINS);
          assertTrue(value <= WorldGenerator.TERRAIN_WATER);
      }

      @Test
      void rejectsCoordinatesOutsideTheFiniteGrid() {
          WorldGenerator generator = new WorldGenerator(42L, COORDINATES, GRID);

          assertThrows(
              IndexOutOfBoundsException.class,
              () -> generator.cellValue(new WorldCoordinate(8, 0))
          );
          assertThrows(
              IndexOutOfBoundsException.class,
              () -> generator.generate(new ChunkCoordinate(2, 0))
          );
      }

      @Test
      void engineGenerationStoresTheGeneratedChunk() {
          Engine engine = new Engine(new Configuration(42L, 20, true, 4, 16, 16));

          Chunk generated = engine.generateChunk(new ChunkCoordinate(0, 0));

          assertEquals(1, engine.chunkStore().size());
          assertEquals(generated, engine.chunkStore().find(new ChunkCoordinate(0, 0)).orElseThrow());
          assertNotEquals(0, generated.cellValue(new LocalCoordinate(0, 0)));
      }
    }
    