 /// <reference path="Tablify.ts" />

module Tablify {
    "use strict";

    export class Cell {

        /*[Readonly]*/ element: JQuery = null;              //References the <th>/<td>-element.
        /*[Readonly]*/ content: CellContent;                //content of the cell.


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
         */
        constructor(cellDef?: CellDefinition) {

            if (!cellDef) {                             //null / undefined -> empty cell
                this.content = "";
            } else if (typeof cellDef === "string"      //string
                    || cellDef instanceof jQuery        //JQuery
                    || cellDef instanceof Table) {      //Table
                this.content = <string|JQuery|Table>cellDef;
            } else if (isElement(cellDef)) {            //Element
                this.content = $(cellDef);
            } else if (cellDef instanceof Cell) {       //Cell -> Copy-Constructor
                if (typeof cellDef.content === "string") {              //string
                    this.content = cellDef.content;
                } else if (<any>cellDef.content instanceof jQuery) {    //JQuery
                    this.content = (<JQuery>cellDef.content).clone(false, false);
                } else {                                                //Table
                    this.content = new Table((<Table>cellDef.content).toObject(true));
                }  
                /*attributes...*/
            } else {                                    //CellDefinitionDetails / CellDescription                                
                // cellDef.content can have one of these types: <null|undefined|string|JQuery|Table|Element|TableDescription>
                if (!(<CellDefinitionDetails|CellDescription>cellDef).content) {                            //null / undefined -> empty cell
                    this.content = ""; 
                } else if (isElement((<CellDefinitionDetails|CellDescription>cellDef).content)) {           //Element
                    this.content = $((<CellDefinitionDetails|CellDescription>cellDef).content);
                } else if (typeof (<CellDefinitionDetails|CellDescription>cellDef).content === "object"                                         //--> remaining: <JQuery|Table|TableDescription>
                            && !(<JQuery|Table|TableDescription>((<CellDefinitionDetails|CellDescription>cellDef).content) instanceof jQuery)   //--> remaining: <Table|TableDescription>
                            && !(<Table|TableDescription>((<CellDefinitionDetails|CellDescription>cellDef).content) instanceof Table)) {        //TableDescription
                    this.content = new Table(<TableDescription>((<CellDefinitionDetails|CellDescription>cellDef).content));

                    console.log("Cell content for small, inner table: ", ((<any>((<CellDefinitionDetails|CellDescription>cellDef).content)).rows[0].content));
                } else {                                                //<string|JQuery|Table>
                    this.content = <string|JQuery|Table>(<CellDefinitionDetails|CellDescription>cellDef).content; 
                } 
                /*attributes...*/ 
            }
            
            if (<any>this.content instanceof Table) {
                (<Table>this.content).parentCell = this;        //Inform the table that it is part of another one
            }
        }

        /*
         * [Internal]
         * Constructor alternative. Makes a complete clone of the cell, and returns a new one.
         * If the cell content is an HTML Element (JQuery) or Table, it will be copied as well.
         * @return      Cell        completly new, deep-copied Cell that doesn't share any resources with the current cell.
         */
        clone(): Cell {
            //<string|JQuery|Table>
            if (typeof this.content === "string") {                 //string - no cloning required
                return new Cell(this.content);
            }
            if (<JQuery|Table>this.content instanceof jQuery) {     //JQuery
                return new Cell((<JQuery>this.content).clone(true));
            }
            //Table
            assert(<any>this.content instanceof Table);
            console.log("Cloning a table");
            return new Cell(new Table(<Table>this.content));
        }

        /*
         * [Internal]
         * Returns a JQuery->HTMLElement, representing the Cell. This element can be attached to the DOM.
         * @tagtype     string      Can either be "th" for title rows or "td" for body rows.
         * @columnId    string      Id of the corresponsing column (used as a tag attribute)
         * @return      JQuery      Element, that can be insterted into the DOM
         */
        generateDom(tagType: string, columnId: string): JQuery {
            if (this.element !== null) {
                logger.warning("Cell: generateDom has been called, although the element has already been generated before. This might be an error.");
                return this.element;
            }
            assert_argumentsNotNull(arguments);
            assert(tagType === "th" || tagType === "td", "Cells must have a \"th\" or \"td\" tagType.");

            this.element = $(document.createElement(tagType));
            this.element.attr("data-columnId", columnId);
            
            if (typeof this.content === "string") {             //string
                this.element.html(<string>this.content);
            } else {                                            //Table / JQuery
                (</*Table|JQuery*/Table>this.content).appendTo(this.element);
            } 

            return this.element;
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
            } else if (<any>this.content instanceof jQuery) {   //JQuery
                description.content = (<JQuery>this.content).get(0).outerHTML;
            } else {                                            //Table
                description.content = (<Table>this.content).toObject(includeContent);
            }

            return description;
        }
    }        
}
