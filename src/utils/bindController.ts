export function bindMethods<T extends object>(instance: T): T {
  const proto = Object.getPrototypeOf(instance);

  Object.getOwnPropertyNames(proto)
    .filter((prop) => {
      const descriptor = Object.getOwnPropertyDescriptor(proto, prop);
      return typeof descriptor?.value === "function" && prop !== "constructor";
    })
    .forEach((method) => {
      const fn = (instance as any)[method];
      if (typeof fn === "function") {
        (instance as any)[method] = fn.bind(instance);
      }
    });

  return instance;
}
