const KEY = 'clinics_access_token';
const USER_KEY = 'clinics_user';

export interface StoredUser {
  id: number;
  name: string;
  email: string;
}

export const tokenStorage = {
  get: () => localStorage.getItem(KEY),
  set: (t: string) => localStorage.setItem(KEY, t),
  clear: () => {
    localStorage.removeItem(KEY);
    localStorage.removeItem(USER_KEY);
  },
};

export const userStorage = {
  get: (): StoredUser | null => {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as StoredUser) : null;
  },
  set: (u: StoredUser) => localStorage.setItem(USER_KEY, JSON.stringify(u)),
};
