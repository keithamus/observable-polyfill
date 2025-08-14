import { describe, it, expectTypeOf } from "vitest";
import { stringObservable } from "./__fixtures__";

describe("Observable.inspect", () => {
  it("receives an optional observer or callback", () => {
    expectTypeOf(stringObservable.inspect).toBeCallableWith();
    expectTypeOf(stringObservable.inspect).toBeCallableWith(() => {});
    expectTypeOf(stringObservable.inspect).toBeCallableWith({
      next: () => {},
      error: () => {},
      complete: () => {},
      subscribe: () => {},
      abort: () => {},
    });
  });

  it("infers callback parameters", () => {
    stringObservable.inspect((value) => {
      expectTypeOf(value).toEqualTypeOf<string>();
    });

    stringObservable.inspect({
      next: (value) => {
        expectTypeOf(value).toEqualTypeOf<string>();
      },
      error: (error) => {
        expectTypeOf(error).toBeAny();
      },
      abort: (reason) => {
        expectTypeOf(reason).toBeAny();
      },
    });
  });

  it("infers Observable type", () => {
    expectTypeOf(stringObservable.inspect()).toEqualTypeOf<
      Observable<string>
    >();
  });
});
