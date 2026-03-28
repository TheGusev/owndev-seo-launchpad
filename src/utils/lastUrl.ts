export const saveLastUrl = (url: string) => localStorage.setItem('owndev_last_url', url);
export const getLastUrl = (): string => localStorage.getItem('owndev_last_url') || '';
