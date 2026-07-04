import { baseApi } from "./baseApi";
import type {
  MetricsUploadUrlRequest,
  PoseUploadUrlRequest,
  SignedUploadUrlResponse,
  ThumbnailUploadUrlRequest,
  VideoUploadUrlRequest,
} from "../types";

export const uploadsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    requestMetricsUploadUrl: builder.mutation<SignedUploadUrlResponse, MetricsUploadUrlRequest>({
      query: (body) => ({
        body,
        method: "POST",
        url: "/uploads/metrics",
      }),
    }),
    requestPoseUploadUrl: builder.mutation<SignedUploadUrlResponse, PoseUploadUrlRequest>({
      query: (body) => ({
        body,
        method: "POST",
        url: "/uploads/pose",
      }),
    }),
    requestThumbnailUploadUrl: builder.mutation<
      SignedUploadUrlResponse,
      ThumbnailUploadUrlRequest
    >({
      query: (body) => ({
        body,
        method: "POST",
        url: "/uploads/thumbnail",
      }),
    }),
    requestVideoUploadUrl: builder.mutation<SignedUploadUrlResponse, VideoUploadUrlRequest>({
      query: (body) => ({
        body,
        method: "POST",
        url: "/uploads/video",
      }),
    }),
  }),
});

export const {
  useRequestMetricsUploadUrlMutation,
  useRequestPoseUploadUrlMutation,
  useRequestThumbnailUploadUrlMutation,
  useRequestVideoUploadUrlMutation,
} = uploadsApi;
