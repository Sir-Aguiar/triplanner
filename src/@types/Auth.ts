export type AuthUser = {
  userId: string;
  username: string;
  name: string;
  email: string;
  location: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AuthTokensResponse = {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
};
