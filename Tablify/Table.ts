/// <reference path="Tablify.ts" />

module Tablify {
    "use strict";

    export class Table {

        //References to commonly used HTML elements:
        /*[Readonly]*/ table: JQuery = null;    //<table>
        private thead: JQuery;                  //<thead>
        private tbody: JQuery;                  //<tbody>
        private tfoot: JQuery;                  //<tfoot>

        /*[Readonly]*/ tableId: string;                 //Unique table id
       
        /*[Readonly]*/ parentCell: Cell = null;         //If this is a nested table, parentCell is the container of the table. This variable is set by the Cell. (If the table gets destroyed, the cell needs to be informed to convert Table into JQuery)


        //Column properties:
        private sortedColumns: Column[] = [];               //All columns, sorted from left to right.
        private columns: { [key: string]: Column; } = {};   //All columns, sorted by their id
        //var columns: Map<string, Column>;                 //better alternative to the above definition. However, this is part of EcmaScript6 and currently not supported very well
        
        //Table content - each row is referenced twice for faster access:
        private titleRows: Row[] = [];                      //Rows, which are part of the table head. Sorted by their output order.
        private bodyRows: Row[] = [];                       //Rows, containing the data. Sorted by their output order.
        private footerRows: Row[] = [];                     //Rows, containing the data. Sorted by their output order.
        private rows: { [key: string]: Row; } = {};         //All rows, sorted by their id
         

        static defaultTableDefinitionDetails: TableDefinitionDetails = {    //Default options that are used in the constructor, if the user omitted them.
            tableId: null,
            columns: [],
            rows: [],
            titleRowCount: 0
        };
        static defaultAnimation: boolean | string | number | JQueryAnimationOptions = false;    //The default value for animations. Is used when rows and columns are inserted or removed.


        /*
         * Generates and returns a new Tablify Table    (Note: If the given html table element is already managed, the old Table-instance will be returned instead of generating a new one)
         * @tableDef        null/undefined              An empty table with no rows and columns will be created.
         *                  string                      tableId. An empty table with the given tableId will be generated.
         *                  TableDefinitionDetails      Data, how the table should look like (rows / columns / ...)
         *                  Table                       The table will be deep-copied.
         *                  TableDescription            Similar to TableDefinitionDetails. Used for deserialisation.
         * @target          string                      JQuery-Selector. Is resolved to a JQuery element (see below)
         *                  JQuery                      References a single HTMLElement. If the Element is a <table> (HTMLTableElement), the Table is initialised with the table content; Otherwise, a new table is generated within the HTMLElement
         *                  Element                     Target element. Is converted to a JQuery element (see above)
         * @throws      OperationFailedException        Is thrown if the table couldn't get generated. This can happen if the selector doesn't find a unique DOM element.
         *              InvalidArgumentException        Is thrown if invalid arguments have been passed
         * Note: If no target is passed, the table won't be appended to the DOM.
         * Note: Both parameters are optional. It is also possible to ommit the first parameter and only pass the target.
         * Note: If only a single string is passed, it will be interpreted as an selector rather than a tableId (A string as the first argument is always a selector).
         */
        constructor(target?: Selector);
        constructor(tableDef: TableDefinition, target?: Selector);

        constructor(tableDef?: TableDefinition|Selector, target?: Selector) {  
          
            //Interchange arguments, if the first parameter has been omitted:
            if (typeof tableDef === "string" || tableDef instanceof jQuery || isElement(tableDef)) {    //If the first parameter is a string, it will always be interpreted as a selector.
                if (arguments.length !== 1) {
                    throw new InvalidArgumentException("Table.constructor()", "Invalid usage. The first parameter needs to be the TableDefinition, while the second parameter is the target. Both parameters can be omitted, but their order can't be interchanged.");
                }
                target = <string|JQuery|Element>tableDef;
                tableDef = null;
            }

            var definition: TableDefinitionDetails = this.extractTableDefinitionDetails(tableDef);    //Convert the input into TableDefinitionDetails
            this.tableId = definition.tableId || Table.getUniqueTableId();
            
            //Find the target for the table:    
            if (!target) {                                  //No target provided -> don't attach to DOM
                logger.info("Creating detached table element.");
                this.generateDom();
            } else {
                //Find the selected element:
                this.table = resolveUniSelector(target);
                if (!this.table) {
                    throw new OperationFailedException("Table.constructor()", "Unable to find unique DOM Element with the following selector: \"" + target + "\"");
                }
                //Check if the selected element can be used: 
                if (this.table.prop("tagName") !== "TABLE") {       //Create a new table within this element
                    logger.info("Appending table element. Parent tag: ", this.table.prop("tagName"));
                    var container = this.table;
                    this.generateDom();
                    container.append(this.table);
                } else {
                    if (this.table.hasClass("tablified")) {         //Maybe the table has already been initialised with Tablify? If yes, return the already existing object and don't create a new one
                        var existingObj = tableStore.getTableByElement(this.table);     //expensive operation
                        if (existingObj !== null) {                 //The table is already managed by another Table-instance
                            logger.warning("The given HTML element is already managed by another Table instance (\"" + existingObj.tableId + "\"). The existing instance will be returned instead of creating a new one.");
                            return existingObj;
                        }
                    }
                    //Todo: Read the existing html-table and manage it
                    throw new OperationFailedException("Table.constructor()", "Not implemented yet: Tablify is currently not able to read existing HTML tables and mange them. Tables have to be created completely using Tablify.");
                }
            }    
            //The target has been found, now the table needs to be initialised:
            this.table.addClass("tablified");
            this.table.attr("data-tableId", this.tableId);
            tableStore.registerTable(this);

            this.thead = this.table.find("thead");
            this.tbody = this.table.find("tbody");
            this.tfoot = this.table.find("tfoot");
            //Generate the table content:           
            if (typeof definition.columns === "number") {           //number
                definition.columns = makeArray(<number>definition.columns, null);
            }                                                       //ColumnDefinition[]
            for (var i = 0; i < (<ColumnDefinition[]>definition.columns).length; ++i) {
                this.addColumn(definition.columns[i], null, false);
            }

            var titleRowCount = definition.titleRowCount;           //Number of rows that should always be titleRows, regardless of possible row.rowType values
            var footerRowCount = definition.footerRowCount;         //Number of rows that should always be footerRows, regardless of possible row.rowType values
            if (typeof definition.rows === "number") {              //number
                definition.rows = makeArray(<number>definition.rows, null);
            }                                                      //RowDefinition[]
            for (var i = 0; i < (<RowDescription[]>definition.rows).length; ++i) {
                if (titleRowCount > i) {
                    this.addTitleRow(definition.rows[i], null, false);
                } else if (footerRowCount > (<RowDescription[]>definition.rows).length - i) {
                    this.addFooterRow(definition.rows[i], null, false);
                } else {
                    this.addRow(definition.rows[i], null, false);
                }
            }

        }        
     
