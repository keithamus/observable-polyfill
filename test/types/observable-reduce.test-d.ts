import { describe, it, expectTypeOf } from "vitest";
import { stringObservable } from "./__fixtures__";

describe("Observable.reduce", () => {
  describe("with no initial value", () => {
    it("requires a callback", () => {
      // @ts-expect-error
      expectTypeOf(stringObservable.reduce).toBeCallableWith();
      expectTypeOf(stringObservable.reduce).toBeCallableWith(
        (acc: string) => acc
      );
    });

    it("infers correct callback parameters", () => {
      stringObservable.reduce((acc, value, index) => {
        expectTypeOf(acc).toEqualTypeOf<string>();
        expectTypeOf(value).toEqualTypeOf<string>();
        expectTypeOf(index).toEqualTypeOf<number>();
        return acc;
      });
    });

    it("infers Promise type", () => {
      expectTypeOf(
        stringObservable.reduce((acc) => acc)
      ).resolves.toEqualTypeOf<string | undefined>();
    });
  });
  describe("with an initial value matching the Observable type", () => {
    it("requires a callback", () => {
      // @ts-expect-error
      expectTypeOf(stringObservable.reduce).toBeCallableWith();
      expectTypeOf(stringObservable.reduce).toBeCallableWith(
        (acc: string) => acc,
        ""
      );
    });

    it("infers correct callback parameters", () => {
      stringObservable.reduce((acc, value, index) => {
        expectTypeOf(acc).toEqualTypeOf<string>();
        expectTypeOf(value).toEqualTypeOf<string>();
        expectTypeOf(index).toEqualTypeOf<number>();
        return acc;
      }, "");
    });
    it("infers Promise type", () => {
      expectTypeOf(
        stringObservable.reduce((acc) => acc, "")
      ).resolves.toEqualTypeOf<string>();
    });
  });
  describe("with an initial value not matching the Observable type", () => {
    it("requires a callback", () => {
      // @ts-expect-error
      expectTypeOf(stringObservable.reduce).toBeCallableWith();
      expectTypeOf(stringObservable.reduce<number>).toBeCallableWith(
        (acc: number) => ++acc,
        0
      );
    });
    it("infers correct callback parameters", () => {
      stringObservable.reduce((acc, value, index) => {
        expectTypeOf(acc).toEqualTypeOf<number>();
        expectTypeOf(value).toEqualTypeOf<string>();
        expectTypeOf(index).toEqualTypeOf<number>();
        return ++acc;
      }, 0);
    });
    it("infers Promise type", () => {
      expectTypeOf(
        stringObservable.reduce((acc) => ++acc, 0)
      ).resolves.toEqualTypeOf<number>();
    });
  });
});
