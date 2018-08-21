/*
 * @license MIT
 *
 * Autocomplete.js v2.7.1
 * Developed by Baptiste Donaux
 * http://autocomplete-js.com
 *
 * (c) 2017, Baptiste Donaux
 */
 "use strict";

interface Params {
    // Custom params
    Delay:                number;
    EmptyMessage:         string;
    Highlight:            Object;
    HttpHeaders:          Object;
    HttpMethod:           string;
    Limit:                number;
    MinChars:             number;
    QueryArg:             string;
    Url:                  string;

    // Keyboard mapping event
    KeyboardMappings:     { [_: string]: MappingEvent };

    // Workable elements
    DOMResults:           HTMLElement;
    Input:                Element;
    Request:              XMLHttpRequest;

    // Workflow methods
    _Blur:                any;
    _Cache:               any;
    _EmptyMessage:        any;
    _Focus:               any;
    _Highlight:           any;
    _HttpMethod:          any;
    _Limit:               any;
    _MinChars:            any;
    _Open:                any;
    _Close:               any;
    _Position:            any;
    _Post:                any;
    _Pre:                 any;
    _QueryArg:            any;
    _Render:              any;
    _RenderRaw:           any;
    _RenderResponseItems: any;
    _Select:              any;
    _Url:                 any;
    _Error:               any;

    // Internal item
    $AjaxTimer:           number;
    $Cache:               { [_: string]: string; };
    $Listeners:           { [_: string]: any; };
}

interface MappingCondition {
    Not: boolean;

    Is?: number;

    From?: number;
    To?: number;
}

enum ConditionOperator {
    AND,
    OR
}

enum EventType {
    KEYDOWN,
    KEYUP
}

interface MappingEvent {
    Callback: any;
    Conditions: MappingCondition[];
    Event: EventType;
    Operator: ConditionOperator;
}

interface ResponseItem {
    Label: string;
    Value: string;
}

/**
 * Core
 *
 * @class
 * @author Baptiste Donaux <baptiste.donaux@gmail.com> @baptistedonaux
 */
