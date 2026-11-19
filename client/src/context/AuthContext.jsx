import { createContext, useContext, useEffect, useState, useCallback } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("sbq_user");
    const storedRole = localStorage.getItem("sbq_role");
    if (storedUser && storedRole) {
      setUser(JSON.parse(storedUser));
      setRole(storedRole);
    }
    setReady(true);
  }, []);

  const login = useCallback((token, userData, userRole) => {
    localStorage.setItem("sbq_token", token);
    localStorage.setItem("sbq_user", JSON.stringify(userData));
    localStorage.setItem("sbq_role", userRole);
    setUser(userData);
    setRole(userRole);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("sbq_token");
    localStorage.removeItem("sbq_user");
    localStorage.removeItem("sbq_role");
    setUser(null);
    setRole(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, role, ready, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
