import { describe, it, expectTypeOf } from "vitest";
import { stringObservable } from "./__fixtures__";

describe("Observable.finally", () => {
  it("requires a callback", () => {
    // @ts-expect-error
    expectTypeOf(stringObservable.finally).toBeCallableWith();
    expectTypeOf(stringObservable.finally).toBeCallableWith(() => {});
  });

  it("infers Observable type", () => {
    expectTypeOf(stringObservable.finally(() => {})).toEqualTypeOf<
      Observable<string>
    >();
  });
});
