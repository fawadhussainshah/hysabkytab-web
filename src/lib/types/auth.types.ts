export interface User {
  id: string;
  email: string;
  fullName: string;
  currency: string;
  avatarUrl?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: User;
}
