/// <reference path="Tablify.ts" />

module Tablify {
    "use strict";

    export class Column {
        
        /*[Readonly]*/ table: Table;                    //The table where this column belongs to  
        /*[Readonly]*/ columnId: string;                //internal id, unique within the table
        //sortable?: boolean;
        //...

        defaultTitleContent: Cell;                      //Is used for rendering title cells that have no content
        defaultBodyContent: Cell;                       //Is used for rendering body cells that have no content
        //defaultFooterContent: Cell;
        

        static defaultColumnDefinitionDetails: ColumnDefinitionDetails = {  //Default options that are used in the constructor, if the user omitted them.
            columnId: null,
            content: {},
            generateMissingRows: false,
            defaultTitleContent: null,                  //null automatically uses the columnId as default value
            defaultBodyContent: ""
        };

        /*
         * [Internal]
         * Generates a new Column
         * @table       Table                       The table where this column belongs to
         * @columnDef   null/undefined              The columnId is generated automatically
         *              string                      ColumnId. The cells of the newly generated column will be empty.
         *              ColumnDefinitionDetails     Contains detailed information on how to generate the new column.
         *              Column                      The column will be deep-copied.
         *              ColumnDescription           Used for deserialisation.
         */
        constructor(table: Table, columnDef?: ColumnDefinition) {
            this.table = table;

            var definition: ColumnDefinitionDetails = this.extractColumnDefinitionDetails(columnDef);    //Convert the input into ColumnDefinitionDetails
           
            this.columnId = definition.columnId || this.table.getUniqueColumnId();
            logger.info("Ceating new column \"" + this.columnId + "\".");
            this.defaultTitleContent = new Cell(definition.defaultTitleContent !== null ? definition.defaultTitleContent :  this.columnId);
            this.defaultBodyContent = new Cell(definition.defaultBodyContent !== null ? definition.defaultBodyContent : this.columnId);
            /*attributes...*/
        }
        
        /*
         * Converts a <ColumnDefinition> into <ColumnDefinitionDetails> and extends the object by setting all optional properties.
         * @columnDef   ColumnDefinition              input
         * @return      ColumnDefinitionDetails       An object of type <ColumnDefinitionDetails>, where all optional fields are set; Note that the columnId and defaultContents might still be null.
         */
        private extractColumnDefinitionDetails(columnDef?: ColumnDefinition): ColumnDefinitionDetails {
            columnDef = columnDef || {};
            var details: ColumnDefinitionDetails = {};
            
            if (typeof columnDef === "string") {    //String
                details.columnId = columnDef;
            } else if (<ColumnDefinitionDetails|Column|ColumnDescription>columnDef instanceof Column) {   //Column
                details = (<Column>columnDef).toObject();   //Extracts the Column description
                if ((<Column>columnDef).table === this.table) {
                    details.columnId = this.table.getUniqueColumnId();
                }
            } else {                                //<ColumnDefinitionDetails | ColumnDescription>
                details = columnDef;
            }
            return jQuery.extend({}, Column.defaultColumnDefinitionDetails, details);
        }
        
        /*
         * [Internal]
         * Destroys the Column. This object will get unusable and members as well as member functions must not be used afterwards.
         * Note that this function does not remove the column from the DOM.
         */
        destroy() {
            logger.info("Deleting column \"" + this.columnId + "\".");
            this.table = null;
        }

        /*
         * Removes the column from its table.
         */
        remove(): void {
            assert(this.table.removeColumn(this));
        }

        /*
         * Checks if the given column is the same as this column.
         * In order to match, the columns must be part of the same table and must have the same columnId (unique per table). Having the same data/cells is not a sufficient match.
         * @other       Column      The column that should be checked for equality
         * @return      boolean     Returns true, if the columns are identical. Returns false otherwise.
         */
        equals(other: Column): boolean {
            return (other.table === this.table && other.columnId === this.columnId);
        }

        /*
         * Returns the cell of a sepcific row.
         * @row             string                      Returns the cell of the row with the given rowId. If the row doesn't exist, null is returned
         *                  number                      Returns the cell of the row with the specified position/index. The first title-row has position 0. The first body row has the position titleRowCount. If the position is out of bounds, null is being returned.
         *                  Row                         Returns the cell belonging to this rows
         *                                              Note that passing numbers as strings (eg. getCell("4");) will be interpreted as a rowId, rather than a position.
         * @return          Cell                        The cell of the given row. If the row does not exist, null is being returned.
         */
        getCell(row: string|number|Row): Cell {
            return this.table.getCell(row, this.columnId);
        }

        /*
         * Returns all cells of this column
         * @return       { [key: string]: Cell; }    A list with all cells that are present within the column. The index represents the rowId.
        */
        getCells(): { [key: string]: Cell; } {
            return this.table.getColumnCells(this.columnId);
        }
        
        /*
         * Converts the Column into an object. Used for serialisation.
         * Performs a deepCopy.
         * @return  ColumnDescription      DeepCopy of this column
         */
        toObject(): ColumnDescription {
            return {
                columnId: this.columnId,
                defaultTitleContent: this.defaultTitleContent.toObject(true),
                defaultBodyContent: this.defaultBodyContent.toObject(true)
            };   
        }




