import api from "./api";

export const sendMessage = async (payload) => {
  const { data } = await api.post("/chat/message", payload);
  return data;
};

export const getConversation = async (userId) => {
  const { data } = await api.get(`/chat/${userId}`);
  return data;
};

export const sendCallSignal = async (payload) => {
  const { data } = await api.post("/call/signal", payload);
  return data;
};

export const getCallSignals = async (userId) => {
  const { data } = await api.get(`/call/signals/${userId}`);
  return data;
};
