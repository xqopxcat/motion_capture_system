import { baseApi } from "./baseApi";
import type { MockLoginRequest, MockLoginResponse } from "../types";

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    mockLogin: builder.mutation<MockLoginResponse, MockLoginRequest>({
      query: (body) => ({
        body,
        method: "POST",
        url: "/auth/mock-login",
      }),
    }),
  }),
});

export const { useMockLoginMutation } = authApi;
