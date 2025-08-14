import * as observable from "observable-polyfill";
import { describe, it, expectTypeOf } from "vitest";

describe("Globals", () => {
  it("registers global Observable class and type", () => {
    expectTypeOf(Observable).toEqualTypeOf<typeof observable.Observable>();
    expectTypeOf<Observable>().toEqualTypeOf<observable.Observable>();
  });

  it("registers global ObservableEventListenerOptions type", () => {
    expectTypeOf<ObservableEventListenerOptions>().toEqualTypeOf<observable.ObservableEventListenerOptions>();
  });

  it("augments EventTarget with when()", () => {
    expectTypeOf<EventTarget>().toHaveProperty("when");
    const target = new EventTarget();
    expectTypeOf(target.when("foo")).toEqualTypeOf<Observable<Event>>();
  });

  it("augments Document with when(), including specific types", () => {
    expectTypeOf<Document>().toHaveProperty("when");
    expectTypeOf(document.when("click")).toEqualTypeOf<
      Observable<PointerEvent>
    >();
    expectTypeOf(document.when("foo")).toEqualTypeOf<Observable<Event>>();
  });

  it("augments HTMLElement with when(), including specific types", () => {
    expectTypeOf<HTMLElement>().toHaveProperty("when");
    expectTypeOf(document.documentElement.when("click")).toEqualTypeOf<
      Observable<PointerEvent>
    >();
    expectTypeOf(document.documentElement.when("foo")).toEqualTypeOf<
      Observable<Event>
    >();
  });

  it("augments Element with when(), including specific types", () => {
    expectTypeOf<Element>().toHaveProperty("when");
    const el = new Element();
    expectTypeOf(el.when("fullscreenchange")).toEqualTypeOf<
      Observable<Event>
    >();
    expectTypeOf(el.when("foo")).toEqualTypeOf<Observable<Event>>();
  });

  it("augments Window with when(), including specific types", () => {
    expectTypeOf<Window>().toHaveProperty("when");
    expectTypeOf(window.when("click")).toEqualTypeOf<
      Observable<PointerEvent>
    >();
    expectTypeOf(window.when("foo")).toEqualTypeOf<Observable<Event>>();
  });
});
