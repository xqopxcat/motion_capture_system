import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "/api";

export const baseApi = createApi({
  reducerPath: "api",
  tagTypes: ["Annotations", "CurrentUser"],
  baseQuery: fetchBaseQuery({
    baseUrl: apiBaseUrl,
    credentials: "include",
  }),
  refetchOnMountOrArgChange: true,
  endpoints: () => ({}),
});
