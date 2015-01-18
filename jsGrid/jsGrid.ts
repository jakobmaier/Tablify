/// <reference path="lib/jQuery/jquery.d.ts"/>

/*
Other libs:
    http://www.datatables.net/blog/2014-11-07
    http://lorenzofox3.github.io/smart-table-website/
*/





type ColumnDefinitions = { [key: string]: JSColumn; };




class JSGrid {
    //References to commonly used HTML elements:
    private table: JQuery;  //<table>
    private thead: JQuery;  //<thead>
    private tbody: JQuery;  //<tbody>

    //Todo: set the gridId programatically to a unique value
    private gridId: string = "grid1";   //Unique grid id on a single html page

    //Column properties:
    private columns: ColumnDefinitions = {}; // { "columnId": JSColumn, ... }
    //private columns: Map<string, JSColumn>;           //better alternative to the above definition. However, this is part of EcmaScript6 and currently not supported very well

    //Table content:
    private headRows: JSRow[] = [];    // Rows, which are part of the table head. [ JSRow, JSRow, ... ]
    private rows: JSRow[] = [];        // [ JSRow, JSRow, ... ]

 
   
    //Initialises JSGrid. The identifier can either be a selector or an JQuery Element. The referenced HTMLElement can either be an HTMLTableElement, or any other HTML element in which case a <table> will be appended
    constructor(identifier: string|JQuery) {
        if (typeof identifier === "string") {
            this.table = $(identifier);                     //selector
        } else {
            this.table = identifier;                        //jQuery
        }
        if (this.table == null) {                           //No table found
            return;
        }

        if (this.table.prop("tagName") !== "table") {       //Create a new table within this element
            var newTable = document.createElement("table");
            this.table = this.table.append(newTable);
        }
        this.table.addClass("jsGrid");
        this.thead = this.table.find("thead");
        this.tbody = this.table.find("tbody");
    }

    destroy() : void {
        this.table.removeClass("jsGrid");
    }
    

    
    addColumn(definition: string|IColumnDefinition): JSGrid {
        var colDef: IColumnDefinition;
        if (typeof definition === "string") {
            colDef = { columnId: definition };
        } else {
            colDef = definition;
        }

        if (colDef.columnId in this.columns) {
            throw "Invalid column id. The column already exists.";      //todo: write logger OR remove old column before (replacing)
        }

        var column = new JSColumn(colDef);
        this.columns[colDef.columnId] = column;

        console.log("Column added. Currently available columns: ", this.columns);

        this.generateColumnHTML(column, colDef.content);

        return this;
    }


    /*
     * Adds the html of a new column to the table
     * @column:         JSColumn            column data
     * @content:        object              {"rowId": JSCell, ...} - the content that should be inserted in each row. If a specific row has no entry, defaultContent is used
     * @defaultContent: JSCell              The content that is inserted into rows, that have so explicit entry in the "content" argument
     */
    private generateColumnHTML(column: JSColumn, content: { [key: string]: ICell; }) {   

        content = content || {};
            
        //Table head:
        for (var i = 0; i < this.headRows.length; ++i) {
            var row: JSRow = this.headRows[i];
            var cell: ICell = (content[row.id] || column.defaultContent);     //Todo: add "defaultHeadContent"
            row.element.append(getCellHtml("th", cell));
        }

        //Table body:
        for (var i = 0; i < this.rows.length; ++i) {
            var row: JSRow = this.rows[i];
            var cell: ICell = (content[row.id] || column.defaultContent);
            row.element.append(getCellHtml("td", cell));
        }
    }



};













window.onload = () => {
    

    //var jsGrid = new JSGrid($table);
    var jsGrid = new JSGrid("#content");
   




    jsGrid.addColumn("a string");
    jsGrid.addColumn({ columnId: "the id" });
    //jsGrid.addColumn({
    //    columnId: "the id2",
    //    title: "the title",
    //    className: "colClass"
    //});


};

