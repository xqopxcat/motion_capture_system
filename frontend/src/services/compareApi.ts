import { baseApi } from "./baseApi";
import type { CompareApiParams, CompareDataResponse } from "../types";

export const compareApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCompareData: builder.query<CompareDataResponse, CompareApiParams>({
      query: ({ recordA, recordB }) => ({
        params: {
          recordA,
          recordB,
        },
        url: "/compare",
      }),
    }),
  }),
});

export const { useGetCompareDataQuery } = compareApi;
