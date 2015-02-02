/// <reference path="lib/jQuery/jquery.d.ts"/>
/// <reference path="Debugging.ts" />
/// <reference path="TypeDefinitions.ts" />

/*
Other libs:
    http://webix.com/demo/datatable/
    http://www.datatables.net/blog/2014-11-07
    http://lorenzofox3.github.io/smart-table-website/
*/

module Tablify {
    "use strict";

    /*
     * Converts any Array or Object into a Table. Recursion is possible.
     * @object      Object      The table will have 2 rows: The first (title) row contains the key, the second (body) row the object's value.
     *              Array       The table will have 2 rows: The first (title) row contains the array index, the second (body) row the array's value.
     *              any         Any other type (string, number, function,...) will result in a table containing 2 cells: The first (top/title) cell contains the type ("typeof object"), the second (bottom/body) cell contains the result of "object.toString()"
     * @identifier  string      JQuery-Selector. Is resolved to a JQuery element (see below)
     *              JQuery      References a single HTMLElement. If the Element is a <table> (HTMLTableElement), the Table is initialised with the table content; Otherwise, a new table is generated within the HTMLElement
     *              Element     Target element. Is converted to a JQuery element (see above)
     * @return      Table       Returns the generated Table instance.
     * Note: If an array or object is passed and one of it's fields is another array/object, tablify is called recursive, leading in nested tables. The return value represents the top table.
     */
    export function tablify(object: Object|Array<any>|any, identifier?: string|JQuery|Element): Table {        

        if (object instanceof Array) {
            var table = new Table({
                columns: [],                        //todo: improve syntax
                rows: [ { rowId: "index" },
                        { rowId: "value" } ],       //todo: improve syntax
                titleRowCount: 1
            }, identifier);
            for (var i = 0; i < object.length; ++i) {
                var index: string = i.toString();
                var value: string = object[i].toString();
                table.addColumn({
                    columnId:   index,
                    content: {  "index": index,
                                "value": value
                    }
                });
                if (typeof object[i] === "object") {   //Array or Object
                    tablify(object[i], table.getCell("value", index).element);
                }
            }
            return table;
        }
        
        if (typeof object === "object") {
            var table = new Table({
                columns: [],                        //todo: improve syntax
                rows: [ { rowId: "key"   },
                        { rowId: "value" } ],       //todo: improve syntax
                titleRowCount: 1
            }, identifier);

            for (var key in object) {
                if (!object.hasOwnProperty(key)) {
                    continue;
                }

                var value: string = object[key].toString();
                table.addColumn({
                    columnId: key,
                    content: {  "key": key,
                                "value": value
                    }
                });

                if (typeof object[key] === "object") {   //Array or Object
                    tablify(object[key], table.getCell("value", key).element);
                }
            }
            return table;
        }

        //Convert any other type into a table:
        var table = new Table(null, identifier);
        table.addRow(RowType.title, "type");
        table.addRow(RowType.body,  "value");
        table.addColumn({
            columnId: "content",
            content: {
                "type":  typeof object,
                "value": object.toString()
            }
        });    
        return table;
    }
}

//Add a "tablify" function to all Arrays:
interface Array<T> {        //Needed to tell TypeScript that there's a new property
    tablify(target?: string|JQuery|Element): Tablify.Table;
}
Array.prototype.tablify = function (target?: string|JQuery|Element): Tablify.Table {
    return Tablify.tablify(this, target);    
}



//Also allows strings, numbers and anything else to be used - I don't want that
//interface Object{
//    tablify(identifier: string|JQuery): Tablify.Table;
//}
//Object.defineProperty(Object.prototype, 'tablify', {
//    value: function (identifier: string|JQuery): Tablify.Table {
//        return Tablify.tablify(this, identifier);
//    },
//    writable: true,   //The property may be changed with an assignment operator
//    configurable: true,   //The property may be changed or deleted from an object
//    enumerable: false   //The property should not show up during enumeration ("for-in" loops)
//});


//Questions:
//  Browser compatibility
//  Performance (each object has another property)
//  User friendliness
//      Is this a good thing to have in a library?
//      Anything that sould be changed?





