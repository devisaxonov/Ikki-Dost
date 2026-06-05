export type AuthenticatedUser = {
  sub: number;
  name: string;
  email: string | null;
  role: string;
  type?: 'access' | 'refresh';
};
