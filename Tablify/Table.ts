﻿/// <reference path="Tablify.ts" />

module Tablify {
    "use strict";
      
    export class Table {

        //References to commonly used HTML elements:
        /*[Readonly]*/ table: JQuery = null;    //<table>
        private thead: JQuery;                  //<thead>
        private tbody: JQuery;                  //<tbody>

    
        private static tableIdSequence: number = 0;     //Used to auto-generate unique ids
        /*[Readonly]*/ tableId: string;                 //Unique table id
       
        /*[Readonly]*/ parentCell: Cell = null;        //If this is a nested table, parentCell is the container of the table. This variable is set by the Cell. (If the table gets destroyed, the cell needs to be informed to convert Table into JQuery)


        //Column properties:
        private sortedColumns: Column[] = [];           //All columns, sorted from left to right.
        private columns: { [key: string]: Column; } = {};        // All rows, sorted by their id
        //var columns: Map<string, Column>;             //better alternative to the above definition. However, this is part of EcmaScript6 and currently not supported very well
        
        //Table content - each row is referenced twice for faster access:
        private titleRows: Row[] = [];                  //Rows, which are part of the table head. Sorted by their output order.
        private bodyRows: Row[] = [];                   //Rows, containing the data. Sorted by their output order.
        private rows: { [key: string]: Row; } = {};     //All rows, sorted by their id
 

        
        
        /*
         * Generates and returns a new Tablify Table    (Note: If the given table element is already managed, the old Table-instance will be returned instead of generating a new one)
         * @tableDef        null/undefined              An empty table with no rows and columns will be created.
         *                  string                      tableId. An empty table with the given tableId will be generated.
         *                  TableDefinitionDetails      Data, how the table should look like (rows / columns / ...)
         *                  Table                       The table will be deep-copied.
         *                  TableDescription            Used for deserialisation.
         * @target          string                      JQuery-Selector. Is resolved to a JQuery element (see below)
         *                  JQuery                      References a single HTMLElement. If the Element is a <table> (HTMLTableElement), the Table is initialised with the table content; Otherwise, a new table is generated within the HTMLElement
         *                  Element                     Target element. Is converted to a JQuery element (see above)
         * Note: If no target is passed, the table won't be appended to the DOM.
         * Note: Both parameters are optional. It is also possible to ommit the first parameter and only pass the target.
         * Note: If only a single string is passed, it will be interpreted as an selector rather than a tableId (A string as the first argument is always a selector).
         */
        constructor(target?: Selector);
        constructor(tableDef: TableDefinition, target?: Selector);

        constructor(tableDef?: TableDefinition|Selector, target?: Selector) {  
            if (typeof tableDef === "string" && target) {       //The tableId has been given (2 parameters, the first one is a string)
                this.tableId = tableDef;
            } else {
                this.tableId = "ttid" + (++Table.tableIdSequence);
            }

        //Interchange arguments, if the first parameter has been omitted:
            if (typeof tableDef === "string" || tableDef instanceof jQuery || isElement(tableDef)) {    //If the first parameter is a string, it will always be interpreted as a selector.
                if (arguments.length !== 1) {
                    logger.error("Invalid usage. The first parameter needs to be the TableDefinition, while the second parameter is the target. Both parameters can be ommited, but their order can't be interchanged.");
                    return;
                }
                target = <string|JQuery|Element>tableDef;
                tableDef = null;
            }
        //Find the target for the table:    
            if (!target) {                                  //No target provided -> don't attach to DOM
                logger.log("Creating detached table element.");
                this.table = $("<table><thead></thead><tbody></tbody></table>");
            } else {
            //Find the selected element:
                this.table = resolveUniSelector(target);
                if (!this.table) {
                    logger.error("Unable to find unique DOM Element with the following selector: \"" + target + "\"");
                    return;
                }
            //Check if the selected element can be used: 
                if (this.table.prop("tagName") !== "TABLE") {       //Create a new table within this element
                    logger.log("Appending table element. Parent tag: ", this.table.prop("tagName"));
                    var table = $("<table><thead></thead><tbody></tbody></table>");
                    this.table.append(table);
                    this.table = table;
                } else {
                    if (this.table.hasClass("tablified")) {         //Maybe the table has already been initialised with Tablify? If yes, return the already existing object and don't create a new one
                        var existingObj = tableStore.getTableByElement(this.table);     //expensive operation
                        if (existingObj !== null) {                 //The table is already managed by another Table-instance
                            logger.warning("The given HTML element is already managed by another Table instance (\"" + existingObj.tableId + "\"). The existing instance will be returned instead of creating a new one.");
                            return existingObj;
                        }
                    }
                    //Todo: Read the existing html-table and manage it
                    logger.error("Not implemented yet: Tablify is currently not able to read existing HTML tables and mange them. Tables have to be created completely using Tablify.");
                    this.table = null;
                    return;
                }
            }    
        //The target has been found, now the table needs to be initialised:
            this.table.addClass("tablified");
            this.table.attr("data-tableId", this.tableId);
            tableStore.registerTable(this);

            this.thead = this.table.find("thead");
            this.tbody = this.table.find("tbody");
        //Generate the table content:
            if (!tableDef || typeof tableDef === "string") {    //No content to generate
                return;
            }
            // <TableDefinitionDetails|Table|TableDescription>

            var defDetails: TableDefinitionDetails;

            if (<TableDefinitionDetails|Table|TableDescription>tableDef instanceof Table) {         //Copy-constructor
                defDetails = (<Table>tableDef).toObject(true);
                logger.info("Copying existing table " + (<Table>tableDef).tableId);
            } else {
                defDetails = <TableDefinitionDetails|TableDescription>tableDef;
            }

            if ("columns" in defDetails) {
                for (var i = 0; i < defDetails.columns.length; ++i) {
                    this.addColumn(defDetails.columns[i]);
                }
            }
            if ("rows" in defDetails) {
                var titleRowCount = defDetails.titleRowCount || 0;
                for (var i = 0; i < defDetails.rows.length; ++i) {
                    this.addRow(titleRowCount > i ? RowType.title : RowType.body, defDetails.rows[i]);
                }
            }
        }
        
