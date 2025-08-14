export interface Subscriber<T = any> {
  next(value: T): void;
  error(error: any): void;
  complete(): void;
  addTeardown(teardown: () => void): void;
  readonly active: boolean;
  readonly signal: AbortSignal;
}

export type SubscribeCallback<T = any> = (subscriber: Subscriber<T>) => void;
export type ObservableSubscriptionCallback<T = any> = (value: T) => void;

export interface SubscriptionObserver<T = any> {
  next?: ObservableSubscriptionCallback<T>;
  error?: ObservableSubscriptionCallback;
  complete?: () => void;
}

export type ObservableInspectorAbortHandler = (value: any) => void;

export interface ObservableInspector<T = any> {
  next?: ObservableSubscriptionCallback<T>;
  error?: ObservableSubscriptionCallback;
  complete?: () => void;
  subscribe?: () => void;
  abort?: ObservableInspectorAbortHandler;
}

export type ObserverUnion<T = any> =
  | ObservableSubscriptionCallback<T>
  | SubscriptionObserver<T>;
export type ObservableInspectorUnion<T = any> =
  | ObservableSubscriptionCallback<T>
  | ObservableInspector<T>;

export interface SubscribeOptions {
  signal?: AbortSignal;
}

export type TypePredicate<T = any, U extends T = T> = (
  value: T,
  index: number
) => value is U;
export type Predicate<T = any> = (value: T, index: number) => unknown;
export type Reducer<T = any, R = any> = (
  accumulator: R,
  currentValue: T,
  index: number
) => R;
export type Mapper<T = any, R = any> = (value: T, index: number) => R;
export type Visitor<T = any> = (value: T, index: number) => void;
export type CatchCallback<R = any> = (value: any) => Observable<R> | R;

export type ObservableInput<T> =
  | Observable<T>
  | AsyncIterable<T>
  | Iterable<T>
  | PromiseLike<T>;

export class Observable<T = any> {
  constructor(callback: SubscribeCallback<T>);
  subscribe(observer?: ObserverUnion<T>, options?: SubscribeOptions): void;
  static from<T>(value: ObservableInput<T>): Observable<T>;
  takeUntil(value: ObservableInput<any>): Observable<T>;
  map<R>(mapper: Mapper<T, R>): Observable<R>;
  filter<U extends T>(predicate: TypePredicate<T, U>): Observable<U>;
  filter(predicate: Predicate<T>): Observable<T>;
  take(amount: number): Observable<T>;
  drop(amount: number): Observable<T>;
  flatMap<R>(mapper: Mapper<T, ObservableInput<R>>): Observable<R>;
  switchMap<R>(mapper: Mapper<T, ObservableInput<R>>): Observable<R>;
  inspect(inspectorUnion?: ObservableInspectorUnion<T>): Observable<T>;
  catch<R>(callback: CatchCallback<R>): Observable<T | R>;
  finally(callback: () => void): Observable<T>;
  toArray(options?: SubscribeOptions): Promise<T[]>;
  forEach(callback: Visitor<T>, options?: SubscribeOptions): Promise<void>;
  every(predicate: Predicate<T>, options?: SubscribeOptions): Promise<boolean>;
  first(options?: SubscribeOptions): Promise<T>;
  last(options?: SubscribeOptions): Promise<T>;
  find(
    predicate: Predicate<T>,
    options?: SubscribeOptions
  ): Promise<T | undefined>;
  some(predicate: Predicate<T>, options?: SubscribeOptions): Promise<boolean>;
  reduce<R>(
    reducer: Reducer<T, R>,
    initialValue?: R,
    options?: SubscribeOptions
  ): Promise<R>;
}

export interface ObservableEventListenerOptions {
  capture?: boolean;
  passive?: boolean;
}

export declare function isSupported(): boolean;
export declare function isPolyfilled(): boolean;
export declare function apply(): void;
