var Tablify;
(function (Tablify) {
    var Table = (function () {
        function Table(identifier, description) {
            this.sortedColumns = [];
            this.columns = {};
            this.titleRows = [];
            this.bodyRows = [];
            this.rows = {};
            this.tableId = "jsg" + (++Table.tableIdSequence);
            if (typeof identifier === "string") {
                this.table = $(identifier);
            }
            else {
                this.table = identifier;
            }
            if (this.table == null) {
                Tablify.logger.error("Unable to find DOM Element", identifier);
                return;
            }
            if (this.table.prop("tagName") !== "TABLE") {
                Tablify.logger.log("Creating table element. Parent tag: ", this.table.prop("tagName"));
                var table = $("<table><thead></thead><tbody></tbody></table>");
                this.table.append(table);
                this.table = table;
            }
            else if (this.table.hasClass("tablified")) {
                var existingObj = Tablify.tableStore.getTableByElement(this.table);
                if (existingObj !== null) {
                    Tablify.logger.warning("The given HTML element is already managed by another Table instance (\"" + existingObj.tableId + "\"). The old instance will be returned instead of creating a new one.");
                    return existingObj;
                }
            }
            this.table.addClass("tablified");
            Tablify.tableStore.registerTable(this);
            this.thead = this.table.find("thead");
            this.tbody = this.table.find("tbody");
            if (!description) {
                return;
            }
            var descriptionObj;
            if (description instanceof Table) {
                descriptionObj = description.toObject(true);
            }
            else {
                descriptionObj = description;
            }
            for (var i = 0; i < descriptionObj.columns.length; ++i) {
                this.addColumn(descriptionObj.columns[i]);
            }
            var titleRowCount = descriptionObj.titleRowCount || 0;
            for (var i = 0; i < descriptionObj.rows.length; ++i) {
                this.addRow(titleRowCount > i ? 0 /* title */ : 1 /* body */, descriptionObj.rows[i]);
            }
        }
        Table.prototype.representsTable = function (table) {
            return (this.table === table);
        };
        Table.prototype.destroy = function () {
            Tablify.tableStore.unregisterTable(this);
            this.table.removeClass("tablified");
            this.table = null;
        };
        Table.prototype.addColumn = function (columnDef) {
            var column = new Tablify.Column(this, columnDef);
            var columnId = column.columnId;
            if (columnId in this.columns) {
                Tablify.logger.error("There is already a column with the id \"" + columnId + "\".");
                return;
            }
            var content = {};
            var generateMissingRows = false;
            if (columnDef && typeof columnDef !== "string" && !(columnDef instanceof Tablify.Column)) {
                content = columnDef.content || {};
                generateMissingRows = (columnDef.generateMissingRows === true);
            }
            if (generateMissingRows) {
                for (var rowId in content) {
                    if (!(rowId in this.rows)) {
                        this.addRow(1 /* body */, rowId);
                    }
                }
            }
            this.columns[columnId] = column;
            this.sortedColumns.push(column);
            for (var rowId in this.rows) {
                var row = this.rows[rowId];
                var cell;
                if (rowId in content) {
                    cell = content[rowId];
                }
                else {
                    switch (row.rowType) {
                        case 0 /* title */:
                            cell = column.defaultTitleContent;
                            break;
                        case 1 /* body */:
                            cell = column.defaultBodyContent;
                            break;
                        default: Tablify.assert(false, "Invalid RowType given.");
                    }
                }
                row.addColumn(column, cell);
            }
        };
        Table.prototype.addRow = function (rowType, rowDef) {
            var row = new Tablify.Row(this, rowType, rowDef, this.columns);
            var rowId = row.rowId;
            if (rowId in this.rows) {
                Tablify.logger.error("There is already a row with the id \"" + rowId + "\".");
                return;
            }
            this.rows[rowId] = row;
            switch (rowType) {
                case 0 /* title */:
                    this.titleRows.push(row);
                    this.thead.append(row.generateDom());
                    break;
                case 1 /* body */:
                    this.bodyRows.push(row);
                    this.tbody.append(row.generateDom());
                    break;
                default: Tablify.assert(false, "Invalid RowType given.");
            }
        };
        Table.prototype.getRowIndex = function (identifier) {
            var row;
            if (typeof identifier === "string") {
                row = this.rows[identifier];
                if (!row) {
                    return null;
                }
            }
            else {
                row = identifier;
            }
            for (var i = 0; i < this.titleRows.length; ++i) {
                if (this.titleRows[i].equals(row)) {
                    return i;
                }
            }
            for (var i = 0; i < this.bodyRows.length; ++i) {
                if (this.bodyRows[i].equals(row)) {
                    return this.titleRows.length + i;
                }
            }
            return null;
        };
        Table.prototype.getColumnIndex = function (identifier) {
            var column;
            if (typeof identifier === "string") {
                column = this.columns[identifier];
                if (!column) {
                    return null;
                }
            }
            else {
                column = identifier;
            }
            for (var i = 0; i < this.sortedColumns.length; ++i) {
                if (this.sortedColumns[i].equals(column)) {
                    return i;
                }
            }
            return null;
        };
        Table.prototype.getRows = function (rowType) {
            if (rowType === 0 /* title */) {
                return this.titleRows;
            }
            if (rowType === 1 /* body */) {
                return this.bodyRows;
            }
            return this.titleRows.concat(this.bodyRows);
        };
        Table.prototype.getRow = function (identifier) {
            if (typeof identifier === "number") {
                if (identifier < this.titleRows.length) {
                    return this.titleRows[identifier] || null;
                }
                return this.bodyRows[identifier - this.titleRows.length] || null;
            }
            return this.rows[identifier] || null;
        };
        Table.prototype.removeRow = function (identifier) {
            var rowId;
            var rowIndex;
            if (typeof identifier === "number") {
                rowIndex = identifier;
                if (identifier < this.titleRows.length) {
                    var row = this.titleRows[identifier];
                    if (!row) {
                        return false;
                    }
                    rowId = row.rowId;
                }
                else {
                    var row = this.bodyRows[identifier - this.titleRows.length];
                    if (!row) {
                        return false;
                    }
                    rowId = row.rowId;
                }
            }
            else if (typeof identifier === "string") {
                rowId = identifier;
                rowIndex = this.getRowIndex(rowId);
                if (rowIndex === null) {
                    return false;
                }
            }
            else {
                rowId = identifier.rowId;
                rowIndex = this.getRowIndex(identifier);
                if (rowIndex === null) {
                    return false;
                }
            }
            this.rows[rowId].element.remove();
            this.rows[rowId].destroy();
            delete this.rows[rowId];
            if (rowIndex < this.titleRows.length) {
                this.titleRows.splice(rowIndex, 1);
            }
            else {
                this.bodyRows.splice(rowIndex - this.titleRows.length, 1);
            }
            return true;
        };
        Table.prototype.removeColumn = function (identifier) {
            var columnId;
            var columnIndex;
            if (typeof identifier === "number") {
                columnIndex = identifier;
                var column = this.sortedColumns[identifier];
                if (!column) {
                    return false;
                }
                columnId = column.columnId;
            }
            else if (typeof identifier === "string") {
                columnId = identifier;
                columnIndex = this.getColumnIndex(columnId);
                if (columnIndex === null) {
                    return false;
                }
            }
            else {
                columnId = identifier.columnId;
                columnIndex = this.getColumnIndex(identifier);
                if (columnIndex === null) {
                    return false;
                }
            }
            for (var rowId in this.rows) {
                this.rows[rowId].removeColumn(columnId);
            }
            this.columns[columnId].destroy();
            delete this.columns[columnId];
            this.sortedColumns.splice(columnIndex, 1);
            return true;
        };
        Table.prototype.getColumns = function () {
            return this.sortedColumns;
        };
        Table.prototype.getColumn = function (identifier) {
            if (typeof identifier === "number") {
                return this.sortedColumns[identifier] || null;
            }
            return this.columns[identifier] || null;
        };
        Table.prototype.getColumnCells = function (identifier) {
            if (this.getColumn(identifier) === null) {
                return null;
            }
            var cells = {};
            for (var rowId in this.rows) {
                cells[rowId] = this.rows[rowId].getCell(identifier);
            }
            return cells;
        };
        Table.prototype.getCell = function (rowIdentifier, columnIdentifier) {
            var row = this.getRow(rowIdentifier);
            if (row === null) {
                return null;
            }
            return row.getCell(columnIdentifier);
        };
        Table.prototype.getRowCount = function (rowType) {
            if (rowType === 0 /* title */) {
                return this.titleRows.length;
            }
            if (rowType === 1 /* body */) {
                return this.bodyRows.length;
            }
            return this.titleRows.length + this.bodyRows.length;
        };
        Table.prototype.getColumnCount = function () {
            return this.sortedColumns.length;
        };
        Table.prototype.toObject = function (includeContent) {
            var description = {
                columns: [],
                rows: [],
                titleRowCount: this.titleRows.length
            };
            for (var columnId in this.columns) {
                description.columns.push(this.columns[columnId].toObject());
            }
            for (var i = 0; i < this.titleRows.length; ++i) {
                description.rows.push(this.titleRows[i].toObject(includeContent));
            }
            for (var i = 0; i < this.bodyRows.length; ++i) {
                description.rows.push(this.bodyRows[i].toObject(includeContent));
            }
            return description;
        };
        Table.tableIdSequence = 0;
        return Table;
    })();
    Tablify.Table = Table;
})(Tablify || (Tablify = {}));
window.onload = function () {
    var table = new Tablify.Table("#content");
    table.addColumn();
    table.addColumn({
        defaultTitleContent: "2. Spalte",
        defaultBodyContent: "---"
    });
    table.addRow(0 /* title */, "Title row");
    table.addRow(1 /* body */, {
        content: {
            "jsc1": new Tablify.Cell("First cell"),
            "jsc2": "Second cell"
        }
    });
    table.addRow(0 /* title */, {
        content: {
            "jsc1": new Tablify.Cell("column 1"),
            "jsc2": "column 2"
        }
    });
    table.addRow(1 /* body */, {
        content: {
            "jsc1": "!!!"
        }
    });
    table.addRow(1 /* body */);
    table.addRow(1 /* body */);
    table.addRow(1 /* body */);
    table.addRow(1 /* body */);
    table.addRow(1 /* body */);
    console.log(JSON.stringify(table.toObject(true)));
    new Tablify.Table("#content", table.toObject(true));
    new Tablify.Table("#content", table.toObject(false));
    console.log("===================================================");
    new Tablify.Table("#content", {
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
    });
};