class AutoComplete {
    static merge: any = function(): any {
        var merge: any = {},
            tmp: any;

        for (var i = 0; i < arguments.length; i++) {
            for (tmp in arguments[i]) {
                merge[tmp] = arguments[i][tmp];
            }
        }

        return merge;
    };
    static defaults: Params = {
        Delay: 150,
        EmptyMessage: "No result here",
        Highlight: {
            getRegex: function (value) {
                return new RegExp(value, "ig");
            },
            transform: function(value) {
                return "<strong>" + value + "</strong>";
            }
        },
        HttpHeaders: {
            "Content-type": "application/x-www-form-urlencoded"
        },
        Limit: 0,
        MinChars: 0,
        HttpMethod: "GET",
        QueryArg: "q",
        Url: null,

        KeyboardMappings: {
            "Enter": {
                Conditions: [{
                    Is: 13,
                    Not: false
                }],
                Callback: function(event) {
                    if (this.DOMResults.getAttribute("class").indexOf("open") != -1) {
                        var liActive = this.DOMResults.querySelector("li.active");

                        if (liActive !== null) {
                            event.preventDefault();
                            this._Select(liActive);
                            this.DOMResults.setAttribute("class", "autocomplete");
                        }
                    }
                },
                Operator: ConditionOperator.AND,
                Event: EventType.KEYDOWN
            },
            "KeyUpAndDown_down": {
                Conditions: [{
                    Is: 38,
                    Not: false
                },
                {
                    Is: 40,
                    Not: false
                }],
                Callback: function(event: KeyboardEvent) {
                    event.preventDefault();
                },
                Operator: ConditionOperator.OR,
                Event: EventType.KEYDOWN
            },
            "KeyUpAndDown_up": {
                Conditions: [{
                    Is: 38,
                    Not: false
                },
                {
                    Is: 40,
                    Not: false
                }],
                Callback: function(event: KeyboardEvent) {
                    event.preventDefault();

                    var first = this.DOMResults.querySelector("li:first-child:not(.locked)"),
                        last = this.DOMResults.querySelector("li:last-child:not(.locked)"),
                        active = this.DOMResults.querySelector("li.active");

                    if (active) {
                        var currentIndex = Array.prototype.indexOf.call(active.parentNode.children, active),
                            position = currentIndex + (event.keyCode - 39),
                            lisCount = this.DOMResults.getElementsByTagName("li").length;

                        if (position < 0) {
                            position = lisCount - 1;
                        } else if (position >= lisCount) {
                            position = 0;
                        }

                        active.classList.remove("active");
                        active.parentElement.children.item(position).classList.add("active");
                    } else if (last && event.keyCode == 38) {
                        last.classList.add("active");
                    } else if (first) {
                        first.classList.add("active");
                    }
                },
                Operator: ConditionOperator.OR,
                Event: EventType.KEYUP
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
                Callback: function() {
                    var oldValue = this.Input.getAttribute("data-autocomplete-old-value"),
                        currentValue = this._Pre();

                    if (currentValue !== "" && currentValue.length >= this._MinChars()) {
                        if (!oldValue || currentValue != oldValue) {
                            this.DOMResults.setAttribute("class", "autocomplete open");
                        }

                        AutoComplete.prototype.cache(
                            this,
                            function(response: string) {
                                this._Render(this._Post(response));
                                this._Open();
                            }.bind(this),
                            this._Error
                        );
                    } else {
                      this._Close();
                    }
                },
                Operator: ConditionOperator.AND,
                Event: EventType.KEYUP
            }
        },

        DOMResults: null,
        Request: null,
        Input: null,

        /**
         * Return the message when no result returns
         */
        _EmptyMessage: function(): string {
            var emptyMessage: string = "";

            if (this.Input.hasAttribute("data-autocomplete-empty-message")) {
                emptyMessage = this.Input.getAttribute("data-autocomplete-empty-message");
            } else if (this.EmptyMessage !== false) {
                emptyMessage = this.EmptyMessage;
            } else {
                emptyMessage = "";
            }

            return emptyMessage;
        },

        /**
         * Returns the maximum number of results
         */
        _Limit: function(): number {
            var limit = this.Input.getAttribute("data-autocomplete-limit");

            if (isNaN(limit) || limit === null) {
                return this.Limit;
            }

            return parseInt(limit, 10);
        },

        /**
         * Returns the minimum number of characters entered before firing ajax
         */
        _MinChars: function(): number {
            var minchars = this.Input.getAttribute("data-autocomplete-minchars");

          if (isNaN(minchars) || minchars === null) {
                return this.MinChars;
            }

            return parseInt(minchars, 10);
        },

        /**
         * Apply transformation on labels response
         */
        _Highlight: function(label): string {
            return label.replace(
                this.Highlight.getRegex(this._Pre()),
                this.Highlight.transform
            );
        },

        /**
         * Returns the HHTP method to use
         */
        _HttpMethod: function(): string {
            if (this.Input.hasAttribute("data-autocomplete-method")) {
                return this.Input.getAttribute("data-autocomplete-method");
            }

            return this.HttpMethod;
        },

        /**
         * Returns the query param to use
         */
        _QueryArg: function(): string {
            if (this.Input.hasAttribute("data-autocomplete-param-name")) {
                return this.Input.getAttribute("data-autocomplete-param-name");
            }

            return this.QueryArg;
        },

        /**
         * Returns the URL to use for AJAX request
         */
        _Url: function(): string {
            if (this.Input.hasAttribute("data-autocomplete")) {
                return this.Input.getAttribute("data-autocomplete");
            }

            return this.Url;
        },

        /**
         * Manage the close
         */
        _Blur: function(now: boolean = false): void {
            if (now) {
              this._Close();
            } else {
                var params = this;
                setTimeout(function() {
                    params._Blur(true);
                }, 150);
            }
        },

        /**
         * Manage the cache
         */
        _Cache: function(value: string): string|undefined {
            return this.$Cache[value];
        },

        /**
         * Manage the open
         */
        _Focus: function(): void {
            var oldValue: string = this.Input.getAttribute("data-autocomplete-old-value");

            if ((!oldValue || this.Input.value != oldValue) && this._MinChars() <= this.Input.value.length){
                this.DOMResults.setAttribute("class", "autocomplete open");
            }
        },

        /**
         * Bind all results item if one result is opened
         */
        _Open: function(): void {
            var params = this;
            Array.prototype.forEach.call(this.DOMResults.getElementsByTagName("li"), function(li) {
                if (li.getAttribute("class") != "locked") {
                    li.onclick = function() {
                        params._Select(li);
                    };
                }
            });
        },

        _Close: function(): void {
          this.DOMResults.setAttribute("class", "autocomplete");
        },

        /**
         * Position the results HTML element
         */
        _Position:function(): void {
            this.DOMResults.setAttribute("class", "autocomplete");
            this.DOMResults.setAttribute("style", "top:" + (this.Input.offsetTop + this.Input.offsetHeight) + "px;left:" + this.Input.offsetLeft + "px;width:" + this.Input.clientWidth + "px;");
        },

        /**
         * Execute the render of results DOM element
         */
        _Render: function(response: ResponseItem[]|string): void {
            var ul: HTMLElement;

            if (typeof response == "string") {
                ul = this._RenderRaw(response);
            } else {
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
        _RenderResponseItems: function(response: ResponseItem[]): HTMLElement {
            var ul: HTMLElement = document.createElement("ul"),
                li: HTMLElement = document.createElement("li"),
                limit = this._Limit();

            // Order
            if (limit < 0) {
                response = response.reverse();
            } else if (limit === 0) {
                limit = response.length;
            }

            for (var item = 0; item < Math.min(Math.abs(limit), response.length); item++) {
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
        _RenderRaw: function(response: string): HTMLElement {
            var ul: HTMLElement = document.createElement("ul"),
                li: HTMLElement = document.createElement("li");

            if (response.length > 0) {
                this.DOMResults.innerHTML = response;
            } else {
                var emptyMessage: string = this._EmptyMessage();
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
        _Post: function(response: string): ResponseItem[]|string {
            try {
                var returnResponse: ResponseItem[] = [];

                //JSON return
                var json: string[]|Object = JSON.parse(response);


                if (Object.keys(json).length === 0) {
                    return "";
                }

                if (Array.isArray(json)) {
                    for (var i = 0 ; i < Object.keys(json).length; i++) {
                        returnResponse[returnResponse.length] = { "Value": json[i], "Label": this._Highlight(json[i]) };
                    }
                } else {
                    for (var value in json) {
                        returnResponse.push({
                            "Value": value,
                            "Label": this._Highlight(json[value])
                        });
                    }
                }

                return returnResponse;
            } catch (event) {
                //HTML return
                return response;
            }
        },

        /**
         * Return the autocomplete value to send (before request)
         */
        _Pre: function(): string {
            return this.Input.value;
        },

        /**
         * Choice one result item
         */
        _Select: function(item: HTMLElement): void {
            if (item.hasAttribute("data-autocomplete-value")) {
                this.Input.value = item.getAttribute("data-autocomplete-value");
            } else {
                this.Input.value = item.innerHTML;
            }
            this.Input.setAttribute("data-autocomplete-old-value", this.Input.value);
        },
        /**
         * Handle HTTP error on the request
         */
        _Error: function(): void {
        },

        $AjaxTimer: null,
        $Cache: {},
        $Listeners: {}
    };

    // Constructor
    constructor(params: Object = {}, selector: any = "[data-autocomplete]") {
        if (Array.isArray(selector)) {
            selector.forEach(function(s: string) {
                new AutoComplete(params, s);
            });
        } else if (typeof selector == "string") {
            var elements: NodeList = document.querySelectorAll(selector);
            Array.prototype.forEach.call(elements, function(input: HTMLElement) {
                new AutoComplete(params, input);
            });
        } else {
            var specificParams = AutoComplete.merge(AutoComplete.defaults, params, {
                DOMResults: document.createElement("div"),
            });

            AutoComplete.prototype.create(specificParams, selector);

            return specificParams;
        }
    }

    create(params: Params, element: HTMLElement): void {
        params.Input = element;

        if (params.Input.nodeName.match(/^INPUT$/i) && (params.Input.hasAttribute("type") === false || params.Input.getAttribute("type").match(/^TEXT|SEARCH$/i)))
        {
            params.Input.setAttribute("autocomplete", "off");
            params._Position(params);
            params.Input.parentNode.appendChild(params.DOMResults);

            params.$Listeners = {
                blur:     params._Blur.bind(params),
                destroy:  AutoComplete.prototype.destroy.bind(null, params),
                focus:    params._Focus.bind(params),
                keyup:    AutoComplete.prototype.event.bind(null, params, EventType.KEYUP),
                keydown:  AutoComplete.prototype.event.bind(null, params, EventType.KEYDOWN),
                position: params._Position.bind(params)
            };

            for (var event in params.$Listeners) {
                params.Input.addEventListener(event, params.$Listeners[event]);
            }
        }
    }

    getEventsByType(params: Params, type: EventType) : Object {
        var mappings = {};

        for (var key in params.KeyboardMappings) {
            var event: EventType = EventType.KEYUP;

            if (params.KeyboardMappings[key].Event !== undefined) {
                event = params.KeyboardMappings[key].Event
            }

            if (event == type) {
                mappings[key] = params.KeyboardMappings[key];
            }
        }

        return mappings;
    }

    event(params: Params, type: EventType, event: KeyboardEvent): void {
        var eventIdentifier = function(condition: {From: number, Is: number, Not: boolean, To: number}) {
            if ((match === true && mapping.Operator == ConditionOperator.AND) || (match === false && mapping.Operator == ConditionOperator.OR)) {
                condition = AutoComplete.merge({
                    Not: false
                }, condition);

                if (condition.hasOwnProperty("Is")) {
                    if (condition.Is == event.keyCode) {
                        match = !condition.Not;
                    } else {
                        match = condition.Not;
                    }
                } else if (condition.hasOwnProperty("From") && condition.hasOwnProperty("To")) {
                    if (event.keyCode >= condition.From && event.keyCode <= condition.To) {
                        match = !condition.Not;
                    } else {
                        match = condition.Not;
                    }
                }
            }
        };

        for (var name in AutoComplete.prototype.getEventsByType(params, type)) {
            var mapping: MappingEvent = AutoComplete.merge({
                    Operator: ConditionOperator.AND
                }, params.KeyboardMappings[name]),
                match: boolean = ConditionOperator.AND == mapping.Operator;

            mapping.Conditions.forEach(eventIdentifier);

            if (match === true) {
                mapping.Callback.call(params, event);
            }
        }
    }

    makeRequest(params: Params, callback: any, callbackErr: any): XMLHttpRequest {
        var propertyHttpHeaders: string[] = Object.getOwnPropertyNames(params.HttpHeaders),
            request: XMLHttpRequest = new XMLHttpRequest(),
            method: string = params._HttpMethod(),
            url: string = params._Url(),
            queryParams: string = params._Pre(),
            queryParamsStringify: string = encodeURIComponent(params._QueryArg()) + "=" + encodeURIComponent(queryParams);

        if (method.match(/^GET$/i)) {
            if (url.indexOf("?") !== -1) {
                url += "&" + queryParamsStringify;
            } else {
                url += "?" + queryParamsStringify;
            }
        }

        request.open(method, url, true);

        for (var i = propertyHttpHeaders.length - 1; i >= 0; i--) {
            request.setRequestHeader(propertyHttpHeaders[i], params.HttpHeaders[propertyHttpHeaders[i]]);
        }

        request.onreadystatechange = function() {
            if (request.readyState == 4 && request.status == 200) {
                params.$Cache[queryParams] = request.response;
                callback(request.response);
            }
            else if (request.status >= 400) {
                callbackErr();
            }
        };

        return request;
    }

    ajax(params: Params, request: XMLHttpRequest, timeout: boolean = true): void {
        if (params.$AjaxTimer) {
            window.clearTimeout(params.$AjaxTimer);
        }

        if (timeout === true) {
            params.$AjaxTimer = window.setTimeout(AutoComplete.prototype.ajax.bind(null, params, request, false), params.Delay);
        } else {
            if (params.Request) {
                params.Request.abort();
            }

            params.Request = request;
            params.Request.send(params._QueryArg() + "=" + params._Pre());
        }
    }

    cache(params: Params, callback: any, callbackErr: any): void {
        var response: string|undefined = params._Cache(params._Pre());

        if (response === undefined) {
            var request: XMLHttpRequest = AutoComplete.prototype.makeRequest(params, callback, callbackErr);

            AutoComplete.prototype.ajax(params, request);
        } else {
            callback(response);
        }
    }

    destroy(params: Params): void {
        for (var event in params.$Listeners) {
            params.Input.removeEventListener(event, params.$Listeners[event]);
        }

        params.DOMResults.parentNode.removeChild(params.DOMResults);
    }
}

declare var module: any;
module.exports = AutoComplete;
