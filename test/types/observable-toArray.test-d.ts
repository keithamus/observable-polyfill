import { describe, it, expectTypeOf } from "vitest";
import { stringObservable, signal } from "./__fixtures__";

describe("Observable.toArray", () => {
  it("accepts an optional options object", () => {
    expectTypeOf(stringObservable.toArray).toBeCallableWith();
    expectTypeOf(stringObservable.toArray).toBeCallableWith({});
    expectTypeOf(stringObservable.toArray).toBeCallableWith({ signal });
  });

  it("infers Promise type", () => {
    expectTypeOf(stringObservable.toArray()).resolves.toEqualTypeOf<string[]>();
  });
});
