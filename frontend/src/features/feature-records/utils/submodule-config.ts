import type { SubmoduleConfig } from '@/config/modules';
import type { FeatureRecordConfig } from '../types';

export const submoduleToFeatureConfig = (submodule: SubmoduleConfig): FeatureRecordConfig => ({
  id: submodule.id,
  title: submodule.label,
  description: submodule.description,
  apiPath: submodule.apiPath ?? '/student-achievements',
  route: submodule.route,
  searchPlaceholder: submodule.searchPlaceholder ?? `Search ${submodule.label.toLowerCase()}...`,
  columns: submodule.columns ?? [],
  listFilters: submodule.listFilters,
});
