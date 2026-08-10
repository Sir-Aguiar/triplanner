/** Resposta do PATCH /trips/:tripId/cover (multipart field: `file`). */
export type UploadTripCoverResponseDto = {
  coverImage?: string;
  trip?: {
    coverImage?: string;
  };
};
