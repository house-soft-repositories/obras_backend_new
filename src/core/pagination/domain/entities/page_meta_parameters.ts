import PageOptionsEntity from '@/core/pagination/domain/entities/page_options.entity';

export default interface PageMetaParameters {
  pageOptions: PageOptionsEntity;
  itemCount: number;
}
