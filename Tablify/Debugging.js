var Tablify;
(function (Tablify) {
    var ConsoleLogger = (function () {
        function ConsoleLogger() {
        }
        ConsoleLogger.prototype.log = function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i - 0] = arguments[_i];
            }
            console.log.apply(console, arguments);
        };
        ConsoleLogger.prototype.info = function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i - 0] = arguments[_i];
            }
            console.info.apply(console, arguments);
        };
        ConsoleLogger.prototype.warning = function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i - 0] = arguments[_i];
            }
            console.warn.apply(console, arguments);
        };
        ConsoleLogger.prototype.error = function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i - 0] = arguments[_i];
            }
            console.error.apply(console, arguments);
        };
        ConsoleLogger.prototype.logIf = function (check) {
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
            if (check) {
                this.log.apply(this, args);
            }
        };
        ConsoleLogger.prototype.infoIf = function (check) {
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
            if (check) {
                this.info.apply(this, args);
            }
        };
        ConsoleLogger.prototype.warningIf = function (check) {
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
            if (check) {
                this.warning.apply(this, args);
            }
        };
        ConsoleLogger.prototype.errorIf = function (check) {
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
            if (check) {
                this.error.apply(this, args);
            }
        };
        return ConsoleLogger;
    })();
    Tablify.logger = new ConsoleLogger();
    function weakAssert(check) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        if (!check) {
            var err = new Error();
            var errorMsg = ["Assertion failed", err.stack, "\n"];
            Tablify.logger.error.apply(this, errorMsg.concat(args));
        }
        return check;
    }
    Tablify.weakAssert = weakAssert;
    function assert(check) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        if (!weakAssert.apply(this, arguments)) {
            throw new Error("Assertion failed");
        }
        return check;
    }
    Tablify.assert = assert;
    function assert_argumentsNotNull(funcArgs) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        var ok = true;
        for (var i = 0; i < funcArgs.length; ++i) {
            if (funcArgs[i] === null) {
                ok = false;
                weakAssert.apply(this, [false, "Argument " + (i + 1) + " is null."].concat(args));
            }
        }
        if (!ok) {
            throw new Error("Assertion failed");
        }
        return ok;
    }
    Tablify.assert_argumentsNotNull = assert_argumentsNotNull;
})(Tablify || (Tablify = {}));
