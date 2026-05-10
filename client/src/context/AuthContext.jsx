import { createContext, useContext, useMemo, useState } from "react";

import { loginUser, signupUser } from "../services/authService";

const STORAGE_KEY = "skillswap_auth";

const AuthContext = createContext(null);

const normalizeUser = (user) => {
  if (!user) {
    return null;
  }

  return {
    ...user,
    id: user.id || user._id,
  };
};

const readStoredAuth = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { token: null, user: null };
    }

    const parsed = JSON.parse(raw);
    return {
      token: parsed.token || null,
      user: normalizeUser(parsed.user),
    };
  } catch (error) {
    return { token: null, user: null };
  }
};

export const AuthProvider = ({ children }) => {
  const [authState, setAuthState] = useState(readStoredAuth);

  const persistAuth = (nextAuthState) => {
    setAuthState(nextAuthState);

    if (nextAuthState.token) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextAuthState));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const login = async (formData) => {
    const data = await loginUser(formData);
    persistAuth({
      token: data.token,
      user: normalizeUser(data.user),
    });
    return data;
  };

  const signup = async (formData) => {
    const data = await signupUser(formData);
    persistAuth({
      token: data.token,
      user: normalizeUser(data.user),
    });
    return data;
  };

  const logout = () => {
    persistAuth({ token: null, user: null });
  };

  const setCurrentUser = (user) => {
    persistAuth({
      token: authState.token,
      user: normalizeUser(user),
    });
  };

  const value = useMemo(
    () => ({
      token: authState.token,
      user: authState.user,
      isAuthenticated: Boolean(authState.token),
      login,
      signup,
      logout,
      setCurrentUser,
    }),
    [authState]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
};
