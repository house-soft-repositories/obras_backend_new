export { default as PageEntity } from '@/core/pagination/domain/entities/page.entity';
export { default as PageMetaEntity } from '@/core/pagination/domain/entities/page_meta.entity';
export { default as PageOptionsEntity } from '@/core/pagination/domain/entities/page_options.entity';
export type PageMetaParametersEntity =
  import('@/core/pagination/domain/entities/page_meta_parameters').default;

export interface PageOptions {
  page: number;
  limit: number;
}

export interface PageResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages?: number;
}