        /*
         * Converts a <TableDefinition> into <TableDefinitionDetails> and extends the object by setting all optional properties.
         * @tableDef    TableDefinition              input
         * @return      TableDefinitionDetails       An object of type <TableDefinitionDetails>, where all optional fields are set; Note that the tableId might still be null.
         */
        private extractTableDefinitionDetails(tableDef?: TableDefinition): TableDefinitionDetails {
            tableDef = tableDef || {};
            var details: TableDefinitionDetails = {};

            if (typeof tableDef === "string") {     //String
                details.tableId = tableDef;
            } else if (<TableDefinitionDetails|Table|TableDescription>tableDef instanceof Table) {   //Table
                details = (<Table>tableDef).toObject(true);     //Extracts the Table description
            } else {                                //<TableDefinitionDetails | TableDescription>
                details = <TableDefinitionDetails|TableDescription>tableDef;
            }
            return jQuery.extend({}, Table.defaultTableDefinitionDetails, details);
        }

        /*
         * Generates a blank new DOM representation for this table. Called by the constructor.
         */
        private generateDom(): void {
            this.table = jQuery(document.createElement("table"));
            this.table.append(
                document.createElement("thead"),
                document.createElement("tbody"),
                document.createElement("tfoot")
                );
        }

        /*
         * Returns true, if the table manages the given HTMLelement
         * @table   Selector    References a HTMLElement. If this HTMLElement is managed by this table object, true is returned
         * @return  boolean     true: The given HTMLElement (<table>) is managed by this Table-instance. Otherwise, false is returned
         */
        representsTable(table: Selector): boolean {
            var other = resolveUniSelector(table);
            if (!other) {
                return false;
            }
            return (this.table[0] === other[0]);
        }

        /*
         * Destroys the Tablify Table. This object will get unusable and members as well as member functions must not be used afterwards.
         */
        destroy(): void {
            tableStore.unregisterTable(this);
            this.table.removeClass("tablified");
            this.table.removeAttr("data-tableId");

            if (this.parentCell) {  //This table is nested and part of a Cell that stores a Table reference -> change it into a not-manages Table
                assert(this.parentCell.content === this);
                this.parentCell.content = this.table;
            }
            this.table = null;
        }
    
        /*
         * Returns true, if the table is part of the DOM
         * @return      boolean         true: The table is part of the DOM; false: the table is detached and not part of the DOM.
         */
        isPartOfDOM(): boolean {
            return jQuery.contains(<any>document, <any>this.table.get(0));
        }

        /*
         * Inserts the table at the end of the target. If the table is already part of the DOM, it will be moved rather than cloned.
         * @target      Selector    target element
         * @return      Table       Returns this table
         */
        appendTo(target: Selector): Table {
            logger.info("Attaching table element.");
            this.table.appendTo(<any>target);       //cast is needed due to the use of an outdated TypeScript version within the jQuery definition
            return this;
        }

        /*
         * Inserts the table at the beginning of the target. If the table is already part of the DOM, it will be moved rather than cloned.
         * @target      Selector    target element
         * @return      Table       Returns this table
         */
        prependTo(target: Selector): Table {
            logger.log("Attaching table element.");
            this.table.prependTo(<any>target);       //cast is needed due to the use of an outdated TypeScript version within the jQuery definition
            return this;
        }
        
        /*
         * Adds a new column to the table.
         * @column          null / undefined            The columnId is generated automatically.
         *                  string                      ColumnId. The cells of the newly generated column will be empty.
         *                  ColumnDefinitionDetails     Contains detailed information on how to generate the new column.
         *                  Column                      The column will be deep-copied.
         *                  ColumnDescription           Used for deserialisation.
         * @position        ColumnPositionDefinition    Position, where this column should be inserted.
         *                  null                        inserted at the end (right)
         *                  "left"                      The column will be inserted at the beginning (left)
         *                  "right"                     The column will be inserted at the ending (right)
         *                  positive number             Position for the column. If this position is not possible (number too big), it will be inserted at the ending (right)
         *                  negative number             Position from the ending. -1: inserted at the end (right). -2: inserted at the second last. If this position is not possible (number too low), it will be inserted at the beginning (left)
         *                  Column                      The column will be inserted before the given one.
         * @animate         null / undefined            Default options are used. The option can be changed with "Table.defaultAnimation"
         *                  AnimationSettings           Information about how to animate the insertion. false: no animation.
         * @return          Column                      Returns the newly generated Column.
         * @throws          OperationFailedException    Is thrown if the column couldn't get added to the table.
         */
        addColumn(columnDef?: ColumnDefinition, position?: ColumnPositionDefinition, animate?: AnimationSettings): Column {
            var column = new Column(this, columnDef);
            var columnId: string = column.columnId;
            if (columnId in this.columns) {
                throw new OperationFailedException("addColumn()", "There is already a column with the id \"" + columnId + "\" in the table.");
            }
            this.integrateColumn(position, column);
            //Add the new column to all existing rows:
            var content: { [key: string]: CellDefinition; } = {};
            var generateMissingRows: boolean = false;
            if (columnDef && typeof columnDef !== "string" && !(columnDef instanceof Column)) {     //ColumnDefinitionDetails / ColumnDescription
                content = (<ColumnDefinitionDetails>columnDef).content || {};
                generateMissingRows = ((<ColumnDefinitionDetails>columnDef).generateMissingRows === true);
            }
            if (<any>columnDef instanceof Column) {         //Also copy the column's cells
                content = (<Column>columnDef).getCells();
                generateMissingRows = false;
            }

            if (generateMissingRows) {              //If the content contains data for non-existing rows, the rows should be generated   
                for (var rowId in content) {
                    if (!(rowId in this.rows)) {    //This row does not exist yet      
                        this.addRow(rowId);
                    }
                }
            }
            //Insert column into table:
            this.columns[columnId] = column;
            this.sortedColumns.splice(column.columnPos, 0, column);

            //Insert column into html:  (Add a new cell to each row (the DOM will be updated by each row)):
            this.eachRow(function (row: Row) {
                var cell: CellDefinition;
                if (row.rowId in content) {     //The user passed a definition on how to create this cell
                    cell = content[row.rowId];
                } else {
                    switch (row.rowType) {
                        case RowType.title: cell = column.defaultTitleContent; break;
                        case RowType.body: cell = column.defaultBodyContent; break;
                        case RowType.footer: cell = column.defaultFooterContent; break;
                        default: assert(false, "Invalid RowType.");
                    }
                }
                row.addColumn(column, cell);
            });
            
            //Animation:
            if (animate === null || animate === undefined) {    //No value given -> default value
                animate = Table.defaultAnimation;
            }

            if (animate && column.isVisible()) {
                column.slideRight(animate);
            }
            return column;
        }
        
