/**
 * @fileoverview Resize handler module for Allday view.
 * @author NHN Ent. FE Development Team <dl_javascript@nhnent.com>
 */
'use strict';
var util = global.ne.util;
var domutil = require('../../common/domutil');
var common = require('../../common/common');
var AlldayCore = require('./core');
var AlldayResizeGuide = require('./resizeGuide');

var parseViewIDRx = /^schedule-view-allday-monthweek[\s]schedule-view-(\d+)/;

/**
 * @constructor
 * @implements {Handler}
 * @mixes AlldayCore
 * @mixes CustomEvents
 * @param {Drag} [dragHandler] - Drag handler instance.
 * @param {Allday} [alldayView] - MonthWeek view instance.
 * @param {Base} [baseController] - Base controller instance.
 */
function AlldayResize(dragHandler, alldayView, baseController) {
    /**
     * Drag handler instance.
     * @type {Drag}
     */
    this.dragHandler = dragHandler;

    /**
     * allday view instance.
     * @type {Allday}
     */
    this.alldayView = alldayView;

    /**
     * Base controller instance.
     * @type {Base}
     */
    this.baseController = baseController;

    dragHandler.on({
        dragStart: this._onDragStart
    }, this);

    /**
     * @type {AlldayResizeGuide}
     */
    this.guide = new AlldayResizeGuide(this);
}

/**
 * Destroy method
 */
AlldayResize.prototype.destroy = function() {
    this.guide.destroy();
    this.dragHandler.off(this);
    this.dragHandler = this.alldayView = this.baseController =
        this.guide = null;
};

/**
 * Check dragstart target is expected conditions for this handler.
 * @param {HTMLElement} target - dragstart event handler's target element.
 * @returns {boolean|MonthWeek} return MonthWeek view instance when satiate condition.
 */
AlldayResize.prototype.checkExpectedCondition = function(target) {
    var cssClass = domutil.getClass(target),
        matches;

    if (!~cssClass.indexOf('schedule-view-allday-resize-handle')) {
        return false;
    }

    target = domutil.closest(target, '.schedule-view-allday-monthweek');

    if (!target) {
        return false;
    }

    cssClass = domutil.getClass(target);
    matches = cssClass.match(parseViewIDRx);

    if (!matches || matches.length < 2) {
        return false;
    }

    return util.pick(this.alldayView.childs.items, matches[1]);
};

/**
 * DragStart event handler.
 * @emits AlldayResize#allday_resize_dragstart
 * @param {object} dragStartEventData - event data.
 */
AlldayResize.prototype._onDragStart = function(dragStartEventData) {
    var target = dragStartEventData.target,
        result = this.checkExpectedCondition(target),
        controller = this.baseController,
        eventBlockElement,
        modelID,
        targetModel,
        getEventDataFunc,
        eventData;

    if (!result) {
        return;
    }

    eventBlockElement = domutil.closest(target, '.schedule-view-allday-event-block');
    modelID = domutil.getData(eventBlockElement, 'id');
    targetModel = controller.events.items[modelID];

    if (!targetModel) {
        return;
    }

    getEventDataFunc = this.getEventDataFunc = this._retriveEventData(this.alldayView, dragStartEventData.originEvent);
    eventData = getEventDataFunc(dragStartEventData.originEvent);

    util.extend(eventData, {
        eventBlockElement: eventBlockElement,
        model: targetModel
    });

    this.dragHandler.on({
        drag: this._onDrag,
        dragEnd: this._onDragEnd,
        click: this._onClick
    }, this);

    /**
     * @event AlldayResize#allday_resize_dragstart
     * @type {object}
     * @property {number} datesInRange - date count of this view.
     * @property {number} xIndex - index number of mouse positions.
     * @property {Event} model - data object of model isntance.
     * @property {HTMLDivElement} eventBlockElement - target event block element.
     */
    this.fire('allday_resize_dragstart', eventData);
};

/**
 * Drag event handler method.
 * @emits AlldayResize#allday_resize_drag
 * @param {object} dragEventData - Drag#drag event handler eventdata.
 */
AlldayResize.prototype._onDrag = function(dragEventData) {
    var getEventDataFunc = this.getEventDataFunc;

    if (!getEventDataFunc) {
        return;
    }

    /**
     * @event AlldayResize#allday_resize_drag
     * @type {object}
     * @property {number} datesInRange - date count of this view.
     * @property {number} xIndex - index number of mouse positions.
     */
    this.fire('allday_resize_drag', getEventDataFunc(dragEventData.originEvent));
};

/**
 * DragEnd event hander method.
 * @emits AlldayResize#allday_resize_dragend
 * @param {object} dragEndEventData - Drag#DragEnd event handler data.
 * @param {string} [overrideEventName] - override emitted event name when supplied.
 */
AlldayResize.prototype._onDragEnd = function(dragEndEventData, overrideEventName) {
    var getEventDataFunc = this.getEventDataFunc;

    if (!getEventDataFunc) {
        return;
    }

    this.dragHandler.off({
        drag: this._onDrag,
        dragEnd: this._onDragEnd,
        click: this._onClick
    }, this);

    /**
     * @event AlldayResize#allday_resize_dragend
     * @type {object}
     * @property {number} datesInRange - date count of this view.
     * @property {number} xIndex - index number of mouse positions.
     */
    this.fire(overrideEventName || 'allday_resize_dragend', getEventDataFunc(dragEndEventData.originEvent));

    this.getEventDataFunc = null;
};

/**
 * Click event handler method.
 * @emits AlldayResize#allday_resize_click
 * @param {object} clickEventData - Drag#Click event handler data.
 */
AlldayResize.prototype._onClick = function(clickEventData) {
    /**
     * @event AlldayResize#allday_resize_click
     * @type {object}
     * @property {number} datesInRange - date count of this view.
     * @property {number} xIndex - index number of mouse positions.
     */
    this._onDragEnd(clickEventData, 'allday_resize_click');
};

common.mixin(AlldayCore, AlldayResize);
util.CustomEvents.mixin(AlldayResize);

module.exports = AlldayResize;

