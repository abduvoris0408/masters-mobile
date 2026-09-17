import { ENDPOINTS } from "@/constants";
import { axiosInstance } from "@/lib/axios";
import type {
  ICreateCourseCompletionResponse,
  ICreateLessonProgressResponse,
  IDjangoPaginated,
  IMandatoryCourseDetail,
  IMandatoryCourseListItem,
} from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const MANDATORY_COURSES_KEYS = {
  list: (page: number, pageSize: number) => ["mandatory-courses", "list", page, pageSize],
  detail: (guid: string | null) => ["mandatory-courses", "detail", guid],
};

export const useMandatoryCoursesQuery = (page: number, pageSize = 12) =>
  useQuery({
    queryKey: MANDATORY_COURSES_KEYS.list(page, pageSize),
    queryFn: (): Promise<IDjangoPaginated<IMandatoryCourseListItem>> =>
      axiosInstance
        .get<IDjangoPaginated<IMandatoryCourseListItem>>(ENDPOINTS.MANDATORY_COURSES.LIST, {
          params: { page, page_size: pageSize },
        })
        .then((r) => r.data),
    placeholderData: (prev) => prev,
  });

export const useMandatoryCourseDetailQuery = (guid: string | null) =>
  useQuery({
    queryKey: MANDATORY_COURSES_KEYS.detail(guid),
    queryFn: (): Promise<IMandatoryCourseDetail> =>
      axiosInstance.get<IMandatoryCourseDetail>(ENDPOINTS.MANDATORY_COURSES.DETAIL(guid as string)).then((r) => r.data),
    enabled: !!guid,
  });

export const useCreateLessonProgressMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { lesson: number }): Promise<ICreateLessonProgressResponse> =>
      axiosInstance.post(ENDPOINTS.MANDATORY_COURSES.LESSON_PROGRESS_CREATE, payload).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mandatory-courses", "detail"] });
    },
  });
};

export const useCreateCourseCompletionMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { course: number }): Promise<ICreateCourseCompletionResponse> =>
      axiosInstance.post(ENDPOINTS.MANDATORY_COURSES.COMPLETION_CREATE, payload).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mandatory-courses", "list"] });
    },
  });
};
