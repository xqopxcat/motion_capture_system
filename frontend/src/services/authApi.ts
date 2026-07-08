import { baseApi } from "./baseApi";
import type { CurrentUser, MockLoginRequest, MockLoginResponse } from "../types";

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCurrentUser: builder.query<CurrentUser, void>({
      query: () => "/me",
      providesTags: ["CurrentUser"],
    }),
    mockLogin: builder.mutation<MockLoginResponse, MockLoginRequest>({
      query: (body) => ({
        body,
        method: "POST",
        url: "/auth/mock-login",
      }),
      invalidatesTags: ["CurrentUser"],
    }),
  }),
});

export const { useGetCurrentUserQuery, useMockLoginMutation } = authApi;
