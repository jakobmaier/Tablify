/// <reference path="JsGrid.ts" />


module JsGrid {
    export type ColumnDefinition = {
        columnId: string;       //Internal representation
        //sortable?: boolean;
        //...


        //The following information is needed to create cells when a new column is inserted (to define the content for each new cell):
        content?: { [key: string]: Cell; };   //key == rowId;  { "rowId": Cell}; If a specific row is not defined, the defaultContent is used
        
        defaultTitleContent?: Cell;
        defaultBodyContent?: Cell;  
        //defaultFooterContent?: Cell;   
    }
    

    /*
     * Returns the cell, which should be generated for newly generated columns
     * @column      ColumnDefinition        The columnDefinition which contains all information on how to generate the cell
     * @rowId       string                  The row, for which the cell should be returned
     * @rowType     RowType                 The RowType of the row (If the cell is not explicitly defined in the column, the defaultContent depends on the rowType)
     * @return      Cell                    Returns the cell that should be generated for the new column
     */    
    export function getColumnCell(column: ColumnDefinition, rowId: string, rowType: RowType) : Cell {        
        if (rowId in column.content) {
            return column.content[rowId];
        }
        switch (rowType) {
            case RowType.title:     return column.defaultTitleContent;
            case RowType.body:      return column.defaultBodyContent;        
            default: assert(false, "Invalid RowType given.");
        }
    }


    export class Column{    
        columnId: string;       //Internal representation
        //sortable?: boolean;
        //...

        defaultTitleContent: Cell;
        defaultBodyContent: Cell;    
        //defaultFooterContent: Cell;


        /*
         * Generates a new Column
         * @definition  string              ColumnId. The cells of the newly generated column will be empty.
         *              ColumnDefinition    Contains detailed information on how to generate the new column.
         */
        constructor(definition: string|ColumnDefinition) {
            assert_argumentsNotNull(arguments);

            var colDef: ColumnDefinition;
            if(typeof definition === "string"){
                colDef = { columnId: definition };
            }else{
               colDef = definition;
            }

            logger.info("Ceating new column \"" + colDef.columnId + "\".");

            this.columnId = colDef.columnId;
            this.defaultTitleContent = colDef.defaultTitleContent || new Cell();
            this.defaultBodyContent = colDef.defaultBodyContent || new Cell();
            //this.defaultFooterContent = colDef.defaultFooterContent || new Cell();
        }


        /*
         * Converts the Column into an object. Used for serialisation.
         * Performs a deepCopy.
         * @return  mixed      Column-Representation
         */
        toObject(): any {
            return {
                columnId: this.columnId,
                defaultTitleContent: this.defaultTitleContent.toObject(),
                defaultBodyContent: this.defaultBodyContent.toObject()
            };   
        }
        
        //Todo: don't provide the following function - either imporove the constructor, or make a factory method
        fromObject(rowId: string, representation: any): void {
            assert(false, "not implemented yet");
        }
    }
}