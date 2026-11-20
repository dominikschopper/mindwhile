// @vitest-environment happy-dom
import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { parseFailures } from '@mindwhile/core';
import type { GameManifest, ProfileData } from '@mindwhile/core';
import { gameRegistryKey } from '../composables/game-registry';
import type { GameEntry, GameRegistry } from '../composables/game-registry';
import { roundState } from '../composables/use-chrome';
import { dismissNotice, notice } from '../composables/use-notice';
import { PROFILE_KEY, resetProfileForTests, useProfile } from '../profile/use-profile';
import { createStorage } from '../storage';
import BackupSection from './BackupSection.vue';
import * as fileIo from './file-io';
import * as codec from './profile-file';
import { t } from './texts';

vi.mock('./file-io', () => ({ saveProfileFile: vi.fn(), pickFile: vi.fn() }));
vi.mock('./profile-file', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./profile-file')>()),
  isBackupSupported: vi.fn(() => true),
  decodeProfileFile: vi.fn(),
}));

const manifest = {
  id: 'g',
  scoringVersion: 1,
  scoring: [{ key: 'moves', better: 'lower' }],
} as unknown as GameManifest;
const registry: GameRegistry = {
  listGames: () => [],
  getGame: (id) => (id === 'g' ? ({ id, manifest } as GameEntry) : undefined),
};

function result(moves: number) {
  return {
    gameId: 'g',
    gameVersion: 1,
    level: 'a',
    seed: 1,
    scoreValues: [moves],
    scoringVersion: 1,
  };
}

function incomingData(moves: number, tag = 'Other Fox'): ProfileData {
  return {
    profile: { playerId: 'BBBBBBBBBBB', gamerTag: tag, gamerSymbol: 'star', gamerTagChangedAt: 5 },
    best: [result(moves)],
  };
}

let store: ReturnType<typeof createStorage>;

function seed(): void {
  store = createStorage(null);
  store.set(
    PROFILE_KEY,
    JSON.stringify({
      app: 'mindwhile',
      kind: 'profile',
      fmtv: 1,
      profile: { player: 'AAAAAAAAAAA', tag: 'Test Fox', symbol: 'star', tagat: 0 },
      best: [],
    }),
  );
  resetProfileForTests(store);
}

function make() {
  return mount(BackupSection, {
    global: { provide: { [gameRegistryKey]: registry } },
    attachTo: document.body,
  });
}

afterEach(() => {
  roundState.value = 'idle';
});

beforeEach(() => {
  HTMLDialogElement.prototype.showModal = vi.fn() as () => void;
  HTMLDialogElement.prototype.close = vi.fn() as () => void;
  document.body.innerHTML = '';
  dismissNotice();
  vi.mocked(codec.isBackupSupported).mockReturnValue(true);
  vi.mocked(fileIo.saveProfileFile).mockReset();
  vi.mocked(fileIo.pickFile).mockReset();
  vi.mocked(codec.decodeProfileFile).mockReset();
  seed();
});

function page(selector: string) {
  return {
    trigger: (e: string) =>
      Promise.resolve(document.body.querySelector(selector)!.dispatchEvent(new Event(e))),
  };
}

async function pickWith(
  wrapper: ReturnType<typeof make>,
  decoded: Awaited<ReturnType<typeof codec.decodeProfileFile>>,
) {
  vi.mocked(fileIo.pickFile).mockResolvedValue(new File(['x'], 'x.gz'));
  vi.mocked(codec.decodeProfileFile).mockResolvedValue(decoded);
  await wrapper.get('.backup-import').trigger('click');
  await flushPromises();
}

