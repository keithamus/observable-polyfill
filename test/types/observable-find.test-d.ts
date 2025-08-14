import { describe, it, expectTypeOf } from "vitest";
import { stringObservable, isFoo } from "./__fixtures__";

describe("Observable.find", () => {
  it("requires a callback", () => {
    // @ts-expect-error
    expectTypeOf(stringObservable.find).toBeCallableWith();
    expectTypeOf(stringObservable.find).toBeCallableWith(() => {});
  });

  it("infers correct callback parameters", () => {
    stringObservable.find((value, index) => {
      expectTypeOf(value).toEqualTypeOf<string>();
      expectTypeOf(index).toEqualTypeOf<number>();
    });
  });

  it("infers Promise type", () => {
    expectTypeOf(stringObservable.find(() => true)).resolves.toEqualTypeOf<
      string | undefined
    >();
  });

  it("narrows Promise type when given a type predicate", () => {
    expectTypeOf(stringObservable.find(isFoo)).resolves.toEqualTypeOf<
      "foo" | undefined
    >();
  });
});