        /*
         * Integrates the column by identifying its position and neigbours and making left/right connections inbetween the columns
         * @position        ColumnPositionDefinition    Position, where this column should be inserted.
         *                  null                        inserted at the end (right)
         *                  "left"                      The column will be inserted at the beginning (left)
         *                  "right"                     The column will be inserted at the ending (right)
         *                  positive number             Position for the column. If this position is not possible (number too big), it will be inserted at the ending (right)
         *                  negative number             Position from the ending. -1: inserted at the end (right). -2: inserted at the second last. If this position is not possible (number too low), it will be inserted at the beginning (left)
         *                  Column                      The column will be inserted before the given one.
         * @column          Column                      The column which should be inserted (not part of the table yet)
         */
        private integrateColumn(position: ColumnPositionDefinition, column: Column): void {
            var colPos: number;
            var noWarn: boolean = false;
            if (typeof position === "string") {
                switch (position.toLowerCase()) {
                    case "left":    colPos = 0; break; //First column
                    case "right":   colPos = this.getColumnCount(); break; //Last column
                    default:
                        logger.error("\"position\" contains an invalid string.");
                        colPos = this.getColumnCount();
                }
                noWarn = true;
            } else if (typeof position === "number") {
                colPos = position;
                if (colPos < 0) {       //-1 = after currently last Column
                    colPos = this.getColumnCount() + 1 + colPos;
                }
            } else if (position) {
                if (position.table !== this) {
                    logger.error("The given column from \"position\" belongs to a different table.");
                    colPos = this.getColumnCount();
                    noWarn = true;
                }
                colPos = position.columnPos;    //Insert on the left of the given column
            } else {                                //Default = last column
                colPos = this.getColumnCount();
                noWarn = true;
            }

            //Check if the colPos is valid:
            if (colPos < 0) {
                colPos = 0; 
                if (!noWarn) { logger.warning("The given column position is too small. The column will be inserted at the beginning."); }
            } else if (colPos > this.getColumnCount()) {
                colPos = this.getColumnCount();
                if (!noWarn) { logger.warning("The given column position is too big. The column will be inserted at the end."); }
            }

            //Get neighbours:
            var rightColumn: Column = this.getColumn(colPos);
            var leftColumn: Column = rightColumn ? rightColumn.left() : this.getColumn(-1);

            //Insert the row:
            column.leftColumn = leftColumn;
            column.rightColumn = rightColumn;
            column.columnPos = colPos;
            if (leftColumn !== null) {
                leftColumn.rightColumn = column;
            }
            if (rightColumn !== null) {
                rightColumn.leftColumn = column;
            }
                       
            //Increase columnPos in shifted columns:
            var it: Column = column;
            while ((it = it.right()) !== null) {
                ++it.columnPos;
            }
        }
        
        /*
         * Adds a new row to the table
         * @rowDef      null / undefined            The rowId is generated automatically.
         *              string                      RowId. The cells of the newly generated row will be created using the column's default values.
         *              RowDefinitionDetails        Contains detailed information on how to generate the new row.
         *              Row                         The row will be deep-copied.
         *              RowDescription              Used for deserialisation.
         * @position    RowPositionDefinition       Position, where this row should be inserted. See Table.integrateRow().
         * @animate     null / undefined            Default options are used. The option can be changed with "Table.defaultAnimation"
         *              AnimationSettings           Information about how to animate the insertion. false: no animation.
         * @return      Row                         Returns the newly generated Row.
         * @throws      OperationFailedException    Is thrown if the row couldn't get added to the table.
         */
        addRow(rowDef?: RowDefinition, position?: RowPositionDefinition, animate?: AnimationSettings): Row {
            var row = new Row(this, rowDef, this.columns);
            if (row.rowId in this.rows) {
                throw new OperationFailedException("addRow()", "There is already a row with the id \"" + row.rowId + "\" in the table.");
            }
            this.integrateRow(position, row);       //Connects the row with it's neighbours                   
            //Add row to table:
            this.rows[row.rowId] = row;
            switch (row.rowType) {
                case RowType.title:  this.titleRows.splice(row.rowPos, 0, row); break;
                case RowType.body:   this.bodyRows.splice(row.rowPos - this.getRowCount(RowType.title), 0, row); break;
                case RowType.footer: this.footerRows.splice(row.rowPos - this.getRowCount(RowType.title) - this.getRowCount(RowType.body), 0, row); break;
                default: assert(false, "Invalid RowType given.");
            }
            //Add row to html:
            if (row.up() && row.up().rowType === row.rowType) {
                row.element.insertAfter( row.up().element );
            } else {
                switch (row.rowType) {
                    case RowType.title:  this.thead.prepend(row.element); break;
                    case RowType.body:   this.tbody.prepend(row.element); break;
                    case RowType.footer: this.tfoot.prepend(row.element); break;
                }
            }
            //Animation:
            if (animate === null || animate === undefined) {    //No value given -> default value
                animate = Table.defaultAnimation;
            }
            if (animate && row.isVisible()) {
                row.slideDown(animate);
            }
            return row;
        }

