

interface Logger {
    info(any, ...args: any[]): void;
    warning(any, ...args: any[]) : void;
    error(any, ...args: any[]) : void;
};


function assert(check: any): boolean {
    if (!check) {
        //todo: log message
        throw "Assignment check failed";
    }
    return check;
}
 