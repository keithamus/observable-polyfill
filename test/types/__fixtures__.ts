import "observable-polyfill";

export const stringObservable = new Observable<string>(() => {});
export const numberObservable = new Observable<number>(() => {});

export async function* count() {
  let i = 0;
  while (true) {
    await new Promise((resolve) => setTimeout(resolve, 100));
    yield i++;
  }
}

export const signal = new AbortController().signal;

export const isFoo = (value: string): value is "foo" => value === "foo";
