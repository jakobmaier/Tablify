 /// <reference path="JsGrid.ts" />

module JsGrid {
    export type CellDefinitionDetails = {
        content: string;
    };
    export type CellDefinition = string | Cell | CellDefinitionDetails;
    
  

    export class Cell{
        private element: JQuery = null;     //References the <th>/<td>-element. If this element !== null, it does not mean that the cell is already part of the DOM
        content: string;

        /*
         * Generates a new Cell
         * @cellDef     string                  The (html-)content of the cell. The content is not html-escaped
         *              Cell                    The cell will be deep-copied.  DOM-connections will not be copied.
         *              CellDefinitionDetails   Contains detailed information on how to generate the cell
         */
        constructor(cellDef?: CellDefinition) {
            if (!cellDef){                                  //null / undefined -> empty cell
                this.content = "";
            } else if (typeof cellDef === "string"){
                this.content = cellDef;
            } else if (<any>cellDef instanceof Cell) {      //Copy-Constructor
                logger.info("Ceating new cell-copy.");
                this.content = (<Cell>cellDef).content;
            } else {                                        //CellDefinitionDetails
                this.content = cellDef.content;
            }
        }

        /*
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
            
            var html = "<" + tagType + " data-columnId='"+columnId+"'>"
                + this.content
                + "</" + tagType + ">";
            this.element = $(html);
            return this.element;
        }
        

        /*
         * Converts the Cell into an object. Used for serialisation.
         * Performs a deepCopy.
         * @return  mixed      Cell-Representation
         */
        toObject(): any {            
            return this.content;
        }
        
        //Todo: don't provide the following function - either improve the constructor, or make a factory method
        fromObject(rowId: string, representation: any): void {
            assert(false, "not implemented yet");
        }
    }
}