        /*
         * Integrates the row by interpreting its position, identifying its new neigbours and making upper/lower connections inbetween the rows
         * If the row is already part of the table, the existing connections will be unraveld correctly
         * @position    RowPositionDefinition       Position, where this row should be inserted.
         *              null                        insertion at the end of the section
         *              "top"                       The row will be inserted at the beginning of the section (title/body/footer)
         *              "bottom"                    The row will be inserted at the end of the section (title/body/footer)
         *              positive number             Position for the row within the row's section. If this position is not possible (eg. "6" for a titleRow, also the title only has 2 rows), the nearest possible position will be chosen.
         *              negative number             Position from the ending within the row's section. -1: inserted at the end of the section. -2: inserted at the second last. If this position is not possible, the nearest possible position will be chosen.
         *              Row                         The row will be inserted before the given one. If this position is not possible, the nearest possible position will be chosen.
         * @row         Row                         The row which should be inserted (not part of the table yet)
         */
        private integrateRow(position: RowPositionDefinition, row: Row): void {
            var isNewRow: boolean = typeof row.rowPos !== "number";     //If a new row should be integrated, or if an existing row should be moved

            var maxPos: number;
            switch (row.rowType) {
                case RowType.title:     maxPos = this.getRowCount(RowType.title); break;
                case RowType.body:      maxPos = this.getRowCount(RowType.body); break;
                case RowType.footer:    maxPos = this.getRowCount(RowType.footer); break;
            }

            var relRowPos: number;
            //var noWarn: boolean = false;
            if (typeof position === "string") {
                switch (position.toLowerCase()) {
                    case "top":     relRowPos = 0; break; //First row
                    case "bottom":  relRowPos = maxPos; break; //Last row
                    default:        logger.error("\"position\" contains an invalid string.");
                                    if(!isNewRow){ return; }
                                    relRowPos = maxPos;
                }
            } else if (typeof position === "number") {
                relRowPos = position;
                if (relRowPos < 0) {       //-1 = after currently last Row
                    relRowPos = maxPos + 1 + relRowPos;
                }
            } else if (position) {      //insert above another row
                if (position.table !== this) {
                    logger.error("The given row from \"position\" belongs to a different table.");
                    relRowPos = this.getRowCount();
                    if (!isNewRow) { return; }
                    relRowPos = maxPos;
                } else {
                    relRowPos = position.getPosition();  //Insert above the given row
                }
            } else {                            //Default = last row
                relRowPos = maxPos;
            }
            logger.debug("Moving row from position " + row.getPosition() + " --> " + relRowPos + " (max=" + maxPos + ")");

            //Check if the rowPos is valid (might be outside the table section (table/body/footer) of the new row)                       
            if (relRowPos < 0) {
                relRowPos = 0;
                logger.warning("The given row position is too small. The row will be inserted at the beginning.");
            } else if (relRowPos > maxPos) {
                relRowPos = maxPos;
                logger.warning("The given row position is too big. The row will be inserted at the end.");
            }

            //relRowPos = relative position where the row should be inserted.
            var rowPos = this.convertToAbsoluteRowPosition(row.rowType, relRowPos);
            if (rowPos === row.rowPos) {                //The row will not be moved. (Can happen if the first row should be moved up, or if the 4th row should be moved to position 4.)
                return;
            }
            //rowPos = new absolute position of the row (afterwards, the row which is currently on this position will be below the moved row) (if the row should be moved down, itself is counted too)
            
            logger.debug("new abs. position = " + rowPos);
                    
            //Get neighbours:
            var lowerRow: Row = this.getRow(rowPos);
            var upperRow: Row = lowerRow ? lowerRow.up() : this.getRow(-1);
                       
            //Unravel existing connections:
            if (!isNewRow) {   //The row is already connected with others
                var it: Row = row;
                while ((it = it.down()) !== null) {
                    --it.rowPos;
                }
                if (row.upperRow) { row.upperRow.lowerRow = row.lowerRow; }
                if (row.lowerRow) { row.lowerRow.upperRow = row.upperRow; }
            }

            //Insert the row at its new position:
            row.upperRow = upperRow;
            row.lowerRow = lowerRow;
            row.rowPos = rowPos;
            if (upperRow !== null) {
                upperRow.lowerRow = row;
            }
            if (lowerRow !== null) {
                lowerRow.upperRow = row;
            }
                       
            //Increase rowPos in shifted rows:
            var it: Row = row;
            while ((it = it.down()) !== null) {
                ++it.rowPos;
            }
        }
        
        /*
         * Same as "addRow", but the rowType is always a titleRow.
         * @rowDef      RowDefinition           Any row definition. If the property "rowDef.rowType" is set, it will be ignored
         * @position    RowPositionDefinition   Position, where this row should be inserted. See Table.addRow().
         * @animate     null / undefined        Default options are used. TDefault options can be changed with "Table.defaultAnimation"
         *              AnimationSettings       Information about how to animate the insertion. false: no animation.
         * @return      Row                     Returns the newly generated Row. Returns null if the row couldn't get generated.
         */
        addTitleRow(rowDef?: RowDefinition, position?: RowPositionDefinition, animate?: AnimationSettings): Row {
            if (!rowDef || typeof rowDef === "string") {
                rowDef = { rowId: <string>rowDef };
            }
            (<RowDefinitionDetails|Row|RowDescription>rowDef).rowType = RowType.title;
            return this.addRow(rowDef, position, animate);
        }

        /*
         * Same as "addRow", but the rowType is always a bodyRow.
         * @rowDef      RowDefinition           Any row definition. If the property "rowDef.rowType" is set, it will be ignored
         * @position    RowPositionDefinition   Position, where this row should be inserted. See Table.addRow().
         * @animate     null / undefined        Default options are used. Default options can be changed with "Table.defaultAnimation"
         *              AnimationSettings       Information about how to animate the insertion. false: no animation.
         * @return      Row                     Returns the newly generated Row. Returns null if the row couldn't get generated.
         */
        addBodyRow(rowDef?: RowDefinition, position?: RowPositionDefinition, animate?: AnimationSettings): Row {
            if (!rowDef || typeof rowDef === "string") {
                rowDef = { rowId: <string>rowDef };
            }
            (<RowDefinitionDetails|Row|RowDescription>rowDef).rowType = RowType.body;
            return this.addRow(rowDef, position, animate);
        }

