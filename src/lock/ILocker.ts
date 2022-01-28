export interface ILocker {
  tryLock(key: string): Promise<boolean>
  unLock(key: string): void
}