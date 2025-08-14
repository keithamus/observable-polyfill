import { describe, it, expectTypeOf } from "vitest";
import { stringObservable } from "./__fixtures__";

describe("Observable.map", () => {
  it("requires a callback", () => {
    // @ts-expect-error
    expectTypeOf(stringObservable.map).toBeCallableWith();
    expectTypeOf(stringObservable.map).toBeCallableWith(() => {});
  });

  it("infers correct callback parameters", () => {
    stringObservable.map((value, index) => {
      expectTypeOf(value).toEqualTypeOf<string>();
      expectTypeOf(index).toEqualTypeOf<number>();
    });
  });

  it("infers Observable type", () => {
    expectTypeOf(stringObservable.map(() => 2)).toEqualTypeOf<
      Observable<number>
    >();
  });
});
