import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { trpc } from "@/lib/trpc";

interface PinAuthContextValue {
  authenticated: boolean;
  loading: boolean;
  login: (pin: string, trusted: boolean) => Promise<void>;
  logout: () => Promise<void>;
}

const PinAuthContext = createContext<PinAuthContextValue | null>(null);

export function PinAuthProvider({ children }: { children: ReactNode }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkQuery = trpc.pin.check.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  const loginMutation = trpc.pin.login.useMutation();
  const logoutMutation = trpc.pin.logout.useMutation();

  useEffect(() => {
    if (checkQuery.isLoading) return;
    setAuthenticated(checkQuery.data?.authenticated ?? false);
    setLoading(false);
  }, [checkQuery.isLoading, checkQuery.data]);

  const login = async (pin: string, trusted: boolean) => {
    await loginMutation.mutateAsync({ pin, trusted });
    setAuthenticated(true);
  };

  const logout = async () => {
    await logoutMutation.mutateAsync();
    setAuthenticated(false);
  };

  return (
    <PinAuthContext.Provider value={{ authenticated, loading, login, logout }}>
      {children}
    </PinAuthContext.Provider>
  );
}

export function usePinAuth() {
  const ctx = useContext(PinAuthContext);
  if (!ctx) throw new Error("usePinAuth must be used within PinAuthProvider");
  return ctx;
}
