import { describe, it, expectTypeOf } from "vitest";
import { stringObservable, signal } from "./__fixtures__";

describe("Observable.last", () => {
  it("accepts an optional options object", () => {
    expectTypeOf(stringObservable.last).toBeCallableWith();
    expectTypeOf(stringObservable.last).toBeCallableWith({});
    expectTypeOf(stringObservable.last).toBeCallableWith({ signal });
  });

  it("infers Promise type", () => {
    expectTypeOf(stringObservable.last()).resolves.toEqualTypeOf<string>();
  });
});
