package com.ashfall.engine;

/**
 * A stable, unbounded cell position in the world plane.
 *
 * <p>World coordinates use long values so the coordinate model does not
 * impose an artificial edge on the future world.</p>
 */
public record WorldCoordinate(long x, long y) {
}