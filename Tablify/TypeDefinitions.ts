// <reference path="Tablify.ts" />

module Tablify {
    "use strict";
    

    export type Selector = string|JQuery|Element;    



//Serialising & Deserialising:
//***************************************************************************************************************
    export type CellDescription = {
        content?: string|TableDescription   //Only available if the table has been serialised WITH the data, not only metadata
        /*attributes...*/
    }

    export type ColumnDescription = {
        columnId: string;       //Internal representation
        defaultTitleContent?: CellDescription;
        defaultBodyContent?: CellDescription;
    };

    export type RowDescription = {
        rowId: string;
        content: {                          
            [key: string]: CellDescription; //{ columnId: CellDescription, ...}
        };
    };

    export type TableDescription = {
        columns: ColumnDescription[];
        rows: RowDescription[];
        titleRowCount?: number;             //Default: 0
    };




    
//***************************************************************************************************************
//C r e a t i n g   n e w   O b j e c t s :
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
        
        //The following information is needed to create cells when a new column is inserted (to define the content for each new cell):
        content?: { [key: string]: CellDefinition; };   //key == rowId;   { "rowId": CellDefinition};   If a specific row is not defined, the defaultContent is used
        generateMissingRows?: boolean                   // true: if the content contains rowIds that do not yet exist, a new row will be generated; false (default): not-existing rowIds will be ignored

        defaultTitleContent?: CellDefinition;
        defaultBodyContent?: CellDefinition;  
        //defaultFooterContent?: CellDefinition; 
    };

    export type ColumnDefinition = string | ColumnDefinitionDetails | Column | ColumnDescription;


//Adding new Rows to an existing Table:
    export enum RowType { title = 0, body = 1 };

    export type RowDefinitionDetails = {
        rowId?: string;
        content?: CellContent | Element | Cell | { [key: string]: CellDefinition; };  //{ columnId: CellDefinition, ...}      If only a single CellDefinition is given, it will be used for each cell in the row
        generateMissingColumns?: boolean                // true: if the content contains columnIds that do not yet exist, a new column will be generated; false (default): not-existing columnIds will be ignored
    };

    export type RowDefinition = string | RowDefinitionDetails | Row | RowDescription;
    
//Creating Tables from JSON:
    export type TableDefinitionDetails = {
        columns?: ColumnDefinition[];
        rows?: RowDefinition[];
        titleRowCount?: number;             //Default: 0
    };

    export type TableDefinition = string | TableDefinitionDetails | Table | TableDescription;       //string = tableId



} 