import { describe, it, expectTypeOf } from "vitest";
import { stringObservable } from "./__fixtures__";

describe("Observable.take", () => {
  it("requires a number", () => {
    // @ts-expect-error
    expectTypeOf(stringObservable.take).toBeCallableWith();
    expectTypeOf(stringObservable.take).toBeCallableWith(1);
  });

  it("infers Observable type", () => {
    expectTypeOf(stringObservable.take(1)).toEqualTypeOf<Observable<string>>();
  });
});
