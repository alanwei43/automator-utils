export interface StringMap { [key: string]: string }
export type PlainObject = {
    [key: string]: string | number | boolean
}
export type PlainObjectGeneric<T> = {
    [key: string]: string | number | boolean | T
}