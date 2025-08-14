import {
  Observable as _Observable,
  ObservableEventListenerOptions as _ObservableEventListenerOptions,
} from "./observable";

// the "type" here is important, we want to re-export all types without the runtime exports
export type * from "./observable";

declare global {
  type ObservableEventListenerOptions = _ObservableEventListenerOptions;

  type Observable<T = any> = _Observable<T>;
  var Observable: typeof _Observable;

  interface EventTarget {
    when(
      type: string,
      options?: ObservableEventListenerOptions
    ): Observable<Event>;
  }

  interface Document {
    when<T extends keyof DocumentEventMap>(
      event: T,
      options?: ObservableEventListenerOptions
    ): Observable<DocumentEventMap[T]>;
    when(
      type: string,
      options?: ObservableEventListenerOptions
    ): Observable<Event>;
  }

  interface HTMLElement {
    when<T extends keyof HTMLElementEventMap>(
      event: T,
      options?: ObservableEventListenerOptions
    ): Observable<HTMLElementEventMap[T]>;
    when(
      type: string,
      options?: ObservableEventListenerOptions
    ): Observable<Event>;
  }

  interface Element {
    when<T extends keyof ElementEventMap>(
      event: T,
      options?: ObservableEventListenerOptions
    ): Observable<HTMLElementEventMap[T]>;
    when(
      type: string,
      options?: ObservableEventListenerOptions
    ): Observable<Event>;
  }

  interface Window {
    when<T extends keyof WindowEventMap>(
      event: T,
      options?: ObservableEventListenerOptions
    ): Observable<WindowEventMap[T]>;
    when(
      type: string,
      options?: ObservableEventListenerOptions
    ): Observable<Event>;
  }
}
