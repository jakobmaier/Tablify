/// <reference path="Tablify.ts" />

module Tablify {

    export class Row {
        private table: Table;                           //The table where this row belongs to

        /*[Readonly]*/ element: JQuery = null;          //References the <tr>-element. If this element !== null, it does not mean that the row is already part of the DOM
        
        private static rowIdSequence: number = 0;       //Used to auto-generate unique ids, if the user didn't pass an Id (note that this sequence produces globally unique ids)
        /*[Readonly]*/ rowId: string;                   //internal id, unique within the table
        /*[Readonly]*/ rowType: RowType;                //title- / body- / footer- row
        private cells: { [key: string]: Cell; } = {}    // {columnId: Cell, ...}


        /*
         * [Internal]
         * Generates a new Row
         * @table       Table                   The table where this row belongs to
         * @rowType     RowType                 The type of the row (titleRow, content, footer)
         * @rowDef      null                    The rowId is generated automatically
         *              string                  RowId. The cells of the newly generated row will be created using the column's default values.
         *              Row                     The row will be deep-copied. DOM-connections will not be copied. Note that the new object will have the same rowId.
         *              RowDefinitionDetails    Contains detailed information on how to generate the new row.
         *              RowDescription          Used for deserialisation.
         * @columns     Column[]                The currently existing columns in the table. The Row will get one cell per column, the content depends on the parameter "definition".
         */
        constructor(table: Table, rowType: RowType, rowDef: RowDefinition|RowDescription, columns: { [key: string]: Column; }) {
            assert(table instanceof Table && typeof rowType === "number" && typeof columns === "object");
            this.table = table;

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
                       
            if (rowInfo.generateMissingColumns === true) {      //If the content contains data for non-existing columns, the columns should not be generated
                //When a column is generated, the argument "columns" will automatically gain an additional field. This field is required in the next loop, which generates the cells for all existing columns.
                for (var columnId in rowInfo.content) {
                    if (!(columnId in columns)) {       //This column does not exist yet                   
                        table.addColumn(columnId);      //this row is not part of the table yet -> if we add the column, the cells of this row can't be 
                    }
                }
            }
                        
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
        }

        /*
         * [Internal]
         * Destroys the Row. This object will get unusable and members as well as member functions must not be used afterwards.
         * Note that this function does not remove the row from the DOM.
         */
        destroy(): void {
            logger.info("Deleting row \"" + this.rowId + "\".");
            this.table = null;
            this.element = null;
        }
        
        /*
         * Removes the row from its table.
         */
        remove(): void {
            assert(this.table.removeRow(this));
        }
        
        /*
         * Checks if the given row is the same as this row.
         * In order to match, the rows must be part of the same table and must have the same rowId (unique per table). Having the same data/cells is not a sufficient match.
         * @other       Row         The row that should be checked for equality
         * @return      boolean     Returns true, if the rows are identical. Returns false otherwise.
         */
        equals(other: Row): boolean {
            return (other.table === this.table && other.rowId === this.rowId);
        }

        /*
         * [Internal]
         * Adds a new column (=cell) to the row. Is called everytime a column is added to the table. Also updates DOM.
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
            } else {
                //With the current source code layout, this shouldn't happen - rows are inserted into the DOM as soon as they're attached to the table
                logger.warning("A column has been added to the row \"" + this.rowId + "\" and the row is not part of the DOM yet. This might be an error.");
            }
        }

        /*
         * [Internal]
         * Removes a column (=cell) from the Row. Is called everytime a column is removed from the table.
         * This function also removes the cell from the DOM.
         * @columnId    string          Id of the column, whose cell should be removed
         */
        removeColumn(columnId: string): void {
            this.cells[columnId].element.remove();
            delete this.cells[columnId];
        }
        
        /*
        * Returns all cells of this row
        * @return       { [key: string]: Cell; }    A list with all cells that are present within the row. The index represents the columnId.
        */
        getCells(): { [key: string]: Cell; } {
            return this.cells;
        }

        /*
         * Returns the cell of a sepcific column.
         * @identifier      string                      Returns the cell of the column with the given columnId. If the column doesn't exist, null is returned
         *                  number                      Returns the cell of the column with the specified index. The first (left) column has index 0. If the index is out of bounds, null is being returned.
         *                                              Note that passing numbers as strings (eg. getCell("4");) will be interpreted as a columnId, rather than an index.
         * @return          Cell                        The cell of the given column. If the column does not exist, null is being returned.
         */
        getCell(column: string|number): Cell {
            if (typeof column === "number") {           //Get the column with that index
                var col = this.table.getColumn(column);
                if (col === null) {     //The column does not exist
                    return null;
                }
                column = col.columnId;
            }
            return this.cells[<string>column] || null;
        }
                        
        /*
         * [Internal]
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

