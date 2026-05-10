import api from "./api";

export const getProfile = async () => {
  const { data } = await api.get("/users/profile");
  return data;
};

export const updateProfile = async (payload) => {
  const { data } = await api.put("/users/profile", payload);
  return data;
};

export const getUsers = async () => {
  const { data } = await api.get("/users");
  return data;
};

export const connectUser = async (userId) => {
  const { data } = await api.post(`/users/connect/${userId}`);
  return data;
};

export const getMatches = async () => {
  const { data } = await api.get("/users/matches");
  return data;
};

export const getReviewsForUser = async (userId) => {
  const { data } = await api.get(`/users/${userId}/reviews`);
  return data;
};

export const submitReview = async (userId, payload) => {
  const { data } = await api.post(`/users/${userId}/reviews`, payload);
  return data;
};
