export type StringMap = IMap<string>
export type BaseTypeMap = IMap<BaseType>

/**
 * 包含基本类型和其数组类型
 */
export type BaseTypes = BaseType | Array<BaseType> 
/**
 * 基本类型
 */
export type BaseType = string | number | boolean 
export type IMapDeep<T> = { [key: string]: T | IMapDeep<T> }
export type IMap<T> = { [key: string]: T }