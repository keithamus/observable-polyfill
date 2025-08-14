import { describe, it, expectTypeOf } from "vitest";

describe("Observable.catch", () => {
  const baseObservable = new Observable<string>(() => {});

  it("infers new Observable type when returning a plain value", () => {
    expectTypeOf(baseObservable.catch(() => 2)).toEqualTypeOf<
      Observable<string | number>
    >();
  });

  it("infers new Observable type when returning an Observable", () => {
    expectTypeOf(
      baseObservable.catch(() => new Observable<number>(() => {}))
    ).toEqualTypeOf<Observable<string | number>>();
  });
});
