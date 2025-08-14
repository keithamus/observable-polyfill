import { describe, it, expectTypeOf } from "vitest";
import { stringObservable, signal } from "./__fixtures__";

describe("Observable.first", () => {
  it("accepts an optional options object", () => {
    expectTypeOf(stringObservable.first).toBeCallableWith();
    expectTypeOf(stringObservable.first).toBeCallableWith({});
    expectTypeOf(stringObservable.first).toBeCallableWith({ signal });
  });

  it("infers Promise type", () => {
    expectTypeOf(stringObservable.first()).resolves.toEqualTypeOf<string>();
  });
});
