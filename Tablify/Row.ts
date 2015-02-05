/// <reference path="Tablify.ts" />

module Tablify {
    "use strict";

    export class Row {

        /*[Readonly]*/ table: Table;                    //The table where this row belongs to.
        /*[Readonly]*/ element: JQuery;                 //References the <tr>-element.
        /*[Readonly]*/ rowId: string;                   //internal id, unique within the table.
        /*[Readonly]*/ rowType: RowType;                //title- / body- / footer- row
        private cells: { [key: string]: Cell; } = {}    // {columnId: Cell, ...}
        

        static defaultRowDefinitionDetails: RowDefinitionDetails = {    //Default options that are used in the constructor, if the user omitted them.
            rowId: null,
            rowType: RowType.body,
            content: {},
            generateMissingRows: false
        };

        /*
         * [Internal]
         * Generates a new Row
         * @table       Table                   The table where this row belongs to
         * @rowDef      null                    The rowId is generated automatically, the cells will have the column's default content
         *              string                  RowId. The cells of the newly generated row will be created using the column's default values.
         *              RowDefinitionDetails    Contains detailed information on how to generate the new row.
         *              Row                     The row will be deep-copied.
         *              RowDescription          Used for deserialisation.
         * @columns     Column[]                The currently existing columns in the table. The Row will get one cell per column, the content depends on the "rowDef" parameter.
         */
        constructor(table: Table, rowDef: RowDefinition, columns: { [key: string]: Column; }) {
            assert(table instanceof Table && typeof columns === "object");

            this.table = table;
            var definition: RowDefinitionDetails = this.extractRowDefinitionDetails(rowDef);    //Convert the input into RowDefinitionDetails
                        
            this.rowId = definition.rowId || this.table.getUniqueRowId();
            this.rowType = definition.rowType;
            logger.info("Ceating new row \"" + this.rowId + "\".");
                       

            //definition.content can have one of the following typses: <string|JQuery|Table|Element|Cell| {[key: string]:CellDefinition;}>            
        //Check if each cell should get the same value:
            //If each cell should be initialised with the same content, it must be deep-copied. (jQuery/Elements/Tables must be cloned) This can be done by using the Cell copy-constr., which performs such a deep copy                    
            if (typeof definition.content === "string"          //string
                || <any>definition.content instanceof jQuery    //JQuery
                || <any>definition.content instanceof Table     //Table
                || <any>definition.content instanceof Cell      //Cell
                || isElement(definition.content)) {             //Element
                var proto: Cell = null;
                for (var columnId in columns) {                 //Generate a cell for each column
                    if (!proto) {
                        proto = this.cells[columnId] = new Cell(definition.content, this, columnId);
                    } else {
                        this.cells[columnId] = new Cell(proto, this, columnId); //Copy constructor = deep copy
                    }
                }
            } else {    //definition.content now has the type < {[key: string]: CellDefinition;} >
                var cellContents: { [key: string]: CellDefinition } = <{ [key: string]: CellDefinition }>definition.content;

                if (definition.generateMissingColumns === true) {       //If the content contains data for non-existing columns, the columns should be generated
                    //When a column is generated, the argument "columns" will automatically gain an additional field. This field is required in the next loop, which generates the cells for all existing columns.
                    for (var columnId in cellContents) {
                        if (!(columnId in columns)) {       //This column does not exist yet                   
                            table.addColumn(columnId);      //this row is not part of the table yet -> if we add the column, the cells of this row can't be 
                        }
                    }
                }

                for (var columnId in columns) {             //generate a cell for each column
                    if (columnId in cellContents) {
                        this.cells[columnId] = new Cell(cellContents[columnId], this, columnId);
                        continue;
                    }
                    logger.info("Using default value in row \"" + this.rowId + "\" for column \"" + columnId + "\".");
                    switch (this.rowType) {
                        case RowType.title:
                            this.cells[columnId] = new Cell(columns[columnId].defaultTitleContent, this, columnId);
                            break;
                        case RowType.body:
                            this.cells[columnId] = new Cell(columns[columnId].defaultBodyContent, this, columnId);
                            break;
                        default: assert(false, "Invalid RowType given.");
                    }
                }

            }
            
            this.generateDom();      //Generates the DOM representation of this row.
        }

