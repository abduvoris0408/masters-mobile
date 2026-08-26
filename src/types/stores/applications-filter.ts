export interface IApplicationsFilters {
  categoryIds: number[];
  region: number | null;
  district: number | null;
  priceMin: number | null;
  priceMax: number | null;
  dateFrom: string | null;
  dateTo: string | null;
  search: string;
}

export interface IApplicationsFilterStore {
  filters: IApplicationsFilters;
  setFilters: (filters: Partial<IApplicationsFilters>) => void;
  resetFilters: () => void;
}
