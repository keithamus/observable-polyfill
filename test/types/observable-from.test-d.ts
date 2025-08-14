import { describe, it, test, expectTypeOf } from "vitest";
import { numberObservable, count } from "./__fixtures__";

describe("Observable.from", () => {
  it("requires an ObservableInput", () => {
    // @ts-expect-error
    expectTypeOf(Observable.from).toBeCallableWith();
    expectTypeOf(Observable.from).toBeCallableWith(numberObservable);
    expectTypeOf(Observable.from).toBeCallableWith(count());
    expectTypeOf(Observable.from).toBeCallableWith([1, 2, 3]);
    expectTypeOf(Observable.from).toBeCallableWith(Promise.resolve(1));
  });

  describe("it infers Observable type", () => {
    test("from an Observable", () => {
      expectTypeOf(Observable.from(numberObservable)).toEqualTypeOf<
        Observable<number>
      >();
    });

    test("from an AsyncIterable", () => {
      expectTypeOf(Observable.from(count())).toEqualTypeOf<
        Observable<number>
      >();
    });

    test("from an Iterable", () => {
      expectTypeOf(Observable.from([1, 2, 3])).toEqualTypeOf<
        Observable<number>
      >();
    });

    test("from a Promise", () => {
      expectTypeOf(Observable.from(Promise.resolve(1))).toEqualTypeOf<
        Observable<number>
      >();
    });
  });
});
