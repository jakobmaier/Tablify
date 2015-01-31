/// <reference path="lib/jQuery/jquery.d.ts"/>
/// <reference path="Debugging.ts" />
/// <reference path="TypeDefinitions.ts" />


/*
Other libs:
    http://webix.com/demo/datatable/
    http://www.datatables.net/blog/2014-11-07
    http://lorenzofox3.github.io/smart-table-website/
*/

type Row = string;

module JsGrid {
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
         * @gridId  string      gridId of the table, whose instance should be returned
         * @return  Table       The Table-Object with the given gridId. If the id does not exist, null is being returned.
         */
        getTableById(gridId: string): Table {
            assert_argumentsNotNull(arguments);
            for (var i = 0; i < this.tableList.length; ++i) {
                if (this.tableList[i].gridId === gridId) {
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





  
    export class Table {
        //References to commonly used HTML elements:
        /*[Readonly]*/ table: JQuery;   //<table>
        private thead: JQuery;          //<thead>
        private tbody: JQuery;          //<tbody>

    
        private static gridIdSequence: number = 0;      //Used to auto-generate unique ids
        /*[Readonly]*/ gridId: string;                  //Unique grid id
       

        //Column properties:
        private sortedColumns: Column[] = [];           //All columns, sorted from left to right.
        private columns: { [key: string]: Column; } = {};        // All rows, sorted by their id
        //var columns: Map<string, Column>;             //better alternative to the above definition. However, this is part of EcmaScript6 and currently not supported very well
        
        //Table content - each row is referenced twice for faster access:
        private titleRows: Row[] = [];                  //Rows, which are part of the table head. Sorted by their output order.
        private bodyRows: Row[] = [];                   //Rows, containing the data. Sorted by their output order.
        private rows: { [key: string]: Row; } = {};     //All rows, sorted by their id
 
        /*
         * Generates and returns a new JsGrid Table     (note: if the given table element is already managed, the old Table-instance will be returned instead of generating a new one)
         * @identifier      string              JQuery-Selector. Is resolved to a JQuery element (see below)
         *                  JQuery              References a single HTMLElement. If the Element is a <table> (HTMLTableElement), the JsGrid is initialised with the table content; Otherwise, a new table is generated within the HTMLElement
         * @description     TableDescription    Data, how the table should look like (rows / columns / ...). Used for deserialisation.
         */
        constructor(identifier: string|JQuery, description?: TableDescription|Table) {
            this.gridId = "jsg" + (++Table.gridIdSequence);
            if (typeof identifier === "string") {
                this.table = $(identifier);                     //selector
            } else {
                this.table = identifier;                        //jQuery
            }
            if (this.table == null) {                           //No table found                
                logger.error("Unable to find DOM Element", identifier);
                return;
            }

            if (this.table.prop("tagName") !== "TABLE") {       //Create a new table within this element
                logger.log("Creating table element. Parent tag: ", this.table.prop("tagName"));
                var table = $("<table><thead></thead><tbody></tbody></table>");
                this.table.append(table);
                this.table = table;
            } else if (this.table.hasClass("jsGrid")){          //Maybe the table has already been initialised with a jsGrid? If yes, return the already existing object and don't create a new one
                var existingObj = tableStore.getTableByElement(this.table);
                if (existingObj !== null) {                     //The table is already managed by another Table-instance
                    logger.warning("The given HTML element is already managed by another Table instance (\""+existingObj.gridId+"\"). The old instance will be returned instead of creating a new one.");
                    return existingObj;
                }
            }
            this.table.addClass("jsGrid");
            tableStore.registerTable(this);

            this.thead = this.table.find("thead");
            this.tbody = this.table.find("tbody");

            if (!description) {     //No content to generate
                return;
            }
        //Generate the table content:
            var descriptionObj: TableDescription;
            if (description instanceof Table) {
                descriptionObj = (<Table>description).toObject(true);
            } else {
                descriptionObj = <TableDescription>description;
            }

            for (var i = 0; i < descriptionObj.columns.length; ++i) {
                this.addColumn(descriptionObj.columns[i] );
            }
            var titleRowCount = descriptionObj.titleRowCount || 0;
            for (var i = 0; i < descriptionObj.rows.length; ++i) {
                this.addRow(titleRowCount > i ? RowType.title : RowType.body, descriptionObj.rows[i]);
            }
        }
        
        /*
         * Returns true, if the object represents the given table-element
         * @table   JQuery      References a HTMLElement. If this HTMLElement is managed by this table object, true is returned
         * @return  boolean     true: The given HTMLElement (<table>) is managed by this Table-instance. Otherwise, false is returned
         */
        representsTable(table: JQuery): boolean {
            return (this.table === table);
        }

        /*
         * Destroys the JsGrid Table. This object will get unusable.
         */
        destroy(): void {
            tableStore.unregisterTable(this);
            this.table.removeClass("jsGrid");
            this.table = null;
            this.rows = null;
            this.columns = null;
        }
    

        /*
         * Adds a new column to the table.
         * @column      null / undefined            The columnId is generated automatically
         *              string                      ColumnId. The cells of the newly generated column will be empty.
         *              Column                      The column will be deep-copied. Note that the new object will have the same columnId
         *              ColumnDefinitionDetails     Contains detailed information on how to generate the new column.
         *              ColumnDescription           Used for deserialisation.
         */
        addColumn(columnDef?: ColumnDefinition|ColumnDescription): void {
            var column = new Column(this, columnDef);
            var columnId: string = column.columnId;
            if (columnId in this.columns) {
                logger.error("There is already a column with the id \"" + columnId + "\".");
                return;
            }
            this.columns[columnId] = column;
            this.sortedColumns.push(column);

            var content: { [key: string]: CellDefinition; } = {};
            if (columnDef && typeof columnDef !== "string" && !(columnDef instanceof Column)) {     //ColumnDefinitionDetails / ColumnDescription
                content = (<ColumnDefinitionDetails>columnDef).content || {};
            }
            
            //Add a new cell to each row:
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
            if (inputValidation) {  //Check if the columnDefinition has some invalid data
                for (var rowId in content) {
                    logger.warningIf(!(rowId in this.rows), "The column definition of column \"" + column.columnId + "\" contains data for row \"" + rowId + "\", although there is no such row.");
                }
            }
        }


        /*
         * Adds a new row to the table
         * @rowType     RowType                 The type of the row (title, body, footer)
         * @rowDef      null / undefined        The rowId is generated automatically.
         *              string                  RowId. The cells of the newly generated row will be created using the column's default values.
         *              Row                     The row will be deep-copied. Note that the new object will have the same rowId.
         *              RowDefinitionDetails    Contains detailed information on how to generate the new row.
         *              RowDescription          Used for deserialisation.
         */
        addRow(rowType: RowType, rowDef?: RowDefinition|RowDescription): void {
            var row = new Row(this, rowType, rowDef, this.columns);
            var rowId: string = row.rowId;
            
            if (rowId in this.rows) {
                logger.error("There is already a row with the id \"" + rowId + "\".");
                return;
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
                    return this.titleRows[identifier];
                }
                return this.bodyRows[identifier - this.titleRows.length] || null;  //A bodyRow should be returned
            }
            return this.rows[<string>identifier] || null;
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













window.onload = () => {
    //new JsGrid.Table("#content>table");
    var grid = new JsGrid.Table("#content");

    grid.addColumn(/*"Column 1"*/);
    grid.addColumn({
        //columnId: "Column 2",
        defaultTitleContent: "2. Spalte",
        defaultBodyContent: "---"
    });

    grid.addRow(JsGrid.RowType.title, "Title row");

    grid.addRow(JsGrid.RowType.body, {
        //rowId: "First row",
        content: {
            "jsc1": new JsGrid.Cell("First cell"),
            "jsc2": "Second cell"
        }
    });

    grid.addRow(JsGrid.RowType.title, {
        content: {
            "jsc1": new JsGrid.Cell("column 1"),
            "jsc2": "column 2"
        }
    });


    grid.addRow(JsGrid.RowType.body, {
        //rowId: "Second row",
        content: {
            "jsc1": "!!!"
        }
    });/*
    grid.addColumn({
        columnId: "Column 3",
        defaultTitleContent: "InvisibleTitle",
        defaultBodyContent: "<b>That's what I call a cell!</b>",
        content: {
            "jsr1": "3x1",
            "Title row": "Title of Nr. 3"
        }
    });*/
    grid.addRow(JsGrid.RowType.body);
    grid.addRow(JsGrid.RowType.body);
    grid.addRow(JsGrid.RowType.body);
    grid.addRow(JsGrid.RowType.body);
    grid.addRow(JsGrid.RowType.body);




    //console.log(grid.toObject());
    console.log(JSON.stringify(grid.toObject(true)));


    new JsGrid.Table("#content", grid.toObject(true));
    new JsGrid.Table("#content", grid.toObject(false));

    var copyTable = new JsGrid.Table(grid.table);
    console.log(copyTable === grid);
};

