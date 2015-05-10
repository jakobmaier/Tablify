/// <reference path="Tablify.ts" />

module Tablify {
    "use strict";

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
         * @table   Selector        If the referenced HTMLElement is managed by an existing table object, the corresponding object is returned
         * @return  Table           The Table-Object that manages the given HTTMLTableElement. If the Element isn't managed, null is being returned.
         */
        getTableByElement(table: Selector): Table {
            for (var i = 0; i < this.tableList.length; ++i) {
                if (this.tableList[i].representsTable(table)) {
                    return this.tableList[i];
                }
            }
            return null;
        }

        /*
         * Returns the Table-instance with a specific id. If the id does not exist, null is returned
         * @tableId     string      tableId of the table, whose instance should be returned
         * @return      Table       The Table-Object with the given tableId. If the id does not exist, null is being returned.
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
         * Returns the requested Table instance.
         * @tableId     string      First tries to return the table with the given tableId. If there is no such table, the string will be interpreted as a jQuery selector
         *              Selector    If the referenced HTMLElement is managed by an existing table object, the corresponding object is returned
         * @return      Table       The Table-Object with the given tableId. If the id does not exist, null is being returned.
         * Note: Using "getTableByElement" and "getTableById()" might be slightly more efficient
         */
        getTable(table: string|Selector): Table {
            if (typeof table === "string") {        //First try to interpret it as a tableId, then interpret it as a selector
                return this.getTableById(table) || this.getTableByElement(table);                
            }
            return this.getTableByElement(table);   //JQuery / Element
        }


        /*
         * Calls func for each table on the page. If func returns false, iterating will be aborted.
         * @func        (Table)=>boolean   Is called for each table on the page. Returns the Table as a parameter. If the iteration should be aborted, false can be returned.   
         * @return      TableStore         Returns the tableStore
         */
        eachTable(func: (Table) => void|boolean): TableStore {
            var self = this;
            for (var i = 0; i < this.tableList.length; ++i) {
                if (func(this.tableList[i]) === false) {
                    return this;
                }
            }
            return this;
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