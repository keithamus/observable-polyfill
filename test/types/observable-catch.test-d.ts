import { describe, it, test, expectTypeOf } from "vitest";
import { count, numberObservable, stringObservable } from "./__fixtures__";

describe("Observable.catch", () => {
  it("requires a callback", () => {
    // @ts-expect-error
    expectTypeOf(stringObservable.catch).toBeCallableWith();
    expectTypeOf(stringObservable.catch).toBeCallableWith(
      () => numberObservable
    );
  });

  it("infers correct callback parameters", () => {
    stringObservable.catch((error) => {
      expectTypeOf(error).toBeAny();
      return numberObservable;
    });
  });

  it("requires the callback to return an ObservableInput", () => {
    // @ts-expect-error
    expectTypeOf(stringObservable.catch).toBeCallableWith(() => {});
    // @ts-expect-error
    expectTypeOf(stringObservable.catch).toBeCallableWith(() => 1);
  });

  describe("it infers Observable type", () => {
    test("from an Observable", () => {
      expectTypeOf(
        stringObservable.catch(() => numberObservable)
      ).toEqualTypeOf<Observable<string | number>>();
    });

    test("from an AsyncIterable", () => {
      expectTypeOf(stringObservable.catch(() => count())).toEqualTypeOf<
        Observable<string | number>
      >();
    });

    test("from an Iterable", () => {
      expectTypeOf(stringObservable.catch(() => [1, 2, 3])).toEqualTypeOf<
        Observable<string | number>
      >();
    });
    test("from a Promise", () => {
      expectTypeOf(
        stringObservable.catch(() => Promise.resolve(1))
      ).toEqualTypeOf<Observable<string | number>>();
    });
  });
});
