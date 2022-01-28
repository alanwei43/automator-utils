import { FileLocker } from "../FileLocker";

test("正确获取lock", async () => {
  const locker = new FileLocker({ dir: "logs", fileNamePrefix: "def" });
  locker.unLock("hello");
  locker.unLock("world");

  const [lockSuccess, lockFail, lock3] = await Promise.all([locker.tryLock("hello"), locker.tryLock("hello"), locker.tryLock("world")]);

  expect(lockSuccess).toEqual(true);
  expect(lockFail).toEqual(false);
  expect(lock3).toEqual(true);

});