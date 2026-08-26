// A single image attached to a portfolio work. `image` is the served URL.
export interface IPortfolioImage {
  id: number;
  guid: string;
  image: string;
}

// One portfolio work: a description plus its gallery of images.
export interface IPortfolioWork {
  id: number;
  guid: string;
  description: string;
  images: IPortfolioImage[];
  created_at: string;
}

// Create sends multipart form-data: `description` + a repeated `images` field
// (one entry per file). Handled in the mutation, not serialised as JSON.
export interface IPortfolioCreateRequest {
  description: string;
  images: File[];
}

// Update (PUT/PATCH) can change the text, append `new_images`, and drop existing
// images by their id via `remove_image_ids` — all in one multipart request.
export interface IPortfolioUpdateRequest {
  description?: string;
  new_images?: File[];
  remove_image_ids?: number[];
}
