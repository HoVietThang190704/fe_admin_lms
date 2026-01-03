import type { Translator } from '@/lib/i18n';
import type { HomeClassSummary, HomeDashboardPayload } from './dashboard';
import type { LucideIcon } from 'lucide-react';
import { Activity, BarChart2, CalendarDays, CheckCircle2 } from 'lucide-react';

export type LearningRhythmSnapshot = {
  averageSessionsPerWeek: number;
  averageCompletedAssignments: number;
  activeLearners: number;
  backlogAssignments: number;
  growthPercentage: number;
  segments: Array<{
    id: string;
    label: string;
    course: string;
    instructor: string;
    sessionsPerWeek: number;
    progress: number;
    completedLessons: number;
    totalLessons: number;
  }>;
};

export type LearningReportCard = {
  id: string;
  label: string;
  value: string | number;
  description: string;
  icon: LucideIcon;
  trend?: {
    isPositive: boolean;
    delta: string;
    label: string;
  };
};

type NormalizeLearningRhythmOptions = {
  classes?: HomeClassSummary[];
};

export const normalizeLearningRhythm = (
  payload: HomeDashboardPayload | null,
  options?: NormalizeLearningRhythmOptions
): LearningRhythmSnapshot => {
  if (!payload) {
    return {
      averageSessionsPerWeek: 0,
      averageCompletedAssignments: 0,
      activeLearners: 0,
      backlogAssignments: 0,
      growthPercentage: 0,
      segments: []
    };
  }

  const classSource = options?.classes && options.classes.length ? options.classes : payload.classes;
  const classCount = classSource.length || 1;
  const assignmentCount = payload.assignments.length || 1;
  const averageSessionsPerWeek = Math.round(
    classSource.reduce((sum, clazz) => {
      const [completedLessons] = clazz.lessonProgress?.split('/')?.map((value) => Number(value)) ?? [0];
      return sum + (completedLessons || 0);
    }, 0) / classCount
  );
  const averageCompletedAssignments = Math.round(
    (payload.assignments.reduce((sum, assignment) => sum + (assignment.status === 'completed' ? 1 : 0), 0) / assignmentCount) * 100
  );
  const backlogAssignments = payload.assignments.filter((item) => item.status !== 'completed').length;
  const growthPercentage = Math.min(40, Math.max(5, Math.round((payload.stats.learningProgress || 0) / 2)));

  const segments = classSource.map((clazz) => {
    const [completedLessons, totalLessons] = clazz.lessonProgress?.split('/')?.map((value) => Number(value)) ?? [0, 0];
    const sessionsPerWeek = Math.max(1, Math.round((completedLessons || 1) / (totalLessons || 1) * 5));
    return {
      id: clazz.id,
      label: clazz.courseCode,
      course: clazz.courseName,
      instructor: clazz.instructor,
      sessionsPerWeek,
      progress: Math.round(clazz.progress ?? 0),
      completedLessons: completedLessons || 0,
      totalLessons: totalLessons || 0
    };
  });

  return {
    averageSessionsPerWeek,
    averageCompletedAssignments,
    activeLearners: payload.stats.enrolledCourses,
    backlogAssignments,
    growthPercentage,
    segments
  };
};

export const buildReportCards = (snapshot: LearningRhythmSnapshot, t: Translator): LearningReportCard[] => [
  {
    id: 'sessions',
    label: t('reports.cards.sessions.label'),
    value: snapshot.averageSessionsPerWeek,
    description: t('reports.cards.sessions.description'),
    icon: CalendarDays,
    trend: {
      isPositive: snapshot.growthPercentage >= 0,
      delta: `${snapshot.growthPercentage}%`,
      label: t('reports.cards.sessions.trend')
    }
  },
  {
    id: 'completion',
    label: t('reports.cards.completion.label'),
    value: `${snapshot.averageCompletedAssignments}%`,
    description: t('reports.cards.completion.description'),
    icon: CheckCircle2
  },
  {
    id: 'active',
    label: t('reports.cards.activeLearners.label'),
    value: snapshot.activeLearners,
    description: t('reports.cards.activeLearners.description'),
    icon: Activity
  },
  {
    id: 'backlog',
    label: t('reports.cards.backlog.label'),
    value: snapshot.backlogAssignments,
    description: t('reports.cards.backlog.description'),
    icon: BarChart2,
    trend: {
      isPositive: snapshot.backlogAssignments <= 5,
      delta: String(snapshot.backlogAssignments),
      label: t('reports.cards.backlog.trend')
    }
  }
];