        /*
         * Same as "addRow", but the rowType is always a footerRow.
         * @rowDef      RowDefinition           Any row definition. If the property "rowDef.rowType" is set, it will be ignored
         * @position    RowPositionDefinition   Position, where this row should be inserted. See Table.addRow().
         * @animate     null / undefined        Default options are used. Default options can be changed with "Table.defaultAnimation"
         *              AnimationSettings       Information about how to animate the insertion. false: no animation.
         * @return      Row                     Returns the newly generated Row. Returns null if the row couldn't get generated.
         */
        addFooterRow(rowDef?: RowDefinition, position?: RowPositionDefinition, animate?: AnimationSettings): Row {
            if (!rowDef || typeof rowDef === "string") {
                rowDef = { rowId: <string>rowDef };
            }
            (<RowDefinitionDetails|Row|RowDescription>rowDef).rowType = RowType.footer;
            return this.addRow(rowDef, position, animate);
        }
        
        /*
         * Returns the relative (zero-based) position of a specific row within its section.
         * @identifier      string      The rowId. If the rowId doesn't existing within this table, null is being returned
         *                  number      The absolute row position. Can be used to convert absolute positions into relative row positions.
         *                  Row         Row Object. If the row is not part of this table, null is being returned.
         * @return          number      Returns the index/position of the given row. If the row couldn't be found, null is returned.
         */
        getRowPosition(identifier: string|number|Row): number {
            var row: Row = this.getRow(identifier);
            var rowPos = row.rowPos;
            switch (row.rowType) {
                case RowType.title: return rowPos;
                case RowType.body: return rowPos - this.getRowCount(RowType.title);
                case RowType.footer: return rowPos - this.getRowCount(RowType.title) - this.getRowCount(RowType.body);
            }
        }
        
        /*
         * Returns the absolute (zero-based) position of a specific row within the table.
         * The first title row has position 0. The first body row has position "titleRowCount".
         * @identifier      string      The rowId. If the rowId doesn't existing within this table, null is being returned
         *                  Row         Row Object. If the row is not part of this table, null is being returned.
         * @return          number      Returns the index/position of the given row. If the row couldn't be found, null is returned.
         */
        getAbsoluteRowPosition(identifier: string|Row): number {
            return this.getRow(identifier).rowPos;
        }

        /* 
         * Converts the given relative row position into an absolute row position
         * Note: This function does not check if the row actually exists or not.
         * @rowType     RowType     Section, where the row is placed
         * @return      number      Absolute position within the table
         */
        convertToAbsoluteRowPosition(rowType: RowType, relativePos: number): number {
            switch (rowType) {
                case RowType.title: return relativePos;
                case RowType.body: return relativePos + this.titleRows.length;
                case RowType.footer: return relativePos + this.titleRows.length + this.bodyRows.length;
            }
        }
        
        /*
         * Returns the position of a specific column within the table. (=index).
         * The first (=left) column has position 0.
         * @identifier      string      The columnId. If the columnId doesn't existing within this table, null is being returned
         *                  Column      Column Object. If the column is not part of this table, null is being returned.
         * @return          number      Returns the index/position of the given column. If the column couldn't be found, null is returned.
         */
        getColumnPosition(identifier: string|Column): number {
            var column: Column = this.getColumn(identifier);
            return column.columnPos;
        }

        /*
         * Returns all rows within the table or table section (title/body/footer).
         * @rowType     RowType     optional; If no value is given, all rows are returned. If "RowType.title" is given, only the title rows are returned. The same for "RowType.body" and "RowType.footer".
         * @return      Row[]       All rows within the table or table section (title/body/footer). The order conforms to the output order.
         */
        getRows(rowType?: RowType): Row[] {
            if (rowType === RowType.title) {
                return this.titleRows;
            }
            if (rowType === RowType.body) {
                return this.bodyRows;
            }
            if (rowType === RowType.footer) {
                return this.footerRows;
            }
            return this.titleRows.concat(this.bodyRows, this.footerRows);
        }
        
        /*
         * Returns the required row. A row contains all cells.
         * @identifier      string          Returns the row with the given rowId. If the id doesn't exist, null is returned
         *                  number          Returns the row with the specified absolute position. The first title-row has position 0. The first body row has the position "titleRowCount". If the position is out of bounds, null is being returned.
         *                                  negative number: -1 = last row;
         *                  Row             Returns this row if it is part of the table. Otherwise null is being returned.
         *                                  Note that passing numbers as strings (eg. getRow("4");) will be interpreted as a rowId, rather than a position.
         * @return          Row             If the requested row exists, it will be returned. Otherwise, null is returned.
         */
        getRow(identifier: string|number|Row): Row {
            if (typeof identifier === "number") {
                var rowPos: number = identifier;                                //Needed because of TypeScript's wrong error messages
                if (rowPos < 0) {
                    rowPos = this.getRowCount() + rowPos;
                }
                if (rowPos < this.getRowCount(RowType.title)) {                           //A titleRow should be returned
                    return this.titleRows[rowPos] || null;
                }
                if (identifier < this.getRowCount(RowType.title) + this.getRowCount(RowType.body)) {    //A bodyRow should be returned
                    return this.bodyRows[rowPos - this.getRowCount(RowType.title)] || null;
                }
                return this.footerRows[rowPos - this.getRowCount(RowType.title) - this.getRowCount(RowType.body)] || null;   //A footerRow should be returned
            }
            if (<any>identifier instanceof Row) {
                return ((<Row>identifier).table === this) ? <Row>identifier : null;
            }
            return this.rows[<string>identifier] || null;
        }

        /*
        * Returns the body row with the given index.
        * @position        number          Returns the row with the specified position within the body. The first body-row has position 0. The last body row has the position "bodyRowCount-1".
        *                                  negative number: -1 = last row;
        * @return          Row             If the requested row exists, it will be returned. Otherwise, null is returned.
        */
        getBodyRow(position: number): Row {
            if (position < 0) {
                position = this.bodyRows.length + position;
            }
            if (position < 0 || position >= this.bodyRows.length) {
                return null;
            }
            return this.bodyRows[position];
        }

