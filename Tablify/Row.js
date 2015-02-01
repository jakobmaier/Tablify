var Tablify;
(function (Tablify) {
    var Row = (function () {
        function Row(table, rowType, rowDef, columns) {
            this.element = null;
            this.cells = {};
            Tablify.assert(table instanceof Tablify.Table && typeof rowType === "number" && typeof columns === "object");
            this.table = table;
            var rowInfo;
            if (typeof rowDef === "string") {
                rowInfo = { rowId: rowDef };
            }
            else if (rowDef instanceof Row) {
                Tablify.logger.info("Ceating new row-copy of \"" + other.rowId + "\".");
                var other = rowDef;
                this.rowId = other.rowId;
                this.rowType = other.rowType;
                for (var columnId in other.cells) {
                    this.cells[columnId] = new Tablify.Cell(other.cells[columnId]);
                }
                return;
            }
            else {
                rowInfo = rowDef || {};
            }
            rowInfo.content = rowInfo.content || {};
            this.element = null;
            this.rowId = rowInfo.rowId || ("jsr" + (++Row.rowIdSequence));
            this.rowType = rowType;
            Tablify.logger.info("Ceating new row \"" + this.rowId + "\".");
            if (rowInfo.generateMissingColumns === true) {
                for (var columnId in rowInfo.content) {
                    if (!(columnId in columns)) {
                        table.addColumn(columnId);
                    }
                }
            }
            for (var columnId in columns) {
                if (columnId in rowInfo.content) {
                    this.cells[columnId] = new Tablify.Cell(rowInfo.content[columnId]);
                    continue;
                }
                Tablify.logger.info("Using default value for row \"" + this.rowId + "\", col \"" + columnId + "\".");
                switch (this.rowType) {
                    case 0 /* title */:
                        this.cells[columnId] = new Tablify.Cell(columns[columnId].defaultTitleContent);
                        break;
                    case 1 /* body */:
                        this.cells[columnId] = new Tablify.Cell(columns[columnId].defaultBodyContent);
                        break;
                    default: Tablify.assert(false, "Invalid RowType given.");
                }
            }
        }
        Row.prototype.destroy = function () {
            Tablify.logger.info("Deleting row \"" + this.rowId + "\".");
            this.table = null;
            this.element = null;
        };
        Row.prototype.remove = function () {
            Tablify.assert(this.table.removeRow(this));
        };
        Row.prototype.equals = function (other) {
            return (other.table === this.table && other.rowId === this.rowId);
        };
        Row.prototype.addColumn = function (column, content) {
            Tablify.assert_argumentsNotNull(arguments);
            var columnId = column.columnId;
            if (columnId in this.cells) {
                Tablify.logger.error("The row \"" + this.rowId + "\" has already a column with the id \"" + columnId + "\".");
                return;
            }
            var cell = new Tablify.Cell(content);
            this.cells[columnId] = cell;
            if (this.element !== null) {
                var cellDom = cell.generateDom(this.rowType === 0 /* title */ ? "th" : "td", columnId);
                this.element.append(cellDom);
                console.log("row " + this.rowId + " / " + columnId + " = " + cell.content);
            }
            else {
                Tablify.logger.warning("A column has been added to the row \"" + this.rowId + "\" and the row is not part of the DOM yet. This might be an error.");
            }
        };
        Row.prototype.removeColumn = function (columnId) {
            this.cells[columnId].element.remove();
            delete this.cells[columnId];
        };
        Row.prototype.getCells = function () {
            return this.cells;
        };
        Row.prototype.getCell = function (column) {
            if (typeof column === "number") {
                var col = this.table.getColumn(column);
                if (col === null) {
                    return null;
                }
                column = col.columnId;
            }
            return this.cells[column] || null;
        };
        Row.prototype.generateDom = function () {
            if (this.element !== null) {
                Tablify.logger.warning("Row: generateDom has been called, altough the element has already been generated before. This might be an error.");
                return this.element;
            }
            var element = $("<tr data-rowId:'" + this.rowId + "'></tr>");
            for (var columnId in this.cells) {
                var cell = this.cells[columnId].generateDom(this.rowType === 0 /* title */ ? "th" : "td", columnId);
                element.append(cell);
            }
            this.element = element;
            return element;
        };
        Row.prototype.toObject = function (includeContent) {
            var description = {
                rowId: this.rowId
            };
            if (includeContent === false) {
                return description;
            }
            description.content = {};
            for (var columnId in this.cells) {
                description.content[columnId] = this.cells[columnId].toObject();
            }
            return description;
        };
        Row.rowIdSequence = 0;
        return Row;
    })();
    Tablify.Row = Row;
})(Tablify || (Tablify = {}));
