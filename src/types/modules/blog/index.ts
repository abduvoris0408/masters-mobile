export interface IBlogListItem {
  id: number;
  guid: string;
  title: string;
  description: string;
  image: string;
  created_at: string;
}

export type EBlogContentBlockType = "text" | "image" | "video";

export interface IBlogContentBlock {
  id: number;
  guid: string;
  type: EBlogContentBlockType;
  order: number;
  text: string;
  image: string | null;
  video: string | null;
}

export interface IBlogDetail {
  id: number;
  guid: string;
  title: string;
  description: string;
  image: string;
  contents: IBlogContentBlock[];
  created_at: string;
}
