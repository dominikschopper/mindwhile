/**
 * Migrates data of version `i + 1` to version `i + 2`. Returns the data with the changed shape,
 * the caller sets `fmtv`.
 */
export type MigrationStep = (data: unknown) => unknown;

/** Index `i` holds the step from version `i + 1` to version `i + 2`. Empty while the current version is 1. */
export const migrationSteps: readonly MigrationStep[] = [];

/**
 * Runs the steps from `fromVersion` up to the current version, one after the other.
 * `fromVersion` equal to the current version returns `data` unchanged.
 */
export function migrate(
  data: unknown,
  fromVersion: number,
  steps: readonly MigrationStep[] = migrationSteps,
): unknown {
  const latestVersion = steps.length + 1;
  if (!Number.isInteger(fromVersion) || fromVersion < 1 || fromVersion > latestVersion) {
    throw new RangeError(
      `Cannot migrate from version ${fromVersion}, expected an integer from 1 to ${latestVersion}`,
    );
  }

  let result = data;
  for (const step of steps.slice(fromVersion - 1)) {
    result = step(result);
  }
  return result;
}
