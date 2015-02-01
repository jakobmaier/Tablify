var Tablify;
(function (Tablify) {
    var Cell = (function () {
        function Cell(cellDef) {
            this.element = null;
            if (!cellDef) {
                this.content = "";
            }
            else if (typeof cellDef === "string") {
                this.content = cellDef;
            }
            else if (cellDef instanceof Cell) {
                Tablify.logger.info("Ceating new cell-copy.");
                this.content = cellDef.content;
            }
            else {
                this.content = cellDef.content;
            }
        }
        Cell.prototype.generateDom = function (tagType, columnId) {
            if (this.element !== null) {
                Tablify.logger.warning("Cell: generateDom has been called, although the element has already been generated before. This might be an error.");
                return this.element;
            }
            Tablify.assert_argumentsNotNull(arguments);
            Tablify.assert(tagType === "th" || tagType === "td", "Cells must have a \"th\" or \"td\" tagType.");
            var html = "<" + tagType + " data-columnId='" + columnId + "'>" + this.content + "</" + tagType + ">";
            this.element = $(html);
            return this.element;
        };
        Cell.prototype.toObject = function () {
            return this.content;
        };
        return Cell;
    })();
    Tablify.Cell = Cell;
})(Tablify || (Tablify = {}));