        /*
         * Returns the first row within the table or table section (title/body/footer).
         * @rowType     RowType     optional; If no value is given, the first row within the table is returned.
         * @return      Row         The first row within the table or table section. If the table section contains no rows, null is returned.
         */
        getFirstRow(rowType?: RowType): Row {
            if (rowType === RowType.title) {
                return this.titleRows[0] || null;
            }
            if (rowType === RowType.body) {
                return this.bodyRows[0] || null;
            }
            if (rowType === RowType.footer) {
                return this.footerRows[0] || null;
            }
            return this.getRow(0)
        }

        /*
         * Returns the last row within the table or table section (title/body/footer).
         * @rowType     RowType     optional; If no value is given, the last row within the table is returned.
         * @return      Row         The last row within the table or table section. If the table section contains no rows, null is returned.
         */
        getLastRow(rowType?: RowType): Row {
            if (rowType === RowType.title) {
                if (this.getRowCount(RowType.title) === 0) {
                    return null;
                }
                return this.titleRows[this.getRowCount(RowType.title) - 1];
            }
            if (rowType === RowType.body) {
                if (this.getRowCount(RowType.body) === 0) {
                    return null;
                }
                return this.bodyRows[this.getRowCount(RowType.body) - 1];
            }
            if (rowType === RowType.footer) {
                if (this.getRowCount(RowType.footer) === 0) {
                    return null;
                }
                return this.footerRows[this.getRowCount(RowType.footer) - 1];
            }
            return this.getRow(-1);
        }
                        
        /*
         * Calls func for each row in the table. If func returns false, iterating will be aborted.
         * func is called in the same order as the rows in the table.
         * @rowType     RowType             optional. Which rows should be iterated.
         * @func        (Row)=>boolean      Is called for each row in the table. Returns the Row as a parameter. If the iteration should be aborted, false can be returned.   
         * @return      Table               Returns this table.
         */
        eachRow(rowType: RowType, func: (Row) => void|boolean);
        eachRow(func: (Row) => void|boolean);

        eachRow(rowType: RowType|((Row) => void|boolean), func?: (Row) => void|boolean): Table {
            var _rowType: RowType = null;
            var _func: (Row) => void|boolean;

            if (arguments.length == 1) {
                _func = <(Row) => void|boolean>rowType;
            } else {
                _rowType = <RowType>rowType;
                if (typeof _rowType === "undefined") {
                    _rowType = null;
                }
                _func = func;
            }
            if (_rowType === RowType.title || _rowType === null) {
                for (var i = 0; i < this.getRowCount(RowType.title); ++i) {
                    if (_func(this.titleRows[i]) === false) {
                        return this;
                    }
                }
            }
            if (_rowType === RowType.body || _rowType === null) {
                for (var i = 0; i < this.getRowCount(RowType.body); ++i) {
                    if (_func(this.bodyRows[i]) === false) {
                        return this;
                    }
                }
            }
            if (_rowType === RowType.footer || _rowType === null) {
                for (var i = 0; i < this.getRowCount(RowType.footer); ++i) {
                    if (_func(this.footerRows[i]) === false) {
                        return this;
                    }
                }
            }
            return this;
        }

        /*
         * Removes the specified row.
         * @identifier  string                      Removes the row with the given rowId.
         *              number                      Removes the row with the specified position. The first title-row has position 0. The first body row has the position titleRowCount.
         *              Row                         Removes the given row from the table.
         *                                          Note that passing numbers as strings (eg. removeRow("4");) will be interpreted as a rowId, rather than a position.
         * @animate     null / undefined            Default options are used. The option can be changed with "Table.defaultAnimation"
         *              AnimationSettings           Information about how to animate the removal. false: no animation.
         * @return      Table                       Returns this table.
         * @throws      OperationFailedException    Is thrown if the given row does not exist or is part of another table.
         */
        removeRow(identifier: string|number|Row, animate?: AnimationSettings): Table {
            var row = this.getRow(identifier);
            if (row === null) {
                throw new OperationFailedException("removeRow()", "The row does not exist in this table.");
            }
                        
            var self = this;
            var removeRowNow = function () {        //"this" will be bound to the removed Row (or to undefined, if no animation is used)
                row.element.remove();               //Remove the row from the DOM
                row.destroy();                      //The row is not part of the table anymore -> make it unusable
                delete self.rows[row.rowId];
                if (row.rowPos < self.titleRows.length) {
                    self.titleRows.splice(row.rowPos, 1);
                } else if (row.rowPos < self.titleRows.length + self.bodyRows.length) {
                    self.bodyRows.splice(row.rowPos - self.titleRows.length, 1);
                } else {
                    self.footerRows.splice(row.rowPos - self.titleRows.length - self.bodyRows.length, 1);
                }
                //Update row-connections (upper/lower-pointers):
                if (row.upperRow) { row.upperRow.lowerRow = row.lowerRow; }
                if (row.lowerRow) { row.lowerRow.upperRow = row.upperRow; }
            
                //Decrease rowPos in moved rows:
                var it: Row = row;
                while ((it = it.down()) !== null) {
                    --it.rowPos;
                }
            };
            
            //Animation:
            if (animate === null || animate === undefined) {    //No value given -> default value
                animate = Table.defaultAnimation;
            }
            if (animate && row.isVisible()) {
                var animationOptions = getJQueryAnimationOptions(animate);
                animationOptions.complete = envelopFunctionCall(
                    animationOptions.complete,
                    removeRowNow
                    );
                row.slideUp(animationOptions);
            } else {
                removeRowNow();
            }
            return this;
        }

