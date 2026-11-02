import { createStorage } from './storage';

export { createStorage } from './storage';
export type { KeyValueStorage } from './storage';

/** The one shared storage instance of the app. */
export const storage = createStorage();
