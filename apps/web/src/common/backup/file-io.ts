function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError';
}

function download(file: File): void {
  const url = URL.createObjectURL(file);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = file.name;
  anchor.hidden = true;
  document.body.appendChild(anchor);
  try {
    anchor.click();
  } finally {
    anchor.remove();
    URL.revokeObjectURL(url);
  }
}

/** Hands the file to the share sheet when possible, otherwise downloads it. */
export async function saveProfileFile(blob: Blob, name: string): Promise<void> {
  const file = new File([blob], name, { type: blob.type || 'application/gzip' });
  if (typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file] });
      return;
    } catch (error) {
      if (isAbortError(error)) return;
    }
  }
  download(file);
}

/** Opens the file dialog. Resolves with the chosen file, or `null` when cancelled. */
export function pickFile(): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.gz,.json.gz,application/gzip';
    input.hidden = true;
    const finish = (file: File | null): void => {
      input.remove();
      resolve(file);
    };
    input.addEventListener('change', () => finish(input.files?.[0] ?? null));
    input.addEventListener('cancel', () => finish(null));
    document.body.appendChild(input);
    input.click();
  });
}
