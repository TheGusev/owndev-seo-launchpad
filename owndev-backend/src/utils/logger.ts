const ts = () => new Date().toISOString();

export const logger = {
  info(tag: string, ...args: unknown[]) {
    console.info(`${ts()} [OWNDEV:${tag}]`, ...args);
  },
  warn(tag: string, ...args: unknown[]) {
    console.warn(`${ts()} [OWNDEV:${tag}]`, ...args);
  },
  error(tag: string, ...args: unknown[]) {
    console.error(`${ts()} [OWNDEV:${tag}]`, ...args);
  },
};
