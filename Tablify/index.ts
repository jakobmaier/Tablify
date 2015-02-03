

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

    table.addRow(Tablify.RowType.title, "Title row");

    table.addRow(Tablify.RowType.body, {
        //rowId: "First row",
        content: {
            "Column 1": new Tablify.Cell("First cell"),
            "Column 3": "Third cell"
        },
        generateMissingColumns: true
    });

    table.addRow(Tablify.RowType.title, {
        content: {
            "Column 1": new Tablify.Cell("column 1"),
            "Column 2": $("<div style='color: red'>column 2</div>").get(0),
            "Column 3": $("<div style='color: red'>column 3</div>")
        }
    });

    table.addRow(Tablify.RowType.body, { rowId: "row4", content: "!4!" });
    table.addRow(Tablify.RowType.body, { rowId: "row5", content: $("<div style='color: red'>5</div>") });
    table.addRow(Tablify.RowType.body, { rowId: "row6", content: $("<div style='color: red'>6</div>").get(0) });

    var destroyedTable = new Tablify.Table(smallTable, "#content");

    table.addRow(Tablify.RowType.body, {
        rowId: "row7",
        content: {
            "Column 1": Tablify.tableStore.getTable(smallTable.tableId),
            "Column 2": Tablify.tableStore.getTable(destroyedTable.table),
            "Column 3": "##",
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

    table.addColumn({
        // columnId: "Column 4",
        defaultTitleContent: "Spalte 4",
        defaultBodyContent: "---",
        content: {
            "Title row": null,
            "row6": primitiveTablifies,
            "row7": Tablify.tablify(new Date(0)),
            "row8": Tablify.tablify([42, { "obj1": "cont1", "obj2": "cont2", "obj3": [[], {}] }]),
            "row4": new Tablify.Table(table.toObject(true))
        },
        generateMissingRows: true
    });


    return table;
}












window.onload = () => {
    "use strict";
    
    var table = generateTestTable();
  
    new Tablify.Table(table.toObject(false), "#content");


    
    new Tablify.Table({
        "rows": [{
                "content": {
                    "col1": "cell1",
                    "col2": "cell x"
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
        try {
            (<any>contentToTablify[i]).tablify("#content");
        } catch(e) {
            console.log("no tablify for", contentToTablify[i]);

            Tablify.tablify(contentToTablify[i], "#content");
        }
    }
        
};

 