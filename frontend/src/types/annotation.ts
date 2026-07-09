export type Annotation = {
  annotationId: string;
  recordId: string;
  frameIndex: number;
  timestamp: number;
  title: string;
  note: string;
  authorUserId: string;
  createdAt: string;
  updatedAt: string;
};

export type ListAnnotationsResponse = {
  items: Annotation[];
  total: number;
};

export type CreateAnnotationRequest = {
  recordId: string;
  frameIndex: number;
  timestamp: number;
  title: string;
  note: string;
};

export type UpdateAnnotationRequest = {
  annotationId: string;
  recordId: string;
  title?: string;
  note?: string;
};

export type DeleteAnnotationRequest = {
  annotationId: string;
  recordId: string;
};
