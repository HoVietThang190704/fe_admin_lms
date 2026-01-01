export const INTERNAL_API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/api/auth/login",
    REGISTER: "/api/auth/register",
    REFRESH_TOKEN: "/api/auth/refresh-token",
    CHANGE_PASSWORD: "/api/auth/change-password",
    FORGOT_PASSWORD: "/api/auth/forgot-password",
    RESET_PASSWORD: "/api/auth/reset-password",
  },
  COURSE: {
    GET_PUBLIC: "/api/courses/public",
    GET_DETAIL: "/api/courses/{id}",
    CREATE: "/api/courses",
    UPDATE: "/api/courses/{id}",
    DELETE: "/api/courses/{id}",
  },
  CATEGORY: {
    GET_CATEGORIES: "/api/category/get-categories",
    GET_USER_CATEGORIES: "/api/category/get-user-categories",
    GET_USER_TARGET_CATEGORIES: "/api/category/get-user-target-categories",
  },
  SEARCH: {
    SEARCH_BY_TYPE: "/api/search/search-by-type",
  },
  CONTENTFUL: {
    GET_FEEDBACK: "/api/feedback",
    GET_HERO_BANNER: "/api/hero-banner",
    GET_HOME_BANNERS: "/api/home-banners",
  },
};

export const EXTERNAL_API_ENDPOINTS = {
  AUTH: {
    LOGIN: "auth/login",
    REGISTER: "auth/register",
    REFRESH_TOKEN: "auth/refresh-token",
    CHANGE_PASSWORD: "auth/change-password",
    FORGOT_PASSWORD: "auth/forgot-password",
    RESET_PASSWORD: "auth/reset-password",
  },
  COURSE: {
    GET_PUBLIC: "courses/public",
    GET_DETAIL: "courses/{id}",
  },
  CATEGORY: {
    GET_CATEGORIES: "category/get-categories",
  },
  SEARCH: {
    SEARCH_BY_TYPE: "search/search-by-type",
  },
};

export const API_QUERY_PARAMS = {
  KEYWORD: 'keyword',
  PAGE: 'page',
  LIMIT: 'limit',
} as const;

export type ApiQueryParams = (typeof API_QUERY_PARAMS)[keyof typeof API_QUERY_PARAMS];
