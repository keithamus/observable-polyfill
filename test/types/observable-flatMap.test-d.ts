import { describe, it, test, expectTypeOf } from "vitest";
import { count, numberObservable, stringObservable } from "./__fixtures__";

describe("Observable.flatMap", () => {
  it("requires a callback", () => {
    // @ts-expect-error
    expectTypeOf(stringObservable.flatMap).toBeCallableWith();
    expectTypeOf(stringObservable.flatMap).toBeCallableWith(
      () => stringObservable
    );
  });

  it("infers correct callback parameters", () => {
    stringObservable.flatMap((value, index) => {
      expectTypeOf(value).toEqualTypeOf<string>();
      expectTypeOf(index).toEqualTypeOf<number>();

      return stringObservable;
    });
  });

  describe("it infers Observable type", () => {
    test("from an Observable", () => {
      expectTypeOf(
        stringObservable.flatMap(() => numberObservable)
      ).toEqualTypeOf<Observable<number>>();
    });

    test("from an AsyncIterable", () => {
      expectTypeOf(stringObservable.flatMap(() => count())).toEqualTypeOf<
        Observable<number>
      >();
    });

    test("from an Iterable", () => {
      expectTypeOf(stringObservable.flatMap(() => [1, 2, 3])).toEqualTypeOf<
        Observable<number>
      >();
    });

    test("from a Promise", () => {
      expectTypeOf(
        stringObservable.flatMap(() => Promise.resolve(1))
      ).toEqualTypeOf<Observable<number>>();
    });
  });
});
