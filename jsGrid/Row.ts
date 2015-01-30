/// <reference path="JsGrid.ts" />

module JsGrid {

    export class Row {

        private element: JQuery = null;             //References the <tr>-element. If this element !== null, it does not mean that the row is already part of the DOM
        
        private static rowIdSequence: number = 0;   //Used to auto-generate unique ids, if the user didn't pass an Id
        rowId: string;                              //internal id
        rowType: RowType;                           //title- / body- / footer- row
        cells: { [key: string]: Cell; } = {}        // {columnId: Cell, ...}


        /*
         * Generates a new Row
         * @rowType     RowType                 The type of the row (titleRow, content, footer)
         * @rowDef      null                    The rowId is generated automatically
         *              string                  RowId. The cells of the newly generated row will be created using the column's default values.
         *              Row                     The row will be deep-copied. DOM-connections will not be copied. Note that the new object will have the same rowId.
         *              RowDefinitionDetails    Contains detailed information on how to generate the new row.
         *              RowDescription          Used for deserialisation.
         * @columns     Column[]                The currently existing columns in the table. The Row will get one cell per column, the content depends on the parameter "definition".
         */
        constructor(rowType: RowType, rowDef: RowDefinition|RowDescription, columns: { [key: string]: Column; }) {
            assert(typeof rowType === "number" && typeof columns === "object");

            var rowInfo: RowDefinitionDetails;
            if (typeof rowDef === "string") {
                rowInfo = { rowId: rowDef };
            } else if (<any>rowDef instanceof Row) {    //Copy-Constructor
                logger.info("Ceating new row-copy of \"" + other.rowId + "\".");
                var other: Row = <Row>rowDef;
                this.rowId = other.rowId; 
                this.rowType = other.rowType;
                for (var columnId in other.cells) {
                    this.cells[columnId] = new Cell(other.cells[columnId]);
                }
                return;
            } else {                                    //null / RowDefinitionDetails / RowDescription
                rowInfo = rowDef || {};
            }
            
            rowInfo.content = rowInfo.content || {};    //Opt. parameter

            this.element = null;
            this.rowId = rowInfo.rowId || ("jsr" + (++Row.rowIdSequence));
            this.rowType = rowType;

            logger.info("Ceating new row \"" + this.rowId + "\".");
           
            for (var columnId in columns) {             //generate a cell for each column
                if (columnId in rowInfo.content) {
                    this.cells[columnId] = new Cell( rowInfo.content[columnId] );
                    continue;
                }
                logger.info("Using default value for row \"" + this.rowId + "\", col \"" + columnId + "\".");
                switch (this.rowType) {
                    case RowType.title: this.cells[columnId] = new Cell(columns[columnId].defaultTitleContent);
                        break;
                    case RowType.body:  this.cells[columnId] = new Cell(columns[columnId].defaultBodyContent);
                        break;
                    default: assert(false, "Invalid RowType given.");
                }                
            }
            if (inputValidation) {  //Check if the rowDefinition has some invalid data
                //todo: regex-check of rowId here, so that it doesn't contain special characters that can ruin html
                for (var columnId in rowInfo.content) {
                    logger.warningIf(!(columnId in columns), "The row definition of row \"" + this.rowId + "\" contains data for column \"" + columnId + "\", although there is no such column.");
                }
            }
        }

        /*
         * Adds a new column to the row. Is called everytime a column is added to the table.
         * @column    Column            Information about the new Column
         * @content   CellDefinition    The cell that should be assigned to the new column. A new copy of this parameter is generated.
         */
        addColumn(column: Column, content: CellDefinition): void {
            assert_argumentsNotNull(arguments);
            var columnId: string = column.columnId;
            if (columnId in this.cells) {
                logger.error("The row \""+this.rowId+"\" has already a column with the id \"" + columnId + "\".");
                return;
            }
            var cell: Cell = new Cell(content);
            this.cells[columnId] = cell;
            if (this.element !== null) {
                var cellDom: JQuery = cell.generateDom(this.rowType === RowType.title ? "th" : "td", columnId);
                this.element.append(cellDom); 
                console.log("row " + this.rowId + " / " + columnId + " = "+ cell.content);
            } else {
                //With the current source code layout, this shouldn't happen - rows are inserted into the DOM as soon as they're attached to the table
                logger.warning("A column has been added to the row \"" + this.rowId + "\" and the row is not part of the DOM yet. This might be an error.");
            }
        }


        /*
         * Returns a JQuery->HTMLElement, representing the Row (including all cells). This element can be attached to the DOM.
         * @return      JQuery      Element, that can be insterted into the DOM
         */
        generateDom(): JQuery {
            if (this.element !== null) {
                logger.warning("Row: generateDom has been called, altough the element has already been generated before. This might be an error.");
                return this.element;
            }
           
            var element:JQuery = $("<tr data-rowId:'" + this.rowId + "'></tr>");

            for (var columnId in this.cells) {
                var cell: JQuery = this.cells[columnId].generateDom(this.rowType === RowType.title ? "th" : "td", columnId);
                element.append(cell);
            }
            this.element = element;
            return element;
        }


        
        /*
         * Converts the Row into an object. Used for serialisation.
         * Performs a deepCopy.
         * @includeContent      boolean             true (default): The data is included in the object as well. Otherwise, the returned object only contains meta data. 
         * @return              RowDescription      DeepCopy of this row
         */
        toObject(includeContent?: boolean): RowDescription{
            var description : RowDescription = {
                rowId:   this.rowId
            };
            console.log(includeContent);
            if (includeContent === false) {      //Don't include any data
                return description;
            }
            
            description.content = {};
            for (var columnId in this.cells) {
                description.content[columnId] = this.cells[columnId].toObject();
            }
            return description;
        }

    } 
}

