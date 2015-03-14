

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
    
    table.addRow( {
        rowId: "row1",
        rowType: Tablify.RowType.body,
        content: {
            "Column 1": new Tablify.Cell("First cell"),
            "Column 3": "Third cell"
        },
        generateMissingColumns: true
    });

    table.addTitleRow("Title row");

    table.addRow( {
        rowType: Tablify.RowType.title,
        content: {
            "Column 1": new Tablify.Cell("column 1"),
            "Column 2": jQuery("<div style='color: red'>column 2</div>").get(0),
            "Column 3": jQuery("<div style='color: red'>column 3</div>")
        }
    });

    table.addBodyRow({ rowId: "row4", rowType: Tablify.RowType.title, content: "!4!" });
    table.addFooterRow({ rowId: "row5", content: jQuery("<div style='color: red'>5</div>") });
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
            "row1": table.getCell(table.getColumnPosition(table.getColumn("Column 1")), table.getRow(table.getRowPosition(table.getRow("row1"))).rowId),
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
    table.addColumn({ columnId: "invisible", defaultBodyContent: "invisible", visible: false }, 500);
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
    table.addRow({ rowId: "invisible", content: "invisible", visible: false }, 500);
    
    try {
        table.removeRow("noExistingRow");
    } catch (e) {
        if (!(e instanceof Tablify.OperationFailedException)) {
            throw e;
        }
        table.removeRow("temp1");
    }
        
    console.log("Table show/hide animation test: Change the speed by setting the variable 'speed', stop the animation by setting 'stop' to true");
    window["speed"] = 100;
    window["stop"] = false;
        var cs = function (table, idx) { table.getColumn(idx).setVisibility(true, window["speed"] + Math.random() * 500, function () { ch(table, idx); }); }
        var ch = function (table, idx) { if (window["stop"]) { return; } table.getColumn(idx).setVisibility(false, window["speed"] + Math.random() * 500, function () { cs(table, idx); }); }
        var rs = function (table, idx) { table.getRow(idx).setVisibility(true, window["speed"] + Math.random() * 500, function () { rh(table, idx); }); }
        var rh = function (table, idx) { if (window["stop"]) { return; } table.getRow(idx).setVisibility(false, window["speed"] + Math.random() * 500, function () { rs(table, idx); }); }

    window["animate"] = function (tableId, duration) {
        var table = tableId;
        if (!(table instanceof Tablify.Table)) {
            table = Tablify.tableStore.getTable(tableId);
        }
        for (var i = 0; i < table.getRowCount(); ++i) {
            rh(table, i);
        }
        for (var i = 0; i < table.getColumnCount(); ++i) {
            ch(table, i);
        }
        duration = duration || 5000;
        setTimeout(function () {
            window["stop"] = true;
        }, duration);
    };

    window["animate"]("ttid17", 2500);        
    return table;
}












window.onload = () => {
    "use strict";

    //Tablify.Table.defaultAnimation = 500;

    window["$"] = function () {
        console.error("jQuery must not be accessed with $");
        return null;
    }

        
    var table = generateTestTable();
    window["tt"] = table;

    var tableCopy = new Tablify.Table(table.toObject(false), "#content");
    
    new Tablify.Table({columns: 5, rows: 5, titleRowCount: 1, footerRowCount: 3}, "#content");


        
    var smallTable = new Tablify.Table({
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
    //window["animate"](smallTable);

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
        var t = Tablify.tablify(contentToTablify[i], "#content", 1);
        jQuery("#content").append("<br>");
    }
            
    window["x"] = Tablify.tableStore.getTable("ttid2");
};

 