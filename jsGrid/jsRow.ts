


interface IRowDefinition {
    rowId: string;
    content?: { [key: string]: ICell; };       //{ "columnId": JSCell}; If a specific column is not defined, the defaultContent (stored in the JSColumn-object) is used


    id?: string;            //HTML-attribute
    className?: string;     //HTML-attribute
}




class JSRow{
    
    rowId: string;          //internal id
    content: { [key: string]: ICell; };        //key == columnId

    element: JQuery;        //Reference to the <tr>-tag
    id: string;             //HTML-attribute
    className: string;      //HTML-attribute

    //todo: column-definitions - is this pass-by-value or pass-by-reference? (I can't remember, it's too long ago)
    constructor(element: JQuery, definition: IRowDefinition, columns: ColumnDefinitions) {
        this.rowId = definition.rowId;
        this.element = element;

        for (var columnId in columns) {
            var cell: ICell = definition.content[columnId] || columns[columnId].defaultContent;
            this.content[columnId] = cell;            
        }

        this.id = definition.id || "";
        this.className = definition.className || "";
    }

    getHtml(): string {
        return "";
    }
} 