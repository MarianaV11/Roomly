import Axios, { AxiosError } from "axios";

import { BASE_URL } from "@/services/env.service";
import { useAuth } from "@/store/auth.store";

export class ApiError extends Error {
  constructor(
    public readonly status: number | undefined,
    message: string,
  ) {
    super(message);
  }
}

type FastApiDetail = string | { msg: string }[] | undefined;

function describe(error: AxiosError<{ detail?: FastApiDetail }>): string {
  const detail = error.response?.data?.detail;

  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) return detail.map((d) => d.msg).join("; ");
  if (!error.response) return "Não foi possível falar com o servidor.";
  return error.message;
}

const axios = Axios.create({
  baseURL: `${BASE_URL}/api`,
  timeout: 90000,
  headers: { "Content-Type": "application/json" },
});

axios.interceptors.request.use((config) => {
  const { token } = useAuth.getState();

  if (token) config.headers.Authorization = `Bearer ${token}`;

  return config;
});

axios.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ detail?: FastApiDetail }>) => {
    if (error.response?.status === 401 && error.config?.headers?.Authorization) {
      useAuth.getState().clearAuth();
    }

    return Promise.reject(new ApiError(error.response?.status, describe(error)));
  },
);

export default axios;
