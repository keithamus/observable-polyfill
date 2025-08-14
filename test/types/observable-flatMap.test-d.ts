import { describe, it, test, expectTypeOf } from "vitest";
import { count, numberObservable, stringObservable } from "./__fixtures__";

describe("Observable.flatMap", () => {
  it("requires a callback returning an ObservableInput", () => {
    // @ts-expect-error
    expectTypeOf(stringObservable.flatMap).toBeCallableWith();
    // @ts-expect-error
    expectTypeOf(stringObservable.flatMap).toBeCallableWith(() => {});
    // @ts-expect-error
    expectTypeOf(stringObservable.flatMap).toBeCallableWith(() => 1);
    expectTypeOf(stringObservable.flatMap).toBeCallableWith(
      () => numberObservable
    );
    expectTypeOf(stringObservable.flatMap).toBeCallableWith(() => count());
    expectTypeOf(stringObservable.flatMap).toBeCallableWith(() => [1, 2, 3]);
    expectTypeOf(stringObservable.flatMap).toBeCallableWith(() =>
      Promise.resolve(1)
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
