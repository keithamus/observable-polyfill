import "observable-polyfill";

export const stringObservable = new Observable<string>(() => {});

export const signal = new AbortController().signal;
