export type AuthProvider = "google" | "dev";

export type CurrentUser = {
  userId: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  provider: AuthProvider;
};

export type MockLoginRequest = {
  provider: AuthProvider;
};

export type MockLoginResponse = {
  user: CurrentUser;
};

export type LogoutResponse = {
  success: boolean;
};