        /*
         * Returns true, if the table manages the given HTMLelement
         * @table   Selector    References a HTMLElement. If this HTMLElement is managed by this table object, true is returned
         * @return  boolean     true: The given HTMLElement (<table>) is managed by this Table-instance. Otherwise, false is returned
         */
        representsTable(table: Selector): boolean {
            var other = resolveUniSelector(table);
            if (!other) {
                return false;
            }
            return (this.table[0] === other[0]);
        }

        /*
         * Destroys the Tablify Table. This object will get unusable and members as well as member functions must not be used afterwards.
         */
        destroy(): void {
            tableStore.unregisterTable(this);
            this.table.removeClass("tablified");
            this.table.removeAttr("data-tableId");

            if (this.parentCell) {  //This table is nested and part of a Cell that stores a Table reference -> change it into a not-manages Table
                assert(this.parentCell.content === this);
                this.parentCell.content = this.table; 
            }
            this.table = null;
        }
    
        /*
         * Returns true, if the table is part of the DOM
         * @return      boolean         true: The table is part of the DOM; false: the table is detached and not part of the DOM.
         */
        isPartOfDOM(): boolean {
            return jQuery.contains(<any>document, <any>this.table.get(0));
        }

        /*
         * Inserts the table at the end of the target. If the table is already part of the DOM, it will be moved rather than cloned.
         * @target      Selector    target element
         */
        appendTo(target: Selector): void {
            logger.log("Attaching table element.");
            this.table.appendTo(<any>target);       //cast is needed due to the use of an outdated TypeScript version within the jQuery definition
        }

        /*
         * Inserts the table at the beginning of the target. If the table is already part of the DOM, it will be moved rather than cloned.
         * @target      Selector    target element
         */
        prependTo(target: Selector): void {
            logger.log("Attaching table element.");
            this.table.prependTo(<any>target);       //cast is needed due to the use of an outdated TypeScript version within the jQuery definition
        }
        
        /*
         * Adds a new column to the table.
         * @column      null / undefined            The columnId is generated automatically.
         *              string                      ColumnId. The cells of the newly generated column will be empty.
         *              ColumnDefinitionDetails     Contains detailed information on how to generate the new column.
         *              Column                      The column will be deep-copied.
         *              ColumnDescription           Used for deserialisation.
         * @return      Column                      Returns the newly generated Column. Returns null if the column couldn't get generated.
         */
        addColumn(columnDef?: ColumnDefinition): Column {
            var column = new Column(this, columnDef);
            var columnId: string = column.columnId;
            if (columnId in this.columns) {
                logger.error("There is already a column with the id \"" + columnId + "\".");
                return null;
            }
            
            var content: { [key: string]: CellDefinition; } = {};
            var generateMissingRows: boolean = false;
            if (columnDef && typeof columnDef !== "string" && !(columnDef instanceof Column)) {     //ColumnDefinitionDetails / ColumnDescription
                content = (<ColumnDefinitionDetails>columnDef).content || {};
                generateMissingRows = ((<ColumnDefinitionDetails>columnDef).generateMissingRows === true);
            }
            
            if (generateMissingRows) {              //If the content contains data for non-existing rows, the rows should be generated   
                for (var rowId in content) {
                    if (!(rowId in this.rows)) {    //This row does not exist yet      
                        this.addRow(RowType.body, rowId);
                    }
                }
            }
            
            this.columns[columnId] = column;
            this.sortedColumns.push(column);

            //Add a new cell to each row (the DOM will be updated by each row):
            for (var rowId in this.rows) {
                var row: Row = this.rows[rowId];
                var cell: CellDefinition;
                if (rowId in content) {     //The user passed a definition on how to create this cell
                    cell = content[rowId];
                } else {
                    switch (row.rowType) {
                        case RowType.title: cell = column.defaultTitleContent; break;
                        case RowType.body: cell = column.defaultBodyContent; break;
                        default: assert(false, "Invalid RowType given.");
                    }
                }
                row.addColumn(column, cell);
            }
            return column;
        }
        
