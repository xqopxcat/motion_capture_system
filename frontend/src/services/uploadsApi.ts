import { baseApi } from "./baseApi";
import type {
  ArtifactCompleteResponse,
  MetricsUploadCompleteRequest,
  MetricsUploadUrlRequest,
  PoseUploadCompleteRequest,
  PoseUploadUrlRequest,
  SignedUploadUrlResponse,
  ThumbnailUploadCompleteRequest,
  ThumbnailUploadUrlRequest,
  VideoUploadCompleteRequest,
  VideoUploadUrlRequest,
} from "../types";

export const uploadsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    completeMetricsUpload: builder.mutation<ArtifactCompleteResponse, MetricsUploadCompleteRequest>({
      query: (body) => ({
        body,
        method: "POST",
        url: "/uploads/metrics/complete",
      }),
    }),
    completePoseUpload: builder.mutation<ArtifactCompleteResponse, PoseUploadCompleteRequest>({
      query: (body) => ({
        body,
        method: "POST",
        url: "/uploads/pose/complete",
      }),
    }),
    completeThumbnailUpload: builder.mutation<
      ArtifactCompleteResponse,
      ThumbnailUploadCompleteRequest
    >({
      query: (body) => ({
        body,
        method: "POST",
        url: "/uploads/thumbnail/complete",
      }),
    }),
    completeVideoUpload: builder.mutation<ArtifactCompleteResponse, VideoUploadCompleteRequest>({
      query: (body) => ({
        body,
        method: "POST",
        url: "/uploads/video/complete",
      }),
    }),
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
  useCompleteMetricsUploadMutation,
  useCompletePoseUploadMutation,
  useCompleteThumbnailUploadMutation,
  useCompleteVideoUploadMutation,
  useRequestMetricsUploadUrlMutation,
  useRequestPoseUploadUrlMutation,
  useRequestThumbnailUploadUrlMutation,
  useRequestVideoUploadUrlMutation,
} = uploadsApi;
