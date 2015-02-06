

function generateTestTable(): Tablify.Table {
    "use strict";
    var smallTable = new Tablify.Table({
        columns: ["col"],
        rows: ["row"],
        titleRowCount: 1
    }, "#content");


    var table = new Tablify.Table("#content");

    table.addColumn("Column 1");
    table.addColumn({
        columnId: "Column 2",
        defaultTitleContent: "2. Spalte",
        defaultBodyContent: "---"
    });

    table.addTitleRow("Title row");

    table.addRow( {
        rowId: "row1",
        rowType: Tablify.RowType.body,
        content: {
            "Column 1": new Tablify.Cell("First cell"),
            "Column 3": "Third cell"
        },
        generateMissingColumns: true
    });

    table.addRow( {
        rowType: Tablify.RowType.title,
        content: {
            "Column 1": new Tablify.Cell("column 1"),
            "Column 2": jQuery("<div style='color: red'>column 2</div>").get(0),
            "Column 3": jQuery("<div style='color: red'>column 3</div>")
        }
    });

    table.addBodyRow({ rowId: "row4", rowType: Tablify.RowType.title, content: "!4!" });
    table.addRow({ rowId: "row5", content: jQuery("<div style='color: red'>5</div>") });
    table.addRow({ rowId: "row6", content: jQuery("<div style='color: red'>6</div>").get(0) });

    var destroyedTable = new Tablify.Table(smallTable, "#content");

    table.addRow( {
        rowId: "row7",
        content: {
            "Column 1": Tablify.tableStore.getTable(smallTable.tableId),
            "Column 2": Tablify.tableStore.getTable(destroyedTable.table),
            "Column 3": new Tablify.Table({ rows: 3, columns: 2, titleRowCount: 1 }),
            "No column": "nothing"
        }
    });
    destroyedTable.destroy();
    
    var primitiveTablifies = new Tablify.Table(
        {
            rows: [{
                content: {
                    "num": Tablify.tablify(42.5),
                    "str": Tablify.tablify("str"),
                    "func": Tablify.tablify(function () { }),
                    "regexp": Tablify.tablify(/[a-z]/g),
                    //"date": Tablify.tablify(new Date())
                },
                generateMissingColumns: true
            }]
        });
    
    Tablify.Cell.defaultCellDefinitionDetails.content = "EMPTY";
    table.addColumn({
        // columnId: "Column 4",
        defaultTitleContent: "Spalte 4",
        defaultBodyContent: "---",
        content: {
            "Title row": null,
            "row1": table.getCell(table.getRow(table.getRowPosition(table.getRow("row1"))).rowId, table.getColumnPosition(table.getColumn("Column 1"))),
            "row5": Tablify.tablify([[[[[[[[42]]]]]]]], undefined, 0),
            "row6": primitiveTablifies,
            "row7": Tablify.tablify(new Date(0)),
            "row8": Tablify.tablify([42, { "obj1": "cont1", "obj2": "cont2", "obj3": [[], {}] }]),
            "row4": new Tablify.Table(table.toObject(true))
        },
        generateMissingRows: true
    });
    Tablify.Cell.defaultCellDefinitionDetails.content = "";

    table.addColumn("temp1");
    table.addColumn("temp2").remove();
    try {
        table.removeColumn("noExistingColumn");
    } catch (e) {
        if (!(e instanceof Tablify.OperationFailedException)) {
            throw e;
        }
        table.removeColumn("temp1");
    }
    table.addRow("temp1");
    table.addRow("temp2").remove();
    try {
        table.removeRow("noExistingRow");
    } catch (e) {
        if (!(e instanceof Tablify.OperationFailedException)) {
            throw e;
        }
        table.removeRow("temp1");
    }






    return table;
}












window.onload = () => {
    "use strict";

    window["$"] = function () {
        console.error("jQuery must not be accessed with $");
        return null;
    }

        
    var table = generateTestTable();
  
    new Tablify.Table(table.toObject(false), "#content");
        
    new Tablify.Table({
        "rows": [{
                "content": {
                    "col1": "cell1",
                    "col2": {
                        content: "cell x"
                    }
                },
                "generateMissingColumns": true
            },{ "content": {
                    "col1": "cell2",
                    "col2": "cell x"
                }
            }
        ]
    }, "#content");


    console.log("===================================================");



    var obj = {
        "A": "a",
        "B": "b",
        "C": "c",
        "D": "d",
        "E": "e",
        "F": "f",
        "G": "g"
    };
    var arr = ["a", "b", "c", "d", "e", "f", "g"];
    var str = "A string";
    var num = 42.5;

    var arrArr = [arr, arr, arr, arr];
    var arrObj = [obj, obj, obj, obj];
    var objArr = { "A": arr, "B": arr, "C": arr, "D": arr };
    var objObj = { "A": obj, "B": obj, "C": obj, "D": obj };


    var array = ["a", "b", "c", "d", "e", "f", "g"];
    var object = { first: array, second: array, third: array };
    var superArray = [object, object, object, object];
    
    console.log("Tablifying...");
    var contentToTablify = [
        obj,
        arr,
        str,
        num,
        arrArr,
        arrObj,
        objArr,
        objObj,
        superArray
    ];
    

    for (var i = 0; i < contentToTablify.length; ++i) {
        Tablify.tablify(contentToTablify[i], "#content", 1);
        jQuery("#content").append("<br>");
    }
        
    

    window["x"] = Tablify.tableStore.getTable("ttid26");

};

 