        /*
         * Removes the specified column.
         * @identifier  string                      Removes the column with the given columnId.
         *              number                      Removes the column with the specified position. The first (left) column has position 0.
         *              Column                      Removes the given column from the table.
         *                                          Note that passing numbers as strings (eg. removeColumn("4");) will be interpreted as a columnId, rather than a position.
         * @animate     null / undefined            Default options are used. The option can be changed with "Table.defaultAnimation"
         *              AnimationSettings           Information about how to animate the removal. false: no animation.
         * @return      Table                       Returns this table.
         * @throws      OperationFailedException    Is thrown if the given column does not exist or is part of another table.
         */
        removeColumn(identifier: string|number|Column, animate?: AnimationSettings): Table {
            var column: Column = this.getColumn(identifier);
            if (column === null) {
                throw new OperationFailedException("removeColumn()", "The column does not exist in this table.");
            }
            
            var self = this;
            var removeColumnNow = function () {     //"this" will be bound to the removed Column (or to undefined, if no animation is used)
                for (var rowId in self.rows) {      //Remove the column from the DOM
                    self.rows[rowId].removeColumn(column.columnId);
                }
                column.destroy();                   //The column is not part of the table anymore -> make it unusable
                delete self.columns[column.columnId];
                self.sortedColumns.splice(column.columnPos, 1);
                //Update column-connections (left/right-pointers):
                if (column.leftColumn) { column.leftColumn.rightColumn = column.rightColumn; }
                if (column.rightColumn) { column.rightColumn.leftColumn = column.leftColumn; }         
                //Decrease columnPos in moved columns:
                var it: Column = column;
                while ((it = it.right()) !== null) {
                    --it.columnPos;
                }
            };
            
            //Animation:
            if (animate === null || animate === undefined) {    //No value given -> default value
                animate = Table.defaultAnimation;
            }
            if (animate && column.isVisible()) {
                var animationOptions = getJQueryAnimationOptions(animate);
                animationOptions.complete = envelopFunctionCall(
                    animationOptions.complete,
                    removeColumnNow
                    );
                column.slideLeft(animationOptions);
            } else {
                removeColumnNow();
            }
            return this;
        }
        
        /*
         * Returns all columns within the table.
         * @return      Column[]        All columns within the table. The order conforms to the output order.
         */
        getColumns(): Column[] {
            return this.sortedColumns;
        }

        /*
         * Returns the required column. The column does not contains cells.
         * @identifier      string          Returns the column with the given columnId. If the id doesn't exist, null is returned
         *                  number          Returns the column with the specified position. The first (left) column has position 0. If the position is out of bounds, null is being returned.
         *                                  negative number: -1 = last column;
         *                  Column          Returns this column if it is part of the table. Otherwise null is being returned.
         *                                  Note that passing numbers as strings (eg. getColumn("4");) will be interpreted as a columnId, rather than a position.
         * @return          Column          If the requested column exists, it will be returned. Otherwise, null is returned.
         */
        getColumn(identifier: string|number|Column): Column {
            if (typeof identifier === "number") {
                var colPos: number = identifier;                 //Needed because of TypeScript's wrong error messages
                if (colPos < 0) {
                    colPos = this.getColumnCount() + colPos;
                }
                return this.sortedColumns[colPos] || null;
            }
            if (<any>identifier instanceof Column) {
                return ((<Column>identifier).table === this) ? <Column>identifier : null;
            }
            return this.columns[<string>identifier] || null;
        }

        /*
         * Calls func for each column in the table. If func returns false, iterating will be aborted.
         * func is called in the same order as the columns in the table.
         * @func        (Column)=>boolean   Is called for each column in the table. Returns the Column as a parameter. If the iteration should be aborted, false can be returned.   
         * @return      Table               Returns this table.
         */
        eachColumn(func: (Column) => void|boolean): Table {
            for (var i = 0; i < this.sortedColumns.length; ++i) {
                if (func(this.sortedColumns[i]) === false) {
                    return this;
                }
            }
            return this;
        }
        
        /*
         * Returns all cells of a sepcific column.
         * @identifier      string                      Returns the cells of the column with the given columnId. If the column doesn't exist, null is returned
         *                  number                      Returns the cells of the column with the specified position. The first (left) column has position 0. If the position is out of bounds, null is being returned.
         *                  Column                      Returns the cells belonging to this column.
         *                                              Note that passing numbers as strings (eg. getColumnCells("4");) will be interpreted as a columnId, rather than a position.
         * @rowType         RowType                     The rows who's cells should be returned
         * @return          { rowId: Cell, ... }        A list with all cells that are present within the column. The index represents the rowId. If the given column does not exist, null is being returned.
         */
        getColumnCells(identifier: string|number|Column, rowType?: RowType): { [key: string]: Cell; } {
            if (this.getColumn(identifier) === null) {  //The column does not exist in this table
                return null;
            }
            var cells: { [key: string]: Cell; } = {};
            this.eachRow(rowType, function (row) {
                cells[row.rowId] = row.getCell(identifier);
            });
            return cells;
        }
       

        /*
         * Returns the specified cell.
         * @columnIdentifier    string          Specifies the columnId of the cell. If the column doesn't exist, null is returned
         *                      number          Specifies the column position of the cell. The first (left) column has position 0. If the position is out of bounds, null is being returned.
         *                      Column          Returns the cell belonging to this column.
         *                                      Note that passing numbers as strings (eg. getCell("rowId", "4");) will be interpreted as a columnId, rather than a position.
         * @rowIdentifier       string          Specifies the rowId of the cell. If the row doesn't exist, null is returned
         *                      number          Specifies the row position of the cell. The first title-row has position 0. The first body row has the position titleRowCount. If the position is out of bounds, null is being returned.
         *                      Row             Returns the cell belonging to this row.
         *                                      Note that passing numbers as strings (eg. getCell("4", "colId");) will be interpreted as a rowId, rather than a position.
         * @return              Cell            The cell within the given row and column. If either the row or the column doesn't exist, null is returned.
         */
        getCell(columnIdentifier: string|number|Column, rowIdentifier: string|number|Row): Cell {
            var row = this.getRow(rowIdentifier);
            if (row === null) {
                return null;
            }
            return row.getCell(columnIdentifier);
        }

        /*
         * Returns the number of rows in the table or table section (title/body)
         * @rowType     RowType     optional; If no value is given, the total number of rows is returned. If "RowType.title" is given, the number of titleRows is returned. If "RowType.body" is given, the number of rows within the table body is returned.
         * @return      number      The number of rows within the table or table section (title/body)
         */
        getRowCount(rowType?: RowType): number {
            if (rowType === RowType.title) {
                return this.titleRows.length;
            }
            if (rowType === RowType.body) {
                return this.bodyRows.length;
            }
            if (rowType === RowType.footer) {
                return this.footerRows.length;
            }
            return this.titleRows.length + this.bodyRows.length + this.footerRows.length;
        }
        
