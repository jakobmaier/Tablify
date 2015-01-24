/// <reference path="JsGrid.ts" />


//Todo: merge with the Fave-Logger to add additional functionality

module JsGrid {

    export var inputValidation: boolean = true;     //For debugging purposes only: If true, input parameters are better validated and log messages will be generated


    interface ILogger {
        log(...args: any[]): void;
        info(...args: any[]): void;
        warning(...args: any[]): void;
        error(...args: any[]): void;
        logIf(check: boolean, ...args: any[]): void;
        infoIf(check: boolean, ...args: any[]): void;
        warningIf(check: boolean, ...args: any[]): void;
        errorIf(check: boolean, ...args: any[]): void;
    }

    class ConsoleLogger implements ILogger {
        log(...args: any[]): void {
            console.log.apply(console, arguments);
        }
        info(...args: any[]): void {
            console.info.apply(console, arguments);
        }
        warning(...args: any[]): void {
            console.warn.apply(console, arguments);
        }
        error(...args: any[]): void {
            console.error.apply(console, arguments);
        }

        logIf(check: boolean, ...args: any[]): void {
            if (check) {
                this.log.apply(this, args);
            }
        }
        infoIf(check: boolean, ...args: any[]): void {
            if (check) {
                this.info.apply(this, args);
            }
        }
        warningIf(check: boolean, ...args: any[]): void {
            if (check) {
                this.warning.apply(this, args);
            }
        }
        errorIf(check: boolean, ...args: any[]): void {
            if (check) {
                this.error.apply(this, args);
            }
        }
    }

    export var logger: ILogger = new ConsoleLogger();

    
    /*
     * If the check evaluates to false, an error message is logged. No exception is thrown.
     * @check   boolean     true: everything ok; false: error
     * @...     mixed       Any additional information that should be logged if check is false
     * @return  boolean     true: everything ok; false: an error has been logged
     */
    export function weakAssert(check: boolean, ...args: any[]): boolean {
        if (!check) {
            var err: any = new Error();
            var errorMsg: any[] = ["Assertion failed", err.stack, "\n"];
            logger.error.apply(this, errorMsg.concat(args));
           
        }
        return check;
    }

    /*
     * If the check evaluates to false, an error message is logged and an exception is thrown.
     * @check   boolean     true: everything ok; false: error
     * @...     mixed       Any additional information that should be logged if check is false
     * @return  boolean     true: everything ok; false: an error has been logged
     */
    export function assert(check: boolean, ...args: any[]): boolean {
        if (!weakAssert.apply(this, arguments)) {
            throw new Error("Assertion failed");
        }
        return check;
    }
    
    /*
     * Can be used in functions to ensure that null hasn't been passed.
     * Evaluates all arguments and logs an error for each argument that is null.
     * @funcArgs   []       argument list
     * @...     mixed       Any additional information that should be logged if an argument is null
     * @return  boolean     true: everything ok; false: one or more errors have been logged
     */
    export function assert_argumentsNotNull(funcArgs: IArguments, ...args: any[]) : boolean{
        var ok: boolean = true;
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
}
 
