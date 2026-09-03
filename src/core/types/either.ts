export type Either<L extends Error, R> = Left<L, R> | Right<L, R>;

export class Left<L extends Error, R> {
  value: L;

  constructor(value: L) {
    this.value = value;
  }

  isRight(): this is Right<L, R> {
    return false;
  }

  isLeft(): this is Left<L, R> {
    return true;
  }

  getOrThrow(): never {
    throw this.value;
  }

  get isSuccess(): boolean {
    return false;
  }

  get isFailure(): boolean {
    return true;
  }

  get asSuccess(): null {
    return null;
  }

  get asFailure(): Left<L, R> {
    return this;
  }

  when<W>({
    onSuccess,
    onFailure,
  }: {
    onSuccess: (value: R) => W;
    onFailure: (exception: L) => W;
  }): W {
    void onSuccess;
    return onFailure(this.value);
  }

  map<T>(fn: (value: R) => T): Either<L, T> {
    void fn;
    return new Left<L, T>(this.value);
  }

  onFailure(onFailure: (failure: L) => void): Either<L, R> {
    onFailure(this.value);
    return this;
  }

  onSuccess(_onSuccess: (success: R) => void): Either<L, R> {
    void _onSuccess;
    return this;
  }
}

export class Right<L extends Error, R> {
  value: R;

  constructor(value: R) {
    this.value = value;
  }

  isRight(): this is Right<L, R> {
    return true;
  }

  isLeft(): this is Left<L, R> {
    return false;
  }

  getOrThrow(): R {
    return this.value;
  }

  when<W>({
    onSuccess,
    onFailure: _onFailure,
  }: {
    onSuccess: (value: R) => W;
    onFailure: (exception: L) => W;
  }): W {
    void _onFailure;
    return onSuccess(this.value);
  }

  map<T>(fn: (value: R) => T): Either<L, T> {
    return new Right<L, T>(fn(this.value));
  }

  onFailure(_onFailure: (failure: L) => void): Either<L, R> {
    void _onFailure;
    return this;
  }

  onSuccess(onSuccess: (success: R) => void): Either<L, R> {
    onSuccess(this.value);
    return this;
  }
}

export const left = <L extends Error, R>(value: L): Either<L, R> => new Left<L, R>(value);
export const right = <L extends Error, R>(value: R): Either<L, R> => new Right<L, R>(value);