        /*
         * Adds a new row to the table
         * @rowType     RowType                 The type of the row (title, body, footer).
         * @rowDef      null / undefined        The rowId is generated automatically.
         *              string                  RowId. The cells of the newly generated row will be created using the column's default values.
         *              RowDefinitionDetails    Contains detailed information on how to generate the new row.
         *              Row                     The row will be deep-copied.
         *              RowDescription          Used for deserialisation.
         * @return      Row                     Returns the newly generated Row. Returns null if the row couldn't get generated.
         */
        addRow(rowType: RowType, rowDef?: RowDefinition): Row {
            var row = new Row(this, rowType, rowDef, this.columns);
            var rowId: string = row.rowId;
            
            if (rowId in this.rows) {
                logger.error("There is already a row with the id \"" + rowId + "\".");
                return null;
            }
            this.rows[rowId] = row;
            switch (rowType) {
                case RowType.title: this.titleRows.push(row);
                    this.thead.append(row.generateDom());       //Add the row to the table-head
                    break;
                case RowType.body: this.bodyRows.push(row);
                    this.tbody.append(row.generateDom());       //Add the row to the table-body
                    break;
                default:    assert(false, "Invalid RowType given.");
            }  
            return row;       
        }

        /*
        * Returns the position of a specific row within the table. (=index).
        * The first title row has index 0. The first body row has index "titleRowCount".
        * @identifier      string      The rowId. If the rowId doesn't existing within this table, null is being returned
        *                  Row         Row Object. If the row is not part of this table, null is being returned.
        * @return          number      Returns the index/position of the given row. If the row couldn't be found, null is returned.
        */
        getRowIndex(identifier: string|Row): number {
            //Todo: possible performance improvement: store the index within the Row object.
            var row: Row;
            if (typeof identifier === "string") {
                row = this.rows[identifier];    
                if (!row) {     //The rowId does not exist
                    return null;
                }
            } else {
                row = identifier;
            }
            for (var i = 0; i < this.titleRows.length; ++i) {
                if (this.titleRows[i].equals(row)) {
                    return i;
                }
            }
            for (var i = 0; i < this.bodyRows.length; ++i) {
                if (this.bodyRows[i].equals(row)) {
                    return this.titleRows.length + i;
                }
            }
            return null;
        }
        
        /*
         * Returns the position of a specific column within the table. (=index).
         * The first (=left) column has index 0.
         * @identifier      string      The columnId. If the columnId doesn't existing within this table, null is being returned
         *                  Column      Column Object. If the column is not part of this table, null is being returned.
         * @return          number      Returns the index/position of the given column. If the column couldn't be found, null is returned.
         */
        getColumnIndex(identifier: string|Column): number {
            //Todo: possible performance improvement: store the index within the Column object.
            var column: Column;
            if (typeof identifier === "string") {
                column = this.columns[identifier];
                if (!column) {     //The columnId does not exist
                    return null;
                }
            } else {
                column = identifier;
            }
            for (var i = 0; i < this.sortedColumns.length; ++i) {
                if (this.sortedColumns[i].equals(column)) {
                    return i;
                }
            }
            return null;
        }

        /*
         * Returns all rows within the table or table section (title/body).
         * @rowType     RowType     optional; If no value is given, all rows are returned. If "RowType.title" is given, only the title rows are returned. If "RowType.body" is given, the body rows are returned.
         * @return      Row[]       All rows within the table or table section (title/body). The order conforms to the output order.
         */
        getRows(rowType?: RowType): Row[]{
            if (rowType === RowType.title) {
                return this.titleRows;
            }
            if (rowType === RowType.body) {
                return this.bodyRows;
            }
            return this.titleRows.concat(this.bodyRows);
        }

