import { describe, it, expectTypeOf } from "vitest";
import { stringObservable, numberObservable } from "./__fixtures__";

describe("Observable.takeUntil", () => {
  it("requires an Observable", () => {
    // @ts-expect-error
    expectTypeOf(stringObservable.takeUntil).toBeCallableWith();
    expectTypeOf(stringObservable.takeUntil).toBeCallableWith(numberObservable);
  });

  it("infers Observable type", () => {
    expectTypeOf(stringObservable.takeUntil(numberObservable)).toEqualTypeOf<
      Observable<string>
    >();
  });
});
