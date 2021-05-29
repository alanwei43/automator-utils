import path from "path";
import { YamlConfig, Automator, YamlActionConfig } from "../../src/index";

test("自动化脚本 基于代码配置", async () => {
    const auto = new Automator({
        "modulesRootDir": path.join(__dirname, "modules")
    });
    const steps = [{
        "id": "/RootModule",
    }, "/share/ShareModule"];
    const actions: YamlActionConfig = {
        "name": "action-1",
        "steps": steps
    };
    const config: YamlConfig = {
        "name": "jack",
        "actions": [actions]
    };
    const all = await auto.getActions(config);
    const action = all.get("action-1");
    const compose = await action({
        map: (letter: string) => letter.toUpperCase()
    }, {
    })
    const result = await compose.run();
    expect(result).toBe("ALAN WEI");
});

test("自动化脚本 基于配置文件", async () => {
    const auto = new Automator({
        "modulesRootDir": path.join(__dirname, "modules")
    });
    const all = await auto.getActionsByFile(path.join(__dirname, "modules", "config.yml"));
    const action = all.get("action-1");
    const compose = await action({
        map: (letter: string) => letter.toUpperCase()
    }, {
    })
    const result = await compose.run();
    expect(result).toBe("ALAN WEI");
});
/**
 * util 正确传递
 * compose.run(...) 正确传递
 */