        /*
         * Returns the order of the table rows.
         * @rowType     RowType         The rowType whose order should be returned. Default: all rows.
         * @return      string[]        Array of rowIds in the same order as the rows
         */
        getRowOrder(rowType?: RowType): string[] {
            var order: string[] = [];
            this.eachRow(rowType, function (row: Row) {
                order.push(row.rowId);
            });
            return order;
        }

        /*
         * Returns the number of columns in the table.
         * @return      number      The number of columns within the table
         */
        getColumnCount(): number {
            return this.sortedColumns.length;
        }

        /*
         * Returns the order of the table columns.
         * @return      string[]        Array of columnIds in the same order as the columns
         */
        getColumnOrder(rowType?: RowType): string[] {
            var order: string[] = [];
            this.eachColumn(function (column: Column) {
                order.push(column.columnId);
            });
            return order;
        }
        
        /**
         * Moves a row to another position within the table
         * @identifier      string                  rowId of the row to reorder
         *                  Row                     The row to reorder
         * @position        RowPositionDefinition   Defines the position, where the row should be moved to.
         *                  "top":                  The row will be moved to the beginning.
         *                  "bottom":               The row will be moved to the ending.
         *                  "up":                   The row is moved upwards by 1.
         *                  "down":                 The row is moved downwards by 1.
         *                  positive number:        Absolute position for the row. If this position is not possible (eg. "0" for a footer-Row if there are bodyRows before), the nearest possible position will be chosen.
         *                  negative number:        Absolute position from the ending. -1: inserted at the end. -2: inserted at the second last. If this position is not possible, the nearest possible position will be chosen.
         *                  "+3", "-4"              The row will be moved by a relative amount. "+" moves the row downwards, "-" moves it upwards. The sign is required.
         *                  Row:                    The row will be moved in front of the given one.
         * @return          Table                   This table
         * @throws          OperationFailedException    Is thrown if the given row does not exist or is part of another table. 
         */
        moveRow(identifier: string|Row, position: RowPositionDefinition): Table {
            var row: Row = this.getRow(identifier);
            if (row === null) {
                throw new OperationFailedException("moveRow()", "The row does not exist in this table.");
            }

            //Handle relative movements:
            var rowPos: RowPositionDefinition = position;
            if (typeof position === "string") {
                switch (position.toLowerCase()) {
                    case "up":  rowPos = row.getPosition() - 1;
                                if (rowPos < 0) { rowPos = 0; }
                                break;
                    case "down": rowPos = row.getPosition() + 1;
                                break;
                    default:
                        if (position[0] === '+' || position[0] === '-') {
                            var delta: number = parseInt(position, 10);
                            if (isNaN(delta)) {
                                logger.error("Unable to interpret the target position. parseInt() failed.");
                                return this;
                            }
                            rowPos = row.getPosition() + delta;
                            if (rowPos < 0) { rowPos = 0; }
                        }                           
                }
            }
          
            //Remove from old position:
            switch (row.rowType) {
                case RowType.title: this.titleRows.splice(row.rowPos, 1); break;
                case RowType.body: this.bodyRows.splice(row.rowPos - this.titleRows.length, 1); break;
                case RowType.footer: this.footerRows.splice(row.rowPos - this.titleRows.length - this.bodyRows.length, 1); break;
                default: assert(false, "Invalid RowType given.");
            }
            
            //Update the row position and its neighbours:           
            this.integrateRow(rowPos, row);

            //Insert at new position:
            switch (row.rowType) {
                case RowType.title: this.titleRows.splice(row.rowPos, 0, row); break;
                case RowType.body: this.bodyRows.splice(row.rowPos - this.getRowCount(RowType.title), 0, row); break;
                case RowType.footer: this.footerRows.splice(row.rowPos - this.getRowCount(RowType.title) - this.getRowCount(RowType.body), 0, row); break;
            }

            //Update the HTML:
            if (row.down() && row.down().rowType === row.rowType) {
                row.element.insertBefore(row.down().element);
            } else {
                switch (row.rowType) {
                    case RowType.title: this.thead.append(row.element); break;
                    case RowType.body: this.tbody.append(row.element); break;
                    case RowType.footer: this.tfoot.append(row.element); break;
                }
            }
            return this;
        }













        /*
         * Stops any active show/hide animation in this and any nested table.
         * @return      Table       This table
         */
        stop(): Table {
            this.table.find(".tranim, .tcanim").stop(true, true);
            return this;
        }
        
        //ID generator for tables, rows and columns:
        private static tableIdSequence: number = 0; //Sequence for globally unique table ids
        private rowIdSequence: number = 0;          //Sequence for table unique row ids
        private columnIdSequence: number = 0;       //Sequence for table unique column ids
        
        /*
         * Returns a new, unique id that can be used for a new table
         * Note: This function never returns the same id multiple times. However, it does not check if there is already a table where the user assigned the exact same id manually.
         * @return      string      Unique table id
         */
        static getUniqueTableId(): string {
            return "ttid" + (++this.tableIdSequence);   //"ttid" = tablify table id
        }

        /*
         * Returns a new, unique id that can be used for rows in this table
         * @return      string      Unique row id
         */
        getUniqueRowId(): string {
            var id;
            do {
                id = "trid" + (++this.rowIdSequence);
            } while (id in this.rows);
            return id;
        }

        /*
         * Returns a new, unique id that can be used for columns in this table
         * @return      string      Unique column id
         */
        getUniqueColumnId(): string {
            var id;
            do {
                id = "tcid" + (++this.columnIdSequence);
            } while (id in this.columns);
            return id;
        }
                        
        /*
         * Converts the Table into an object. Used for serialisation.
         * Performs a deepCopy.
         * @includeContent      boolean             true (default): The data is included in the object as well. Otherwise, the returned object only contains meta data. 
         * @return              TableDescription    DeepCopy of this table
         */
        toObject(includeContent?: boolean): TableDescription {
            var description: TableDescription = {
                columns: [],
                rows: []
            };
            this.eachColumn(function (col) {
                description.columns.push(col.toObject());
            });
            this.eachRow(function (row) {
                description.rows.push(row.toObject(includeContent));
            });
            return description;
        }

    }

}

