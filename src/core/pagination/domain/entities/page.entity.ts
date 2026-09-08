import PageMetaEntity from '@/core/pagination/domain/entities/page_meta.entity';

export default class PageEntity<T> {
  constructor(
    private readonly data: T[],
    private readonly meta: PageMetaEntity,
  ) {}

  get pageData() {
    return this.data;
  }
  get pageMeta() {
    return this.meta;
  }

  toObject() {
    return {
      data: this.data.map((item) => {
        if (
          item !== null &&
          typeof item === 'object' &&
          'toObject' in item &&
          typeof item.toObject === 'function'
        ) {
          return item.toObject();
        }
        return item;
      }),
      meta: this.meta,
    };
  }
}