describe('BackupSection', () => {
  it('shows only the hint when backup is unsupported', () => {
    vi.mocked(codec.isBackupSupported).mockReturnValue(false);
    const wrapper = make();
    expect(wrapper.find('button').exists()).toBe(false);
    expect(wrapper.text()).toContain(t('unsupported.hint'));
  });

  it('saves the profile with a dated file name on export', async () => {
    const wrapper = make();
    await wrapper.get('.backup-export').trigger('click');
    await vi.waitFor(() => expect(fileIo.saveProfileFile).toHaveBeenCalledTimes(1));
    const [blob, name] = vi.mocked(fileIo.saveProfileFile).mock.calls[0]!;
    expect(blob).toBeInstanceOf(Blob);
    expect(name).toBe(codec.profileFileName(new Date()));
  });

  it('shows a notice when export fails', async () => {
    vi.mocked(fileIo.saveProfileFile).mockRejectedValue(new Error('no'));
    const wrapper = make();
    await wrapper.get('.backup-export').trigger('click');
    await vi.waitFor(() => expect(notice.value).toBe(t('export.failed')));
  });

  it('does nothing when the file dialog is cancelled', async () => {
    vi.mocked(fileIo.pickFile).mockResolvedValue(null);
    const wrapper = make();
    await wrapper.get('.backup-import').trigger('click');
    await flushPromises();
    expect(codec.decodeProfileFile).not.toHaveBeenCalled();
    expect(notice.value).toBeNull();
    expect(document.body.querySelector('dialog') !== null).toBe(false);
  });

  it.each(parseFailures)('shows the notice for failure %s and opens no dialog', async (reason) => {
    const wrapper = make();
    await pickWith(wrapper, { ok: false, reason });
    expect(notice.value).toBe(t(`failure.${reason}`));
    expect(document.body.querySelector('dialog') !== null).toBe(false);
  });

  it.each(['too-large', 'unreadable'] as const)('shows the notice for %s', async (reason) => {
    const wrapper = make();
    await pickWith(wrapper, { ok: false, reason });
    expect(notice.value).toBe(t(`failure.${reason}`));
    expect(document.body.querySelector('dialog') !== null).toBe(false);
  });

  it('opens the dialog for a valid file and merges on confirm', async () => {
    const wrapper = make();
    await pickWith(wrapper, { ok: true, data: incomingData(3), skipped: 2 });
    expect(document.body.querySelector('dialog') !== null).toBe(true);
    expect(HTMLDialogElement.prototype.showModal).toHaveBeenCalled();
    expect(document.body.textContent).toContain('Other Fox');
    await page('.import-merge').trigger('click');
    await flushPromises();
    expect(useProfile().best.value).toHaveLength(1);
    expect(notice.value).toBe(t('notice.merged'));
    expect(document.body.querySelector('dialog') !== null).toBe(false);
  });

  it('changes nothing on cancel', async () => {
    const before = store.get(PROFILE_KEY);
    const profileBefore = JSON.stringify(useProfile().profile.value);
    const wrapper = make();
    await pickWith(wrapper, { ok: true, data: incomingData(3), skipped: 0 });
    await page('.import-cancel').trigger('click');
    await flushPromises();
    expect(store.get(PROFILE_KEY)).toBe(before);
    expect(JSON.stringify(useProfile().profile.value)).toBe(profileBefore);
    expect(useProfile().best.value).toHaveLength(0);
    expect(notice.value).toBeNull();
    expect(document.body.querySelector('dialog') !== null).toBe(false);
  });

  it('is idempotent when importing the own exported data', async () => {
    const { applyImport, profile, best } = useProfile();
    applyImport(incomingData(4, 'Mine'), () => manifest.scoring);
    const own: ProfileData = {
      profile: { ...profile.value },
      best: best.value.map((e) => ({ ...e, scoreValues: [...e.scoreValues] })),
    };
    const before = store.get(PROFILE_KEY);
    const wrapper = make();
    await pickWith(wrapper, { ok: true, data: own, skipped: 0 });
    await page('.import-merge').trigger('click');
    await flushPromises();
    expect(store.get(PROFILE_KEY)).toBe(before);
  });

  it('renders the dialog under body, outside the component root', async () => {
    const wrapper = make();
    await pickWith(wrapper, { ok: true, data: incomingData(3), skipped: 0 });
    expect(document.body.querySelector('dialog')).not.toBeNull();
    expect(wrapper.element.querySelector('dialog')).toBeNull();
  });

  it('disables import with a hint during a round, export stays enabled', () => {
    roundState.value = 'running';
    const wrapper = make();
    const importButton = wrapper.get('.backup-import');
    expect(importButton.attributes('disabled')).toBeDefined();
    expect(wrapper.get('.backup-export').attributes('disabled')).toBeUndefined();
    const hint = wrapper.get('.backup-hint');
    expect(hint.text()).toBe(t('import.disabledDuringRound'));
    expect(importButton.attributes('aria-describedby')).toBe(hint.attributes('id'));
  });

  it('shows no hint outside a round', () => {
    const wrapper = make();
    expect(wrapper.find('.backup-hint').exists()).toBe(false);
    expect(wrapper.get('.backup-import').attributes('disabled')).toBeUndefined();
  });

  it('emits importStarted once on click, also when the file dialog is cancelled', async () => {
    vi.mocked(fileIo.pickFile).mockResolvedValue(null);
    const wrapper = make();
    await wrapper.get('.backup-import').trigger('click');
    await flushPromises();
    expect(wrapper.emitted('importStarted')).toHaveLength(1);
  });

  it('renders an icon and keeps the text label on both buttons', () => {
    const wrapper = make();
    for (const [cls, key] of [
      ['.backup-export', 'export.button'],
      ['.backup-import', 'import.button'],
    ] as const) {
      const button = wrapper.get(cls);
      expect(button.find('svg').exists()).toBe(true);
      expect(button.text()).toBe(t(key));
    }
  });
});
