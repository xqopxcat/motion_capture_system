import { baseApi } from "./baseApi";
import type { CreateRecordRequest, CreateRecordResponse } from "../types";

export const recordsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createRecord: builder.mutation<CreateRecordResponse, CreateRecordRequest>({
      query: (body) => ({
        body,
        method: "POST",
        url: "/records",
      }),
    }),
  }),
});

export const { useCreateRecordMutation } = recordsApi;
