// @vitest-environment happy-dom
import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import PauseCover from './PauseCover.vue';
import { usePause } from './use-pause';

let showModal: ReturnType<typeof vi.fn>;
let close: ReturnType<typeof vi.fn>;

beforeEach(() => {
  showModal = vi.fn(function (this: HTMLDialogElement) {
    this.setAttribute('open', '');
  });
  close = vi.fn(function (this: HTMLDialogElement) {
    this.removeAttribute('open');
  });
  HTMLDialogElement.prototype.showModal = showModal as () => void;
  HTMLDialogElement.prototype.close = close as () => void;
});

afterEach(() => {
  document.body.innerHTML = '';
});

function make(open = false) {
  return mount(PauseCover, {
    props: { open, heading: 'Paused', resumeLabel: 'Continue' },
    slots: { default: '<p class="hint">Hint</p>' },
    attachTo: document.body,
  });
}

describe('PauseCover', () => {
  it('is closed by default', async () => {
    make(false);
    await Promise.resolve();
    expect(showModal).not.toHaveBeenCalled();
  });

  it('opens when open becomes true and closes when it becomes false', async () => {
    const wrapper = make(false);
    await wrapper.setProps({ open: true });
    await Promise.resolve();
    await Promise.resolve();
    expect(showModal).toHaveBeenCalledTimes(1);
    await wrapper.setProps({ open: false });
    expect(close).toHaveBeenCalledTimes(1);
  });

  it('shows heading, resume label, slot and the opaque backdrop class', () => {
    const wrapper = make();
    expect(wrapper.get('h2').text()).toBe('Paused');
    expect(wrapper.get('button').text()).toBe('Continue');
    expect(wrapper.find('.hint').exists()).toBe(true);
    expect(wrapper.get('dialog').classes()).toContain('app-dialog-opaque');
  });

  it('emits resume on button click', async () => {
    const wrapper = make(true);
    await wrapper.get('button').trigger('click');
    expect(wrapper.emitted('resume')).toHaveLength(1);
  });

  it('emits resume on Escape', async () => {
    const wrapper = make(true);
    await wrapper.get('dialog').trigger('keydown', { key: 'Escape' });
    expect(wrapper.emitted('resume')).toHaveLength(1);
  });

  it('keeps keydown away from window', async () => {
    const wrapper = make(true);
    const onWindow = vi.fn();
    window.addEventListener('keydown', onWindow);
    await wrapper.get('button').trigger('keydown', { key: 'a' });
    window.removeEventListener('keydown', onWindow);
    expect(onWindow).not.toHaveBeenCalled();
  });

  it('has the resume button as first focusable element', () => {
    const wrapper = make(true);
    const first = wrapper.get('dialog').element.querySelector('button, [href], input, [tabindex]');
    expect(first).toBe(wrapper.get('button').element);
  });

  it('works with usePause in a host', async () => {
    const Host = defineComponent({
      setup() {
        const { paused, pause, resume } = usePause();
        return () =>
          h('div', [
            h('button', { class: 'pause', onClick: pause }),
            h(PauseCover, {
              open: paused.value,
              heading: 'Paused',
              resumeLabel: 'Continue',
              onResume: resume,
            }),
          ]);
      },
    });
    const wrapper = mount(Host, { attachTo: document.body });
    await wrapper.get('.pause').trigger('click');
    await Promise.resolve();
    await Promise.resolve();
    expect(showModal).toHaveBeenCalledTimes(1);
    await wrapper.get('dialog button').trigger('click');
    expect(close).toHaveBeenCalledTimes(1);
  });
});
