import { marks } from '../common/board/marks';
import { t } from '../texts';

/** Accessible name of a demo tray: its position and its layers from the bottom up. */
export function demoTrayLabel(layers: readonly number[], index: number, capacity: number): string {
  const position = index + 1;
  if (layers.length === 0) {
    return t('tray.labelEmpty', { position });
  }
  const described = layers.map((color) =>
    t('tray.layer', { color: t(`color.${color}` as 'color.0'), mark: t(marks[color]!.nameKey) }),
  );
  return t('tray.label', {
    position,
    filled: layers.length,
    capacity,
    layers: described.join(', '),
  });
}
