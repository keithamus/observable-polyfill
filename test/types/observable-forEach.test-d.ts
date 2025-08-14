import { describe, it, expectTypeOf } from "vitest";
import { stringObservable, signal } from "./__fixtures__";

describe("Observable.forEach", () => {
  it("requires a callback, and an optional options object", () => {
    // @ts-expect-error
    expectTypeOf(stringObservable.forEach).toBeCallableWith();
    expectTypeOf(stringObservable.forEach).toBeCallableWith(() => {});
    expectTypeOf(stringObservable.forEach).toBeCallableWith(() => {}, {});
    expectTypeOf(stringObservable.forEach).toBeCallableWith(() => {}, {
      signal,
    });
  });

  it("infers correct callback parameters", () => {
    stringObservable.forEach((value, index) => {
      expectTypeOf(value).toEqualTypeOf<string>();
      expectTypeOf(index).toEqualTypeOf<number>();
    });
  });
});
