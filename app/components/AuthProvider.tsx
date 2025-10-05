import { createContext, useContext, type ReactNode } from "react";
import { useLoaderData, useRevalidator } from "react-router";

interface User {
  userId: number;
  username: string;
  isAdmin: boolean;
}

interface AuthContextType {
  user: User | null;
  logout: () => void;
  revalidate: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ 
  children,
  user
}: { 
  children: ReactNode;
  user: User | null;
}) {
  const revalidator = useRevalidator();

  const logout = async () => {
    await fetch("/logout");
    revalidator.revalidate();
    window.location.href = "/login";
  };

  const revalidate = () => {
    revalidator.revalidate();
  };

  return (
    <AuthContext.Provider value={{ user, logout, revalidate }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
