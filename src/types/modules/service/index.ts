import type { IBase, TLocalizedName } from "@/types/general";

export interface IService extends IBase {
  name: TLocalizedName;
  description?: TLocalizedName;
  category_id: number;
  category?: import("../worker").ICategory;
  icon?: string;
  price_from?: number;
  price_to?: number;
  is_active: boolean;
}