        /*
         * Returns the required row. A row contains all cells.
         * @identifier      string          Returns the row with the given rowId. If the id doesn't exist, null is returned
         *                  number          Returns the row with the specified index. The first title-row has index 0. The first body row has the index titleRowCount. If the index is out of bounds, null is being returned.
         *                                  Note that passing numbers as strings (eg. getRow("4");) will be interpreted as a rowId, rather than an index.
         * @return          Row             If the requested row exists, it will be returned. Otherwise, null is returned.
         */
        getRow(identifier: string|number): Row {
            if (typeof identifier === "number") {
                if (identifier < this.titleRows.length) {                   //A titleRow should be returned
                    return this.titleRows[identifier] || null;
                }
                return this.bodyRows[identifier - this.titleRows.length] || null;  //A bodyRow should be returned
            }
            return this.rows[<string>identifier] || null;
        }
        
        /*
         * Removes the specified row.
         * @identifier      string          Removes the row with the given rowId. If the id doesn't exist, false is returned
         *                  number          Removes the row with the specified index. The first title-row has index 0. The first body row has the index titleRowCount. If the index is out of bounds, false is being returned.
         *                  Row             Removes the given row from the table. If the row is not part of this table, null is being returned.
         *                                  Note that passing numbers as strings (eg. removeRow("4");) will be interpreted as a rowId, rather than an index.
         * @return          boolean         Returns true, if the row has been removed successfully. Returns false, if the specified row hasn't been found.
         */
        removeRow(identifier: string|number|Row): boolean {
            //The following two informations are needed in order to remove a column:
            var rowId: string;
            var rowIndex: number;

            if (typeof identifier === "number") {
                rowIndex = identifier;
                if (identifier < this.titleRows.length) {   //A titleRow should be removed
                    var row = this.titleRows[identifier];
                    if (!row) {             //Index out of bounds (this check is needed in case of negative or float values)
                        return false;
                    }
                    rowId = row.rowId;
                } else {
                    var row = this.bodyRows[identifier - this.titleRows.length];
                    if (!row) {             //Index out of bounds
                        return false;
                    }
                    rowId = row.rowId;
                }
            } else if(typeof identifier === "string") {    //the rowId is given
                rowId = identifier;
                rowIndex = this.getRowIndex(rowId);
                if (rowIndex === null) {    //rowId does not exist
                    return false;
                }
            } else {                        //a Row has been given
                rowId = identifier.rowId;
                rowIndex = this.getRowIndex(identifier);
                if (rowIndex === null) {    //the row is not part of this table
                    return false;
                }
            }
            
            this.rows[rowId].element.remove();  //Remove the row from the DOM
            this.rows[rowId].destroy();         //The row is not part of the table anymore -> make it unusable
            delete this.rows[rowId];
            if (rowIndex < this.titleRows.length) {
                this.titleRows.splice(rowIndex, 1);
            } else {
                this.bodyRows.splice(rowIndex - this.titleRows.length, 1);
            }
            return true;
        }

        /*
         * Removes the specified column.
         * @identifier      string          Removes the column with the given columnId. If the id doesn't exist, false is returned
         *                  number          Removes the column with the specified index. The first (left) column has index 0. If the index is out of bounds, false is being returned.
         *                  Column          Removes the given column from the table. If the column is not part of this table, null is being returned.
         *                                  Note that passing numbers as strings (eg. removeColumn("4");) will be interpreted as a columnId, rather than an index.
         * @return          boolean         Returns true, if the column has been removed successfully. Returns false, if the specified column hasn't been found.
         */
        removeColumn(identifier: string|number|Column): boolean {
            //The following two informations are needed in order to remove a column:
            var columnId: string;
            var columnIndex: number;

            if (typeof identifier === "number") {
                columnIndex = identifier;
                var column = this.sortedColumns[identifier];
                if (!column) {                  //Index out of bounds
                    return false;
                }
                columnId = column.columnId;               
            } else if (typeof identifier === "string") {    //the columnId is given
                columnId = identifier;
                columnIndex = this.getColumnIndex(columnId);
                if (columnIndex === null) {     //columnId does not exist
                    return false;
                }
            } else {                            //a Column has been given
                columnId = identifier.columnId;
                columnIndex = this.getColumnIndex(identifier);
                if (columnIndex === null) {     //the column is not part of this table
                    return false;
                }
            }

            for (var rowId in this.rows) {      //Remove the column from the DOM
                this.rows[rowId].removeColumn(columnId);
            }
            this.columns[columnId].destroy();   //The column is not part of the table anymore -> make it unusable
            delete this.columns[columnId];
            this.sortedColumns.splice(columnIndex, 1);
            return true;
        }




