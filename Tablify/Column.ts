/// <reference path="Tablify.ts" />

module Tablify {
    "use strict";

    export class Column {
        /*[Readonly]*/ table: Table;                    //The table where this column belongs to  

        private static columnIdSequence: number = 0;    //Used to auto-generate unique ids, if the user didn't pass an Id (note that this sequence produces globally unique ids)
        /*[Readonly]*/ columnId: string;                //internal id, unique within the table
        //sortable?: boolean;
        //...

        defaultTitleContent: Cell;                      //Is used for rendering title cells that have no content
        defaultBodyContent: Cell;                       //Is used for rendering body cells that have no content
        //defaultFooterContent: Cell;


        /*
         * [Internal]
         * Generates a new Column
         * @table       Table                       The table where this column belongs to
         * @columnDef   null/undefined              The columnId is generated automatically
         *              string                      ColumnId. The cells of the newly generated column will be empty.
         *              ColumnDefinitionDetails     Contains detailed information on how to generate the new column.
         *              Column                      The column will be deep-copied.
         *              ColumnDescription           Used for deserialisation.
         */
        constructor(table: Table, columnDef?: ColumnDefinition) {
            this.table = table;

            var columnDefDetails: ColumnDefinitionDetails|ColumnDescription;        
            if (typeof columnDef === "string") {
                columnDefDetails = { columnId: columnDef };
            } else if (columnDef instanceof Column) {  //Copy-Constructor
                logger.info("Ceating new column-copy of \"" + columnDef.columnId + "\".");
                if (columnDef.table === this.table) {
                    this.columnId = "tcid" + (++Column.columnIdSequence);
                } else {
                    this.columnId = columnDef.columnId;
                }                
                this.defaultTitleContent = columnDef.defaultTitleContent;
                this.defaultBodyContent = columnDef.defaultBodyContent;
                return;
            } else {                                        //null / undefined / ColumnDefinitionDetails / ColumnDescription
                columnDefDetails = columnDef || {};
            }

            this.columnId = columnDefDetails.columnId || ("tcid" + (++Column.columnIdSequence));

            logger.info("Ceating new column \"" + this.columnId + "\".");
                       
            this.defaultTitleContent = new Cell(columnDefDetails.defaultTitleContent || this.columnId);
            this.defaultBodyContent = new Cell(columnDefDetails.defaultBodyContent);
        }

        /*
         * [Internal]
         * Destroys the Column. This object will get unusable and members as well as member functions must not be used afterwards.
         * Note that this function does not remove the column from the DOM.
         */
        destroy() {
            logger.info("Deleting column \"" + this.columnId + "\".");
            this.table = null;
        }

        /*
         * Removes the column from its table.
         */
        remove(): void {
            assert(this.table.removeColumn(this));
        }

        /*
         * Checks if the given column is the same as this column.
         * In order to match, the columns must be part of the same table and must have the same columnId (unique per table). Having the same data/cells is not a sufficient match.
         * @other       Column      The column that should be checked for equality
         * @return      boolean     Returns true, if the columns are identical. Returns false otherwise.
         */
        equals(other: Column): boolean {
            return (other.table === this.table && other.columnId === this.columnId);
        }

        /*
         * Returns the cell of a sepcific row.
         * @row             string                      Returns the cell of the row with the given rowId. If the row doesn't exist, null is returned
         *                  number                      Returns the cell of the row with the specified position/index. The first title-row has position 0. The first body row has the position titleRowCount. If the position is out of bounds, null is being returned.
         *                  Row                         Returns the cell belonging to this rows
         *                                              Note that passing numbers as strings (eg. getCell("4");) will be interpreted as a rowId, rather than a position.
         * @return          Cell                        The cell of the given row. If the row does not exist, null is being returned.
         */
        getCell(row: string|number|Row): Cell {
            return this.table.getCell(row, this.columnId);
        }

        /*
         * Returns all cells of this column
         * @return       { [key: string]: Cell; }    A list with all cells that are present within the column. The index represents the rowId.
        */
        getCells(): { [key: string]: Cell; } {
            return this.table.getColumnCells(this.columnId);
        }
        
        /*
         * Converts the Column into an object. Used for serialisation.
         * Performs a deepCopy.
         * @return  ColumnDescription      DeepCopy of this column
         */
        toObject(): ColumnDescription {
            return {
                columnId: this.columnId,
                defaultTitleContent: this.defaultTitleContent.toObject(true),
                defaultBodyContent: this.defaultBodyContent.toObject(true)
            };   
        }
    }
}