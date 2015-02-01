/// <reference path="Tablify.ts" />


module Tablify {

    /*
     * Contains all Tables, that are currently active on the web page.
     */
    class TableStore {
        /*[Readonly]*/ tableList: Table[] = [];                 //List of all Tables that are available on the page. This list is neccessary in order to find/retrieve Table objects by an element selector
      
        //Callback handlers:
        onTableRegistered: (table: Table) => void = null;       //Is called everytime a new table is initialised
        onTableUnregistered: (table: Table) => void = null;     //Is called everytime an existing table is destroyed



        /*
         * Returns the Table-instance that manages a specific HTMLTableElement. If the given HTMLElement is not managed by any Table instance, null is returned
         * @table   JQuery      References an HTMLTableElement. If this HTMLTableElement is managed by an existing table object, the corresponding object is returned
         * @return  Table       The Table-Object that manages the given HTTMLTableElement. If the Element isn't managed, null is being returned.
         */
        getTableByElement(table: JQuery): Table {
            for (var i = 0; i < this.tableList.length; ++i) {
                if (this.tableList[i].representsTable(table)) {
                    return this.tableList[i];
                }
            }
            return null;
        }

        /*
         * Returns the Table-instance with a specific id. If the id does not exist, null is returned
         * @tableId  string     tableId of the table, whose instance should be returned
         * @return  Table       The Table-Object with the given tableId. If the id does not exist, null is being returned.
         */
        getTableById(tableId: string): Table {
            assert_argumentsNotNull(arguments);
            for (var i = 0; i < this.tableList.length; ++i) {
                if (this.tableList[i].tableId === tableId) {
                    return this.tableList[i];
                }
            }
            return null;
        }

        /*
         * [Internal]
         * Adds a table to the internal list
         */
        registerTable(table: Table): void {
            assert_argumentsNotNull(arguments);
            this.tableList.push(table);
            if (typeof this.onTableRegistered === "function") {
                this.onTableRegistered(table);
            }
        }

        /*
         * [Internal]
         * Removes a table from the internal list
         */
        unregisterTable(table: Table): void {
            assert_argumentsNotNull(arguments);
            for (var i = 0; i < this.tableList.length; ++i) {
                if (this.tableList[i] === table) {
                    this.tableList.splice(i, 1);
                    if (typeof this.onTableUnregistered === "function") {
                        this.onTableUnregistered(table);
                    }
                    return;
                }
            }
            logger.error("Unregister table failed. No such table in the list.");
        }
    };
    export var tableStore: TableStore = new TableStore();    //Singleton

} 