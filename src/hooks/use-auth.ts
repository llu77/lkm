// Mock auth hook
export function useAuth() {
  return {
    isAuthenticated: true,
    user: null,
    login: async () => {},
    logout: async () => {},
  };
}
