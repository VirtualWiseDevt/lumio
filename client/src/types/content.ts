export type ContentType = "MOVIE" | "SERIES" | "DOCUMENTARY" | "CHANNEL";

export interface Content {
  id: string;
  type: ContentType;
  title: string;
  description: string | null;
  releaseYear: number | null;
  duration: number | null;
  ageRating: string | null;
  quality: string | null;
  categories: string[];
  cast: string[];
  director: string | null;
  posterPortrait: string | null;
  posterLandscape: string | null;
  trailerUrl: string | null;
  streamUrl: string | null;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Season {
  id: string;
  contentId: string;
  number: number;
  title: string | null;
  episodes: Episode[];
}

export interface Episode {
  id: string;
  seasonId: string;
  number: number;
  title: string;
  description: string | null;
  duration: number | null;
  videoUrl: string | null;
  thumbnail: string | null;
}

export interface ContentDetail extends Content {
  seasons?: Season[];
}

export interface BrowseRow {
  title: string;
  slug: string;
  items: Content[];
}

export interface BrowsePageData {
  featured: Content[];
  rows: BrowseRow[];
}

export interface LiveTvData {
  categories: {
    name: string;
    channels: Content[];
  }[];
}

export interface SearchResults {
  movies: Content[];
  series: Content[];
  documentaries: Content[];
  channels: Content[];
}
