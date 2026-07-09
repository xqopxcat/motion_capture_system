import { baseApi } from "./baseApi";
import type {
  Annotation,
  CreateAnnotationRequest,
  DeleteAnnotationRequest,
  ListAnnotationsResponse,
  UpdateAnnotationRequest,
} from "../types";

export const annotationsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createAnnotation: builder.mutation<Annotation, CreateAnnotationRequest>({
      invalidatesTags: (_result, _error, { recordId }) => [
        { id: recordId, type: "Annotations" },
      ],
      query: ({ recordId, ...body }) => ({
        body,
        method: "POST",
        url: `/records/${recordId}/annotations`,
      }),
    }),
    deleteAnnotation: builder.mutation<void, DeleteAnnotationRequest>({
      invalidatesTags: (_result, _error, { recordId }) => [
        { id: recordId, type: "Annotations" },
      ],
      query: ({ annotationId, recordId }) => ({
        method: "DELETE",
        url: `/records/${recordId}/annotations/${annotationId}`,
      }),
    }),
    getAnnotations: builder.query<ListAnnotationsResponse, string>({
      providesTags: (_result, _error, recordId) => [{ id: recordId, type: "Annotations" }],
      query: (recordId) => `/records/${recordId}/annotations`,
    }),
    updateAnnotation: builder.mutation<Annotation, UpdateAnnotationRequest>({
      invalidatesTags: (_result, _error, { recordId }) => [
        { id: recordId, type: "Annotations" },
      ],
      query: ({ annotationId, recordId, ...body }) => ({
        body,
        method: "PATCH",
        url: `/records/${recordId}/annotations/${annotationId}`,
      }),
    }),
  }),
});

export const {
  useCreateAnnotationMutation,
  useDeleteAnnotationMutation,
  useGetAnnotationsQuery,
  useUpdateAnnotationMutation,
} = annotationsApi;
