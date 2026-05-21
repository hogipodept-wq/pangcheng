import { createContext, useContext, type ReactNode } from 'react';
import { trpc } from './trpc';

export interface CurrentUser {
  id: number;
  username: string;
  name: string;
  email: string | null;
  role: string;
  active: boolean;
}

interface AuthContextValue {
  user: CurrentUser | null;
  isLoading: boolean;
  refetch: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isLoading: true,
  refetch: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const query = trpc.auth.me.useQuery(undefined, { retry: false });
  return (
    <AuthContext.Provider
      value={{
        user: query.data ?? null,
        isLoading: query.isLoading,
        refetch: () => {
          void query.refetch();
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
