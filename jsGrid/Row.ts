/// <reference path="JsGrid.ts" />

module JsGrid {

    export type RowDefinition = {
        rowId: string;
        content?: { [key: string]: string|CellDefinition; };       //{ columnId: "content", columnId: CellDefinition, ...}
    }

    export enum RowType { title = 0, body = 1 };


    export class Row {
        private element: JQuery;                //Reference to the <tr>-tag
        
        rowId: string;                          //internal id
        rowType: RowType;                       //title- / body- / footer- row
        cells: { [key: string]: Cell; } = {}    // {columnId: Cell, ...}


        //todo: column-definitions - is this pass-by-value or pass-by-reference? (I can't remember, it's too long ago)
        /*
         * Generates a new Row
         * @parameter   rowType     RowType         The type of the row (titleRow, content, footer)
         * @parameter   definition  string          RowId. The cells of the newly generated row will be created using the column's default values.
         *                          RowDefinition   Contains detailed information on how to generate the new row.
         * @parameter   columns     Column[]        The currently existing columns in the table. The Row will get one cell per column, the content depends on the parameter "definition".
         */
        constructor(rowType: RowType, definition: string|RowDefinition, columns: { [key: string]: Column; }) {
            assert_argumentsNotNull(arguments);

            var rowDef: RowDefinition;
            if (typeof definition === "string") {
                rowDef = { rowId: definition };
            } else {
                rowDef = definition;
            }
            rowDef.content = rowDef.content || {};

            logger.info("Ceating new row \"" + rowDef.rowId + "\".");

            this.element = null;
            this.rowId = rowDef.rowId;
            this.rowType = rowType;
           
            for (var columnId in columns) {
                if (columnId in rowDef.content) {
                    this.cells[columnId] = new Cell(rowDef.content[columnId]);
                    continue;
                }
                logger.info("Using default value for row \"" + this.rowId + "\", col \"" + columnId + "\".");
                switch (this.rowType) {
                    case RowType.title: this.cells[columnId] = columns[columnId].defaultTitleContent;
                        break;
                    case RowType.body:  this.cells[columnId] = columns[columnId].defaultBodyContent;
                        break;
                    default: assert(false, "Invalid RowType given.");
                }                
            }
        }

        /*
         * Adds a new column to the row. Is called everytime a column is added to the table.
         * @parameter column    Column      Information about the new Column
         * @parameter content   Cell        The cell that should be assigned to the new column
         */
        addColumn(column: Column, content: Cell): void {
            assert_argumentsNotNull(arguments);
            var columnId: string = column.columnId;
            if (columnId in this.cells) {
                logger.error("The row \""+this.rowId+"\" has already a column with the id \"" + columnId + "\".");
                return;
            }
            this.cells[columnId] = content;
        }

        
        /*
         * Converts the Row into an object. Used for serialisation.
         * Performs a deepCopy.
         * @return  mixed      Row-Representation
         */
        toObject(): any{
            var representation = {
                rowId: this.rowId,
                rowType: this.rowType,
                cells: {}
            };
            for (var columnId in this.cells) {
                representation.cells[columnId] = this.cells[columnId].toObject();
            }
            return representation;
        }

        //Todo: don't provide the following function - either imporove the constructor, or make a factory method
        fromObject(rowId: string, representation: any): void {
            assert(false, "not implemented yet");
        }
    } 
}

