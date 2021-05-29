export interface StringMap { [key: string]: string }
export type PlainObjectGeneric<T> = { [key: string]: string | number | boolean | T | PlainObjectGeneric<T> }
export type PlainObject = PlainObjectGeneric<null>