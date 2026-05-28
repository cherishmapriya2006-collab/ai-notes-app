import { createContext, useContext, useState } from "react";
import api from "../utils/api";

const AuthContext = createContext(null);

const readStoredUser = () => {
  const storedUser = localStorage.getItem("user") || sessionStorage.getItem("user");
  return storedUser ? JSON.parse(storedUser) : null;
};

const persistAuth = (data, remember = true) => {
  const token = data?.token;
  const user = data?.user || data;

  if (remember) {
    if (token) localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
  } else {
    if (token) sessionStorage.setItem("token", token);
    sessionStorage.setItem("user", JSON.stringify(user));
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  }

  return user;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => readStoredUser());
  const [loading, setLoading] = useState(false);

  const signup = async (name, email, password) => {
    setLoading(true);
    try {
      const { data } = await api.post("/auth/signup", { name, email, password });
      setUser(persistAuth(data, true));
      return data;
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password, remember = true) => {
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", { email, password });
      setUser(persistAuth(data, remember));
      return data;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, signup, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);