        /*
         * Converts a <RowDefinition> into <RowDefinitionDetails> and extends the object by setting all optional properties.
         * @columnDef   RowDefinition              input
         * @return      RowDefinitionDetails       An object of type <RowDefinitionDetails>, where all optional fields are set. Note that the rowId might still be null.
         */
        private extractRowDefinitionDetails(rowDef?: RowDefinition): RowDefinitionDetails{
            rowDef = rowDef || {};
            var details: RowDefinitionDetails = {};
            
            if (typeof rowDef === "string") {    //String
                details.rowId = rowDef;
            } else if (<RowDefinitionDetails|Row|RowDescription>rowDef instanceof Row) {   //Row
                details = (<Row>rowDef).toObject(true);   //Extracts the Row description
                if ((<Row>rowDef).table === this.table) {
                    details.rowId = this.table.getUniqueRowId();
                }
                details.content = (<Row>rowDef).getCells(); //Also copy the row's cells
                details.generateMissingColumns = false;
            } else {                            //<RowDefinitionDetails | RowDescription>
                details = rowDef;
            }
            return jQuery.extend({}, Row.defaultRowDefinitionDetails, details);
        }
        
        /*
         * Generates the DOM representation for this row. Called by the constructor.
         */
        private generateDom(): void {
            this.element = jQuery(document.createElement("tr"));
            this.element.attr("data-rowId", this.rowId);
            
            for (var columnId in this.cells) {
                this.element.append(this.cells[columnId].element);
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
            delete this.element;
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
         * @column    Column                    Information about the new Column
         * @content   CellDefinition            The cell that should be assigned to the new column. A new copy of this parameter is generated.
         * @throws    OperationFailedException  Is thrown if the column already has such a column
         */
        addColumn(column: Column, content: CellDefinition): void {
            var columnId: string = column.columnId;
            if (columnId in this.cells) {
                throw new OperationFailedException("addColumn()", "The row \"" + this.rowId + "\" has already a column with the id \"" + columnId + "\".");
            }
            var cell: Cell = new Cell(content, this, columnId);
            this.cells[columnId] = cell;            
            this.element.append(cell.element);      //Append the cell to the DOM
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
         * @column      string      Returns the cell of the column with the given columnId. If the column doesn't exist, null is returned
         *              number      Returns the cell of the column with the specified position/index. The first (left) column has position 0. If the position is out of bounds, null is being returned.
         *              Column      Returns the cell belonging to this column.
         *                          Note that passing numbers as strings (eg. getCell("4");) will be interpreted as a columnId, rather than a position.
         * @return      Cell        The cell of the given column. If the column does not exist, null is being returned.
         */
        getCell(column: string|number|Column): Cell {
            if (typeof column === "number") {           //Get the column with that position/index
                var col = this.table.getColumn(<number>column);
                if (col === null) {     //The column does not exist
                    return null;
                }
                column = col.columnId;
            } else if (<any>column instanceof Column) {
                column = (<Column>column).columnId;
            }
            return this.cells[<string>column] || null;
        }
                        
        
                
        /*
         * Converts the Row into an object. Used for serialisation.
         * Performs a deepCopy.
         * @includeContent      boolean             true (default): The data is included in the object as well. Otherwise, the returned object only contains meta data. 
         * @return              RowDescription      DeepCopy of this row
         */
        toObject(includeContent?: boolean): RowDescription{
            var description : RowDescription = {
                rowId: this.rowId,
                rowType: this.rowType,
                content: {}
            };
            for (var columnId in this.cells) {
                description.content[columnId] = this.cells[columnId].toObject(includeContent);
            }
            return description;
        }

    } 
}