        /*
         * Returns all columns within the table.
         * @return      Column[]        All columns within the table. The order conforms to the output order.
         */
        getColumns(): Column[] {
            return this.sortedColumns;
        }

        /*
         * Returns the required column. The column does not contains cells.
         * @identifier      string          Returns the column with the given columnId. If the id doesn't exist, null is returned
         *                  number          Returns the column with the specified index. The first (left) column has index 0. If the index is out of bounds, null is being returned.
         *                                  Note that passing numbers as strings (eg. getColumn("4");) will be interpreted as a columnId, rather than an index.
         * @return          Column          If the requested column exists, it will be returned. Otherwise, null is returned.
         */
        getColumn(identifier: string|number): Column {
            if (typeof identifier === "number") {        
                return this.sortedColumns[identifier] || null;
            }
            return this.columns[<string>identifier] || null;
        }

        /*
         * Returns all cells of a sepcific column.
         * @identifier      string                      Returns the cells of the column with the given columnId. If the column doesn't exist, null is returned
         *                  number                      Returns the cells of the column with the specified index. The first (left) column has index 0. If the index is out of bounds, null is being returned.
         *                                              Note that passing numbers as strings (eg. getColumnCells("4");) will be interpreted as a columnId, rather than an index.
         * @return          { rowId: Cell, ... }        A list with all cells that are present within the column. The index represents the rowId. If the given column does not exist, null is being returned.
         */
        getColumnCells(identifier: string|number): { [key: string]: Cell; } {
            if (this.getColumn(identifier) === null) {  //The column does not exist
                return null;
            }
            var cells: { [key: string]: Cell; } = {};
            for (var rowId in this.rows) {
                cells[rowId] = this.rows[rowId].getCell(identifier);
            }
            return cells;
        }
        
        /*
         * Returns the specified cell.
         * @rowIdentifier       string          Specifies the rowId of the cell. If the row doesn't exist, null is returned
         *                      number          Specifies the row index of the cell. The first title-row has index 0. The first body row has the index titleRowCount. If the index is out of bounds, null is being returned.
         *                                      Note that passing numbers as strings (eg. getCell("4", "colId");) will be interpreted as a rowId, rather than an index.
         * @columnIdentifier    string          Specifies the columnId of the cell. If the column doesn't exist, null is returned
         *                      number          Specifies the column index of the cell. The first (left) column has index 0. If the index is out of bounds, null is being returned.
         *                                      Note that passing numbers as strings (eg. getCell("rowId", "4");) will be interpreted as a columnId, rather than an index.
         * @return              Cell            The cell within the given row and column. If either the row or the column doesn't exist, null is returned.
         */
        getCell(rowIdentifier: string|number, columnIdentifier: string|number): Cell {
            var row = this.getRow(rowIdentifier);
            if (row === null) {
                return null;
            }
            return row.getCell(columnIdentifier);
        }

        /*
         * Returns the number of rows in the table or table section (title/body)
         * @rowType     RowType     optional; If no value is given, the total number of rows is returned. If "RowType.title" is given, the number of titleRows is returned. If "RowType.body" is given, the number of rows within the table body is returned.
         * @return      number      The number of rows within the table or table section (title/body)
         */
        getRowCount(rowType?: RowType): number {
            if (rowType === RowType.title) {
                return this.titleRows.length;
            }
            if (rowType === RowType.body) {
                return this.bodyRows.length;
            }
            return this.titleRows.length + this.bodyRows.length;
        }
        
        /*
         * Returns the number of columns in the table
         * @return      number      The number of columns within the table
         */
        getColumnCount(): number {
            return this.sortedColumns.length;
        }
                
        /*
         * Converts the Table into an object. Used for serialisation.
         * Performs a deepCopy.
         * @includeContent      boolean             true (default): The data is included in the object as well. Otherwise, the returned object only contains meta data. 
         * @return              TableDescription    DeepCopy of this table
         */
        toObject(includeContent?: boolean): TableDescription {
            //assert(this.table !== null, "The table has already been destroyed");

            var description: TableDescription = {
                columns: [],
                rows: [],
                titleRowCount: this.titleRows.length
            };
            for (var columnId in this.columns) {
                description.columns.push(this.columns[columnId].toObject());
            }
            for (var i = 0; i < this.titleRows.length; ++i) {
                description.rows.push(this.titleRows[i].toObject(includeContent));
            }
            for (var i = 0; i < this.bodyRows.length; ++i) {
                description.rows.push(this.bodyRows[i].toObject(includeContent));
            }
            return description;
        }
          
    }
}











