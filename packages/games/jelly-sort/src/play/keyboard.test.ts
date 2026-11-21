import { describe, expect, it } from 'vitest';
import { moveCursor, trayKeyAction, type TrayKeyEvent } from './keyboard';

function ev(key: string, extra: Partial<TrayKeyEvent> = {}): TrayKeyEvent {
  return { key, ctrlKey: false, metaKey: false, altKey: false, shiftKey: false, ...extra };
}

describe('trayKeyAction', () => {
  it('maps arrows to cursor moves', () => {
    expect(trayKeyAction(ev('ArrowLeft'), 6)).toEqual({ type: 'move', delta: -1 });
    expect(trayKeyAction(ev('ArrowUp'), 6)).toEqual({ type: 'move', delta: -1 });
    expect(trayKeyAction(ev('ArrowRight'), 6)).toEqual({ type: 'move', delta: 1 });
    expect(trayKeyAction(ev('ArrowDown'), 6)).toEqual({ type: 'move', delta: 1 });
  });

  it('maps digits to trays and ignores digits beyond the tray count and 0', () => {
    expect(trayKeyAction(ev('1'), 6)).toEqual({ type: 'jump', index: 0 });
    expect(trayKeyAction(ev('6'), 6)).toEqual({ type: 'jump', index: 5 });
    expect(trayKeyAction(ev('7'), 6)).toBeUndefined();
    expect(trayKeyAction(ev('0'), 6)).toBeUndefined();
  });

  it('maps Enter and Space to a tap', () => {
    expect(trayKeyAction(ev('Enter'), 6)).toEqual({ type: 'tap' });
    expect(trayKeyAction(ev(' '), 6)).toEqual({ type: 'tap' });
  });

  it('leaves Enter and Space on a focused button to the click', () => {
    expect(trayKeyAction(ev('Enter', { target: { tagName: 'BUTTON' } }), 6)).toBeUndefined();
    expect(trayKeyAction(ev('ArrowRight', { target: { tagName: 'BUTTON' } }), 6)).toEqual({
      type: 'move',
      delta: 1,
    });
  });

  it.each(['ctrlKey', 'metaKey', 'altKey', 'shiftKey'] as const)('ignores %s', (mod) => {
    expect(trayKeyAction(ev('1', { [mod]: true }), 6)).toBeUndefined();
  });

  it('ignores repeats, prevented events and form fields', () => {
    expect(trayKeyAction(ev('1', { repeat: true }), 6)).toBeUndefined();
    expect(trayKeyAction(ev('1', { defaultPrevented: true }), 6)).toBeUndefined();
    expect(trayKeyAction(ev('1', { target: { tagName: 'input' } }), 6)).toBeUndefined();
    expect(trayKeyAction(ev('Enter', { target: { tagName: 'TEXTAREA' } }), 6)).toBeUndefined();
    expect(trayKeyAction(ev('1', { target: { isContentEditable: true } }), 6)).toBeUndefined();
  });
});

describe('moveCursor', () => {
  it('wraps around both ends', () => {
    expect(moveCursor(5, 1, 6)).toBe(0);
    expect(moveCursor(0, -1, 6)).toBe(5);
    expect(moveCursor(2, 1, 6)).toBe(3);
  });
});
