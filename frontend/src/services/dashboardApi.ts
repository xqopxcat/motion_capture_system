import type { DashboardSummaryResponse } from "../types";
import { baseApi } from "./baseApi";


export const dashboardApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDashboardSummary: builder.query<DashboardSummaryResponse, void>({
      query: () => "/dashboard/summary",
    }),
  }),
});


export const { useGetDashboardSummaryQuery } = dashboardApi;
