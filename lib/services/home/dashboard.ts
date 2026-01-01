import { INTERNAL_API_ENDPOINTS } from '@/lib/shared/constants/endpoints';
import { ApiError } from '@/lib/shared/utils/api';

export type HomeClassSummary = {
  id: string;
  courseCode: string;
  courseName: string;
  instructor: string;
  progress: number;
  schedule: string;
  room: string;
  lessonProgress: string;
};

export type HomeAssignmentSummary = {
  id: string;
  title: string;
  courseCode: string;
  deadline: string;
  status: 'pending' | 'in-progress' | 'completed';
};

export type HomeNotificationSummary = {
  id: string;
  title: string;
  description: string;
  time: string;
};

export type HomeStatsPayload = {
  enrolledCourses: number;
  pendingAssignments: number;
  averageGrade: string;
  learningProgress: number;
};

export type HomeUserProfile = {
  name: string;
};

export type HomeCourseSummary = {
  id: string;
  code: string;
  name: string;
  description?: string;
  tags?: string[];
  status?: 'active' | 'archived';
  image?: string;
  instructor: string;
  schedule: string;
  room: string;
  credits: number;
  enrolled: number;
  capacity: number;
  isEnrolled?: boolean;
};

export type HomeDashboardPayload = {
  user: HomeUserProfile;
  stats: HomeStatsPayload;
  classes: HomeClassSummary[];
  assignments: HomeAssignmentSummary[];
  notifications: HomeNotificationSummary[];
  courses: HomeCourseSummary[];
};

type FetchDashboardSummaryOptions = {
  baseUrl?: string;
};

const isAbsoluteUrl = (value: string) => /^https?:\/\//.test(value);

const trimTrailingSlash = (value: string) => value.replace(/\/$/, '');

const resolveBaseUrl = (baseUrl?: string) => {
  if (baseUrl) {
    return trimTrailingSlash(baseUrl);
  }

  if (process.env.NEXT_PUBLIC_APP_URL) {
    return trimTrailingSlash(process.env.NEXT_PUBLIC_APP_URL);
  }

  if (process.env.NEXTAUTH_URL) {
    return trimTrailingSlash(process.env.NEXTAUTH_URL);
  }

  if (process.env.VERCEL_URL) {
    return `https://${trimTrailingSlash(process.env.VERCEL_URL)}`;
  }

  return 'http://localhost:3000';
};

const resolveInternalApiUrl = (path: string, baseUrl?: string) => {
  if (typeof window !== 'undefined' || isAbsoluteUrl(path)) {
    return path;
  }

  const normalizedBase = resolveBaseUrl(baseUrl);
  return new URL(path, `${normalizedBase}/`).toString();
};

export const fetchDashboardSummary = async (options?: FetchDashboardSummaryOptions): Promise<HomeDashboardPayload> => {
  const endpoint = resolveInternalApiUrl(INTERNAL_API_ENDPOINTS.HOME.DASHBOARD, options?.baseUrl);

  const response = await fetch(endpoint, {
    method: 'GET',
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  let data: unknown;

  try {
    data = await response.json();
  } catch {
    data = undefined;
  }

  if (!response.ok) {
    const message = (data as { message?: string })?.message || 'Unable to load dashboard data';
    throw new ApiError(message, response.status, data);
  }

  return data as HomeDashboardPayload;
};
