(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.AutoComplete = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/*
 * @license MIT
 *
 * Autocomplete.js v2.1.4
 * Developed by Baptiste Donaux
 * https://autocomplete-js.com
 *
 * (c) 2016, Baptiste Donaux
 */
"use strict";
var ConditionOperator;
(function (ConditionOperator) {
    ConditionOperator[ConditionOperator["AND"] = 0] = "AND";
    ConditionOperator[ConditionOperator["OR"] = 1] = "OR";
})(ConditionOperator || (ConditionOperator = {}));
/**
 * Core
 *
 * @class
 * @author Baptiste Donaux <baptiste.donaux@gmail.com> @baptistedonaux
 */
var AutoComplete = (function () {
    // Constructor
    function AutoComplete(params, selector) {
        if (params === void 0) { params = {}; }
        if (selector === void 0) { selector = "[data-autocomplete]"; }
        if (Array.isArray(selector)) {
            selector.forEach(function (s) {
                new AutoComplete(params, s);
            });
        }
        else if (typeof selector == "string") {
            var elements = document.querySelectorAll(selector);
            Array.prototype.forEach.call(elements, function (input) {
                new AutoComplete(params, input);
            });
        }
        else {
            AutoComplete.prototype.create(AutoComplete.merge(AutoComplete.defaults, params, {
                DOMResults: document.createElement("div")
            }), selector);
        }
    }
    AutoComplete.prototype.create = function (params, element) {
        params.Input = element;
        if (params.Input.nodeName.match(/^INPUT$/i) && (params.Input.hasAttribute("type") === false || params.Input.getAttribute("type").match(/^TEXT|SEARCH$/i))) {
            params.Input.setAttribute("autocomplete", "off");
            params._Position(params);
            params.Input.parentNode.appendChild(params.DOMResults);
            params.$Listeners = {
                blur: params._Blur.bind(params),
                destroy: AutoComplete.prototype.destroy.bind(null, params),
                focus: params._Focus.bind(params),
                keyup: AutoComplete.prototype.event.bind(null, params),
                keydown: function (event) {
                    if (event.keyCode == 38 || event.keyCode == 40) {
                        event.preventDefault();
                    }
                },
                position: params._Position.bind(params)
            };
            for (var event in params.$Listeners) {
                params.Input.addEventListener(event, params.$Listeners[event]);
            }
        }
    };
    AutoComplete.prototype.event = function (params, event) {
        var eventIdentifier = function (condition) {
            if ((match === true && mapping.Operator == ConditionOperator.AND) || (match === false && mapping.Operator == ConditionOperator.OR)) {
                condition = AutoComplete.merge({
                    Not: false
                }, condition);
                if (condition.hasOwnProperty("Is")) {
                    if (condition.Is == event.keyCode) {
                        match = !condition.Not;
                    }
                    else {
                        match = condition.Not;
                    }
                }
                else if (condition.hasOwnProperty("From") && condition.hasOwnProperty("To")) {
                    if (event.keyCode >= condition.From && event.keyCode <= condition.To) {
                        match = !condition.Not;
                    }
                    else {
                        match = condition.Not;
                    }
                }
            }
        };
        for (var name in params.KeyboardMappings) {
            var mapping = AutoComplete.merge({
                Operator: ConditionOperator.AND
            }, params.KeyboardMappings[name]), match = ConditionOperator.AND == mapping.Operator;
            mapping.Conditions.forEach(eventIdentifier);
            if (match === true) {
                mapping.Callback.bind(params, event)();
            }
        }
    };
    AutoComplete.prototype.ajax = function (params, callback, timeout) {
        if (timeout === void 0) { timeout = true; }
        if (params.$AjaxTimer) {
            window.clearTimeout(params.$AjaxTimer);
        }
        if (timeout === true) {
            params.$AjaxTimer = window.setTimeout(AutoComplete.prototype.ajax.bind(null, params, callback, false), params.Delay);
        }
        else {
            if (params.Request) {
                params.Request.abort();
            }
            var propertyHttpHeaders = Object.getOwnPropertyNames(params.HttpHeaders), method = params._HttpMethod(), url = params._Url(), queryParams = params._QueryArg() + "=" + params._Pre();
            if (method.match(/^GET$/i)) {
                if (url.indexOf("?") !== -1) {
                    url += "&" + queryParams;
                }
                else {
                    url += "?" + queryParams;
                }
            }
            params.Request = new XMLHttpRequest();
            params.Request.open(method, url, true);
            for (var i = propertyHttpHeaders.length - 1; i >= 0; i--) {
                params.Request.setRequestHeader(propertyHttpHeaders[i], params.HttpHeaders[propertyHttpHeaders[i]]);
            }
            params.Request.onreadystatechange = callback;
            params.Request.send(queryParams);
        }
    };
    AutoComplete.prototype.destroy = function (params) {
        for (var event in params.$Listeners) {
            params.Input.removeEventListener(event, params.$Listeners[event]);
        }
        params.DOMResults.parentNode.removeChild(params.DOMResults);
    };
    AutoComplete.merge = function () {
        var merge = {}, tmp;
        for (var i = 0; i < arguments.length; i++) {
            for (tmp in arguments[i]) {
                merge[tmp] = arguments[i][tmp];
            }
        }
        return merge;
    };
    AutoComplete.defaults = {
        Delay: 150,
        EmptyMessage: "No result here",
        Highlight: {
            getRegex: function (value) {
                return new RegExp(value, "ig");
            },
            transform: function (value) {
                return "<strong>" + value + "</strong>";
            }
        },
        HttpHeaders: {
            "Content-type": "application/x-www-form-urlencoded"
        },
        Limit: 0,
        HttpMethod: "GET",
        QueryArg: "q",
        Url: null,
        KeyboardMappings: {
            "Enter": {
                Conditions: [{
                        Is: 13,
                        Not: false
                    }],
                Callback: function () {
                    if (this.DOMResults.getAttribute("class").indexOf("open") != -1) {
                        var liActive = this.DOMResults.querySelector("li.active");
                        if (liActive !== null) {
                            this._Select(liActive);
                            this.DOMResults.setAttribute("class", "autocomplete");
                        }
                    }
                },
                Operator: ConditionOperator.AND
            },
            "KeyUpAndDown": {
                Conditions: [{
                        Is: 38,
                        Not: false
                    },
                    {
                        Is: 40,
                        Not: false
                    }],
                Callback: function (event) {
                    event.preventDefault();
                    var first = this.DOMResults.querySelector("li:first-child:not(.locked)"), last = this.DOMResults.querySelector("li:last-child:not(.locked)"), active = this.DOMResults.querySelector("li.active");
                    if (active) {
                        var currentIndex = Array.prototype.indexOf.call(active.parentNode.children, active), position = currentIndex + (event.keyCode - 39), lisCount = this.DOMResults.getElementsByTagName("li").length;
                        if (position < 0) {
                            position = lisCount - 1;
                        }
                        else if (position >= lisCount) {
                            position = 0;
                        }
                        active.classList.remove("active");
                        active.parentElement.children.item(position).classList.add("active");
                    }
                    else if (last && event.keyCode == 38) {
                        last.classList.add("active");
                    }
                    else if (first) {
                        first.classList.add("active");
                    }
                },
                Operator: ConditionOperator.OR
            },
            "AlphaNum": {
                Conditions: [{
                        Is: 13,
                        Not: true
                    }, {
                        From: 35,
                        To: 40,
                        Not: true
                    }],
                Callback: function () {
                    var oldValue = this.Input.getAttribute("data-autocomplete-old-value"), currentValue = this._Pre();
                    if (currentValue !== "") {
                        if (!oldValue || currentValue != oldValue) {
                            this.DOMResults.setAttribute("class", "autocomplete open");
                        }
                        AutoComplete.prototype.ajax(this, function () {
                            if (this.Request.readyState == 4 && this.Request.status == 200) {
                                this._Render(this._Post(this.Request.response));
                                this._Open();
                            }
                        }.bind(this));
                    }
                },
                Operator: ConditionOperator.AND
            }
        },
        DOMResults: null,
        Request: null,
        Input: null,
        /**
         * Return the message when no result returns
         */
        _EmptyMessage: function () {
            var emptyMessage = "";
            if (this.Input.hasAttribute("data-autocomplete-empty-message")) {
                emptyMessage = this.Input.getAttribute("data-autocomplete-empty-message");
            }
            else if (this.EmptyMessage !== false) {
                emptyMessage = this.EmptyMessage;
            }
            else {
                emptyMessage = "";
            }
            return emptyMessage;
        },
        /**
         * Returns the maximum number of results
         */
        _Limit: function () {
            var limit = this.Input.getAttribute("data-autocomplete-limit");
            if (isNaN(limit) || limit === null) {
                return this.Limit;
            }
            return parseInt(limit);
        },
        /**
         * Apply transformation on labels response
         */
        _Highlight: function (label) {
            return label.replace(this.Highlight.getRegex(this._Pre()), this.Highlight.transform);
        },
        /**
         * Returns the HHTP method to use
         */
        _HttpMethod: function () {
            if (this.Input.hasAttribute("data-autocomplete-method")) {
                return this.Input.getAttribute("data-autocomplete-method");
            }
            return this.HttpMethod;
        },
        /**
         * Returns the query param to use
         */
        _QueryArg: function () {
            if (this.Input.hasAttribute("data-autocomplete-param-name")) {
                return this.Input.getAttribute("data-autocomplete-param-name");
            }
            return this.QueryArg;
        },
        /**
         * Returns the URL to use for AJAX request
         */
        _Url: function () {
            if (this.Input.hasAttribute("data-autocomplete")) {
                return this.Input.getAttribute("data-autocomplete");
            }
            return this.Url;
        },
        /**
         * Manage the close
         */
        _Blur: function (now) {
            if (now === void 0) { now = false; }
            if (now) {
                this.DOMResults.setAttribute("class", "autocomplete");
            }
            else {
                var params = this;
                setTimeout(function () {
                    params._Blur(true);
                }, 150);
            }
        },
        /**
         * Manage the open
         */
        _Focus: function () {
            var oldValue = this.Input.getAttribute("data-autocomplete-old-value");
            if (!oldValue || this.Input.value != oldValue) {
                this.DOMResults.setAttribute("class", "autocomplete open");
            }
        },
        /**
         * Bind all results item if one result is opened
         */
        _Open: function () {
            var params = this;
            Array.prototype.forEach.call(this.DOMResults.getElementsByTagName("li"), function (li) {
                if (li.getAttribute("class") != "locked") {
                    li.onclick = function () {
                        params._Select(li);
                    };
                }
            });
        },
        /**
         * Position the results HTML element
         */
        _Position: function () {
            this.DOMResults.setAttribute("class", "autocomplete");
            this.DOMResults.setAttribute("style", "top:" + (this.Input.offsetTop + this.Input.offsetHeight) + "px;left:" + this.Input.offsetLeft + "px;width:" + this.Input.clientWidth + "px;");
        },
        /**
         * Execute the render of results DOM element
         */
        _Render: function (response) {
            var ul;
            if (typeof response == "string") {
                ul = this._RenderRaw(response);
            }
            else {
                ul = this._RenderResponseItems(response);
            }
            if (this.DOMResults.hasChildNodes()) {
                this.DOMResults.removeChild(this.DOMResults.childNodes[0]);
            }
            this.DOMResults.appendChild(ul);
        },
        /**
         * ResponseItems[] rendering
         */
        _RenderResponseItems: function (response) {
            var ul = document.createElement("ul"), li = document.createElement("li"), limit = this._Limit();
            // Order
            if (limit < 0) {
                response = response.reverse();
            }
            for (var item = 0; item < Math.min(limit, response.length); item++) {
                li.innerHTML = response[item].Label;
                li.setAttribute("data-autocomplete-value", response[item].Value);
                ul.appendChild(li);
                li = document.createElement("li");
            }
            return ul;
        },
        /**
         * string response rendering (RAW HTML)
         */
        _RenderRaw: function (response) {
            var ul = document.createElement("ul"), li = document.createElement("li");
            if (response.length > 0) {
                this.DOMResults.innerHTML = response;
            }
            else {
                var emptyMessage = this._EmptyMessage();
                if (emptyMessage !== "") {
                    li.innerHTML = emptyMessage;
                    li.setAttribute("class", "locked");
                    ul.appendChild(li);
                }
            }
            return ul;
        },
        /**
         * Deal with request response
         */
        _Post: function (response) {
            try {
                var returnResponse = [];
                //JSON return
                var json = JSON.parse(response);
                if (Object.keys(json).length === 0) {
                    return "";
                }
                if (Array.isArray(json)) {
                    for (var i = 0; i < Object.keys(json).length; i++) {
                        returnResponse[returnResponse.length] = { "Value": json[i], "Label": this._Highlight(json[i]) };
                    }
                }
                else {
                    for (var value in json) {
                        returnResponse.push({
                            "Value": value,
                            "Label": this._Highlight(json[value])
                        });
                    }
                }
                return returnResponse;
            }
            catch (event) {
                //HTML return
                return response;
            }
        },
        /**
         * Return the autocomplete value to send (before request)
         */
        _Pre: function () {
            return this.Input.value;
        },
        /**
         * Choice one result item
         */
        _Select: function (item) {
            if (item.hasAttribute("data-autocomplete-value")) {
                this.Input.value = item.getAttribute("data-autocomplete-value");
            }
            else {
                this.Input.value = item.innerHTML;
            }
            this.Input.setAttribute("data-autocomplete-old-value", this.Input.value);
        },
        $AjaxTimer: null,
        $Listeners: {}
    };
    return AutoComplete;
}());
module.exports = AutoComplete;

},{}]},{},[1])(1)
});