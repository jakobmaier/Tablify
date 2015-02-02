

window.onload = () => {
    //new Tablify.Table("#content>table");
    var table = new Tablify.Table("#content");

    table.addColumn(/*"Column 1"*/);
    table.addColumn({
        //columnId: "Column 2",
        defaultTitleContent: "2. Spalte",
        defaultBodyContent: "---"
    });

    table.addRow(Tablify.RowType.title, "Title row");

    table.addRow(Tablify.RowType.body, {
        //rowId: "First row",
        content: {
            "jsc1": new Tablify.Cell("First cell"),
            "jsc2": "Second cell"
        }
    });

    table.addRow(Tablify.RowType.title, {
        content: {
            "jsc1": new Tablify.Cell("column 1"),
            "jsc2": "column 2"
        }
    });


    table.addRow(Tablify.RowType.body, {
        //rowId: "Second row",
        content: {
            "jsc1": "!!!"
        }
    });/*
    table.addColumn({
        columnId: "Column 3",
        defaultTitleContent: "InvisibleTitle",
        defaultBodyContent: "<b>That's what I call a cell!</b>",
        content: {
            "jsr1": "3x1",
            "Title row": "Title of Nr. 3"
        }
    });*/
    table.addRow(Tablify.RowType.body);
    table.addRow(Tablify.RowType.body);
    table.addRow(Tablify.RowType.body);
    table.addRow(Tablify.RowType.body);
    table.addRow(Tablify.RowType.body);




    //console.log(table.toObject());
    console.log(JSON.stringify(table.toObject(true)));


    new Tablify.Table(table.toObject(true), "#content");
    new Tablify.Table(table.toObject(false), "#content");

    //var copyTable = new Tablify.Table(table.table);
    //console.log(copyTable === table);

    
    console.log("===================================================");
    new Tablify.Table({
        "columns": [
        ],
        "rows": [
            {
                "rowId": "row1",
                "content": {
                    "col1": "cell1",
                    "col2": "cell x"
                },
                "generateMissingColumns": true
            },
            {
                "rowId": "row2", 
                "content": {
                    "col1": "cell2",
                    "col2": "cell x"
                },
                "generateMissingColumns": true
            }
        ],
        "titleRowCount": 0
    }, "#content");










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

 