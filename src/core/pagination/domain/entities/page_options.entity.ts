export default class PageOptionsEntity {
  public readonly order: 'ASC' | 'DESC';
  public readonly page: number;
  public readonly take: number;

  constructor(
    order: 'ASC' | 'DESC' = 'ASC',
    page: number = 1,
    take: number = 10,
  ) {
    this.order = order;
    this.page = page;
    this.take = take;
  }

  get skip() {
    return (this.page - 1) * this.take;
  }
}
