export interface Subscriber<T = any> {
  next(value: T): void;
  error(error: any): void;
  complete(): void;
  addTeardown(teardown: () => void): void;
  readonly active: boolean;
  readonly signal: AbortSignal;
};

export type SubscribeCallback<T = any> = (subscriber: Subscriber<T>) => void;
export type ObservableSubscriptionCallback<T = any> = (value: T) => void;

export interface SubscriptionObserver<T = any> {
  next?: ObservableSubscriptionCallback<T>;
  error?: ObservableSubscriptionCallback;
  complete?: () => void;
};

export type ObservableInspectorAbortHandler = (value: any) => void;

export interface ObservableInspector<T = any> {
  next?: ObservableSubscriptionCallback<T>;
  error?: ObservableSubscriptionCallback;
  complete?: () => void;
  subscribe?: () => void;
  abort?: ObservableInspectorAbortHandler;
};

export type ObserverUnion<T = any> = ObservableSubscriptionCallback<T> | SubscriptionObserver<T>;
export type ObservableInspectorUnion<T = any> = ObservableSubscriptionCallback<T> | ObservableInspector<T>;

export interface SubscribeOptions {
  signal?: AbortSignal;
};

export type Predicate<T = any> = (value: T, index: bigint) => boolean;
export type Reducer<T = any, R = any> = (accumulator: R, currentValue: T, index: bigint) => R;
export type Mapper<T = any, R = any> = (value: T, index: bigint) => R;
export type Visitor<T = any> = (value: T, index: bigint) => void;
export type CatchCallback<R = any> = (value: any) => Observable<R> | R;

export class Observable<T = any> {
  constructor(callback: SubscribeCallback<T>);
  subscribe(observer?: ObserverUnion<T>, options?: SubscribeOptions): void;
  static from(value: any): Observable<any>;
  takeUntil(value: any): Observable<T>;
  map<R>(mapper: Mapper<T, R>): Observable<R>;
  filter(predicate: Predicate<T>): Observable<T>;
  take(amount: bigint): Observable<T>;
  drop(amount: bigint): Observable<T>;
  flatMap<R>(mapper: Mapper<T, R>): Observable<R>;
  switchMap<R>(mapper: Mapper<T, R>): Observable<R>;
  inspect(inspectorUnion?: ObservableInspectorUnion<T>): Observable<T>;
  catch(callback: CatchCallback): Observable<T>;
  finally(callback: () => void): Observable<T>;
  toArray(options?: SubscribeOptions): Promise<T[]>;
  forEach(callback: Visitor<T>, options?: SubscribeOptions): Promise<void>;
  every(predicate: Predicate<T>, options?: SubscribeOptions): Promise<boolean>;
  first(options?: SubscribeOptions): Promise<T>;
  last(options?: SubscribeOptions): Promise<T>;
  find(predicate: Predicate<T>, options?: SubscribeOptions): Promise<T | undefined>;
  some(predicate: Predicate<T>, options?: SubscribeOptions): Promise<boolean>;
  reduce<R>(reducer: Reducer<T, R>, initialValue?: R, options?: SubscribeOptions): Promise<R>;
};

interface ObservableEventListenerOptions {
  capture?: boolean;
  passive?: boolean;
};

interface EventTarget {
  when<T extends keyof HTMLElementEventMap>(type: T, options?: ObservableEventListenerOptions): Observable<HTMLElementEventMap[T]>;
  when<T extends keyof WindowEventMap>(type: T, options?: ObservableEventListenerOptions): Observable<WindowEventMap[T]>;
  when<T extends keyof DocumentEventMap>(type: T, options?: ObservableEventListenerOptions): Observable<DocumentEventMap[T]>;
  when(type: string, options?: ObservableEventListenerOptions): Observable<Event>;
};

declare global {
  export interface GlobalThis {
    Observable: typeof Observable;
  }
  export class Observable;

  export interface ObservableEventListenerOptions;

  export interface EventTarget;

  interface Document {
    when<T extends keyof HTMLElementEventMap>(event: T, options?: ObservableEventListenerOptions): Observable<HTMLElementEventMap[T]>;
    when(type: string, options?: ObservableEventListenerOptions): Observable<Event>;
  }
  interface Element {
    when<T extends keyof HTMLElementEventMap>(event: T, options?: ObservableEventListenerOptions): Observable<HTMLElementEventMap[T]>;
    when(type: string, options?: ObservableEventListenerOptions): Observable<Event>;
  }
  interface Window {
    when<T extends keyof HTMLElementEventMap>(event: T, options?: ObservableEventListenerOptions): Observable<HTMLElementEventMap[T]>;
    when(type: string, options?: ObservableEventListenerOptions): Observable<Event>;
  }
}

export declare function isSupported(): boolean;
export declare function isPolyfilled(): boolean;
export declare function apply(): void;

