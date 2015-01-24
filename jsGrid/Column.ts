/// <reference path="JsGrid.ts" />


module JsGrid {
    export type ColumnDefinitionDetails = {
        columnId?: string;      //Internal representation
        //sortable?: boolean;
        //...


        //The following information is needed to create cells when a new column is inserted (to define the content for each new cell):
        content?: { [key: string]: CellDefinition; };   //key == rowId;   { "rowId": CellDefinition};   If a specific row is not defined, the defaultContent is used
        
        defaultTitleContent?: CellDefinition;
        defaultBodyContent?: CellDefinition;  
        //defaultFooterContent?: CellDefinition;   
    };
    export type ColumnDefinition = string | Column | ColumnDefinitionDetails;
    
    



    export class Column{    

        private static columnIdSequence: number = 0;    //Used to auto-generate unique ids, if the user didn't pass an Id
        columnId: string;                               //Internal representation
        //sortable?: boolean;
        //...

        defaultTitleContent: Cell;
        defaultBodyContent: Cell;    
        //defaultFooterContent: Cell;


        /*
         * Generates a new Column
         * @columnDef   null/undefined              The columnId is generated automatically
         *              string                      ColumnId. The cells of the newly generated column will be empty.
         *              Column                      The column will be deep-copied. DOM-connections will not be copied. Note that the new object will have the same columnId
         *              ColumnDefinitionDetails     Contains detailed information on how to generate the new column.
         */
        constructor(columnDef?: ColumnDefinition) {
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
            } else {                                        //null / undefined / ColumnDefinitionDetails
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
        
        //Todo: don't provide the following function - either improve the constructor, or make a factory method
        fromObject(rowId: string, representation: any): void {
            assert(false, "not implemented yet");
        }
    }
}