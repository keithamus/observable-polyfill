// getting a reference of some used global objects as globalThis is getting undefined when a iframe is removed
const { AbortController, AbortSignal, WeakMap, WeakRef, Window, reportError = console.log } = globalThis;

// https://html.spec.whatwg.org/multipage/document-sequences.html#fully-active
// A Document d is said to be fully active when d is the active document of
// a navigable navigable, and either navigable is a top-level traversable or
// navigable's container document is fully active.
const isDocumentFullyActive = (d) => d && d.defaultView !== null && d.defaultView.document === d && (d.defaultView.top === d.defaultView || isDocumentFullyActive(d.defaultView.parent.document));

// check if we run in a browser
const isBrowserContext = () => !!Window && globalThis instanceof Window;

const unset = Symbol("unset");

const [Observable, Subscriber] = (() => {
  function enumerate(obj, key, enumerable = true) {
    Object.defineProperty(obj, key, {
      ...Object.getOwnPropertyDescriptor(obj, key),
      enumerable,
    });
  }

  const pTry = "try" in Promise ? Promise.try.bind(Promise) : (fn, ...args) => new Promise((r) => r(fn(...args)));

  const pWithResolvers = 'withResolvers' in Promise ? Promise.withResolvers.bind(Promise) : () => {
    let resolve, reject;
    const promise = new Promise((res, rej) => ((resolve = res), (reject = rej)));
    return { promise, resolve, reject };
  }

  function getIteratorFromMethod(obj, method) {
    // 1. Let iterator be ? Call(method, obj).
    const iterator = method.call(obj);
    // 2. If iterator is not an Object, throw a TypeError exception.
    if (iterator === null || typeof iterator !== "object") throw new TypeError("Iterator is not an object");
    // 3. Return ? GetIteratorDirect(iterator)
    return iterator;
  }

  const privateState = new WeakMap();

  const AsyncFromSyncIteratorPrototype = {
    next(...args) {
      // 1. Let O be the this value.
      const O = this;
      // 2. Assert: O is an Object that has a [[SyncIteratorRecord]] internal slot.
      const state = privateState.get(O);
      if (!state?.syncIteratorRecord)
        throw new TypeError(
          "AsyncFromSyncIteratorPrototype.next called on invalid object"
        );
      // 4. Let syncIteratorRecord be O.[[SyncIteratorRecord]].
      const { syncIteratorRecord } = state;
      return pTry(() => syncIteratorRecord.next(...args));
    },
    return(...args) {
      // 1. Let O be the this value.
      const O = this;
      // 2. Assert: O is an Object that has a [[SyncIteratorRecord]] internal slot.
      const state = privateState.get(O);
      if (!state?.syncIteratorRecord)
        throw new TypeError(
          "AsyncFromSyncIteratorPrototype.return called on invalid object"
        );
      // 4. Let syncIteratorRecord be O.[[SyncIteratorRecord]].
      const { syncIteratorRecord } = state;
      return pTry(() => {
        if (!syncIteratorRecord.return) return { value: undefined, done: true };
        return syncIteratorRecord.return(...args);
      });
    },
    throw(...args) {
      // 1. Let O be the this value.
      const O = this;
      // 2. Assert: O is an Object that has a [[SyncIteratorRecord]] internal slot.
      const state = privateState.get(O);
      if (!state?.syncIteratorRecord)
        throw new TypeError(
          "AsyncFromSyncIteratorPrototype.throw called on invalid object"
        );
      // 4. Let syncIteratorRecord be O.[[SyncIteratorRecord]].
      const { syncIteratorRecord } = state;
      return pTry(() => {
        if (!syncIteratorRecord.throw) {
          // a. NOTE: If syncIterator does not have a throw method, close it to give it a chance to clean up before we reject the capability.
          syncIteratorRecord.return();
          throw new TypeError("no throw method");
        }
        return syncIteratorRecord.throw(...args);
      });
    },
  };

  function createAsyncFromSyncIterator(syncIteratorRecord) {
    // 1. Let asyncIterator be OrdinaryObjectCreate(%AsyncFromSyncIteratorPrototype%, « [[SyncIteratorRecord]] »).
    const asyncIterator = Object.create(AsyncFromSyncIteratorPrototype);
    // 2. Set asyncIterator.[[SyncIteratorRecord]] to syncIteratorRecord.
    privateState.set(asyncIterator, { syncIteratorRecord });
    return asyncIterator;
  }

  function getIterator(obj, kind = "SYNC") {
    let method = undefined;
    // 1. if kind is ASYNC, then
    if (kind === "ASYNC") {
      // 1.a. Let method be ? GetMethod(obj, %Symbol.asyncIterator%).
      method = obj[Symbol.asyncIterator];
      // 1.b. If method is undefined, then
      if (method == undefined) {
        // 1.b.i. Let method be ? GetMethod(obj, %Symbol.iterator%).
        method = obj[Symbol.iterator];
        // 1.b.ii. If method is undefined, throw a TypeError exception.
        if (method == undefined) throw new TypeError("Object is not async iterable");
        // 1.b.iii. Let syncIteratorRecord be ? GetIteratorFromMethod(obj, syncMethod).
        const syncIteratorRecord = getIteratorFromMethod(obj, method);
        // 1.b.iv. Return ! CreateAsyncFromSyncIterator(syncIteratorRecord).
        return createAsyncFromSyncIterator(syncIteratorRecord);
      }
    // 2. Else,
    } else {
      // 2.a. Let method be ? GetMethod(obj, %Symbol.iterator%).
      method = obj[Symbol.iterator];
    }
    // 3. If method is undefined, throw a TypeError exception.
    if (method == undefined) throw new TypeError("Object is not iterable");
    // 4. Return ? GetIteratorFromMethod(obj, method).
    return getIteratorFromMethod(obj, method);
  }

  const abortSignalAny = "any" in AbortSignal ? AbortSignal.any.bind(AbortSignal) : (signals) => {
    // create a signal that will abort when any of the signals aborts.
    const ac = new AbortController();
    // when any of the signals is already aborted, abort ac immediately and return its signal.
    for (const signal of signals) {
      if (signal.aborted) {
        ac.abort(signal.reason);
        return ac.signal;
      }
    }
    // otherwise, add an abort listener to each signal that will abort ac.
    for (const signal of signals) {
      signal.addEventListener("abort", () => {
        ac.abort(signal.reason);
      }, { signal: ac.signal });
    }
    // return the signal.
    return ac.signal;
  };

  // wrapper for AbortSignal.any that removes null and undefined, for convenience.
  const anySignal = (signalArray) => abortSignalAny(signalArray.filter(Boolean));

  class InternalObserver {
    constructor({ next, error, complete } = {}) {
      privateState.set(this, { next, error, complete });
    }

    next(value) {
      const { next } = privateState.get(this) || {};
      if (next) next(value);
    }

    error(value) {
      const { error } = privateState.get(this) || {};
      if (error) error(value);
      else reportError(value);
    }

    complete() {
      const { complete } = privateState.get(this) || {};
      if (complete) complete();
    }
  }

  // https://wicg.github.io/observable/#close-a-subscription
  function closeASubscription(subscriber, reason) {
    const state = privateState.get(subscriber);
    
    // 1. If subscriber’s active is false, then return.
    if (!state?.active) return;

    // 2. Set subscriber’s active boolean to false.
    state.active = false;

    // 3. Signal abort subscriber’s subscription controller with reason, if it is given.
    state.subscriptionController.abort(reason);

    // 4. For each teardown of subscriber’s teardown callbacks sorted in reverse insertion order:
    for (const teardown of state.teardowns.reverse()) {
      // 4.1. If subscriber’s relevant global object is a Window object, and its associated Document is not fully active, then abort these steps.
      if (isBrowserContext() && !isDocumentFullyActive(document)) return;
      // 4.2. Invoke teardown.
      try {
        teardown();
      } catch (e) {
        reportError(e);
      }
    }
  }

  // https://wicg.github.io/observable/#observable-subscribe-to-an-observable
  function subscribeTo(observable, observer, options = {}) {
    // 1. If this’s relevant global object is a Window object, and its associated Document is not fully active, then return.
    if (isBrowserContext() && !isDocumentFullyActive(document)) return;

    // 2. Let internal observer be a new internal observer.
    let internalObserver;

    // 3. Process observer as follows:
    // 3.1. If observer is an ObservableSubscriptionCallback
    if (typeof observer == "function") {
      // 3.2. Set internal observer’s next steps to these steps that take an
      // any value:
      internalObserver = new InternalObserver({ next: observer });
      // 4. If observer is a SubscriptionObserver
    } else if (observer && !(observer instanceof InternalObserver)) {
      // 4.1. If observer’s next exists, then set internal observer’s next
      // steps to these steps that take an any value:
      // 4.2. If observer’s error exists, then set internal observer’s error
      // steps to these steps that take an any error:
      // 4.3. If observer’s complete exists, then set internal observer’s
      // complete steps to these steps:
      internalObserver = new InternalObserver(observer);
    } else {
      internalObserver = observer || new InternalObserver();
    }

    const observableState = privateState.get(observable);

    // 5. If this’s weak subscriber is not null and this’s weak subscriber’s active is true:
    const existingSubscriber = observableState.weakSubscriber?.deref();
    if (existingSubscriber?.active) {
      // 5.1. Let subscriber be this’s weak subscriber.
      const subscriber = existingSubscriber;
      const subscriberState = privateState.get(subscriber);
      // 5.2. Append internal observer to subscriber’s internal observers.
      subscriberState.observers.add(internalObserver);
      // 5.3. If options’s signal exists, then:
      if (options.signal) {
        // 5.3.1 If options’s signal is aborted, then remove internal observer from subscriber’s internal observers.
        if (options.signal.aborted) subscriberState.observers.delete(internalObserver);
        // 5.3.2 Otherwise, add the following abort algorithm to options’s signal:
        else options.signal.addEventListener("abort", () => {
          const subscriberState = privateState.get(subscriber);
          // 5.3.2.1 If subscriber’s active is false, then abort these steps.
          if (!subscriberState?.active) return;
          // 5.3.2.2 Remove internal observer from subscriber’s internal observers.
          subscriberState.observers.delete(internalObserver);
          // 5.3.2.3 If subscriber’s internal observers is empty, then close subscriber with options’s signal’s abort reason.
          if (subscriberState.observers.size == 0) {
            closeASubscription(subscriber, options.signal.reason);
          }
        });
      }
      // 5.4. return
      return;
    }

    // 6. Let subscriber be a new Subscriber.
    // 7. Append internal observer to subscriber’s internal observers.
    const subscriber = new Subscriber(internalObserver);

    // 8. Set this’s weak subscriber to subscriber.
    observableState.weakSubscriber = new WeakRef(subscriber);

    // 9. If options’s signal exists, then:
    if ("signal" in options) {
      // 9.1. If options’s signal is aborted, then close subscriber given options’s signal abort reason.
      if (options.signal.aborted)
        closeASubscription(subscriber, options.signal.reason);
      // 9.2. Otherwise, add the following abort algorithm to options’s signal:
      else
        options.signal.addEventListener("abort", () => {
          const subscriberState = privateState.get(subscriber);
          // 9.2.1. If subscriber’s active is false, then abort these steps.
          if (!subscriberState?.active) return;
          // 9.2.2. Remove internal observer from subscriber’s internal observers.
          subscriberState.observers.delete(internalObserver);
          // 9.2.3. If subscriber’s internal observers is empty, then close subscriber with options’s signal’s abort reason.
          if (subscriberState.observers.size == 0) {
            closeASubscription(subscriber, options.signal.reason);
          }
        });
    }

    // 7. If observable's subscribe callback is a SubscribeCallback, invoke it with subscriber.
    if (observableState.subscribeCallback) {
      // If an exception E was thrown, call subscriber’s error() method with E.
      try {
        observableState.subscribeCallback(subscriber);
      } catch (e) {
        subscriber.error(e);
      }
    }
    // 8. Otherwise, run the steps given by observable's subscribe callback, given subscriber.
    // (Not needed because internal subscribers use the same callback function)
  }

  // https://wicg.github.io/observable/#subscriber-api
  class Subscriber {
    get [Symbol.toStringTag]() {
      return "Subscriber";
    }

    constructor(internalObserver = null) {
      if (!(internalObserver instanceof InternalObserver)) {
        throw new TypeError("Illegal constructor");
      }
      privateState.set(this, {
        active: true,
        observers: new Set([internalObserver]),
        teardowns: [],
        subscriptionController: new AbortController(),
      });
    }

    // https://wicg.github.io/observable/#dom-subscriber-next
    next(value) {
      if (!(this instanceof Subscriber))
        throw new TypeError("illegal invocation");
      if (!arguments.length) throw new TypeError("too few arguments");

      const state = privateState.get(this);

      // 1. If this's active is false, then return.
      if (!state?.active) return;

      // 2. If this’s relevant global object is a Window object, and its associated Document is not fully active, then return.
      if (isBrowserContext() && !isDocumentFullyActive(document)) return;

      // 3. For each observer of this’s internal observers:
      for (const observer of state.observers) {
        // 3.1. Run observer’s next steps given value.
        observer.next(value);
      }
    }

    // https://wicg.github.io/observable/#dom-subscriber-error
    error(error) {
      if (!(this instanceof Subscriber))
        throw new TypeError("illegal invocation");

      if (!arguments.length) throw new TypeError("too few arguments");

      const state = privateState.get(this);

      // 1. If this’s active is false, report an exception with error and this’s relevant global object, then return.
      if (!state?.active) {
        reportError(error);
        return;
      };

      // 2. If this’s relevant global object is a Window object, and its associated Document is not fully active, then return.
      if (isBrowserContext() && !isDocumentFullyActive(document)) return;

      // 3. Close this.
      closeASubscription(this, error);

      // 4. For each observer of this’s internal observers:
      for (const observer of state.observers) {
        // 4.1. Run observer’s error steps given error.
        observer.error(error);
      }
    }

    // https://wicg.github.io/observable/#dom-subscriber-complete
    complete() {
      if (!(this instanceof Subscriber))
        throw new TypeError("illegal invocation");

      const state = privateState.get(this);

      // 1. If this's active is false, then return.
      if (!state?.active) return;

      // 2. If this’s relevant global object is a Window object, and its associated Document is not fully active, then return.
      if (isBrowserContext() && !isDocumentFullyActive(document)) return;

      // 3. Close this.
      closeASubscription(this);

      // 4. For each observer of this’s internal observers:
      for (const observer of state.observers) {
        // 4.1. Run observer’s complete steps.
        observer.complete();
      }
    }

    // https://wicg.github.io/observable/#dom-subscriber-addteardown
    addTeardown(teardown) {
      if (!(this instanceof Subscriber))
        throw new TypeError("illegal invocation");

      if (typeof teardown != "function") {
        throw new TypeError(`Parameter 1 is not of type 'Function'`);
      }

      // 1. If this’s relevant global object is a Window object, and its associated Document is not fully active, then return.
      if (isBrowserContext() && !isDocumentFullyActive(document)) return;

      // 2. If this's active is true, then append teardown to this's teardown callbacks list.
      const state = privateState.get(this);
      if (state?.active)
        state.teardowns.push(teardown);
      // 3. Otherwise, invoke teardown.
      else teardown();
    }

    get active() {
      if (!(this instanceof Subscriber))
        throw new TypeError("illegal invocation");

      return !!privateState.get(this)?.active;
    }

    get signal() {
      if (!(this instanceof Subscriber))
        throw new TypeError("illegal invocation");

      if (!privateState.has(this)) {
        const controller = new AbortController();
        controller.abort();
        return controller.signal;
      }
      return privateState.get(this).subscriptionController.signal;
    }
  }

  enumerate(Subscriber.prototype, "next");
  enumerate(Subscriber.prototype, "error");
  enumerate(Subscriber.prototype, "complete");
  enumerate(Subscriber.prototype, "addTeardown");
  enumerate(Subscriber.prototype, "active");
  enumerate(Subscriber.prototype, "signal");

  // https://wicg.github.io/observable/#observable-api
  class Observable {
    get [Symbol.toStringTag]() {
      return "Observable";
    }

    // https://wicg.github.io/observable/#dom-observable-observable
    constructor(subscribeCallback) {
      if (!subscribeCallback) {
        throw new TypeError("1 argument required but 0 present");
      }
      privateState.set(this, {
        weakSubscriber: null,
        subscribeCallback,
      });
    }

    // https://wicg.github.io/observable/#observable-from
    static from(value) {
      // 1. If Type(value) is not Object, throw a TypeError.
      if (value === null || typeof value !== "object") throw new TypeError("Observable.from only accepts objects");

      // 2. From Observable: If value’s specific type is an Observable, then return value.
      if (value instanceof Observable) return value;

      // 3. Let asyncIteratorMethodRecord be GetMethod(value, %Symbol.asyncIterator%).
      const asyncIteratorMethodRecord = Symbol.asyncIterator in value && value[Symbol.asyncIterator];
      // 4. If asyncIteratorMethod’s is undefined or null, then jump to the step labeled From iterable.
      if (typeof asyncIteratorMethodRecord === "function") {
        let done = false;
        // 5. Let nextAlgorithm be the following steps, given a Subscriber subscriber and an Iterator Record iteratorRecord:
        function nextAlgorithm(subscriber, iteratorRecord) {
          // 5.1. If subscriber’s subscription controller’s signal is aborted, then return.
          if (subscriber.signal.aborted) return;
          // 5.2. Let nextPromise be a Promise-or-undefined, initially undefined.
          let nextPromise = undefined;
          try {
            // 5.3. Let nextCompletion be IteratorNext(iteratorRecord).
            let nextCompletion = iteratorRecord.next();
            // 5.5. Otherwise, if nextRecord is normal completion, then set nextPromise to a promise resolved with nextRecord’s [[Value]].
            nextPromise = Promise.resolve(nextCompletion);
          } catch (error) {
            // 5.4. If nextCompletion is a throw completion, then:
            // 5.4.1. Assert: iteratorRecord’s [[Done]] is true.
            // 5.4.2. Set nextPromise to a promise rejected with nextRecord’s [[Value]].
            nextPromise = Promise.reject(error);
          }
          // 5.6. React to nextPromise:
          nextPromise.then(
            // If nextPromise was fulfilled with value iteratorResult, then:
            (iteratorResult) => {
              // 5.6.1 If Type(iteratorResult) is not Object, then run subscriber’s error() method with a TypeError and abort these steps.
              if (iteratorResult === null || typeof iteratorResult !== "object") {
                subscriber.error(new TypeError("Not an IteratorResult."));
                return;
              }
              try {
                // 5.6.2 Let done be IteratorComplete(iteratorResult).
                ({ done } = iteratorResult);
              } catch (error) {
                // 5.6.3 If done is a throw completion, then run subscriber’s error() method with done’s [[Value]] and abort these steps.
                subscriber.error(error);
                return;
              }
              // 5.6.4. If done’s [[Value]] is true, then run subscriber’s complete() and abort these steps.
              if (done) {
                subscriber.complete();
                return;
              }
              let value;
              try {
                // 5.6.5. Let value be IteratorValue(iteratorResult).
                value = iteratorResult.value;
              } catch (error) {
                // 5.6.6. If value is a throw completion, then run subscriber’s error() method with value’s [[Value]] and abort these steps.
                subscriber.error(error);
                return;
              }
              // 5.6.7. Run subscriber’s next() given value’s [[Value]].
              subscriber.next(value);
              // 5.6.8. Run nextAlgorithm given subscriber and iteratorRecord.
              nextAlgorithm(subscriber, iteratorRecord);
            },
            // If nextPromise was rejected with reason r, then run subscriber’s error() method given r.
            (r) => {
              subscriber.error(r);
            }
          );
        }
        // 6. Return a new Observable whose subscribe callback is an algorithm that takes a Subscriber subscriber and does the following:
        return new Observable((subscriber) => {
          // 6.1. If subscriber’s subscription controller’s signal is aborted, then return.
          if (subscriber.signal.aborted) return;
          let iteratorRecordCompletion;
          try {
            // 6.2. Let iteratorRecordCompletion be GetIterator(value, async).
            iteratorRecordCompletion = getIterator(value, "ASYNC");
          } catch (error) {
            // 6.3. If iteratorRecordCompletion is a throw completion, then run subscriber’s error() method with iteratorRecordCompletion’s [[Value]] and abort these steps.
            subscriber.error(error);
            return;
          }
          // 6.4. Let iteratorRecord be ! iteratorRecordCompletion.
          // 6.5. Assert: iteratorRecord is an Iterator Record.
          const iteratorRecord = iteratorRecordCompletion;
          // 6.6. If subscriber’s subscription controller’s signal is aborted, then return.
          if (subscriber.signal.aborted) return;
          // 6.7. Add the following abort algorithm to subscriber’s subscription controller’s signal:
          subscriber.signal.addEventListener("abort", () => {
            // 6.7.1. Run AsyncIteratorClose(iteratorRecord, NormalCompletion(subscriber’s subscription controller’s abort reason)).
            if (typeof iteratorRecord.return !== "function" || done) return;
            const returnPromise = pTry(() => iteratorRecord.return(subscriber.signal.reason));
            returnPromise.then((result) => {
              if (result === null || typeof result !== "object") {
                throw new TypeError("Iterator .return() must return an Object");
              }
            });
          });
          // 6.8. Run nextAlgorithm given subscriber and iteratorRecord.
          nextAlgorithm(subscriber, iteratorRecord);
        });
      }

      // 7. From iterable: Let iteratorMethod be ? GetMethod(value, %Symbol.iterator%).
      let iteratorMethod = Symbol.iterator in value && value[Symbol.iterator];
      // 8. If iteratorMethod is undefined, then jump to the step labeled From Promise.
      if (typeof iteratorMethod === "function") {
        // Otherwise, return a new Observable whose subscribe callback is an algorithm that takes a Subscriber subscriber and does the following:
        return new Observable((subscriber) => {
          // 8.1. If subscriber’s subscription controller’s signal is aborted, then return.
          if (subscriber.signal.aborted) return;
          let iteratorRecordCompletion;
          try {
            // 8.2. Let iteratorRecordCompletion be GetIterator(value, sync).
            iteratorRecordCompletion = getIterator(value, "SYNC");
          } catch (error) {
            // 8.3. If iteratorRecordCompletion is a throw completion, then run subscriber’s error() method, given iteratorRecordCompletion’s [[Value]], and abort these steps.
            subscriber.error(error);
            return;
          }
          let done = false;
          // 8.4. Let iteratorRecord be ! iteratorRecordCompletion.
          let iteratorRecord = iteratorRecordCompletion;
          // 8.5 If subscriber’s subscription controller’s signal is aborted, then return.
          if (subscriber.signal.aborted) return;
          // 8.6. Add the following abort algorithm to subscriber’s subscription controller’s signal:
          subscriber.signal.addEventListener("abort", () => {
            // 8.6.1. Run IteratorClose(iteratorRecord, NormalCompletion(UNUSED)).
            if (typeof iteratorRecord.return !== "function" || done) return;
            const returnResult = iteratorRecord.return();
            if (returnResult === null || typeof returnResult !== "object") {
              throw new TypeError("Iterator .return() must return an Object");
            }
          });
          // 8.7. While true:
          while (true) {
            try {
              // 8.7.1. Let next be IteratorStepValue(iteratorRecord).
              let next = iteratorRecord.next();
              ({ done } = next);
              // 8.7.3. Set next to ! to next.
              // 8.7.4. If next is done, then:
              if (done) {
                // 8.7.4.1. Assert: iteratorRecord’s [[Done]] is true.
                // 8.7.4.2. Run subscriber’s complete().
                subscriber.complete();
                // 8.7.4.3. return
                return;
              }
              // 8.7.5 Run subscriber’s next() given next.
              subscriber.next(next.value);
              // 8.7.6. If subscriber’s subscription controller’s signal is aborted, then break.
              if (subscriber.signal.aborted) break;
            } catch (error) {
              // 8.7.2. If next is a throw completion, then run subscriber’s error() method, given next’s [[Value]], and break.
              subscriber.error(error);
              break;
            }
          }
        });
      }

      // 9. From Promise: If IsPromise(value) is true, then:
      if (value instanceof Promise || typeof value.then === "function") {
        // 9.1. Return a new Observable whose subscribe callback is an algorithm that takes a Subscriber subscriber and does the following:
        return new Observable((subscriber) => {
          // 9.1.1. React to value:
          value.then(
            // 9.1.1.1. If value was fulfilled with value v, then:
            (v) => {
              // 9.1.1.1.1 Run subscriber’s next() method, given v.
              subscriber.next(v);
              // 9.1.1.1.2 Run subscriber’s complete() method.
              subscriber.complete();
            },
            // 9.1.1.2 If value was rejected with reason r, then run subscriber’s error() method, given r.
            (r) => {
              subscriber.error(r);
            }
          );
        });
      }

      // 10. Throw a TypeError.
      throw new TypeError("Could not convert value to Observable");
    }

    // https://wicg.github.io/observable/#dom-observable-subscribe
    subscribe(observer = null, options = {}) {
      if (!(this instanceof Observable))
        throw new TypeError("illegal invocation");
      // 1. Subscribe to this given observer and options.
      subscribeTo(this, observer, options);
    }

    // https://wicg.github.io/observable/#dom-observable-takeuntil
    takeUntil(value) {
      if (!(this instanceof Observable))
        throw new TypeError("illegal invocation");

      // 1. Let sourceObservable be this.
      let sourceObservable = this;

      // 2. Let notifier be the result of converting value to an Observable.
      let notifier = Observable.from(value);

      // 3. Let observable be a new Observable whose subscribe callback is an algorithm that takes a Subscriber subscriber and does the following:
      return new Observable((subscriber) => {
        // 3.1. Let notifierObserver be a new internal observer, initialized as follows:
        const notifierObserver = new InternalObserver({
          // 3.1.1. For the next callback, run subscriber’s complete() method.
          next() {
            subscriber.complete();
          },
          // 3.1.2. For the error callback, run subscriber’s complete() method.
          error() {
            subscriber.complete();
          },
        });

        // 3.2. Let options be a new SubscribeOptions whose signal is subscriber’s subscription controller's signal.
        let options = { signal: subscriber.signal };

        // 3.3. Subscribe to notifier given notifierObserver and options.
        subscribeTo(notifier, notifierObserver, options);

        // 3.4. If subscriber’s active is false, then return.
        if (!subscriber.active) return;

        // 3.5. Let sourceObserver be a new internal observer, initialized as follows:
        let sourceObserver = new InternalObserver({
          // 3.5.1. For the next callback, run subscriber’s next() method, given the passed in value.
          next(value) {
            subscriber.next(value);
          },
          // 3.5.2. For the error callback, run subscriber’s error() method, given the passed in error.
          error(value) {
            subscriber.error(value);
          },
          // 3.5.3. For the complete callback, run subscriber’s complete() method.
          complete() {
            subscriber.complete();
          },
        });

        // 3.6. Subscribe to sourceObservable given sourceObserver and options.
        subscribeTo(sourceObservable, sourceObserver, options);
      });
    }

    // https://wicg.github.io/observable/#dom-observable-map
    map(mapper) {
      if (!(this instanceof Observable))
        throw new TypeError("illegal invocation");
      if (typeof mapper !== "function")
        throw new TypeError(`Parameter 1 is not of type 'Function'`);
      // 1. Let sourceObservable be this.
      let sourceObservable = this;
      // 2. Let observable be a new Observable whose subscribe callback is an algorithm that takes a Subscriber subscriber and does the following:
      // 3. Return observable.
      return new Observable((subscriber) => {
        // 2.1. Let idx be an unsigned long long, initially 0.
        let idx = 0;
        // 2.2. Let sourceObserver be a new internal observer, initialized as follows:
        let sourceObserver = new InternalObserver({
          next(value) {
            let mappedValue;
            // 1. Invoke mapper with the passed in value, and idx, and let mappedValue be the returned value.
            try {
              mappedValue = mapper(value, idx);
            } catch (e) {
              // 2. If an exception E was thrown, then run subscriber’s error() method, given E, and abort these steps.
              subscriber.error(e);
              return;
            }
            // 3. Increment idx.
            idx += 1;
            // 4. Run subscriber’s next() method, given mappedValue.
            subscriber.next(mappedValue);
          },
          error(value) {
            // Run subscriber’s error() method, given the passed in error.
            subscriber.error(value);
          },
          complete() {
            // Run subscriber’s complete() method.
            subscriber.complete();
          },
        });
        // 3. Let options be a new SubscribeOptions whose signal is subscriber’s subscription controller's signal.
        let options = { signal: subscriber.signal };
        // 4. Subscribe to sourceObservable given sourceObserver and options.
        subscribeTo(sourceObservable, sourceObserver, options);
      });
    }

    // https://wicg.github.io/observable/#dom-observable-inspect
    inspect(inspectorUnion = {}) {
      // 1: Let subscribe callback be a `VoidFunction`-or-null, initially null.
      let subscribeCallback = null;
      // 2: Let next callback be a `ObservableSubscriptionCallback`-or-null, initially null.
      let nextCallback = null;
      // 3: Let error callback be a `ObservableSubscriptionCallback`-or-null, initially null.
      let errorCallback = null;
      // 4: Let complete callback be a `VoidFunction`-or-null, initially null.
      let completeCallback = null;
      // 5: Let abort callback be a `ObservableInspectorAbortHandler`-or-null, initially null.
      let abortCallback = null;

      // 6: Process inspectorUnion as follows:
      if (typeof inspectorUnion === "function") {
        // If inspectorUnion is an `ObservableSubscriptionCallback`
        // 6.1: Set next callback to inspectorUnion.
        nextCallback = inspectorUnion;
      } else if (inspectorUnion && typeof inspectorUnion === "object") {
        // If inspectorUnion is an `ObservableInspector`
        // 6.1: If `subscribe` exists in inspectorUnion, then set subscribe callback to it.
        if ("subscribe" in inspectorUnion) subscribeCallback = inspectorUnion.subscribe;
        // 6.2: If `next` exists in inspectorUnion, then set next callback to it.
        if ("next" in inspectorUnion) nextCallback = inspectorUnion.next;
        // 6.3: If `error` exists in inspectorUnion, then set error callback to it.
        if ("error" in inspectorUnion) errorCallback = inspectorUnion.error;
        // 6.4: If `complete` exists in inspectorUnion, then set complete callback to it.
        if ("complete" in inspectorUnion) completeCallback = inspectorUnion.complete;
        // 6.5: If `abort` exists in inspectorUnion, then set abort callback to it.
        if ("abort" in inspectorUnion) abortCallback = inspectorUnion.abort;
      }

      // 7: Let sourceObservable be this.
      const sourceObservable = this;
      // 8: Let observable be a new `Observable` whose subscribe callback is an algorithm that takes a `Subscriber` subscriber and does the following:
      return new Observable((subscriber) => {
        // 8.1: If subscribe callback is not null, then invoke it.
        if (subscribeCallback !== null) {
          try {
            subscribeCallback();
          } catch (e) {
            // If an exception E was thrown, then run subscriber’s `error()` method, given E, and abort these steps.
            subscriber.error(e);
            return;
          }
        }

        // 8.2: If abort callback is not null, then add the following abort algorithm to subscriber’s subscription controller’s signal:
        const abortCallbackWrapped = () => {
          // 8.2.1: Invoke abort callback with subscriber’s subscription controller’s signal’s abort reason.
          try {
            if (abortCallback !== null) {
              abortCallback(subscriber.signal.reason);
            }
          } catch (e) {
            // If an exception E was thrown, then report the exception E.
            reportError(e);
          }
        };
        subscriber.signal.addEventListener("abort", abortCallbackWrapped, { once: true });

        // 8.3: Let sourceObserver be a new internal observer, initialized as follows:
        const sourceObserver = new InternalObserver({
          next(value) {
            // next steps
            // 8.3.next.1: If next callback is not null, then invoke next callback with the passed in value.
            if (nextCallback !== null) {
              try {
                nextCallback(value);
              } catch (e) {
                // If an exception E was thrown, then:
                // 8.3.next.1.1: Remove abort callback from subscriber’s subscription controller’s signal.
                subscriber.signal.removeEventListener("abort", abortCallbackWrapped);
                // 8.3.next.1.2: Run subscriber’s `error()` method, given E, and abort these steps.
                subscriber.error(e);
                return;
              }
            }
            // 8.3.next.2: Run subscriber’s `next()` method with the passed in value.
            subscriber.next(value);
          },
          error(error) {
            // error steps
            // 8.3.error.1: Remove abort callback from subscriber’s subscription controller’s signal.
            subscriber.signal.removeEventListener("abort", abortCallbackWrapped);
            // 8.3.error.2: If error callback is not null, then invoke error callback given the passed in error.
            if (errorCallback !== null) {
              try {
                errorCallback(error);
              } catch (e) {
                // If an exception E was thrown, then run subscriber’s `error()` method, given E, and abort these steps.
                subscriber.error(e);
                return;
              }
            }
            // 8.3.error.3: Run subscriber’s `error()` method, given the passed in error.
            subscriber.error(error);
          },
          complete() {
            // complete steps
            // 8.3.complete.1: Remove abort callback from subscriber’s subscription controller’s signal.
            subscriber.signal.removeEventListener("abort", abortCallbackWrapped);
            // 8.3.complete.2: If complete callback is not null, then invoke complete callback.
            if (completeCallback !== null) {
              try {
                completeCallback();
              } catch (e) {
                // If an exception E was thrown, then run subscriber’s `error()` method, given E, and abort these steps.
                subscriber.error(e);
                return;
              }
            }
            // 8.3.complete.3: Run subscriber’s `complete()` method.
            subscriber.complete();
          },
        });

        // 8.4: Let options be a new `SubscribeOptions` whose `signal` is subscriber’s subscription controller’s signal.
        const options = { signal: subscriber.signal };
        // 8.5: Subscribe to sourceObservable given sourceObserver and options.
        subscribeTo(sourceObservable, sourceObserver, options);
      });
    }

    // https://wicg.github.io/observable/#dom-observable-filter
    filter(predicate) {
      if (!(this instanceof Observable))
        throw new TypeError("illegal invocation");
      if (typeof predicate !== "function")
        throw new TypeError(`Parameter 1 is not of type 'Function'`);
      // 1. Let sourceObservable be this.
      let sourceObservable = this;
      // 2. Let observable be a new Observable whose subscribe callback is an algorithm that takes a Subscriber subscriber and does the following:
      // 3. Return observable.
      return new Observable((subscriber) => {
        // 2.1. Let idx be an unsigned long long, initially 0.
        let idx = 0;
        // 2.2. Let sourceObserver be a new internal observer, initialized as follows:
        let sourceObserver = new InternalObserver({
          next(value) {
            let matches = false;
            // 1. Invoke mapper with the passed in value, and idx, and let mappedValue be the returned value.
            try {
              matches = predicate(value, idx);
            } catch (e) {
              // 2. If an exception E was thrown, then run subscriber’s error() method, given E, and abort these steps.
              subscriber.error(e);
              return;
            }
            // 3. Set idx to idx + 1.
            idx += 1;
            // 4. If matches is true, then run subscriber’s next() method, given value.
            if (matches) {
              subscriber.next(value);
            }
          },
          error(value) {
            // Run subscriber’s error() method, given the passed in error.
            subscriber.error(value);
          },
          complete() {
            // Run subscriber’s complete() method.
            subscriber.complete();
          },
        });
        // 3. Let options be a new SubscribeOptions whose signal is subscriber’s subscription controller's signal.
        let options = { signal: subscriber.signal };
        // 4. Subscribe to sourceObservable given sourceObserver and options.
        subscribeTo(sourceObservable, sourceObserver, options);
      });
    }

    // https://wicg.github.io/observable/#dom-observable-take
    take(amount) {
      if (!(this instanceof Observable))
        throw new TypeError("illegal invocation");
      // 1. Let sourceObservable be this.
      let sourceObservable = this;
      // 2. Let observable be a new Observable whose subscribe callback is an algorithm that takes a Subscriber subscriber and does the following:
      // 3. Return observable.
      return new Observable((subscriber) => {
        // 2.1. Let remaining be amount.
        let remaining = amount;
        // 2.2. If remaining is 0, then run subscriber’s complete() method and abort these steps.
        if (remaining == 0) return subscriber.complete();
        // 2.3. Let sourceObserver be a new internal observer, initialized as follows:
        let sourceObserver = new InternalObserver({
          next(value) {
            // 1. Run subscriber’s next() method with the passed in value.
            subscriber.next(value);
            // 2. Decrement remaining.
            remaining -= 1;
            // 3. If remaining is 0, then run subscriber’s complete() method.
            if (remaining == 0) subscriber.complete();
          },
          error(value) {
            // Run subscriber’s error() method, given the passed in error.
            subscriber.error(value);
          },
          complete() {
            // Run subscriber’s complete() method.
            subscriber.complete();
          },
        });
        // 3. Let options be a new SubscribeOptions whose signal is subscriber’s subscription controller's signal.
        let options = { signal: subscriber.signal };
        // 4. Subscribe to sourceObservable given sourceObserver and options.
        subscribeTo(sourceObservable, sourceObserver, options);
      });
    }

    // https://wicg.github.io/observable/#dom-observable-drop
    drop(amount) {
      if (!(this instanceof Observable))
        throw new TypeError("illegal invocation");
      // 1. Let sourceObservable be this.
      let sourceObservable = this;
      // 2. Let observable be a new Observable whose subscribe callback is an algorithm that takes a Subscriber subscriber and does the following:
      // 3. Return observable.
      return new Observable((subscriber) => {
        // 2.1. Let remaining be amount.
        let remaining = amount;
        // 2.3. Let sourceObserver be a new internal observer, initialized as follows:
        let sourceObserver = new InternalObserver({
          next(value) {
            // 1. If remaining is > 0, then decrement remaining and abort these steps.
            if (remaining > 0) return (remaining -= 1);
            // 2. Assert: remaining is 0.
            if (remaining != 0) return;
            // 3. Run subscriber’s next() method with the passed in value.
            subscriber.next(value);
          },
          error(value) {
            // Run subscriber’s error() method, given the passed in error.
            subscriber.error(value);
          },
          complete() {
            // Run subscriber’s complete() method.
            subscriber.complete();
          },
        });
        // 3. Let options be a new SubscribeOptions whose signal is subscriber’s subscription controller's signal.
        let options = { signal: subscriber.signal };
        // 4. Subscribe to sourceObservable given sourceObserver and options.
        subscribeTo(sourceObservable, sourceObserver, options);
      });
    }

    // https://wicg.github.io/observable/#dom-observable-flatmap
    flatMap(mapper) {
      if (!(this instanceof Observable))
        throw new TypeError("illegal invocation");
      if (typeof mapper !== "function")
        throw new TypeError(`Parameter 1 is not of type 'Function'`);
      // 1. Let sourceObservable be this.
      let sourceObservable = this;
      // 2. Let observable be a new Observable whose subscribe callback is an algorithm that takes a Subscriber subscriber and does the following:
      // 3. Return observable.
      return new Observable((subscriber) => {
        // 2.1. Let idx be an unsigned long long, initially 0.
        let idx = 0;
        // 2.2. Let outerSubscriptionHasCompleted to a boolean, initially false.
        let outerSubscriptionHasCompleted = false;
        // 2.3. Let queue be a new list of any values, initially empty.
        let queue = [];

        // https://wicg.github.io/observable/#flatmap-process-next-value-steps
        // The flatmap process next value steps, given an any value, a
        // Subscriber subscriber, a Mapper mapper, and references to all
        // of the following: a list of any values queue, a boolean
        // activeInnerSubscription, a boolean outerSubscriptionHasCompleted,
        // and an unsigned long long idx:
        function flatmapProcessNextValueSteps(value) {
          // 1. Let mappedResult be the result of invoking mapper with value, idx and "rethrow".
          let mappedResult;
          try {
            mappedResult = mapper(value, idx);
          } catch (e) {
            return subscriber.error(e);
          }
          // 2. Set idx to idx + 1.
          idx += 1;
          // 3. Let innerObservable be the result of calling from() with mappedResult.
          let innerObservable;
          try {
            innerObservable = Observable.from(mappedResult);
          } catch (e) {
            return subscriber.error(e);
          }
          // 4. Let innerObserver be a new internal observer, initialized as follows:
          let innerObserver = new InternalObserver({
            next(value) {
              // Run subscriber’s next() method, given the passed in value.
              subscriber.next(value);
            },
            error(value) {
              // Run subscriber’s error() method, given the passed in error.
              subscriber.error(value);
            },
            complete() {
              // 1. If queue is not empty, then:
              if (queue.length) {
                // 1.1. Let nextValue be the first item in queue; remove remove this item from queue.
                let nextValue = queue.shift();
                // 1.2. Run flatmap process next value steps given nextValue, subscriber, mapper, and references to queue and activeInnerSubscription.
                flatmapProcessNextValueSteps(nextValue);
                // 2. Otherwise:
              } else {
                // 2.1. Set activeInnerSubscription to false.
                activeInnerSubscription = false;
                // 2.2. If outerSubscriptionHasCompleted is true, run subscriber’s complete() method.
                if (outerSubscriptionHasCompleted) subscriber.complete();
              }
            },
          });
          // 5. Let innerOptions be a new SubscribeOptions whose signal is subscriber’s subscription controller's signal.
          let innerOptions = { signal: subscriber.signal };
          // 6. Subscribe to innerObservable given innerObserver and innerOptions.
          subscribeTo(innerObservable, innerObserver, innerOptions);
        }

        // 2.4. Let activeInnerSubscription be a boolean, initially false.
        let activeInnerSubscription = false;
        // 2.5. Let sourceObserver be a new internal observer, initialized as follows:
        let sourceObserver = new InternalObserver({
          next(value) {
            // 1. If activeInnerSubscription is true, then:
            if (activeInnerSubscription) {
              // 1.1. Append value to queue.
              queue.push(value);
              // 2. Otherwise:
            } else {
              // 2.1. Set activeInnerSubscription to true.
              activeInnerSubscription = true;
              // 2.2. Run the flatmap process next value steps with value,
              // subscriber, mapper, and references to all of the following:
              // queue, activeInnerSubscription, outerSubscriptionHasCompleted,
              // and idx.
              flatmapProcessNextValueSteps(value);
            }
          },
          error(value) {
            // Run subscriber’s error() method, given the passed in error.
            subscriber.error(value);
          },
          complete() {
            // 1. Set outerSubscriptionHasCompleted to true.
            outerSubscriptionHasCompleted = true;
            // 2. If activeInnerSubscription is false and queue is empty, run subscriber’s complete() method.
            if (!activeInnerSubscription && !queue.length) {
              subscriber.complete();
            }
          },
        });
        // 2.6. Let options be a new SubscribeOptions whose signal is subscriber’s subscription controller’s signal.
        const options = { signal: subscriber.signal };
        // 2.7. Subscribe to sourceObservable given sourceObserver and options.
        subscribeTo(sourceObservable, sourceObserver, options);
      });
    }

    // https://wicg.github.io/observable/#dom-observable-switchmap
    switchMap(mapper) {
      if (!(this instanceof Observable))
        throw new TypeError("illegal invocation");
      if (typeof mapper !== "function")
        throw new TypeError(`Parameter 1 is not of type 'Function'`);
      // 1. Let sourceObservable be this.
      let sourceObservable = this;
      // 2. Let observable be a new Observable whose subscribe callback is an algorithm that takes a Subscriber subscriber and does the following:
      // 3. Return observable.
      return new Observable((subscriber) => {
        // 2.1. Let idx be an unsigned long long, initially 0.
        let idx = 0;
        // 2.2. Let outerSubscriptionHasCompleted to a boolean, initially false.
        let outerSubscriptionHasCompleted = false;
        // 2.3. Let activeInnerAbortController be an AbortController-or-null, initially null.
        let activeInnerAbortController = null;

        function switchmapProcessNextValueSteps(value) {
          // https://wicg.github.io/observable/#flatmap-process-next-value-steps
          //  The flatmap process next value steps, given an any value, a
          //  Subscriber subscriber, a Mapper mapper, and references to all
          //  of the following: a list of any values queue, a boolean
          //  activeInnerSubscription, a boolean outerSubscriptionHasCompleted,
          //  and an unsigned long long idx:
          //
          // 1. Let mappedResult be the result of invoking mapper with value
          // and idx.
          let mappedResult;
          try {
            mappedResult = mapper(value, idx);
          } catch (e) {
            return subscriber.error(e);
          }
          // 2. Set idx to idx + 1.
          idx += 1;
          // 3. Let innerObservable be the result of calling from() with mappedResult.
          let innerObservable;
          try {
            innerObservable = Observable.from(mappedResult);
          } catch (e) {
            return subscriber.error(e);
          }
          // 4. Let innerObserver be a new internal observer, initialized as follows:
          let innerObserver = new InternalObserver({
            next(value) {
              // Run subscriber’s next() method, given the passed in value.
              subscriber.next(value);
            },
            error(value) {
              // Run subscriber’s error() method, given the passed in error.
              subscriber.error(value);
            },
            complete(value) {
              // 1. If outerSubscriptionHasCompleted is true, run subscriber’s complete() method.
              if (outerSubscriptionHasCompleted) subscriber.complete();
              // 2. Otherwise, set activeInnerAbortController to null.
              else activeInnerAbortController = null;
            },
          });
          // 5. Let innerOptions be a new SubscribeOptions whose signal is the
          // result of creating a dependent abort signal from the list
          // «activeInnerAbortController’s signal, subscriber’s subscription
          // controller's signal», using AbortSignal, and the current realm.
          const innerOptions = { signal: anySignal([activeInnerAbortController.signal, subscriber.signal]) };
          // 6. Subscribe to innerObservable given innerObserver and innerOptions.
          subscribeTo(innerObservable, innerObserver, innerOptions);
        }

        // 2.4. Let activeInnerSubscription be a boolean, initially false.
        // 2.5. Let sourceObserver be a new internal observer, initialized as follows:
        let sourceObserver = new InternalObserver({
          next(value) {
            // 1. If activeInnerAbortController is not null, then signal abort activeInnerAbortController.
            if (activeInnerAbortController) {
              activeInnerAbortController.abort();
            }
            // 2. Set activeInnerAbortController to a new AbortController.
            activeInnerAbortController = new AbortController();
            // 3. Run the switchmap process next value steps with value,
            // subscriber, mapper, and references to all of the
            // following: activeInnerAbortController,
            // outerSubscriptionHasCompleted, and idx.
            switchmapProcessNextValueSteps(value);
          },
          error(value) {
            // Run subscriber’s error() method, given the passed in error.
            subscriber.error(value);
          },
          complete() {
            // 1. Set outerSubscriptionHasCompleted to true.
            outerSubscriptionHasCompleted = true;
            // 2. If activeInnerAbortController is null, run subscriber’s complete() method.
            if (!activeInnerAbortController) subscriber.complete();
          },
        });
        // 3. Let options be a new SubscribeOptions whose signal is subscriber’s subscription controller's signal.
        let options = { signal: subscriber.signal };
        // 4. Subscribe to sourceObservable given sourceObserver and options.
        subscribeTo(sourceObservable, sourceObserver, options);
      });
    }

    // https://wicg.github.io/observable/#dom-observable-catch
    catch(callback) {
      if (!(this instanceof Observable))
        throw new TypeError("illegal invocation");
      if (typeof callback !== "function")
        throw new TypeError(`Parameter 1 is not of type 'Function'`);
      // 1. Let sourceObservable be this.
      const sourceObservable = this;
      // 2. Let observable be a new Observable whose subscribe callback is an algorithm that takes a Subscriber subscriber and does the following:
      const observable = new Observable((subscriber) => {
        // 2.1 Let sourceObserver be a new internal observer, initialized as follows:
        const sourceObserver = new InternalObserver({
          next(value) {
            // 2.1.next Run subscriber’s next() method, given the passed in value.
            subscriber.next(value);
          },
          error(value) {
            // 2.1.error.1 Invoke callback with «the passed in error» and "rethrow". Let result be the returned value.
            // If an exception E was thrown, then run subscriber’s error() with E, and abort these steps.
            let result;
            try {
              result = callback(value);
            } catch (error) {
              subscriber.error(error);
              return;
            }
            // 2.1.error.2 Let innerObservable be the result of calling from() with result.
            // If an exception E was thrown, then run subscriber’s error() method, given E, and abort these steps.
            let innerObservable;
            try {
              innerObservable = Observable.from(result);
            } catch (error) {
              subscriber.error(error);
              return;
            }
            // 2.1.error.3 Let innerObserver be a new internal observer, initialized as follows:
            const innerObserver = new InternalObserver({
              next(value) {
                // Run subscriber’s next() method, given the passed in value.
                subscriber.next(value);
              },
              error(error) {
                // Run subscriber’s error() method, given the passed in error.
                subscriber.error(error);
              },
              complete() {
                // Run subscriber’s complete() method.
                subscriber.complete();
              },
            });
            // 2.1.error.4 Let innerOptions be a new SubscribeOptions whose signal is subscriber’s subscription controller’s signal.
            const innerOptions = { signal: subscriber.signal };
            // 2.1.error.5 Subscribe to innerObservable given innerObserver and innerOptions.
            subscribeTo(innerObservable, innerObserver, innerOptions);
          },
          complete() {
            // 2.1.complete Run subscriber’s complete() method.
            subscriber.complete();
          },
        });
        // 2.2. Let options be a new SubscribeOptions whose signal is subscriber’s subscription controller’s signal.
        const options = { signal: subscriber.signal };
        // 2.3. Subscribe to sourceObservable given sourceObserver and options.
        subscribeTo(sourceObservable, sourceObserver, options);
      });
      // 3. Return observable.
      return observable;
    }

    // https://wicg.github.io/observable/#dom-observable-finally
    finally(callback) {
      if (!(this instanceof Observable))
        throw new TypeError("illegal invocation");
      if (typeof callback !== "function")
        throw new TypeError(`Parameter 1 is not of type 'Function'`);
      // 1. Let sourceObservable be this.
      let sourceObservable = this;
      // 2. Let observable be a new Observable whose subscribe callback is an algorithm that takes a Subscriber subscriber and does the following:
      // 3. Return observable.
      return new Observable((subscriber) => {
        // 2.1. Run subscriber’s addTeardown() method with callback.
        subscriber.addTeardown(callback);
        // 2.2. Let sourceObserver be a new internal observer, initialized as follows:
        const sourceObserver = new InternalObserver({
          next(value) {
            // Run subscriber’s next() method, given the passed in value.
            subscriber.next(value);
          },
          error(value) {
            // Run subscriber’s error() method, given the passed in error.
            subscriber.error(value);
          },
          complete() {
            // Run subscriber’s complete() method.
            subscriber.complete();
          },
        });
        // 3. Let options be a new SubscribeOptions whose signal is subscriber’s subscription controller’s signal.
        let options = { signal: subscriber.signal };
        // 4. Subscribe to sourceObservable given sourceObserver and options.
        subscribeTo(sourceObservable, sourceObserver, options);
      });
    }

    // https://wicg.github.io/observable/#dom-observable-toarray
    toArray(options = {}) {
      if (!(this instanceof Observable))
        throw new TypeError("illegal invocation");
      // 1. Let p a new promise.
      let { promise: p, resolve, reject } = pWithResolvers();
      // 2. If options’s signal is not null:
      if (options.signal) {
        // 2.1. If options’s signal is aborted, then:
        if (options.signal.aborted) {
          // 2.1.1. Reject p with options’s signal's abort reason.
          // 2.1.2. Return p.
          return Promise.reject(options.signal.reason);
        }
        // 2.2. Add the following abort algorithm to options’s signal:
        options.signal.addEventListener("abort", () => {
          // 2.2.1. Reject p with options’s signal's abort reason.
          reject(options.signal.reason);
        });
      }
      // 3. Let values be a new list.
      let values = [];
      // 4. Let observer be a new internal observer, initialized as follows:
      let observer = new InternalObserver({
        next(value) {
          // Append the passed in value to values.
          values.push(value);
        },
        error(error) {
          // Reject p with the passed in error.
          reject(error);
        },
        complete() {
          // Resolve p with values.
          resolve(values);
        },
      });
      // 5. Subscribe to this given observer and options.
      subscribeTo(this, observer, options);
      // 6. Return p.
      return p;
    }

    // https://wicg.github.io/observable/#dom-observable-foreach
    forEach(callback, options = {}) {
      if (!(this instanceof Observable))
        throw new TypeError("illegal invocation");
      if (typeof callback !== "function")
        throw new TypeError(`Parameter 1 is not of type 'Function'`);
      // 1. Let p a new promise.
      let { promise: p, resolve, reject } = pWithResolvers();
      // 2. Let visitor callback controller be a new AbortController.
      let visitorCallbackController = new AbortController();
      // 3. Let internal options be a new SubscribeOptions whose signal is the
      // result of creating a dependent abort signal from the list «visitor
      // callback controller’s signal, options’s signal if non-null», using
      // AbortSignal, and the current realm.
      const internalOptions = { signal: anySignal([visitorCallbackController.signal, options.signal]) };
      // 4. If internal options’s signal is aborted, then:
      if (internalOptions.signal.aborted) {
        // 4.1. Reject p with internal options’s signal's abort reason.
        reject(internalOptions.signal.reason);
        // 4.2. Return p.
        return p;
      }
      // 5. Add the following abort algorithm to internal options’s signal:
      internalOptions.signal.addEventListener("abort", () => {
        // Reject p with internal options’s signal's abort reason.
        reject(internalOptions.signal.reason);
      });

      // 6. Let idx be an unsigned long long, initially 0.
      let idx = 0;
      // 7. Let observer be a new internal observer, initialized as follows:
      let observer = new InternalObserver({
        next(value) {
          // 1. Invoke callback with the passed in value, and idx.
          try {
            callback(value, idx);
          } catch (e) {
            // If an exception E was thrown, then reject p with E, and signal abort visitor callback controller with E.
            reject(e);
            visitorCallbackController.abort(e);
          }
          // 2. Increment idx.
          idx += 1;
        },
        error(error) {
          // Reject p with the passed in error.
          reject(error);
        },
        complete() {
          // Resolve p with undefined.
          resolve();
        },
      });
      // 8. Subscribe to this given observer and internal options.
      subscribeTo(this, observer, internalOptions);
      // 9. Return p.
      return p;
    }

    // https://wicg.github.io/observable/#dom-observable-every
    every(predicate, options = {}) {
      if (!(this instanceof Observable))
        throw new TypeError("illegal invocation");
      if (typeof predicate !== "function")
        throw new TypeError(`Parameter 1 is not of type 'Function'`);
      // 1. Let p a new promise.
      let { promise: p, resolve, reject } = pWithResolvers();
      // 2. Let controller be a new AbortController.
      let controller = new AbortController();
      // 3. Let internal options be a new SubscribeOptions whose signal is the
      // result of creating a dependent abort signal from the list «controller’s
      // signal, options’s signal if non-null», using AbortSignal, and the
      // current realm.
      const internalOptions = { signal: anySignal([controller.signal, options.signal]) };
      // 4. If internal options’s signal is aborted, then:
      if (internalOptions.signal.aborted) {
        // 4.1. Reject p with internal options’s signal's abort reason.
        reject(internalOptions.signal.reason);
        // 4.2. Return p.
        return p;
      }
      // 5. Add the following abort algorithm to internal options’s signal:
      internalOptions.signal.addEventListener("abort", () => {
        // Reject p with internal options’s signal's abort reason.
        reject(internalOptions.signal.reason);
      });

      // 6. Let idx be an unsigned long long, initially 0.
      let idx = 0;
      // 7. Let observer be a new internal observer, initialized as follows:
      let observer = new InternalObserver({
        next(value) {
          let passed = false;
          // 1. Invoke predicate with the passed in value, and idx.
          try {
            passed = predicate(value, idx);
          } catch (e) {
            // If an exception E was thrown, then reject p with E, and signal abort visitor callback controller with E.
            reject(e);
            controller.abort(e);
          }
          // 2. Set idx to idx + 1.
          idx += 1;
          // 3. If passed is false, then resolve p with false, and signal abort controller.
          if (!passed) {
            resolve(false);
            controller.abort();
          }
        },
        error(error) {
          // Reject p with the passed in error.
          reject(error);
        },
        complete() {
          // Resolve p with true.
          resolve(true);
        },
      });
      // 8. Subscribe to this given observer and internal options.
      subscribeTo(this, observer, internalOptions);
      // 9. Return p.
      return p;
    }

    // https://wicg.github.io/observable/#dom-observable-first
    first(options = {}) {
      if (!(this instanceof Observable))
        throw new TypeError("illegal invocation");
      // 1. Let p a new promise.
      let { promise: p, resolve, reject } = pWithResolvers();
      // 2. Let controller be a new AbortController.
      let controller = new AbortController();
      // 3. Let internal options be a new SubscribeOptions whose signal is the
      // result of creating a dependent abort signal from the list «controller’s
      // signal, options’s signal if non-null», using AbortSignal, and the
      // current realm.
      const internalOptions = { signal: anySignal([controller.signal, options.signal]) };
      // 4. If internal options’s signal is aborted, then:
      if (internalOptions.signal.aborted) {
        // 4.1. Reject p with internal options’s signal's abort reason.
        reject(internalOptions.signal.reason);
        // 4.2. Return p.
        return p;
      }
      // 5. Add the following abort algorithm to internal options’s signal:
      internalOptions.signal.addEventListener("abort", () => {
        // Reject p with internal options’s signal's abort reason.
        reject(internalOptions.signal.reason);
      });
      // 6. Let observer be a new internal observer, initialized as follows:
      let observer = new InternalObserver({
        next(value) {
          // 1. Resolve p with the passed in value.
          resolve(value);
          // 2. Signal abort controller.
          controller.abort();
        },
        error(error) {
          // Reject p with the passed in error.
          reject(error);
        },
        complete() {
          // Reject p with a new RangeError.
          // Note: This is only reached when the source Observable completes before it emits a single value.
          reject(new RangeError('No values in Observable'));
        },
      });
      // 7. Subscribe to this given internal observer and internal options.
      subscribeTo(this, observer, internalOptions);
      // 8. Return p.
      return p;
    }

    // https://wicg.github.io/observable/#dom-observable-last
    last(options = {}) {
      if (!(this instanceof Observable))
        throw new TypeError("illegal invocation");
      // 1. Let p a new promise.
      let { promise: p, resolve, reject } = pWithResolvers();
      // 2. If options’s signal is not null:
      if (options.signal) {
        // 2.1. If options’s signal is aborted, then:
        if (options.signal.aborted) {
          // 2.1.1 Reject p with options’s signal's abort reason.
          reject(options.signal.reason);
          // 2.1.2 Return p.
          return p;
        }
        // 2.2. Add the following abort algorithm to options’s signal:
        options.signal.addEventListener("abort", () => {
          // Reject p with internal options’s signal's abort reason.
          reject(options.signal.reason);
        });
      }
      // 3. Let lastValue be an any-or-null, initially null.
      let lastValue = null;
      // 4. Let hasLastValue be a boolean, initially false.
      let hasLastValue = false;
      // 5. Let observer be a new internal observer, initialized as follows:
      let observer = new InternalObserver({
        next(value) {
          // 1. Set hasLastValue to true.
          hasLastValue = true;
          // 2. Set lastValue to the passed in value.
          lastValue = value;
        },
        error(error) {
          // Reject p with the passed in error.
          reject(error);
        },
        complete() {
          // 1. If hasLastValue is true, resolve p with lastValue.
          if (hasLastValue) resolve(lastValue);
          // 2. Otherwise, reject p with a new RangeError.
          else reject(new RangeError('No values in Observable'));
        },
      });
      // 5. Subscribe to this given observer and options.
      subscribeTo(this, observer, options);
      // 6. Return p.
      return p;
    }

    // https://wicg.github.io/observable/#dom-observable-find
    find(predicate, options = {}) {
      if (!(this instanceof Observable))
        throw new TypeError("illegal invocation");
      if (typeof predicate !== "function")
        throw new TypeError(`Parameter 1 is not of type 'Function'`);
      // 1. Let p a new promise.
      let { promise: p, resolve, reject } = pWithResolvers();
      // 2. Let controller be a new AbortController.
      let controller = new AbortController();
      // 3. Let internal options be a new SubscribeOptions whose signal is the
      // result of creating a dependent abort signal from the list «controller’s
      // signal, options’s signal if non-null», using AbortSignal, and the
      // current realm.
      const internalOptions = { signal: anySignal([controller.signal, options.signal]) };
      // 4. If internal options’s signal is aborted, then:
      if (internalOptions.signal.aborted) {
        // 4.1. Reject p with internal options’s signal's abort reason.
        reject(internalOptions.signal.reason);
        // 4.2. Return p.
        return p;
      }
      // 5. Add the following abort algorithm to internal options’s signal:
      internalOptions.signal.addEventListener("abort", () => {
        // Reject p with internal options’s signal's abort reason.
        reject(internalOptions.signal.reason);
      });

      // 6. Let idx be an unsigned long long, initially 0.
      let idx = 0;
      // 7. Let observer be a new internal observer, initialized as follows:
      let observer = new InternalObserver({
        next(value) {
          let passed = false;
          // 1. Invoke predicate with the passed in value, and idx.
          try {
            passed = predicate(value, idx);
          } catch (e) {
            // If an exception E was thrown, then reject p with E, and signal abort visitor callback controller with E.
            reject(e);
            controller.abort(e);
          }
          // 2. Set idx to idx + 1.
          idx += 1;
          // 3. If passed is true, then resolve p with value, and signal abort controller.
          if (passed) {
            resolve(value);
            controller.abort();
          }
        },
        error(error) {
          // Reject p with the passed in error.
          reject(error);
        },
        complete() {
          // Resolve p with undefined.
          resolve();
        },
      });
      // 8. Subscribe to this given observer and internal options.
      subscribeTo(this, observer, internalOptions);
      // 9. Return p.
      return p;
    }

    // https://wicg.github.io/observable/#dom-observable-some
    some(predicate, options = {}) {
      if (!(this instanceof Observable))
        throw new TypeError("illegal invocation");
      if (typeof predicate !== "function")
        throw new TypeError(`Parameter 1 is not of type 'Function'`);
      // 1. Let p a new promise.
      let { promise: p, resolve, reject } = pWithResolvers();
      // 2. Let controller be a new AbortController.
      let controller = new AbortController();
      // 3. Let internal options be a new SubscribeOptions whose signal is the
      // result of creating a dependent abort signal from the list «controller’s
      // signal, options’s signal if non-null», using AbortSignal, and the
      // current realm.
      const internalOptions = { signal: anySignal([controller.signal, options.signal]) };
      // 4. If internal options’s signal is aborted, then:
      if (internalOptions.signal.aborted) {
        // 4.1. Reject p with internal options’s signal's abort reason.
        reject(internalOptions.signal.reason);
        // 4.2. Return p.
        return p;
      }
      // 5. Add the following abort algorithm to internal options’s signal:
      internalOptions.signal.addEventListener("abort", () => {
        // Reject p with internal options’s signal's abort reason.
        reject(internalOptions.signal.reason);
      });

      // 6. Let idx be an unsigned long long, initially 0.
      let idx = 0;
      // 7. Let observer be a new internal observer, initialized as follows:
      let observer = new InternalObserver({
        next(value) {
          let passed = false;
          // 1. Invoke predicate with the passed in value, and idx.
          try {
            passed = predicate(value, idx);
          } catch (e) {
            // If an exception E was thrown, then reject p with E, and signal abort controller with E.
            reject(e);
            controller.abort(e);
          }
          // 2. Set idx to idx + 1.
          idx += 1;
          // 3. If passed is true, then resolve p with true, and signal abort controller.
          if (passed) {
            resolve(true);
            controller.abort();
          }
        },
        error(error) {
          // Reject p with the passed in error.
          reject(error);
        },
        complete() {
          // Resolve p with false.
          resolve(false);
        },
      });
      // 8. Subscribe to this given observer and internal options.
      subscribeTo(this, observer, internalOptions);
      // 9. Return p.
      return p;
    }

    // https://wicg.github.io/observable/#dom-observable-reduce
    reduce(reducer, initialValue, options = {}) {
      if (!(this instanceof Observable))
        throw new TypeError("illegal invocation");
      if (typeof reducer !== "function")
        throw new TypeError(`Parameter 1 is not of type 'Function'`);
      // 1. Let p a new promise.
      let { promise: p, resolve, reject } = pWithResolvers();
      // 2. Let controller be a new AbortController.
      const controller = new AbortController();
      // 3. Let internal options be a new SubscribeOptions whose signal is the
      // result of creating a dependent abort signal from the list «controller’s
      // signal, options’s signal if non-null», using AbortSignal, and the
      // current realm.
      const internalOptions = { signal: anySignal([controller.signal, options.signal]) };
      // 4. If internal options’s signal is aborted, then:
      if (internalOptions.signal.aborted) {
        // 4.1 Reject p with internal options’s signal’s abort reason.
        reject(internalOptions.signal.reason);
        // 4.2 Return p.
        return p;
      }
      // 5. Add the following abort algorithm to internal options’s signal:
      internalOptions.signal.addEventListener("abort", () => {
        // 5.1 Reject p with internal options’s signal’s abort reason.
        reject(internalOptions.signal.reason);
      }, { once: true });
      // 6. Let idx be an unsigned long long, initially 0.
      let idx = 0;
      // 7. Let accumulator be initialValue if it is given, and uninitialized otherwise.
      let accumulator = arguments.length > 1 ? initialValue : unset;
      // 8. Let observer be a new internal observer, initialized as follows:
      const observer = new InternalObserver({
        // next steps
        next(value) {
          // 8.1 If accumulator is uninitialized (meaning no initialValue was passed in), then set accumulator to the passed in value, set idx to idx + 1, and abort these steps.
          if (accumulator === unset) {
            accumulator = value;
            idx++;
            return;
          }
          try {
            // 8.2 Invoke reducer with «accumulator as accumulator, the passed in value as currentValue, idx as index» and "rethrow". Let result be the returned value.
            const result = reducer(accumulator, value, idx);
            // 8.3 Set idx to idx + 1.
            idx++;
            // 8.4 Set accumulator to result.
            accumulator = result;
          } catch (e) {
            // 8.2-error If an exception E was thrown, then reject p with E, and signal abort controller with E.
            reject(e);
            controller.abort(e);
            return;
          }
        },
        // error steps
        error(error) {
          // Reject p with the passed in error.
          reject(error);
        },
        // complete steps
        complete() {
          // 1. If accumulator is not "unset", then resolve p with accumulator.
          // Otherwise, reject p with a TypeError.
          if (accumulator !== unset) {
            resolve(accumulator);
          } else {
            reject(new TypeError('no initial value provided and no values emitted'));
          }
        },
      });
      // 9. Subscribe to this given observer and internal options.
      subscribeTo(this, observer, internalOptions);
      // 10. Return p.
      return p;
    }
  }

  enumerate(Observable.prototype, "subscribe");

  return [Observable, Subscriber];
})();

