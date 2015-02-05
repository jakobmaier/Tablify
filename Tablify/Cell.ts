 /// <reference path="Tablify.ts" />

module Tablify {
    "use strict";

    export class Cell {

        /*[Readonly]*/ element: JQuery = null;              //References the <th>/<td>-element.
        /*[Readonly]*/ content: CellContent;                //content of the cell.


        static defaultCellDefinitionDetails: CellDefinitionDetails = {  //Default options that are used in the constructor, if the user omitted them.
            content: ""
        };

        /*
         * [Internal]
         * Generates a new Cell
         * @cellDef     null/undefined          The cell will be empty         
         *              string                  The (html-)content of the cell. The content will not be escaped before adding to the HTML
         *              JQuery                  Element(s) to be appended to the cell. The elements will NOT be copied
         *              Table                   Allows nesting of Tables. The table will NOT be copied.       
         *              CellDefinitionDetails   Contains detailed information on how to generate the cell
         *              Element                 Will be appended to the cell. The element will NOT be copied
         *              Cell                    The cell will be deep-copied.
         *              CellDescription         Used for deserialisation.
         * @row         Column                  The row this cell belongs to
         * @columnId    string                  The columnId of the column where this cell belongs to
         * Note: if the arguments row and columnId are omitted, the cell will not get a DOM representation and can therefore never be added to the DOM
         */
        constructor(cellDef?: CellDefinition, row?: Row, columnId?: string) {
            var definition: CellDefinitionDetails = this.extractCellDefinitionDetails(cellDef);    //Convert the input into CellDefinitionDetails
            
            //The content can have the types  <CellContent | Element | TableDescription>, while CellContent = <string | JQuery | Table>
            if (isElement(definition.content)) {        //Element
                this.content = jQuery(definition.content);
            } else if (typeof definition.content === "string"
                    || <JQuery|Table|TableDescription>definition.content instanceof jQuery
                    || <JQuery|TableDescription>      definition.content instanceof Table) {
                this.content = <string|JQuery|Table>definition.content;
            } else {    //TableDescription
                this.content = new Table(<TableDescription>definition.content);
            }
            /*attributes...*/

            if (arguments.length < 3) {
                delete this.element;                        //The cell can never get part of the DOM
            } else {
                this.generateDom(row.rowType, columnId);    //Generates the DOM representation of this cell.
            }

            if (<any>this.content instanceof Table) {
                (<Table>this.content).parentCell = this;    //Inform the table that it is part of another one
            }
        }
        
        /*
         * Converts a <CellDefinition> into <CellDefinitionDetails> and extends the object by setting all optional properties.
         * @cellDef     CellDefinition              input
         * @return      CellDefinitionDetails       An object of type <CellDefinitionDetails>, where all optional fields are set
         */
        private extractCellDefinitionDetails(cellDef?: CellDefinition): CellDefinitionDetails {
            cellDef = cellDef || {};
            var details: CellDefinitionDetails = {};

            //Convert primitive values into "{content: primitive}":
            if (typeof cellDef === "string"         //string
                || cellDef instanceof jQuery        //JQuery
                || cellDef instanceof Table         //Table
                || isElement(cellDef)) {            //Element
                details.content = <string|JQuery|Table|Element>cellDef;
            } else if (<CellDefinitionDetails|Cell|CellDescription>cellDef instanceof Cell) {   //Cell
                details = (<Cell>cellDef).toObject(true);   //Extracts the Cell description
            } else {                                //<CellDefinitionDetails | CellDescription>
                details = cellDef;
            }

            //CellDescription might have the option "contentType", which has to be processed and removed from the "CellDefinitionDetails" type:
            if ((<CellDescription>details).contentType === CellContentType.jquery) {
                assert(typeof details.content === "string");
                details.content = jQuery(details.content);
            }
            delete (<CellDescription>details).contentType;
            
            return jQuery.extend({}, Cell.defaultCellDefinitionDetails, details);
        }
                        
        /*
         * Generates the DOM representation for this cell. Called by the constructor.
         * @rowType     RowType     RowType of the row this cell belongs to. Needed to distinguish between "th" for title rows and "td" for body rows.
         * @columnId    string      Id of the corresponsing column (used as a tag attribute)
         */
        private generateDom(rowType: RowType, columnId: string): void {   
            this.element = jQuery(document.createElement(rowType===RowType.title ? "th" : "td"));
            this.element.attr("data-columnId", columnId);
            
            if (typeof this.content === "string") {             //string
                this.element.html(<string>this.content);
            } else {                                            //Table / JQuery
                (</*Table|JQuery*/Table>this.content).appendTo(this.element);
            }
        }
        
        /*
         * Converts the Cell into an object. Used for serialisation.
         * Performs a deepCopy - if the cell contains a Table, that table is converted to.
         * @includeContent      boolean             true (default): The data is included in the object as well. Otherwise, the returned object only contains meta data. 
         * @return              CellDescription     DeepCopy of this cell
         */
        toObject(includeContent?: boolean): CellDescription {
            var description: CellDescription = {
                /*attributes...*/
            };

            if (!includeContent) {
                return description;
            }
            if (typeof this.content === "string") {             //string
                description.content = <string>this.content;
                description.contentType = CellContentType.string;
            } else if (<any>this.content instanceof jQuery) {   //JQuery
                description.content = (<JQuery>this.content).get(0).outerHTML;
                description.contentType = CellContentType.jquery;       //Is needed, so that the deserialisation process knows that the string should be converted into jQuery
            } else {                                            //Table
                description.content = (<Table>this.content).toObject(includeContent);
                description.contentType = CellContentType.table;
            }
            return description;
        }
    }        

}
