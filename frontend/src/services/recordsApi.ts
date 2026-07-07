import { baseApi } from "./baseApi";
import type {
  CreateRecordRequest,
  CreateRecordResponse,
  FinalizeRecordRequest,
  FinalizeRecordResponse,
} from "../types";

export const recordsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createRecord: builder.mutation<CreateRecordResponse, CreateRecordRequest>({
      query: (body) => ({
        body,
        method: "POST",
        url: "/records",
      }),
    }),
    finalizeRecord: builder.mutation<FinalizeRecordResponse, FinalizeRecordRequest>({
      query: ({ recordId }) => ({
        method: "POST",
        url: `/records/${recordId}/complete`,
      }),
    }),
  }),
});

export const { useCreateRecordMutation, useFinalizeRecordMutation } = recordsApi;
