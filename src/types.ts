export interface StringMap { [key: string]: string }
export type PlainObject = PlainObjectGeneric<string | number | boolean>
export type PlainObjectGeneric<T> = {
    [key: string]: T
}