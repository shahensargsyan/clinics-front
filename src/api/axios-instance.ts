import Axios, { type AxiosError, type AxiosRequestConfig } from 'axios';
import { message } from 'antd';
import { tokenStorage } from './token-storage';

export const AXIOS_INSTANCE = Axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

AXIOS_INSTANCE.interceptors.request.use((config) => {
  const token = tokenStorage.get();
  if (token && !config.url?.includes('/auth/login')) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

AXIOS_INSTANCE.interceptors.response.use(
  (r) => r,
  (error: AxiosError) => {
    if (
      error.response?.status === 401 &&
      !window.location.pathname.startsWith('/login')
    ) {
      tokenStorage.clear();
      message.warning('Session expired. Please sign in again.');
      window.location.assign(
        `/login?returnUrl=${encodeURIComponent(window.location.pathname)}`,
      );
    }
    return Promise.reject(error); // 422 handled on forms; 5xx can be added here
  },
);

export const customInstance = <T>(
  config: AxiosRequestConfig,
  options?: AxiosRequestConfig,
): Promise<T> => {
  const source = Axios.CancelToken.source();
  const promise = AXIOS_INSTANCE({
    ...config,
    ...options,
    cancelToken: source.token,
  }).then(({ data }) => data);
  // @ts-expect-error attach cancel for React Query
  promise.cancel = () => source.cancel('cancelled');
  return promise;
};
