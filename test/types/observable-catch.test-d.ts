import { describe, it, expectTypeOf } from "vitest";
import { stringObservable } from "./__fixtures__";

describe("Observable.catch", () => {
  it("requires a callback", () => {
    // @ts-expect-error
    expectTypeOf(stringObservable.catch).toBeCallableWith();
    expectTypeOf(stringObservable.catch).toBeCallableWith(() => {});
  });

  it("infers caught error type", () => {
    stringObservable.catch((error) => {
      expectTypeOf(error).toBeAny();
    });
  });

  it("infers new Observable type when returning a plain value", () => {
    expectTypeOf(stringObservable.catch(() => 2)).toEqualTypeOf<
      Observable<string | number>
    >();
  });

  it("infers new Observable type when returning an Observable", () => {
    expectTypeOf(
      stringObservable.catch(() => new Observable<number>(() => {}))
    ).toEqualTypeOf<Observable<string | number>>();
  });
});
