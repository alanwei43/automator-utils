import { deepClonePlainObject } from "../index";
test("utils assignDeep 简单对象clone", () => {
    const target = deepClonePlainObject<any>({ fn: "Alan" }, { ln: "Wei" });
    expect(target.fn).toBe("Alan");
    expect(target.ln).toBe("Wei");
});
test("utils assignDeep 嵌套对象clone", () => {
    const target = deepClonePlainObject<any>({
        fn: "Alan",
        company: { address: "bj" },
        first: { id: "hello" },
        hasValue: { desc: "some value" },
        shouldNotOverride: "value"
    }, {
        ln: "Wei",
        company: { name: "Jest", people: 10 },
        second: { id: "world" },
        week: ["Sunday", "Friday"],
        hasValue: null,
        shouldNotOverride: null
    });
    expect(target.fn).toBe("Alan");
    expect(target.ln).toBe("Wei");
    expect(target.company.name).toBe("Jest");
    expect(target.company.people).toBe(10);
    expect(target.company.address).toBe("bj");

    expect(target.first.id).toBe("hello");
    expect(target.second.id).toBe("world");

    expect(target.week.join(",")).toBe("Sunday,Friday");

    expect(target.hasValue.desc).toBe("some value");
    expect(target.shouldNotOverride).toBe("value");
});