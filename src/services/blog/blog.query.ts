import { ENDPOINTS } from "@/constants";
import { axiosInstance } from "@/lib/axios";
import i18n from "@/lib/i18n/i18n";
import type { IBlogDetail, IBlogListItem, IDjangoPaginated } from "@/types";
import { useQuery } from "@tanstack/react-query";

export const BLOG_KEYS = {
  list: (page: number, pageSize: number) => ["blog", "list", page, pageSize],
  detail: (guid: string | null) => ["blog", "detail", guid],
};

// Backend only has uz/ru translations — English omits `lang` and falls back
// to the default, same as the web project's useBlogListQuery/useBlogDetailQuery.
function blogLangParam(): string | undefined {
  return i18n.language === "uz" || i18n.language === "ru" ? i18n.language : undefined;
}

export const useBlogListQuery = (page: number, pageSize = 12) =>
  useQuery({
    queryKey: BLOG_KEYS.list(page, pageSize),
    queryFn: (): Promise<IDjangoPaginated<IBlogListItem>> =>
      axiosInstance
        .get<IDjangoPaginated<IBlogListItem>>(ENDPOINTS.BLOG.LIST, {
          params: { page, page_size: pageSize, lang: blogLangParam() },
        })
        .then((r) => r.data),
    placeholderData: (prev) => prev,
  });

export const useBlogDetailQuery = (guid: string | null) =>
  useQuery({
    queryKey: BLOG_KEYS.detail(guid),
    queryFn: (): Promise<IBlogDetail> =>
      axiosInstance
        .get<IBlogDetail>(ENDPOINTS.BLOG.DETAIL(guid as string), { params: { lang: blogLangParam() } })
        .then((r) => r.data),
    enabled: !!guid,
  });
