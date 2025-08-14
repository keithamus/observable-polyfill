import { describe, it, expectTypeOf } from "vitest";
import { stringObservable, numberObservable, count } from "./__fixtures__";

describe("Observable.takeUntil", () => {
  it("requires an ObservableInput", () => {
    // @ts-expect-error
    expectTypeOf(stringObservable.takeUntil).toBeCallableWith();
    // @ts-expect-error
    expectTypeOf(stringObservable.takeUntil).toBeCallableWith(1);
    expectTypeOf(stringObservable.takeUntil).toBeCallableWith(numberObservable);
    expectTypeOf(stringObservable.takeUntil).toBeCallableWith(count());
    expectTypeOf(stringObservable.takeUntil).toBeCallableWith([1, 2, 3]);
    expectTypeOf(stringObservable.takeUntil).toBeCallableWith(
      Promise.resolve(1)
    );
  });

  it("infers Observable type", () => {
    expectTypeOf(stringObservable.takeUntil(numberObservable)).toEqualTypeOf<
      Observable<string>
    >();
  });
});
