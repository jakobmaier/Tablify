var Tablify;
(function (Tablify) {
    var Column = (function () {
        function Column(table, columnDef) {
            this.table = table;
            var columnDefDetails;
            if (typeof columnDef === "string") {
                columnDefDetails = { columnId: columnDef };
            }
            else if (columnDef instanceof Column) {
                var other = columnDef;
                Tablify.logger.info("Ceating new column-copy of \"" + other.columnId + "\".");
                this.columnId = other.columnId;
                this.defaultTitleContent = other.defaultTitleContent;
                this.defaultBodyContent = other.defaultBodyContent;
                return;
            }
            else {
                columnDefDetails = columnDef || {};
            }
            this.columnId = columnDefDetails.columnId || ("jsc" + (++Column.columnIdSequence));
            Tablify.logger.info("Ceating new column \"" + this.columnId + "\".");
            this.defaultTitleContent = new Tablify.Cell(columnDefDetails.defaultTitleContent || this.columnId);
            this.defaultBodyContent = new Tablify.Cell(columnDefDetails.defaultBodyContent);
        }
        Column.prototype.destroy = function () {
            Tablify.logger.info("Deleting column \"" + this.columnId + "\".");
            this.table = null;
        };
        Column.prototype.remove = function () {
            Tablify.assert(this.table.removeColumn(this));
        };
        Column.prototype.equals = function (other) {
            return (other.table === this.table && other.columnId === this.columnId);
        };
        Column.prototype.getCell = function (row) {
            return this.table.getCell(row, this.columnId);
        };
        Column.prototype.getCells = function () {
            return this.table.getColumnCells(this.columnId);
        };
        Column.prototype.toObject = function () {
            return {
                columnId: this.columnId,
                defaultTitleContent: this.defaultTitleContent.toObject(),
                defaultBodyContent: this.defaultBodyContent.toObject()
            };
        };
        Column.columnIdSequence = 0;
        return Column;
    })();
    Tablify.Column = Column;
})(Tablify || (Tablify = {}));
