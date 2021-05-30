const fs = require("fs");

if (fs.existsSync(".npmrc")) {
    fs.unlink(".npmrc");
}
const pkg = JSON.parse(fs.readFileSync("package.json", { encoding: "utf-8" }));
pkg.name = "@alanwei43/" + pkg.name;
pkg.publishConfig = {
    "registry": "https://npm.pkg.github.com"
};
fs.writeFileSync("package.json", JSON.stringify(pkg), {
    encoding: "utf-8"
});
fs.writeFileSync(".npmrc", `
@alanwei43:registry=https://npm.pkg.github.com
`, {
    encoding: "utf-8"
});
console.log("repalced npm registry");