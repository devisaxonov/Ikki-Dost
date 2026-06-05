const ADMIN_TOKEN_KEY = 'admin_token';
const ADMIN_USER_KEY = 'admin_user';

export const getAdminToken = () => localStorage.getItem(ADMIN_TOKEN_KEY) ?? '';

export const getAdminUser = () => {
  try {
    const rawUser = localStorage.getItem(ADMIN_USER_KEY);

    if (!rawUser) {
      return null;
    }

    return JSON.parse(rawUser);
  } catch {
    return null;
  }
};

export const setAdminSession = ({ token, user }) => {
  localStorage.setItem(ADMIN_TOKEN_KEY, token);
  localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(user));
};

export const clearAdminSession = () => {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
  localStorage.removeItem(ADMIN_USER_KEY);
};