function isSupported() {
  return typeof globalThis.Observable === "function";
}

function isPolyfilled() {
  return globalThis.Observable === Observable;
}

function apply() {
  Object.defineProperties(globalThis, {
    Observable: {
      value: Observable,
      configurable: true,
      writable: true,
    },
    Subscriber: {
      value: Subscriber,
      configurable: true,
      writable: true,
    },
  });

  EventTarget.prototype.when = function (type, options = {}) {
    // Step 1: If this’s relevant global object is a Window object, and its associated Document is not fully active, then return.
    if (isBrowserContext() && !isDocumentFullyActive(document)) return;

    // Step 2: Let event target be this.
    const eventTarget = this;

    // Step 3: Let observable be a new Observable, initialized with a subscribe callback.
    return new Observable((subscriber) => {
      // Step 3.1: If event target is null, abort these steps.
      if (!eventTarget) return;

      // Step 3.2: If subscriber’s subscription controller’s signal is aborted, then return.
      if (subscriber.signal.aborted) return;

      // Step 3.3: Add an event listener with the following configuration:
      // - type: type (passed as argument)
      // - callback: A new Web IDL EventListener instance that invokes subscriber.next(event)
      // - capture: options.capture (default false)
      // - passive: options.passive (default undefined)
      // - once: false (explicitly set per spec)
      // - signal: subscriber.signal (for aborting the subscription)
      const listener = (event) => {
        // Observable event listener invoke algorithm: Run subscriber’s next() method with event.
        subscriber.next(event);
      };

      eventTarget.addEventListener(type, listener, {
        capture: options.capture || false,
        passive: options.passive,
        once: false, // Explicitly false as required by spec
        signal: subscriber.signal,
      });
    });
  };
}

export { Observable, Subscriber, isPolyfilled, isSupported, apply };
