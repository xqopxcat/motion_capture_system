import { baseApi } from "./baseApi";
import type { Annotation, CreateAnnotationRequest, ListAnnotationsResponse } from "../types";

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
    getAnnotations: builder.query<ListAnnotationsResponse, string>({
      providesTags: (_result, _error, recordId) => [{ id: recordId, type: "Annotations" }],
      query: (recordId) => `/records/${recordId}/annotations`,
    }),
  }),
});

export const { useCreateAnnotationMutation, useGetAnnotationsQuery } = annotationsApi;
