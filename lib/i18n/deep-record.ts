/** Same nested shape as the template; every leaf is a string. */
export type DeepRecord<T> = T extends string
  ? string
  : T extends readonly (infer _U)[]
    ? DeepRecord<T[number]>[]
    : { [K in keyof T]: DeepRecord<T[K]> };