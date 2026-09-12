import { createContext, useContext, useState } from "react";
import api from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [username, setUsername] = useState(localStorage.getItem("username"));

  const login = async (email, password) => {
    const res = await api.post("/login", { email, password });
    localStorage.setItem("token", res.data.token);
    localStorage.setItem("username", res.data.username);
    setToken(res.data.token);
    setUsername(res.data.username);
    return res.data;
  };

  const register = async (regUsername, email, password) => {
    return api.post("/register", { username: regUsername, email, password });
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    setToken(null);
    setUsername(null);
  };

  return (
    <AuthContext.Provider value={{ token, username, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);