/// <reference path="lib/jQuery/jquery.d.ts"/>


interface IColumnDefinition {
    columnId: string;       //Internal representation
    //sortable: boolean;
    //...


//The following information is needed to create the cells, when a new column is inserted:
    title?: { [key: string]: ICell; };     //id == rowId;  { "rowId": JSCell}; If a specific row is not defined, the defaultTitleContent is used
    content?: { [key: string]: ICell; };   //id == rowId;  { "rowId": JSCell}; If a specific row is not defined, the defaultContent is used

    defaultTitleContent?: ICell;
    defaultContent?: ICell;     
}


 





class JSColumn implements IColumnDefinition{    
    columnId: string;       //Internal representation

    title: { [key: string]: ICell; };     //id == rowId;  { "rowId": JSCell}; If a specific row is not defined, the defaultTitleContent is used
    content: { [key: string]: ICell; };   //id == rowId;  { "rowId": JSCell}; If a specific row is not defined, the defaultContent is used

    defaultTitleContent: ICell;
    defaultContent: ICell;    


    constructor(definition: IColumnDefinition) {   
        //alert(JSON.stringify(definition));
        //this.className = definition.className || "";

        //this.defaultContent = definition.defaultContent || new JSCell();     //Some properties are inherited to the cell
        //TODO: - ein eigenes interface dafür machen (class: string / addClass / removeClass -> auch html representation ändern)
        //BESSER: addColumn / removeColumn / changeColumn / getColumn (gibt interface mit methoden wie "addClass" usw. zurück - kann aber auch noch später implementiert werden)
        //this.defaultContent.addClass( this.className );
    }
}