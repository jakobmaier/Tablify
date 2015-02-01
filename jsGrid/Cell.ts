 /// <reference path="JsGrid.ts" />

module JsGrid {

    export class Cell {

        /*[Readonly]*/ element: JQuery = null;  //References the <th>/<td>-element. If this element !== null, it does not mean that the cell is already part of the DOM

        /*[Readonly]*/ content: string;         //content of the cell. Might contain HTML.

        /*
         * [Internal]
         * Generates a new Cell
         * @cellDef     string                  The (html-)content of the cell. The content is not html-escaped
         *              Cell                    The cell will be deep-copied.  DOM-connections will not be copied.
         *              CellDefinitionDetails   Contains detailed information on how to generate the cell
         *              CellDescription         Used for deserialisation
         */
        constructor(cellDef?: CellDefinition|CellDescription) {
            if (!cellDef) {                                  //null / undefined -> empty cell
                this.content = "";
            } else if (typeof cellDef === "string") {
                this.content = cellDef;
            } else if (<any>cellDef instanceof Cell) {      //Copy-Constructor
                logger.info("Ceating new cell-copy.");
                this.content = (<Cell>cellDef).content;
            } else {                                        //CellDefinitionDetails / CellDescription
                this.content = cellDef.content;
            }
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

            var html = "<" + tagType + " data-columnId='" + columnId + "'>"
                + this.content
                + "</" + tagType + ">";
            this.element = $(html);
            return this.element;
        }
        
        /*
         * Converts the Cell into an object. Used for serialisation.
         * Performs a deepCopy.
         * @return  CellDescription         DeepCopy of this cell
         */
        toObject(): CellDescription {            
            //return { content: this.content };
            return this.content;
        }
    }        
}
