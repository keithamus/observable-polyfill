const [Observable, Subscriber] = (() => {
  function enumerate(obj, key, enumerable = true) {
    Object.defineProperty(obj, key, {
      ...Object.getOwnPropertyDescriptor(obj, key),
      enumerable,
    });
  }

  const noop = () => {};

  const privateState = new WeakMap();

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
    // 1. If subscriber’s active is false, then return.
    if (!privateState.has(subscriber)) return;

    const state = privateState.get(subscriber);
    // 2. Set subscriber’s active boolean to false.
    privateState.delete(subscriber);

    // 3. Signal abort subscriber’s subscription controller with reason, if it
    // is given.
    state.subscriptionController.abort(reason);

    // 4. For each teardown of subscriber’s teardown callbacks sorted in
    // reverse insertion order:
    for (const teardown of state.teardowns.reverse()) {
      // 4.1. If subscriber’s relevant global object is a Window object, and
      // its associated Document is not fully active, then abort these steps.

      // 4.2. Invoke teardown.
      teardown();
    }
  }

  // https://wicg.github.io/observable/#observable-subscribe-to-an-observable
  function subscribeTo(observable, observer, options = {}) {
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

    // 5. Let subscriber be a new Subscriber, initialized as...
    const subscriber = new Subscriber(internalObserver);

    // 6. If options’s signal exists, then:
    if ("signal" in options) {
      // 6.1. If options’s signal is aborted, then close subscriber.
      if (options.signal.aborted)
        closeASubscription(subscriber, options.signal.reason);
      // 6.2. Otherwise, add the following abort algorithm to options’s signal:
      else
        options.signal.addEventListener("abort", () =>
          // 6.2.1 Close subscriber.
          closeASubscription(subscriber, options.signal.reason),
        );
    }

    const subscribe = privateState.get(observable);
    // 7. If observable's subscribe callback is a SubscribeCallback, invoke it with subscriber.
    if (subscribe) {
      // If an exception E was thrown, call subscriber’s error() method with E.
      try {
        subscribe(subscriber);
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
        observer: internalObserver,
        teardowns: [],
        subscriptionController: new AbortController(),
      });
    }

    // https://wicg.github.io/observable/#dom-subscriber-next
    next(value) {
      if (!(this instanceof Subscriber))
        throw new TypeError("illegal invocation");
      if (!arguments.length) throw new TypeError("too few arguments");

      // 1. If this's active is false, then return.
      if (!privateState.has(this)) return;

      // 3. Run this's next algorithm given value.
      privateState.get(this).observer.next(value);
    }

    // https://wicg.github.io/observable/#dom-subscriber-error
    error(error) {
      if (!(this instanceof Subscriber))
        throw new TypeError("illegal invocation");

      if (!arguments.length) throw new TypeError("too few arguments");

      // 1. If this's active is false, then return.
      if (!privateState.has(this)) return;

      let observer = privateState.get(this).observer;

      // 3. Close this.
      closeASubscription(this);

      // 4. Run this's error algorithm given error.
      observer.error(error);
    }

    // https://wicg.github.io/observable/#dom-subscriber-complete
    complete() {
      if (!(this instanceof Subscriber))
        throw new TypeError("illegal invocation");

      // 1. If this's active is false, then return.
      if (!privateState.has(this)) return;

      let observer = privateState.get(this).observer;

      // 3. Close this.
      closeASubscription(this);

      // 4. Run this's complete algorithm.
      observer.complete();
    }

    // https://wicg.github.io/observable/#dom-subscriber-addteardown
    addTeardown(teardown) {
      if (!(this instanceof Subscriber))
        throw new TypeError("illegal invocation");

      if (typeof teardown != "function") {
        throw new TypeError(`Parameter 1 is not of type 'Function'`);
      }
      // 2. If this's active is true, then append teardown to this's teardown callbacks list.
      if (privateState.has(this))
        privateState.get(this).teardowns.push(teardown);
      // 3. Otherwise, invoke teardown.
      else teardown();
    }

    get active() {
      if (!(this instanceof Subscriber))
        throw new TypeError("illegal invocation");

      return privateState.has(this);
    }

    get signal() {
      if (!(this instanceof Subscriber))
        throw new TypeError("illegal invocation");

      if (!privateState.has(this)) {
        const controller = new AbortController();
        controller.abort(); // TODO we need the reason here - how to get it without subscriptionController?
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
    constructor(subscriberCallback) {
      if (!subscriberCallback) {
        throw new TypeError("1 argument required but 0 present");
      }
      privateState.set(this, subscriberCallback);
    }

    // https://wicg.github.io/observable/#observable-from
    static from(value) {
      // 1. If value is an Observable, then return value.
      if (value instanceof Observable) return value;

      // 2. Let asyncIteratorMethodRecord be GetMethod(value, %Symbol.asyncIterator%).
      if (Symbol.asyncIterator in value) {
        try {
          // 3. If asyncIteratorMethodRecord is a normal completion and asyncIteratorMethodRecord’s [[Value]] is not undefined, then:
          value[Symbol.asyncIterator](); // trigger a completion record
          // 3.1. Let nextAlgorithm be the following steps, given iterator:
          function nextAlgorithm(subscriber, iterator) {
            // 3.1.1 If iterator’s [[Done]] is true, then:
            if (iterator.done)
              // 2.1.1.1 Run subscriber’s complete() method and abort these steps.
              return subscriber.complete();
            // 3.1.2 Let nextRecord be IteratorStepValue(iterator).
            // 3.1.3 Let nextPromise be undefined.
            let nextPromise = undefined;
            try {
              // 3.1.5 Otherwise, set nextPromise to nextRecord’s [[Value]].
              nextPromise = iterator.next().value;
              // 3.1.4 If nextRecord is a throw completion then:
            } catch (e) {
              // 3.1.4.1 Set nextPromise to a promise rejected with nextRecord’s [[Value]].
              nextPromise = Promise.reject(e);
            }
            // 3.1.6 Upon fulfillment of nextPromise, run the following steps, given resolution:
            nextPromise
              .then((resolution) => {
                // 3.1.6.1. Run subscriber’s next() method, given resolution.
                subscriber.next(resolution);
                // 3.1.6.2. Run nextAlgorithm, given iterator.
                nextAlgorithm(subscriber, iterator);
              })
              // 6.1.7 Upon rejection of nextPromise, run the following steps, given rejection:
              .catch((rejection) => {
                // 6.1.7.1 Run subscriber’s error() method, given rejection.
                subscriber.error(rejection);
              });
          }
          // 3.2 Return a new Observable whose subscribe callback is an algorithm that takes a Subscriber subscriber and does the following:
          return new Observable((subscriber) => {
            // 3.2.1 Let iteratorRecord be GetIteratorFromMethod(value, %Symbol.asyncIterator%).
            try {
              let iterator = value[Symbol.asyncIterator]();
              // 3.2.3 Otherwise, queue a microtask to perform the following steps:
              queueMicrotask(() => {
                // 3.2.3.1. Run nextAlgorithm given iteratorRecord’s [[Value]].
                nextAlgorithm(subscriber, iterator);
              });
              // 3.2.2 If iteratorRecord is a throw completion then:
            } catch (e) {
              // 3.2.2.1 queue a microtask to perform the following steps:
              queueMicrotask(() => {
                // 3.2.2.1.1 Run subscriber’s error() method, given iteratorRecord’s [[Value]].
                subscriber.error(e);
              });
            }
          });
        } catch (e) {}
      }
      // 4. Let iteratorMethodRecord be GetMethod(value, %Symbol.iterator%).
      if (Symbol.iterator in value) {
        try {
          // 5. If iteratorMethodRecord is a normal completion and iteratorMethodRecord’s [[Value]] is not undefined, then:
          value[Symbol.iterator](); // trigger a completion record
          // 5.1 Return a new Observable whose subscribe callback is an algorithm that takes a Subscriber subscriber and does the following:
          return new Observable((subscriber) => {
            // 5.1.1 Let iteratorRecord be GetIteratorFromMethod(value, %Symbol.asyncIterator%).
            try {
              // 5.1.3 Let iterator be iteratorRecord’s [[Value]].
              const iterator = value[Symbol.iterator]();
              // 5.1.4 Repeat:
              while (true) {
                const nextRecord = iterator.next();
                // 5.1.5. If iterator’s [[Done]] is true, then:
                if (nextRecord.done) {
                  break;
                }
                // 5.1.5.2 Let nextRecord be IteratorStepValue(iterator).
                try {
                  // 5.1.5.4. Run subscriber’s next() given nextRecord’s [[Value]].
                  subscriber.next(nextRecord.value);
                  // 5.1.5.3. If nextRecord is a throw completion then:
                } catch (e) {
                  // 5.1.5.3.1. Run subscriber’s error() method, given nextRecord’s [[Value]].
                  subscriber.error(e);
                  // 5.1.5.3.2. Abort these steps.
                  return;
                }
              }
              // 5.1.5.1 Run subscriber’s complete() method and abort these steps.
              subscriber.complete();
              // 5.1.2. If iteratorRecord is a throw completion then:
            } catch (e) {
              // 5.1.3. Run subscriber’s error() method, given iteratorRecord’s [[Value]].
              // 5.1.4 Abort these steps.
              subscriber.error(e);
            }
          });
        } catch (e) {}
      }

      // 6. If IsPromise(value) is true, then:
      if (value instanceof Promise) {
        // 6.1. Return a new Observable whose subscribe callback is an algorithm that takes a Subscriber subscriber and does the following:
        return new Observable((subscriber) => {
          // 6.1.1 Upon fulfillment of value, run the following steps, given resolution:
          value
            .then((resolution) => {
              // 6.1.1.1 Run subscriber’s next() method, given resolution.
              subscriber.next(resolution);
              // 6.1.1.2 Run subscriber’s complete() method.
              subscriber.complete();
            })
            // 6.1.2 Upon rejection of value, run the following steps, given rejection:
            .catch((rejection) => {
              subscriber.error(rejection);
            });
        });
      }

      // 7. Throw a TypeError.
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
            globalThis.reportError(e);
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
          let dependantAbortController = new AbortController();
          subscriber.signal.addEventListener(
            "abort",
            () => dependantAbortController.abort(),
            { once: true },
          );
          if (activeInnerAbortController)
            activeInnerAbortController.signal.addEventListener(
              "abort",
              () => dependantAbortController.abort(),
              { once: true },
            );
          let innerOptions = { signal: dependantAbortController.signal };
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

    // https://pr-preview.s3.amazonaws.com/WICG/observable/pull/153.html#dom-observable-finally
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
        // 2.1. Let finally callback steps be the following steps:
        function finallyCallback() {
          // 2.1.1. Invoke callback.
          try {
            callback();
          } catch (e) {
            subscriber.error(e);
          }
        }
        // 2.2. Add the algorithm finally callback steps to subscriber’s signal.
        subscriber.signal.addEventListener("abort", finallyCallback);
        // 3. Let sourceObserver be a new internal observer, initialized as follows:
        let sourceObserver = new InternalObserver({
          next(value) {
            // Run subscriber’s next() method, given the passed in value.
            subscriber.next(value);
          },
          error(value) {
            // 1. Run the finally callback steps.
            finallyCallback();
            // 2. Run subscriber’s error() method, given the passed in error.
            subscriber.error(value);
          },
          complete() {
            // 1. Run the finally callback steps.
            finallyCallback();
            // 2. Run subscriber’s complete() method.
            subscriber.complete(value);
          },
        });
        // 3. Let options be a new SubscribeOptions whose signal is subscriber’s subscription controller's signal.
        let options = { signal: subscriber.signal };
        // 4. Subscribe to sourceObservable given sourceObserver and options.
        subscribeTo(sourceObservable, sourceObserver, options);
      });
    }

    // https://wicg.github.io/observable/#dom-observable-toarray
    toArray(options = {}) {
      if (!(this instanceof Observable))
        throw new TypeError("illegal invocation");
      let resolve, reject;
      // 1. Let p a new promise.
      let p = new Promise((res, rej) => ((resolve = res), (reject = rej)));
      // 2. If options’s signal is not null:
      if (options.signal) {
        // 2.1. If options’s signal is aborted, then:
        if (options.signal.aborted) {
          // 2.1.1. Reject p with options’s signal's abort reason.
          // 2.1.2. Return p.
          return Promise.reject(options.signal.reason);
        }
        // 2.2. Add the following abort algorithm to options’s signal:
        options.signal.addEventListener("abort", (e) => {
          // 2.2.1. Reject p with options’s signal's abort reason.
          reject(e.reason);
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
      let resolve, reject;
      // 1. Let p a new promise.
      let p = new Promise((res, rej) => ((resolve = res), (reject = rej)));
      // 2. Let visitor callback controller be a new AbortController.
      let visitorCallbackController = new AbortController();
      // 3. Let internal options be a new SubscribeOptions whose signal is the
      // result of creating a dependent abort signal from the list «visitor
      // callback controller’s signal, options’s signal if non-null», using
      // AbortSignal, and the current realm.
      let dependantAbortController = new AbortController();
      visitorCallbackController.signal.addEventListener("abort", (e) =>
        dependantAbortController.abort(e.reason),
      );
      if (options.signal)
        options.signal.addEventListener("abort", (e) =>
          dependantAbortController.abort(e.reason),
        );
      let internalOptions = { signal: dependantAbortController.signal };
      // 4. If internal options’s signal is aborted, then:
      if (internalOptions.signal.aborted) {
        // 4.1. Reject p with internal options’s signal's abort reason.
        reject(internalOptions.signal.reason);
        // 4.2. Return p.
        return p;
      }
      // 5. Add the following abort algorithm to internal options’s signal:
      dependantAbortController.signal.addEventListener("abort", (e) => {
        // Reject p with internal options’s signal's abort reason.
        reject(e.reason);
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
      // 5. Subscribe to this given observer and options.
      subscribeTo(this, observer, options);
      // 6. Return p.
      return p;
    }

    // https://wicg.github.io/observable/#dom-observable-every
    every(predicate, options = {}) {
      if (!(this instanceof Observable))
        throw new TypeError("illegal invocation");
      if (typeof predicate !== "function")
        throw new TypeError(`Parameter 1 is not of type 'Function'`);
      let resolve, reject;
      // 1. Let p a new promise.
      let p = new Promise((res, rej) => ((resolve = res), (reject = rej)));
      // 2. Let controller be a new AbortController.
      let controller = new AbortController();
      // 3. Let internal options be a new SubscribeOptions whose signal is the
      // result of creating a dependent abort signal from the list «controller’s
      // signal, options’s signal if non-null», using AbortSignal, and the
      // current realm.
      let dependantAbortController = new AbortController();
      controller.signal.addEventListener("abort", (e) =>
        dependantAbortController.abort(e.reason),
      );
      if (options.signal)
        options.signal.addEventListener("abort", (e) =>
          dependantAbortController.abort(e.reason),
        );
      let internalOptions = { signal: dependantAbortController.signal };
      // 4. If internal options’s signal is aborted, then:
      if (internalOptions.signal.aborted) {
        // 4.1. Reject p with internal options’s signal's abort reason.
        reject(internalOptions.signal.reason);
        // 4.2. Return p.
        return p;
      }
      // 5. Add the following abort algorithm to internal options’s signal:
      dependantAbortController.signal.addEventListener("abort", (e) => {
        // Reject p with internal options’s signal's abort reason.
        reject(e.reason);
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
          // 2. Increment idx.
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
      // 5. Subscribe to this given observer and options.
      subscribeTo(this, observer, options);
      // 6. Return p.
      return p;
    }

    // https://wicg.github.io/observable/#dom-observable-first
    first(options = {}) {
      if (!(this instanceof Observable))
        throw new TypeError("illegal invocation");
      let resolve, reject;
      // 1. Let p a new promise.
      let p = new Promise((res, rej) => ((resolve = res), (reject = rej)));
      // 2. Let controller be a new AbortController.
      let controller = new AbortController();
      // 3. Let internal options be a new SubscribeOptions whose signal is the
      // result of creating a dependent abort signal from the list «controller’s
      // signal, options’s signal if non-null», using AbortSignal, and the
      // current realm.
      let dependantAbortController = new AbortController();
      controller.signal.addEventListener("abort", (e) =>
        dependantAbortController.abort(e.reason),
      );
      if (options.signal)
        options.signal.addEventListener("abort", (e) =>
          dependantAbortController.abort(e.reason),
        );
      let internalOptions = { signal: dependantAbortController.signal };
      // 4. If internal options’s signal is aborted, then:
      if (internalOptions.signal.aborted) {
        // 4.1. Reject p with internal options’s signal's abort reason.
        reject(internalOptions.signal.reason);
        // 4.2. Return p.
        return p;
      }
      // 5. Add the following abort algorithm to internal options’s signal:
      dependantAbortController.signal.addEventListener("abort", (e) => {
        // Reject p with internal options’s signal's abort reason.
        reject(e.reason);
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
          // Resolve p with true.
          resolve(true);
        },
      });
      // 5. Subscribe to this given observer and options.
      subscribeTo(this, observer, options);
      // 6. Return p.
      return p;
    }

    // https://wicg.github.io/observable/#dom-observable-last
    last(options = {}) {
      if (!(this instanceof Observable))
        throw new TypeError("illegal invocation");
      let resolve, reject;
      // 1. Let p a new promise.
      let p = new Promise((res, rej) => ((resolve = res), (reject = rej)));
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
        options.signal.addEventListener("abort", (e) => {
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
      let resolve, reject;
      // 1. Let p a new promise.
      let p = new Promise((res, rej) => ((resolve = res), (reject = rej)));
      // 2. Let controller be a new AbortController.
      let controller = new AbortController();
      // 3. Let internal options be a new SubscribeOptions whose signal is the
      // result of creating a dependent abort signal from the list «controller’s
      // signal, options’s signal if non-null», using AbortSignal, and the
      // current realm.
      let dependantAbortController = new AbortController();
      controller.signal.addEventListener("abort", (e) =>
        dependantAbortController.abort(e.reason),
      );
      if (options.signal)
        options.signal.addEventListener("abort", (e) =>
          dependantAbortController.abort(e.reason),
        );
      let internalOptions = { signal: dependantAbortController.signal };
      // 4. If internal options’s signal is aborted, then:
      if (internalOptions.signal.aborted) {
        // 4.1. Reject p with internal options’s signal's abort reason.
        reject(internalOptions.signal.reason);
        // 4.2. Return p.
        return p;
      }
      // 5. Add the following abort algorithm to internal options’s signal:
      dependantAbortController.signal.addEventListener("abort", (e) => {
        // Reject p with internal options’s signal's abort reason.
        reject(e.reason);
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
          // 2. Increment idx.
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
      // 5. Subscribe to this given observer and options.
      subscribeTo(this, observer, options);
      // 6. Return p.
      return p;
    }

    // https://wicg.github.io/observable/#dom-observable-some
    some(predicate, options = {}) {
      if (!(this instanceof Observable))
        throw new TypeError("illegal invocation");
      if (typeof predicate !== "function")
        throw new TypeError(`Parameter 1 is not of type 'Function'`);
      let resolve, reject;
      // 1. Let p a new promise.
      let p = new Promise((res, rej) => ((resolve = res), (reject = rej)));
      // 2. Let controller be a new AbortController.
      let controller = new AbortController();
      // 3. Let internal options be a new SubscribeOptions whose signal is the
      // result of creating a dependent abort signal from the list «controller’s
      // signal, options’s signal if non-null», using AbortSignal, and the
      // current realm.
      let dependantAbortController = new AbortController();
      controller.signal.addEventListener("abort", (e) =>
        dependantAbortController.abort(e.reason),
      );
      if (options.signal)
        options.signal.addEventListener("abort", (e) =>
          dependantAbortController.abort(e.reason),
        );
      let internalOptions = { signal: dependantAbortController.signal };
      // 4. If internal options’s signal is aborted, then:
      if (internalOptions.signal.aborted) {
        // 4.1. Reject p with internal options’s signal's abort reason.
        reject(internalOptions.signal.reason);
        // 4.2. Return p.
        return p;
      }
      // 5. Add the following abort algorithm to internal options’s signal:
      dependantAbortController.signal.addEventListener("abort", (e) => {
        // Reject p with internal options’s signal's abort reason.
        reject(e.reason);
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
          // 2. Increment idx.
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
      // 5. Subscribe to this given observer and options.
      subscribeTo(this, observer, options);
      // 6. Return p.
      return p;
    }

    // https://wicg.github.io/observable/#dom-observable-reduce
    reduce(reducer, initialValue, options) {
      if (!(this instanceof Observable))
        throw new TypeError("illegal invocation");
      if (typeof reducer !== "function")
        throw new TypeError(`Parameter 1 is not of type 'Function'`);
      let resolve, reject;
      // 1. Let p a new promise.
      const p = new Promise((res, rej) => ((resolve = res), (reject = rej)));
      // 2. Let controller be a new AbortController.
      const controller = new AbortController();
      // 3 Let internal options be a new SubscribeOptions whose signal is the result of creating a dependent
      // abort signal from the list «controller’s signal, options’s signal if non-null», using AbortSignal, and the current realm.
      const dependantAbortController = new AbortController();
      controller.signal.addEventListener("abort", (e) =>
        dependantAbortController.abort(e.reason),
      );
      if (options?.signal)
        options.signal.addEventListener("abort", (e) =>
          dependantAbortController.abort(e.reason),
        );
      const internalOptions = { signal: dependantAbortController.signal };
      // 4. If internal options’s signal is aborted, then:
      if (internalOptions.signal.aborted) {
        // 4.1 Reject p with internal options’s signal’s abort reason.
        reject(internalOptions.signal.reason);
        // 4.2 Return p.
        return p;
      }
      // 5. Add the following abort algorithm to internal options’s signal:
      internalOptions.signal.addEventListener('abort', () => {
        // 5.1 Reject p with internal options’s signal’s abort reason.
        reject(internalOptions.signal.reason);
      }, { once: true });
      // 6. Let idx be an unsigned long long, initially 0.
      let idx = 0;
      // 7. Let accumulator be initialValue if it is given, and uninitialized otherwise.
      let accumulator = initialValue;
      // 8. Let observer be a new internal observer, initialized as follows:
      const observer = new InternalObserver({
        // next steps
        next(value) {
          // 8.1 If accumulator is uninitialized (meaning no initialValue was passed in), then set accumulator to the passed in value, set idx to idx + 1, and abort these steps.
          if (accumulator === undefined) {
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
          if (accumulator !== undefined) {
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
    if (globalThis.Window && this instanceof Window && !document?.isConnected) {
      return; // Early return if Document isn’t fully active
    }

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
