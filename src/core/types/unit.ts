const KEY = Symbol('unit');

export type Unit = typeof KEY;

export const unit: Unit = KEY;
