var Tablify;
(function (Tablify) {
    var TableStore = (function () {
        function TableStore() {
            this.tableList = [];
            this.onTableRegistered = null;
            this.onTableUnregistered = null;
        }
        TableStore.prototype.getTableByElement = function (table) {
            for (var i = 0; i < this.tableList.length; ++i) {
                if (this.tableList[i].representsTable(table)) {
                    return this.tableList[i];
                }
            }
            return null;
        };
        TableStore.prototype.getTableById = function (tableId) {
            Tablify.assert_argumentsNotNull(arguments);
            for (var i = 0; i < this.tableList.length; ++i) {
                if (this.tableList[i].tableId === tableId) {
                    return this.tableList[i];
                }
            }
            return null;
        };
        TableStore.prototype.registerTable = function (table) {
            Tablify.assert_argumentsNotNull(arguments);
            this.tableList.push(table);
            if (typeof this.onTableRegistered === "function") {
                this.onTableRegistered(table);
            }
        };
        TableStore.prototype.unregisterTable = function (table) {
            Tablify.assert_argumentsNotNull(arguments);
            for (var i = 0; i < this.tableList.length; ++i) {
                if (this.tableList[i] === table) {
                    this.tableList.splice(i, 1);
                    if (typeof this.onTableUnregistered === "function") {
                        this.onTableUnregistered(table);
                    }
                    return;
                }
            }
            Tablify.logger.error("Unregister table failed. No such table in the list.");
        };
        return TableStore;
    })();
    ;
    Tablify.tableStore = new TableStore();
})(Tablify || (Tablify = {}));
