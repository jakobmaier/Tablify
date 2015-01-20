/// <reference path="lib/jQuery/jquery.d.ts"/>
/// <reference path="helper.ts" />


/*
Other libs:
    http://webix.com/demo/datatable/
    http://www.datatables.net/blog/2014-11-07
    http://lorenzofox3.github.io/smart-table-website/
*/

type Row = string;

module JsGrid {
   
   

    
    export class Table {
        //References to commonly used HTML elements:
        private table: JQuery;  //<table>
        private thead: JQuery;  //<thead>
        private tbody: JQuery;  //<tbody>

    
        private static gridIdSequence: number = 0;      //Used to auto-generate unique ids
        private gridId: string;                         //Unique grid id

        //Column properties:
        private columns: { [key: string]: Column; } = {};        // { "columnId": Column, ... }
        //var columns: Map<string, Column>;             //better alternative to the above definition. However, this is part of EcmaScript6 and currently not supported very well

        //Table content - each row is referenced twice for faster access:
        private titleRows: Row[] = [];                  // Rows, which are part of the table head. Sorted by their output order.
        private bodyRows: Row[] = [];                   // Rows, containing the data. Sorted by their output order.
        private rows: { [key: string]: Row; } = {};     //All rows, sorted by their ID
 
        /*
         * Generates a new JsGrid Table
         * @identifier      string      JQuery-Selector. Is resolved to a JQuery element (see below)
         *                  JQuery      References a single HTMLElement. If the Element is a <table> (HTMLTableElement), the JsGrid is initialised with the table content; Otherwise, a new table is generated within the HTMLElement
         */
        constructor(identifier: string|JQuery) {
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
            }
            this.table.addClass("jsGrid");

            this.thead = this.table.find("thead");
            this.tbody = this.table.find("tbody");
        }


        /*
         * Destroys the JsGrid Table. This object will get unusable.
         */
        destroy(): void {
            this.table.removeClass("jsGrid");
            this.table = null;
        }
    

        /*
         * Adds a new column to the table.
         * @column      string                  ColumnId. The cells of the newly generated column will be empty.
         *              Column                  The column will be deep-copied. Note that the new object will have the same columnId
         *              ColumnDefinitionDetails Contains detailed information on how to generate the new column.
         */
        addColumn(columnDef: ColumnDefinition): void {
            assert_argumentsNotNull(arguments);
                      

            var column = new Column(columnDef);
            var columnId: string = column.columnId;
            if (columnId in this.columns) {
                logger.error("There is already a column with the id \"" + columnId + "\".");
                return;
            }
            this.columns[columnId] = column;

            var content: { [key: string]: CellDefinition; } = {};
            if (typeof columnDef !== "string" && !(columnDef instanceof Column)) {       //ColumnDefinitionDetails
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
                        case RowType.title: cell = column.defaultTitleContent;  break;
                        case RowType.body:  cell = column.defaultBodyContent;   break;
                        default: assert(false, "Invalid RowType given.");
                    }
                }
                row.addColumn(column, cell);
            }
        }

        /*
         * Adds a new row to the table
         * @rowType     RowType                 The type of the row (title, body, footer)
         * @rowDef      string                  RowId. The cells of the newly generated row will be created using the column's default values.
         *              Row                     The row will be deep-copied. Note that the new object will have the same rowId.
         *              RowDefinitionDetails    Contains detailed information on how to generate the new row.
         */
        addRow(rowType: RowType, rowDef: RowDefinition): void {
            assert_argumentsNotNull(arguments);

            var row = new Row(rowType, rowDef, this.columns);
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
         * Converts the Table into an object. Used for serialisation.
         * Performs a deepCopy.
         * @return  mixed      Row-Representation
         */
        toObject(): any {
            var representation = {
                gridId: this.gridId,
                columns: [],
                rows: {
                    titleRows: [],
                    bodyRows: []
                }
            };
            for (var columnId in this.columns) {
                representation.columns.push(this.columns[columnId].toObject());
            }
            for (var i = 0; i < this.titleRows.length; ++i) {
                representation.rows.titleRows.push(this.titleRows[i].toObject());
            }
            for (var i = 0; i < this.bodyRows.length; ++i) {
                representation.rows.bodyRows.push(this.bodyRows[i].toObject());
            }
            return representation;
        }
          


        //Todo: don't provide the following function - either improve the constructor, or make a factory method
        fromObject(rowId: string, representation: any): void {
            assert(false, "not implemented yet");
        }
    }
}













window.onload = () => {
    //new JsGrid.Table("#content>table");
    var grid = new JsGrid.Table("#content");

    grid.addColumn("Column 1");
    grid.addColumn({
        columnId: "Column 2",
        defaultTitleContent: "2. Spalte"
    });

    grid.addRow(JsGrid.RowType.title, "Title row");

    grid.addRow(JsGrid.RowType.body, {
        rowId: "First row",
        content: {
            "Column 1": "First cell",
            "Column 2": "Second cell"
        }
    });
    grid.addRow(JsGrid.RowType.body, {
        rowId: "Second row",
        content: {
            "Column 1": "!!!"
        }
    });
    grid.addColumn({
        columnId: "Column 3",
        defaultTitleContent: "InvisibleTitle",
        defaultBodyContent: "<b>That's what I call a cell!</b>",
        content: {
            "First row": "3x1",
            "Title row": "Title of Nr. 3"
        }
    });


    //TODO:
    //tbody/thead!



    console.log(grid.toObject());

};

