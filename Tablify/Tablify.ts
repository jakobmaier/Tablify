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
     * [Internal]
     * Exception object that is thrown by Tablify if an operation failed.
     * @funcName    string      Name of the function that produced this exception
     * @message     string      Error description
     */
    export function OperationFailedException(funcName: string, message: string) {
        this.name = "OperationFailedException";
        this.message = "<Tablify: " + funcName + ">: " + message;
        this.toString = function () {
            return this.name + " " + this.message;
        };       
    }
     
    /*
     * [Internal]
     * Exception object that is thrown by Tablify if invalid parameters are passed.
     * @funcName    string      Name of the function that produced this exception
     * @message     string      Error description
     */
    export function InvalidArgumentException(funcName: string, message: string) {
        this.name = "InvalidArgumentException";
        this.message = "<Tablify: " + funcName + ">: " + message;
        this.toString = function () {
            return this.name + " " + this.message;
        };
    }

    /*
     * Converts any Array or Object into a Table. Recursion is possible.
     * @object          Object      The table will have 2 rows: The first (title) row contains the key, the second (body) row the object's value.
     *                  Array       The table will have 2 rows: The first (title) row contains the array index, the second (body) row the array's value.
     *                  any         Any other type (string, number, function,...) will result in a table containing 2 cells: The first (top/title) cell contains the type ("typeof object"), eventually following by "(RegExp)" or "(Date)", the second (bottom/body) cell contains the result of "object.toString()"
     * @target          string      JQuery-Selector. Is resolved to a JQuery element (see below)
     *                  JQuery      References a single HTMLElement. If the Element is a <table> (HTMLTableElement), the Table is initialised with the table content; Otherwise, a new table is generated within the HTMLElement
     *                  Element     Target element. Is converted to a JQuery element (see above)
     * @maxRecursion    number      The max. recursion depth, default = 10. If the max. depth has been reached, objects and arrays will be displayed using ".toString()".
     * @return          Table       Returns the generated Table instance.
     * Note: If an array or object is passed and one of it's fields is another array/object, tablify is called recursive, leading in nested tables. The return value represents the top table.
     */
    export function tablify(object: Object|Array<any>|any, target?: Selector, maxRecursion?: number): Table { 
        if (typeof maxRecursion !== "number") {
            maxRecursion = 10;
        }
        --maxRecursion;

        if (object instanceof Array) {
            var table = new Table({
                rows: [ "index", "value" ],
                titleRowCount: 1
            }, target);
            for (var i = 0; i < object.length; ++i) {
                var index: string = i.toString();
                table.addColumn({
                    columnId:   index,
                    content: {  "index": index,
                                "value": (typeof object[i] !== "object" || maxRecursion < 0) ? object[i].toString() : tablify(object[i], null, maxRecursion)
                    }
                });
            }
            return table;
        }
        
        if (typeof object === "object" && !(object instanceof Date) && !(object instanceof RegExp)) {      
            var table = new Table({
                rows: [ "key", "value" ],   
                titleRowCount: 1
            }, target);

            for (var key in object) {
                if (!object.hasOwnProperty(key)) {
                    continue;
                }
                table.addColumn({
                    columnId: key,
                    content: {  "key": key,
                                "value": (typeof object[key] !== "object" || maxRecursion < 0) ? object[key].toString() : tablify(object[key], null, maxRecursion)
                    }
                });
            }
            return table;
        }

        //Convert any other type into a table:
        var table = new Table({
            columns: [null],
            rows: [{
                rowId: "type",
                content: (object instanceof RegExp) ? "object(RegExp)" : 
                         (object instanceof Date) ? "object(Date)" : typeof object
            }, {
                rowId: "value",
                content: object.toString()
            }],
            titleRowCount: 1
        }, target);      
        
        var count = 0;
        for (var i = 0; i < Tablify.tableStore.tableList.length; ++i) {
            if (Tablify.tableStore.tableList[i].isPartOfDOM()) {
                count++;
            }
        }
        assert(count === jQuery(".tablified").length);
           
        return table;
    }
    
    /*
     * [Internal]
     * Checks if the given argument is an HTMLElement (type "Element").
     * @something       any         Any object that might be of type "Element"
     * @return          boolean     true: It is an Element; otherwise: false
     */
    export function isElement(something: any): boolean {
        //Source: http://stackoverflow.com/a/384380/2224996
        return (
            typeof HTMLElement === "object" ? something instanceof HTMLElement : //DOM2
            something && typeof something === "object" && something !== null && something.nodeType === 1 && typeof something.nodeName === "string"
        );
    }

    /*
     * [Internal]
     * Returns the type of the HTMLElement in lower case
     * @elem        Element         Element whose type (eg. "div") should be returned
     * @return      String          Element type (=tag name) in lower case characters. eg. "div", "table", "span"
     */
    export function getElementType(elem: Element): String {
        return elem.nodeName.toLowerCase();
    }

    /*
     * [Internal]
     * Resolves a Selector and returns the appropiate JQuery Object.
     * If the selector doesn't reference exacly ONE Element, null is being returned.
     * @selector    string      JQuery selector string
     *              Element     The HTMLElement will be wrapped in a JQuery element
     *              JQuery      The object's length is checked for 1 and then directly returned
     * @return      JQuery      Returns the JQuery element that references exacly one HTMLElement. If this is not possible, null is being returned
     */
    export function resolveUniSelector(selector: Selector): JQuery{
        if (isElement(selector)){               //Element
            return jQuery(selector);
        }
        if (typeof selector === "string") {     //selector
            selector = jQuery(selector);
        }
        //JQuery        
        if ((<JQuery>selector).length !== 1) {
            return null;
        }
        return <JQuery>selector;
    }

    /*
     * [Internal]
     * Generates an array with exacly "count" fields. Each field holding the value "value". Note: no deep-copy is being performed.
     * @count   number      Length of the array to generate
     * @value   any         Content which will be applied to each field
     * @return  any[]       The resulting array
     */
    export function makeArray(count: number, value: any): any[] {
        var array = [];
        for (var i = 0; i < count; ++i) {
            array.push(value);
        }
        return array;
    }



    /*
     * [Internal]
     * Surrounds a function call with another function, which is either called before or afterwards. Can be usefull for wrapping callback functions.
     * Creates a new function, which calls "firstFunc" and then "lastFunc". Both functions get the same arguments.
     * @firstFunc       Function    Is called first. The arguments are passed on. When no function is passed, it will be ignored.
     * @lastFunc        Function    Is called afterwards. The arguments are passed on. When no function is passed, it will be ignored.
     * @context         any         Gets bound to "this" in both passed functions. If the argument is omitted, "this" won't get modified.
     * @return          Function    New function that calls both given functions.
     */
    export function envelopFunctionCall(firstFunc: Function, lastFunc: Function, context?: any): Function {
        return function () {
            if (arguments.length < 3) {
                context = this;
            }
            if (jQuery.isFunction(firstFunc)) {
                firstFunc.apply(context, arguments);
            }
            if (jQuery.isFunction(lastFunc)) {
                lastFunc.apply(context, arguments);
            }
        };
    }
    
    /*
     * [Internal]
     * Converts the given parameters into a JQueryAnimationOptions object
     * @duration    number                      Duration in milliseconds
     *              string                      "fast" = 200ms; "slow" = 600ms
     * @options     JQueryAnimationOptions      Additional options for the animation. For more information, take a look at jQuery's `animate` function. The object is returnd directly. 
     * @complete    function                    Callbackfunction which is called after the animation completed. The argument is ignored if JQueryAnimationOptions are passed.
     * @return      JQueryAnimationOptions
     */
    export function getJQueryAnimationOptions(duration: number | string, complete?: () => void): JQueryAnimationOptions;
    export function getJQueryAnimationOptions(options: JQueryAnimationOptions): JQueryAnimationOptions;

    export function getJQueryAnimationOptions(duration: number | string | JQueryAnimationOptions, complete?: () => void): JQueryAnimationOptions {
        //Create the animation options for jQuery
        var options: JQueryAnimationOptions;
        if (typeof duration === "object") {     //Animation options have been given
            options = duration;
        } else {
            options = {
                "duration": duration,
                "complete": complete
            };
        }
        return options;
    }

    /*
     * [Internal]
     * Performs a sliding motion to show or hide table rows or columns
     * @cells               JQuery                      All cells (<th>, <td> elements) that belong to the row or column. These elements are being animated.
     * @visible             boolean                     true: The row/column will be slided in (shown); false: The row/column will be hidden.
     * @context             Row|Column                  The Instance where the row/column belongs to. This is needed to distinguish between row/column, and it's also needed as a this-context within the complete function     
     * @animationOptions    JQueryAnimationOptions      Additional options for the animation. For more information, take a look at jQuery's `animate` function.
     *                                                  When "animationOptions.complete()" is called,  "this" will be bound to the context (row/column).
     */
    export function tableSlider(cells: JQuery, visible: boolean, context: Row|Column, animationOptions?: JQueryAnimationOptions): void {
        /*
         * Table cells can't be slided correctly -> each cell content needs to be wrapped within a temporary wrapper div which is then animated.
         * When the width decreases during the animation, the cell content might start wrapping, resulting in sudden height changed. 
         * To avoid this, there needs to be a second wrapper div within the animated one. The size of this div needs to be set to the content's width.
         * Moreover, during animation, the cell must not have any padding. The padding is therefore removed from the cell and instead added to the inner wrapper div.
         *      cell -> wrapperDiv -> innerWrapper -> content
         *                  ^ animated    ^ contains cell padding
         * The wrapper divs are created temporarily. If a row and column animation are performed simultaneously, there will be 4 wrapper divs.
         */
        var isRowAnimation: boolean;        //To distinguish the type - making an "instanceof" check all the time is inperformant
        var wrapperClass: string;           //class for the content wrapper divs (row and column animations need different classes)
        var sides: [string, string];        //The two sides which are affected        
        if (context instanceof Row) {
            isRowAnimation = true;
            wrapperClass = "tranim";        //If this class gets changed, also change it in the stop() method!
            sides = ["top", "bottom"];
            context.element.show();         //The row must be visible during the animation, the inner wrapperDivs will be animated
        } else {
            isRowAnimation = false;
            wrapperClass = "tcanim";        //If this class gets changed, also change it in the stop() method!
            sides = ["left", "right"];
        }                     
        
        //Prepare the complete function    
        //    jQuery calls the complete function once per animated element. We are only interested in the last callback.
        var completeCounter: number = 0;
        var userCallback = animationOptions.complete;
        animationOptions.complete =
            function () {
                if (++completeCounter < cells.length) {
                    return;
                }
                if (!visible) {
                    if (isRowAnimation) {
                        (<Row>context).element.hide();  //The row is hidden afterwards
                    } else {
                        cells.hide();                   //The cells are hidden afterwards
                    }
                }
                //Restore the table:
                cells.each(function () {
                    var cell = jQuery(this);
                    var div = cell.children("." + wrapperClass);
                    if (div.length === 0) {             //the outer div might not be the direct child of the cell anymore (will happen if another row/column animation has been started in the meantime)
                        div = cell.children().children().children("." + wrapperClass);
                    }
                    var inner = div.children();
                    //Restore the cell padding:
                    cell.css("padding-" + sides[0], inner.css("padding-" + sides[0]));
                    cell.css("padding-" + sides[1], inner.css("padding-" + sides[1]));
                    //Unwrap the cell contents:                    
                    div.replaceWith(inner.contents());
                });
                if (jQuery.isFunction(userCallback)) {
                    userCallback.call(context);
                }
            };
        
        //Wrap the cells
        var wrapperDivs = cells.wrapInner('<div style="display: ' + (visible ? 'none' : 'block') + ';" class="' + wrapperClass + '" />').children();
        var innerWrapper = wrapperDivs.wrapInner('<div class="animationWrapper" />').children();
        var visibleSize: number = 0;     //The the width/height of the column/row, if it would be visible. It is max(outerWidth) / max(outerHeight).
        var distanceProp = isRowAnimation ? "outerHeight" : "outerWidth";

        innerWrapper.each(function () {
            var inner = jQuery(this);       //this div will get the cell's padding
            var outer = inner.parent();     //this div will be animated
            var cell = outer.parent();     
            cell.show();
            //In order to work properly, the padding has to be removed from the cell. It will instead be added to the inner wrapper div.
            for (var i = 0; i < 2; ++i) {
                inner.css("padding-" + sides[i], cell.css("padding-" + sides[i]));
                cell.css("padding-" + sides[i], 0);
            }
            //It seems that if rows are shown, and a cell's content is smaller than the cell, it's cut in half. The following line would fix this. However it would destroy the layout when showing the column that contains the tallest cell.
            //if (!isRowAnimation) {
            //    inner.height(cell.height() + parseInt(cell.css("border-bottom-width"), 10));   //Don't ask me why that's required. Just leave it where it is and don't touch it.
            //}
            visibleSize = Math.max(visibleSize, outer[distanceProp]());
        });

        //Create the animation properties for jQuery
        var properties: Object = {};
        properties["opacity"] = visible ? "show" : "hide";

        innerWrapper[distanceProp](visibleSize);    //Set the size of the inner wrapper to the cell size - this avoids word wrapping when the width is decreased
        if (visible) {
            wrapperDivs[distanceProp](0);
            properties[isRowAnimation ? "height" : "width"] = visibleSize;
        } else {
            wrapperDivs[distanceProp](visibleSize);
            properties[isRowAnimation ? "height" : "width"] = 0;
        }
        //Note: It is possible to set the speed to the value "pixel per second", which would result in longer animations for bigger cells.
        //      This can be done by setting the duration to "duration = visibleSize / pxPerSec;"
        //      I'm not sure if this would be a good behaviour so I didn't implement it.
        wrapperDivs.animate(properties, animationOptions);
    }

    /*
     * [Internal]
     * Completes a sliding animation of rows/columns immediately. If the row/columns is not animated (or the animation already finished), nothing happens.
     * @cells               JQuery          All cells (<th>, <td> elements) that belong to the row or column. These elements are animated.
     * @context             Row|Column      Is needed to distinguish between row/column.
     */
    export function stopAnimation(cells: JQuery, context: Row|Column): void {
        var wrapperClass: string;           //class for the content wrapper divs (row and column animations need different classes)           
        if (context instanceof Row) {
            wrapperClass = ".tranim";
        } else {
            wrapperClass = ".tcanim";
        }
        var divs = cells.children(wrapperClass);
        if (divs.length === 0) {             //the outer div might not be the direct child of the cell anymore (will happen if another row/column animation has been started in the meantime)
            divs = cells.children().children().children(wrapperClass);
        }
        divs.stop(true, true);
    }      
        
}



//Extends all native objects with a tablify-method
//This functionality has been removed though, see http://stackoverflow.com/a/28305414/2224996
//interface Object{
//    tablify(target?: Tablify.Selector): Tablify.Table;
//}
//Object.defineProperty(Object.prototype, 'tablify', {
//    value: function (target?: Tablify.Selector): Tablify.Table {
//        "use strict";
//        return Tablify.tablify(this, target);
//    },
//    writable:     true,   //The property may be changed with an assignment operator
//    configurable: true,   //The property may be changed or deleted from an object
//    enumerable:   false   //The property should not show up during enumeration ("for-in" loops)
//});
