import { baseApi } from "./baseApi";
import type {
  CreateRecordRequest,
  CreateRecordResponse,
  FinalizeRecordRequest,
  FinalizeRecordResponse,
  ListRecordsResponse,
  RecordDetail,
  RetryRecordResponse,
  DeleteRecordResponse,
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
    retryRecord: builder.mutation<RetryRecordResponse, string>({
      query: (recordId) => ({
        method: "POST",
        url: `/records/${recordId}/retry`,
      }),
    }),
    deleteRecord: builder.mutation<DeleteRecordResponse, string>({
      query: (recordId) => ({
        method: "DELETE",
        url: `/records/${recordId}`,
      }),
    }),
    getRecordDetail: builder.query<RecordDetail, string>({
      query: (recordId) => `/records/${recordId}`,
    }),
    getRecords: builder.query<ListRecordsResponse, void>({
      query: () => "/records",
    }),
  }),
});

export const {
  useCreateRecordMutation,
  useFinalizeRecordMutation,
  useRetryRecordMutation,
  useDeleteRecordMutation,
  useGetRecordDetailQuery,
  useGetRecordsQuery,
} = recordsApi;
