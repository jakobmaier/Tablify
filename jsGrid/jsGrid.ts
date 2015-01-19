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

    
        //Todo: set the gridId programatically to a unique value
        private gridId: string = "grid1";               //Unique grid id

        //Column properties:
        private columns: { [key: string]: Column; } = {};        // { "columnId": Column, ... }
        //var columns: Map<string, Column>;             //better alternative to the above definition. However, this is part of EcmaScript6 and currently not supported very well

        //Table content - each row is referenced twice for faster access:
        private titleRows: Row[] = [];                  // Rows, which are part of the table head. Sorted by their output order.
        private bodyRows: Row[] = [];                   // Rows, containing the data. Sorted by their output order.
        private rows: { [key: string]: Row; } = {};     //All rows, sorted by their ID
 
        /*
         * Generates a new JsGrid Table
         * @parameter   identifier      string      JQuery-Selector. Is resolved to a JQuery element (see below)
         *                              JQuery      References a single HTMLElement. If the Element is a <table> (HTMLTableElement), the JsGrid is initialised with the table content; Otherwise, a new table is generated within the HTMLElement
         */
        constructor(identifier: string|JQuery) {
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
                var newTable = document.createElement("table");
                this.table.append(newTable);
                this.table = $(newTable);
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
         * @parameter column    string                  ColumnId. The cells of the newly generated column will be empty.
         *                      ColumnDefinition        Contains detailed information on how to generate the new column.
         */
        addColumn(column: string|ColumnDefinition): void {
            assert_argumentsNotNull(arguments);

            var colDef = new Column(column);
            var columnId: string = colDef.columnId;
            if (columnId in this.columns) {
                logger.error("There is already a column with the id \"" + columnId + "\".");
                return;
            }
            this.columns[columnId] = colDef;

            //Add a new cell to each row:
            for (var rowId in this.rows) {
                var row: Row = this.rows[rowId];
                var cell: Cell = getColumnCell(colDef, row.rowId, row.rowType);
                row.addColumn(colDef, cell);
                //TODO: the row (or this table) needs to generate the HTML
            }
        }

        addRow(rowType: RowType, row: string|RowDefinition): void {
            assert_argumentsNotNull(arguments);

            var rowDef = new Row(rowType, row, this.columns);
            var rowId: string = rowDef.rowId;
            
            if (rowId in this.rows) {
                logger.error("There is already a row with the id \"" + rowId + "\".");
                return;
            }
            switch (rowType) {
                case RowType.title:
                    this.titleRows.push(rowDef);
                    break;
                case RowType.body:
                    this.bodyRows.push(rowDef);
                    break;
                default:
                    assert(false, "Invalid RowType given.");
            }
            this.rows[rowId] = rowDef;
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
          


        //Todo: don't provide the following function - either imporove the constructor, or make a factory method
        fromObject(rowId: string, representation: any): void {
            assert(false, "not implemented yet");
        }
    }

}













window.onload = () => {
    //new JsGrid.Table("#content>table");
    var grid = new JsGrid.Table("#content");

    grid.addColumn("Column 1");
    grid.addRow(JsGrid.RowType.title, "Title row");
    grid.addRow(JsGrid.RowType.body, {
        rowId: "First row",
        content: {
            "Column 1": "First cell"
        }
    });
    grid.addRow(JsGrid.RowType.body, "Second row");

    console.log(grid.toObject());
};

