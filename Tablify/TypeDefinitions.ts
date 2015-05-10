// <reference path="Tablify.ts" />

module Tablify {
    "use strict";
    

    export type Selector = string | JQuery | Element;    

    /* 
    * boolean                     false: no animation; true: default animation
    * number                      Animation duration in milliseconds
    * string                      "fast" = 200ms; "slow" = 600ms
    * JQueryAnimationOptions      Detailed animation options including a callback option; For more information, take a look at jQuery's `animate` 
    */
    export type AnimationSettings = boolean | string | number | JQueryAnimationOptions; 


//Serialising & Deserialising:
//***************************************************************************************************************
    export enum CellContentType { string = 0, jquery = 1, table = 2 }

    export type CellDescription = {
        content?: string|TableDescription;      //Only available if the table has been serialised WITH the data, not only metadata
        contentType?: CellContentType;          //Only available if the table has been serialised WITH the data, not only metadata. This field is important for deserialisation in order to distinguish between "string" and "JQuery", which is also stored as a string
        /*attributes...*/
    }

    export type ColumnDescription = {
        columnId: string;       //Internal representation
        defaultTitleContent?: CellDescription;
        defaultBodyContent?: CellDescription;
        defaultFooterContent?: CellDescription;
        visible?: boolean;                             
    };

    export enum RowType { title = 0, body = 1, footer = 2 };

    export type RowDescription = {
        rowId: string;
        rowType: RowType;
        content: {                          
            [key: string]: CellDescription; //{ columnId: CellDescription, ...}
        };
        visible?: boolean;                    
    };

    export type TableDescription = {
        columns: ColumnDescription[];
        rows: RowDescription[];
    };




    
//***************************************************************************************************************
// C r e a t i n g   n e w   O b j e c t s :
//***************************************************************************************************************



//Cells:
    export type CellContent = string | JQuery | Table;    //Table can be used for nesting
    
    export type CellDefinitionDetails = {
        content?: CellContent | Element | TableDescription
        /*attributes...*/
    }

    export type CellDefinition = CellContent | Element | CellDefinitionDetails | Cell | CellDescription;
    

//Adding new Columns to an existing Table:
    export type ColumnDefinitionDetails = {
        columnId?: string;     
        /*sortable...*/
        /*attributes...*/
        visible?: boolean;                              //true: the column will be visible; false: the column will be added but stays invisible
        
        //The following information is needed to create cells when a new column is inserted (to define the content for each new cell):
        content?: { [key: string]: CellDefinition; };   //key == rowId;   { "rowId": CellDefinition};   If a specific row is not defined, the defaultContent is used
        generateMissingRows?: boolean                   // true: if the content contains rowIds that do not yet exist, a new row will be generated; false (default): not-existing rowIds will be ignored

        defaultTitleContent?: CellDefinition;
        defaultBodyContent?: CellDefinition;  
        defaultFooterContent?: CellDefinition; 
    };

    export type ColumnDefinition = string | ColumnDefinitionDetails | Column | ColumnDescription;
    export type ColumnPositionDefinition = string|number|Column;    //Is used to specify the position for a column (string can either be "first" or "last"). In case of relative positioning, it can also be "left" or "right", "+1", "-4", ...

//Adding new Rows to an existing Table:
    export type RowDefinitionDetails = {
        rowId?: string;
        rowType?: RowType;                                          //default: 1 (body)
        visible?: boolean;                                          //true: the row will be visible; false: the row will be added but stays invisible

        content?: CellContent | Element | Cell | { [key: string]: CellDefinition; };  //{ columnId: CellDefinition, ...}      If only a single CellDefinition is given, it will be used for each cell in the row
        generateMissingColumns?: boolean;                           //true: if the content contains columnIds that do not yet exist, a new column will be generated; false (default): not-existing columnIds will be ignored
    };

    export type RowDefinition = string | RowDefinitionDetails | Row | RowDescription;
    export type RowPositionDefinition = string|number|Row;          //Is used to specify the position for a row (string can either be "top" or "bottom"). In case of relative positioning, it can also be "up", "down", "+1", "-4", ...
    
//Creating Tables from JSON:
    export type TableDefinitionDetails = {
        tableId?: string;
        columns?: number|ColumnDefinition[];
        rows?: number|RowDefinition[];
        titleRowCount?: number;                         //Number of rows who are automatically interpreted as titlerows, ignoring possible "row.rowType" options. Default: 0
        footerRowCount?: number;                        //Number of rows who are automatically interpreted as footerrows, ignoring possible "row.rowType" options. Default: 0
    };

    export type TableDefinition = string | TableDefinitionDetails | Table | TableDescription;       //string = tableId

} 