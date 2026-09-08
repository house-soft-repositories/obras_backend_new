import PageMetaParameters from '@/core/pagination/domain/entities/page_meta_parameters';

export default class PageMetaEntity {
  public readonly page: number;
  public readonly take: number;
  public readonly itemCount: number;
  public readonly pageCount: number;
  public readonly hasPreviousPage: boolean;
  public readonly hasNextPage: boolean;
  constructor({ pageOptions, itemCount }: PageMetaParameters) {
    this.page = pageOptions.page;
    this.take = pageOptions.take;
    this.itemCount = itemCount;
    this.pageCount = Math.ceil(this.itemCount / this.take);
    this.hasPreviousPage = this.page > 1;
    this.hasNextPage = this.page < this.pageCount;
  }
}
