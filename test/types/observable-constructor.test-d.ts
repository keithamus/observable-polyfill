import type { Subscriber } from "observable-polyfill";
import { describe, it, expectTypeOf } from "vitest";

describe("Observable", () => {
  it("requires a subscribe callback", () => {
    // @ts-expect-error
    expectTypeOf(Observable).toBeConstructibleWith();

    expectTypeOf(Observable).toBeConstructibleWith(() => {});
  });

  it("passes a Subscriber to the subscribe callback", () => {
    expectTypeOf(Observable<string>).toBeConstructibleWith((subscriber) => {
      expectTypeOf(subscriber).toEqualTypeOf<Subscriber<string>>();

      expectTypeOf(subscriber.next).toBeFunction();
      expectTypeOf(subscriber.next).parameters.toEqualTypeOf<[string]>();
      expectTypeOf(subscriber.next).returns.toBeVoid();

      expectTypeOf(subscriber.error).toBeFunction();
      expectTypeOf(subscriber.error).parameters.toEqualTypeOf<[any]>();
      expectTypeOf(subscriber.error).returns.toBeVoid();

      expectTypeOf(subscriber.complete).toBeFunction();
      expectTypeOf(subscriber.complete).parameters.toEqualTypeOf<[]>();
      expectTypeOf(subscriber.complete).returns.toBeVoid();

      expectTypeOf(subscriber.addTeardown).toBeFunction();
      expectTypeOf(subscriber.addTeardown).parameters.toEqualTypeOf<
        [() => void]
      >();
      expectTypeOf(subscriber.addTeardown).returns.toBeVoid();

      expectTypeOf(subscriber.active).toEqualTypeOf<boolean>();
      expectTypeOf(subscriber.signal).toEqualTypeOf<AbortSignal>();
    });
  });
});
