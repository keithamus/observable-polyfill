import { describe, it, expectTypeOf } from "vitest";
import { stringObservable, signal } from "./__fixtures__";

describe("Observable.every", () => {
  it("requires a callback, and an optional options object", () => {
    // @ts-expect-error
    expectTypeOf(stringObservable.every).toBeCallableWith();
    expectTypeOf(stringObservable.every).toBeCallableWith(() => {});
    expectTypeOf(stringObservable.every).toBeCallableWith(() => {}, {});
    expectTypeOf(stringObservable.every).toBeCallableWith(() => {}, {
      signal,
    });
  });

  it("returns a Promise<boolean>", () => {
    expectTypeOf(
      stringObservable.every(() => true)
    ).resolves.toEqualTypeOf<boolean>();
  });
});
