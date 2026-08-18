export type UploadedMediaInput = {
  key: string;
  originalName: string;
  mimeType: string;
  size: number;
  type: 'IMAGE' | 'VIDEO';
};

export type MultipartPart = {
  partNumber: number;
  etag: string;
};
