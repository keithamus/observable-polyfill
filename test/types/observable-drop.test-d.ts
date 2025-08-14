import { describe, it, expectTypeOf } from "vitest";
import { stringObservable } from "./__fixtures__";

describe("Observable.drop", () => {
  it("requires a number", () => {
    // @ts-expect-error
    expectTypeOf(stringObservable.drop).toBeCallableWith();
    expectTypeOf(stringObservable.drop).toBeCallableWith(1);
  });

  it("infers Observable type", () => {
    expectTypeOf(stringObservable.drop(1)).toEqualTypeOf<Observable<string>>();
  });
});
