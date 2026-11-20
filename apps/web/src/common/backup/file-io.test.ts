// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { pickFile, saveProfileFile } from './file-io';

const blob = new Blob(['data'], { type: 'application/gzip' });
const NAME = 'mindwhile-profile-2026-01-02.json.gz';

function setNavigator(share?: unknown, canShare?: unknown): void {
  Object.defineProperty(navigator, 'share', { value: share, configurable: true });
  Object.defineProperty(navigator, 'canShare', { value: canShare, configurable: true });
}

describe('saveProfileFile', () => {
  let create: ReturnType<typeof vi.fn>;
  let revoke: ReturnType<typeof vi.fn>;
  let clicked: HTMLAnchorElement[];

  beforeEach(() => {
    create = vi.fn(() => 'blob:test');
    revoke = vi.fn();
    clicked = [];
    URL.createObjectURL = create as unknown as typeof URL.createObjectURL;
    URL.revokeObjectURL = revoke as unknown as typeof URL.revokeObjectURL;
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      clicked.push(this);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    setNavigator(undefined, undefined);
  });

  it('shares a File when canShare is true', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    setNavigator(share, () => true);
    await saveProfileFile(blob, NAME);
    expect(share).toHaveBeenCalledTimes(1);
    const file = share.mock.calls[0]![0].files[0] as File;
    expect(file).toBeInstanceOf(File);
    expect(file.name).toBe(NAME);
    expect(file.type).toBe('application/gzip');
    expect(clicked).toHaveLength(0);
  });

  it('ignores AbortError without downloading', async () => {
    const share = vi.fn().mockRejectedValue(new DOMException('cancelled', 'AbortError'));
    setNavigator(share, () => true);
    await expect(saveProfileFile(blob, NAME)).resolves.toBeUndefined();
    expect(clicked).toHaveLength(0);
    expect(create).not.toHaveBeenCalled();
  });

  it('falls back to download on other share errors', async () => {
    const share = vi.fn().mockRejectedValue(new Error('boom'));
    setNavigator(share, () => true);
    await saveProfileFile(blob, NAME);
    expect(clicked).toHaveLength(1);
    expect(clicked[0]!.download).toBe(NAME);
  });

  it('downloads through an anchor when sharing is unavailable', async () => {
    setNavigator(undefined, undefined);
    await saveProfileFile(blob, NAME);
    expect(create).toHaveBeenCalledTimes(1);
    expect(clicked).toHaveLength(1);
    expect(clicked[0]!.download).toBe(NAME);
    expect(clicked[0]!.href).toBe('blob:test');
    expect(revoke).toHaveBeenCalledWith('blob:test');
    expect(document.querySelector('a')).toBeNull();
  });
});

describe('pickFile', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('resolves the chosen file on change and removes the input', async () => {
    const file = new File(['x'], 'a.json.gz');
    const promise = pickFile();
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input).not.toBeNull();
    Object.defineProperty(input, 'files', { value: [file] });
    input.dispatchEvent(new Event('change'));
    await expect(promise).resolves.toBe(file);
    expect(document.querySelector('input[type="file"]')).toBeNull();
  });

  it('resolves null on cancel and removes the input', async () => {
    const promise = pickFile();
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    input.dispatchEvent(new Event('cancel'));
    await expect(promise).resolves.toBeNull();
    expect(document.querySelector('input[type="file"]')).toBeNull();
  });
});
