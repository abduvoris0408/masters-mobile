export interface IMastersCatalogFilters {
  categoryIds: number[];
  region: number | null;
  district: number | null;
  priceMin: number | null;
  priceMax: number | null;
  minRating: number | null;
  search: string;
}

export interface IMastersCatalogFilterStore {
  filters: IMastersCatalogFilters;
  setFilters: (filters: Partial<IMastersCatalogFilters>) => void;
  resetFilters: () => void;
}
