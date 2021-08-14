const AutomatorUtils = require("../../../../dist/index");

class ToUpperCase extends AutomatorUtils.StepMiddleware {
    execute(next, uitls, text) {
        const cmd = this.ctor.cmd || {};
        return (cmd.name + "").toUpperCase();
    }
}

exports.ToUpperCase = ToUpperCase;