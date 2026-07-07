import { baseApi } from "./baseApi";
import type {
  CreateRecordRequest,
  CreateRecordResponse,
  FinalizeRecordRequest,
  FinalizeRecordResponse,
  ListRecordsResponse,
  RecordDetail,
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
  useGetRecordDetailQuery,
  useGetRecordsQuery,
} = recordsApi;