        ///*
        // * Returns true if the column is visible.
        // * Note: If the column is part of a detached table (table/column is not part of the DOM), false is returned
        // * Note: Elements with "visibility: hidden" or "opacity: 0" are considered visible, since they still consume space in the layout.
        // * @return      boolean     true: The column is visible; otherwise: false.
        // */
        //isVisible(): boolean {
        //    return this.element.filter(":visible").length === 1;
        //}

        ///*
        // * Shows the column without animation
        // * Note: If there is already a show/hide animation active, it will be aborted
        // * @return      Column          This column
        // */
        //show(): Column {
        //    this.stop().element.show();
        //    return this;
        //}

        ///*
        // * Hides the column without animation
        // * Note: If there is already a show/hide animation active, it will be aborted
        // * @return      Column          This column
        // */
        //hide(): Column {
        //    this.stop().element.hide();
        //    return this;
        //}

         /*
         * Hides or shows the column with a sliding motion
         * @visible     boolean     true: shows the column; false: hides the column
         * @duration    number      Duration in milliseconds
         *              string      "fast" = 200ms; "slow" = 600ms
         * @options     JQueryAnimationOptions      Additional options for the animation. For more information, take a look at jQuery's `animate` function.
         * @complete    function    Callbackfunction which is called after the animation completed. "this" will be bound to the current column.
         * @return      Column      This column
         */
        setVisibility(visible: boolean, duration?: number|string, complete?: () => void): Column;
        setVisibility(visible: boolean, options?: JQueryAnimationOptions): Column; 
        setVisibility(visible: boolean, duration?: number|string|JQueryAnimationOptions, complete?: () => void): Column {
            var cellObjects = this.getCells();
            this.stop();        //Finish any existing animation that might be active

            //Todo: Improve the following piece of code (unneccessary bad performance):
            var cells = jQuery("");
            for (var rowId in cellObjects) {
                cells = cells.add(cellObjects[rowId].element);
            }
                       
            var divs = cells.wrapInner('<div style="display: ' + (visible ? 'none' : 'block') + ';" class="tanim" />').children();            
            
            //columns can't be slided left/right-> wrap all cell contents within a div, and animate this div.
            //In order to work correctly, the padding has to be moved from the cells to the divs to get animated too
            divs.css("padding", function () { return jQuery(this).parent().css("padding"); });
            cells.css("padding", 0);

            cells.show();           //The cells must be visible during animation, the inner divs will be animated

            var options: JQueryAnimationOptions;
            if (typeof duration === "object") {
                options = duration;
                complete = <() => void>options.complete;
            } else {
                options = {
                    "duration": duration
                };
            }

            var completeCounter: number = 0;
            var self = this;
            options.complete = function () {
                if (++completeCounter < divs.length) {      //jQuery calls the complete function once for each element. We only want the last callback to be used
                    return;
                }
                if (!visible) {
                    cells.hide();                           //The cells are hidden afterwards
                }
                cells.css("padding", function () { return jQuery(this).children().css("padding"); });    //Move the padding back to the cells
                divs.replaceWith(function () { return jQuery(this).contents(); });                       //Unwrap the cell contents
                if (typeof complete === "function") {
                    complete.call(self);
                }
            };
            var str = (visible ? "show" : "hide");

            divs.animate({
                width: str,
                opacity: str,
                'padding-left': str,
                'padding-right': str,
            }, options);

            return this;
        }

        /*
        * Stops any active show/hide animation that is performed on this column
        * @return      Column       This column
        */
        stop(): Column {
            var cellObjects = this.getCells();
            
            //Todo: Improve the following piece of code (unneccessary bad performance):
            var cells = jQuery("");
            for (var rowId in cellObjects) {
                cells = cells.add(cellObjects[rowId].element);
            }
            cells.children(".tanim").stop(true, true);      //Finish any existing animation that might be active
            return this;
        }


        /*
         * Hides the column with a sliding motion
         * @duration    number      Duration in milliseconds
         *              string      "fast" = 200ms; "slow" = 600ms
         * @options     JQueryAnimationOptions      Additional options for the animations For more information, take a look at jQuery's `slideUp` function
         * @complete    function    Callbackfunction which is called after the animation completed. "this" will be bound to the current column.
         * @return      Column      This column
         */
        slideLeft(duration?: number|string, complete?: () => void): Column;
        slideLeft(options?: JQueryAnimationOptions): Column;

        slideLeft(duration?: number|string|JQueryAnimationOptions, complete?: () => void): Column {
            return this.setVisibility(false, <any>duration, complete);
        }

        /*
         * Shows the column with a sliding motion
         * @duration    number      Duration in milliseconds
         *              string      "fast" = 200ms; "slow" = 600ms
         * @options     JQueryAnimationOptions      Additional options for the animations For more information, take a look at jQuery's `slideDown` function
         * @complete    function    Callbackfunction which is called after the animation completed. "this" will be bound to the current column.
         * @return      Column      This column
         */
        slideRight(duration?: number|string, complete?: () => void): Column;
        slideRight(options?: JQueryAnimationOptions): Column;

        slideRight(duration?: number|string|JQueryAnimationOptions, complete?: () => void): Column {
            return this.setVisibility(true, <any>duration, complete);
        }
    }
}