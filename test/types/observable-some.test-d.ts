import { describe, it, expectTypeOf } from "vitest";
import { stringObservable, signal } from "./__fixtures__";

describe("Observable.some", () => {
  it("requires a callback, and an optional options object", () => {
    // @ts-expect-error
    expectTypeOf(stringObservable.some).toBeCallableWith();
    expectTypeOf(stringObservable.some).toBeCallableWith(() => {});
    expectTypeOf(stringObservable.some).toBeCallableWith(() => {}, {});
    expectTypeOf(stringObservable.some).toBeCallableWith(() => {}, {
      signal,
    });
  });

  it("returns a Promise<boolean>", () => {
    expectTypeOf(
      stringObservable.some(() => true)
    ).resolves.toEqualTypeOf<boolean>();
  });
});
