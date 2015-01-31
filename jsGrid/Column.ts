/// <reference path="JsGrid.ts" />


module JsGrid {

    export class Column {
        private table: Table;                           //The table where this column belongs to  

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
         *              Column                      The column will be deep-copied. DOM-connections will not be copied. Note that the new object will have the same columnId
         *              ColumnDefinitionDetails     Contains detailed information on how to generate the new column.
         *              ColumnDescription           Used for deserialisation.
         */
        constructor(table: Table, columnDef?: ColumnDefinition|ColumnDescription) {
            this.table = table;

            var columnDefDetails: ColumnDefinitionDetails;        
            if (typeof columnDef === "string") {
                columnDefDetails = { columnId: columnDef };
            } else if (<any>columnDef instanceof Column) {  //Copy-Constructor
                var other: Column = <Column>columnDef;
                logger.info("Ceating new column-copy of \"" + other.columnId + "\".");
                this.columnId = other.columnId;
                this.defaultTitleContent = other.defaultTitleContent;
                this.defaultBodyContent = other.defaultBodyContent;
                return;
            } else {                                        //null / undefined / ColumnDefinitionDetails / ColumnDescription
                columnDefDetails = columnDef || {};
            }

            this.columnId = columnDefDetails.columnId || ("jsc" + (++Column.columnIdSequence));

            logger.info("Ceating new column \"" + this.columnId + "\".");
                       
            this.defaultTitleContent = new Cell(columnDefDetails.defaultTitleContent || this.columnId);
            this.defaultBodyContent = new Cell(columnDefDetails.defaultBodyContent);


            if (inputValidation) {  //Check if the columnDefinition has some invalid data
                //todo: regex-check of columnId here, so that it doesn't contain special characters that can ruin html
            }
        }


        /*
         * Returns the cell of a sepcific row.
         * @identifier      string                      Returns the cell of the row with the given rowId. If the row doesn't exist, null is returned
         *                  number                      Returns the cell of the row with the specified index. The first title-row has index 0. The first body row has the index titleRowCount. If the index is out of bounds, null is being returned.
         *                                              Note that passing numbers as strings (eg. getCell("4");) will be interpreted as a rowId, rather than an index.
         * @return          Cell                        The cell of the given row. If the row does not exist, null is being returned.
         */
        getCell(row: string|number): Cell {
            return this.table.getCell(row, this.columnId);
        }


        /*
         * Converts the Column into an object. Used for serialisation.
         * Performs a deepCopy.
         * @return  ColumnDescription      DeepCopy of this column
         */
        toObject(): ColumnDescription {
            return {
                columnId: this.columnId,
                defaultTitleContent: this.defaultTitleContent.toObject(),
                defaultBodyContent: this.defaultBodyContent.toObject()
            };   
        }
    }
}