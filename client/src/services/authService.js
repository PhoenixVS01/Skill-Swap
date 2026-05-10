import api from "./api";

export const signupUser = async (payload) => {
  const { data } = await api.post("/auth/signup", payload);
  return data;
};

export const loginUser = async (payload) => {
  const { data } = await api.post("/auth/login", payload);
  return data;
};
