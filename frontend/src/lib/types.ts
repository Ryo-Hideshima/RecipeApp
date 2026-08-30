// バックエンド API (Laravel) のレスポンス型。

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  bio: string | null;
  avatar_path: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface UserSummary {
  id: number;
  name: string;
  avatar_path: string | null;
  avatar_url: string | null;
  following_count?: number;
  followers_count?: number;
  is_following?: boolean;
}

export interface Profile {
  id: number;
  name: string;
  bio: string | null;
  avatar_path: string | null;
  avatar_url: string | null;
  recipes_count: number;
  following_count: number;
  followers_count: number;
  is_following?: boolean;
  is_me: boolean;
  created_at: string;
}

export interface Category {
  id: number;
  name: string;
}

export interface RecipeIngredient {
  name: string;
  quantity: string | null;
}

export interface RecipeStep {
  step_number: number;
  description: string;
}

export interface RecipeImage {
  id: number;
  path: string;
  url: string | null;
}

export interface Recipe {
  id: number;
  title: string;
  user?: UserSummary;
  ingredients?: RecipeIngredient[];
  steps?: RecipeStep[];
  images?: RecipeImage[];
  categories?: Category[];
  favorites_count?: number;
  comments_count?: number;
  is_favorited?: boolean;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: number;
  content: string;
  user?: UserSummary;
  created_at: string;
}

export interface PaginationLinks {
  first: string | null;
  last: string | null;
  prev: string | null;
  next: string | null;
}

export interface PaginationMeta {
  current_page: number;
  from: number | null;
  last_page: number;
  path: string;
  per_page: number;
  to: number | null;
  total: number;
}

export interface Paginated<T> {
  data: T[];
  links: PaginationLinks;
  meta: PaginationMeta;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}
