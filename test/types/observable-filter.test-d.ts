import { describe, it, expectTypeOf } from "vitest";
import { stringObservable, isFoo } from "./__fixtures__";

describe("Observable.filter", () => {
  it("requires a callback", () => {
    // @ts-expect-error
    expectTypeOf(stringObservable.filter).toBeCallableWith();
    expectTypeOf(stringObservable.filter).toBeCallableWith(() => {});
  });

  it("infers correct callback parameters", () => {
    stringObservable.filter((value, index) => {
      expectTypeOf(value).toEqualTypeOf<string>();
      expectTypeOf(index).toEqualTypeOf<number>();
    });
  });

  it("infers Observable type", () => {
    expectTypeOf(stringObservable.filter(() => true)).toEqualTypeOf<
      Observable<string>
    >();
  });

  it("narrows Observable type when given a type predicate", () => {
    expectTypeOf(stringObservable.filter(isFoo)).toEqualTypeOf<
      Observable<"foo">
    >();
  });
});
