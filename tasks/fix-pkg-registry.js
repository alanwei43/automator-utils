const fs = require("fs");

if (fs.existsSync(".npmrc")) {
    fs.unlink(".npmrc");
}
const pkg = JSON.parse(fs.readFileSync("package.json", { encoding: "utf-8" }));
pkg.publishConfig = {
    "registry": "https://npm.pkg.github.com/@alanwei43"
};
fs.writeFileSync("package.json", JSON.stringify(pkg), {
    encoding: "utf-8"
});
console.log("repalced npm registry");