import { describe, it, expectTypeOf, test } from "vitest";
import { count, numberObservable, stringObservable } from "./__fixtures__";

describe("Observable.switchMap", () => {
  it("requires a callback", () => {
    // @ts-expect-error
    expectTypeOf(stringObservable.switchMap).toBeCallableWith();
    expectTypeOf(stringObservable.switchMap).toBeCallableWith(
      () => stringObservable
    );
  });

  it("infers correct callback parameters", () => {
    stringObservable.switchMap((value, index) => {
      expectTypeOf(value).toEqualTypeOf<string>();
      expectTypeOf(index).toEqualTypeOf<number>();

      return stringObservable;
    });
  });

  describe("it infers Observable type", () => {
    test("from an Observable", () => {
      expectTypeOf(
        stringObservable.switchMap(() => numberObservable)
      ).toEqualTypeOf<Observable<number>>();
    });

    test("from an AsyncIterable", () => {
      expectTypeOf(stringObservable.switchMap(() => count())).toEqualTypeOf<
        Observable<number>
      >();
    });

    test("from an Iterable", () => {
      expectTypeOf(stringObservable.switchMap(() => [1, 2, 3])).toEqualTypeOf<
        Observable<number>
      >();
    });

    test("from a Promise", () => {
      expectTypeOf(
        stringObservable.switchMap(() => Promise.resolve(1))
      ).toEqualTypeOf<Observable<number>>();
    });
  });
});
