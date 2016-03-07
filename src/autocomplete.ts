/*
 * Autocomplete.js v2.0.2
 * Developed by Baptiste Donaux
 * http://autocomplete-js.com
 * 
 * Under MIT Licence
 * (c) 2016, Baptiste Donaux
 */
"use strict";

interface Params {
    // Custom params
    Delay:        number;
    EmptyMessage: string;
    HttpHeaders:  Object;
    HttpMethod:   string;
    Limit:        number;
    QueryArg:     string;
    Url:          string;

    // Keyboard mapping event
    KeyboardMappings: { [_: string]: MappingEvent; };

    // Workable elements
    DOMResults: HTMLElement;
    Request:    XMLHttpRequest;
    Input:      Element;

    // Workflow methods
    _Blur:          any;
    _EmptyMessage:  any;
    _Focus:         any;
    _Limit:         any;
    _HttpMethod:    any;
    _Open:          any;
    _QueryArg:      any;
    _Position:      any;
    _Post:          any;
    _Render:        any;
    _Pre:           any;
    _Select:        any;
    _Url:           any;

    // Internal item
    $AjaxTimer:     number;
    $Listeners:     { [_: string]: any; };
}

interface MappingCondition {
    Not: boolean;
}

interface MappingConditionIs extends MappingCondition {
    Is: number;
}

interface MappingConditionRange extends MappingCondition {
    From: number;
    To: number;
}

enum ConditionOperator { AND, OR };

interface MappingEvent {
    Conditions: MappingCondition[];
    Callback: any;
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
                Callback: function(event: KeyboardEvent) {
                    if (this.DOMResults.getAttribute("class").indexOf("open") != -1) {
                        var liActive = this.DOMResults.querySelector("li.active");
    
                        if (liActive !== null) {
                            this._Select(liActive);
                            this.DOMResults.setAttribute("class", "autocomplete");
                        }

                        // Cancel form send only if results element is open
                        event.preventDefault();
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
                Callback: function(event: KeyboardEvent) {
                    var first = this.DOMResults.querySelector("li:first-child:not(.locked)"),
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
        
                        active.setAttribute("class", "");
                        active.parentElement.childNodes.item(position).setAttribute("class", "active");
                    } else if (first) {
                        first.setAttribute("class", "active");
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
                Callback: function(event: KeyboardEvent) {
                    var oldValue = this.Input.getAttribute("data-autocomplete-old-value"),
                        currentValue = this._Pre();
    
                    if (currentValue !== "") {
                        if (!oldValue || currentValue != oldValue) {
                            this.DOMResults.setAttribute("class", "autocomplete open");
                        }
    
                        AutoComplete.prototype.ajax(this, function() {
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
        _EmptyMessage: function(): string {
            var emptyMessage: string|boolean = "";

            if (this.Input.hasAttribute("data-autocomplete-empty-message")) {
                emptyMessage = this.Input.getAttribute("data-autocomplete-empty-message");
            } else {
                emptyMessage = this.EmptyMessage;
            }

            if (emptyMessage === false) {
                emptyMessage = "";
            }

            return emptyMessage;
        },
        
        /**
         * Returns the maximum number of results 
         */
        _Limit: function(): number {
            var limit = this.Input.getAttribute("data-autocomplete-limit");
            
            if (isNaN(limit)) {
                return this.Limit;
            }

            return parseInt(limit);
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
                this.DOMResults.setAttribute("class", "autocomplete");
            } else {
                var params = this;
                setTimeout(function() {
                    params._Blur(true);
                }, 150);
            }
        },
        
        /**
         * Manage the open 
         */
        _Focus: function(): void {
            var oldValue: string = this.Input.getAttribute("data-autocomplete-old-value");

            if (!oldValue || this.Input.value != oldValue) {
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
                    li.onclick = function(event) {
                        params._Select(li);
                    };
                }
            });
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
            var ul: HTMLElement = document.createElement("ul"),
                li: HTMLElement = document.createElement("li");
            
            if (typeof response == "string") {
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
            } else {
                // Order
                if (this._Limit() < 0) {
                    response = response.reverse();
                }

                for (var item = 0; item < response.length; item++) {
                    li.innerHTML = response[item].Label;
                    li.setAttribute("data-autocomplete-value", response[item].Value);
                    
                    ul.appendChild(li);
                    li = document.createElement("li");
                }
            }
    
            if (this.DOMResults.hasChildNodes()) {
                this.DOMResults.removeChild(this.DOMResults.childNodes[0]);
            }
            
            this.DOMResults.appendChild(ul);
        },
        
        /**
         * Deal with request response
         */
        _Post: function(response: string): ResponseItem[]|string {
            try {
                var returnResponse: ResponseItem[] = [];
                
                //JSON return
                var json: string[]|Object = JSON.parse(response);

                
                if (Object.keys(json).length == 0) {
                    return "";
                }

                if (Array.isArray(json)) {
                    for (var i = 0 ; i < Object.keys(json).length; i++) {
                        returnResponse[returnResponse.length] = { "Value": json[i], "Label": json[i] };
                    }
                } else {
                    for (var value in json) {
                        returnResponse.push({
                            "Value": value,
                            "Label": json[value]
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

        $AjaxTimer: null,
        $Listeners: {},
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
            AutoComplete.prototype.create(AutoComplete.merge(AutoComplete.defaults, params, {
                DOMResults: document.createElement("div"),
            }), selector);
        }
    }

    create(params: Params, element: HTMLElement): void {
        params.Input = element;

        if (params.Input.nodeName.match(/^INPUT$/i)
            && (params.Input.hasAttribute("type") === false || params.Input.getAttribute("type").match(/^TEXT|SEARCH$/i)))
        {
            params.Input.setAttribute("autocomplete", "off");
            params._Position(params);
            params.Input.parentNode.appendChild(params.DOMResults);

            params.$Listeners["focus"]    = params._Focus.bind(params);
            params.$Listeners["keydown"]  = AutoComplete.prototype.event.bind(null, params);
            params.$Listeners["blur"]     = params._Blur.bind(params);
            params.$Listeners["position"] = params._Position.bind(params);
            params.$Listeners["destroy"]  = AutoComplete.prototype.destroy.bind(null, params);

            for (var event in params.$Listeners) {
                params.Input.addEventListener(event, params.$Listeners[event]);
            }
        }
    }

    event(params: Params, event: KeyboardEvent): void {
        for (var name in params.KeyboardMappings) {
            var mapping: MappingEvent = AutoComplete.merge({
                    Operator: ConditionOperator.AND
                }, params.KeyboardMappings[name]),
                match: boolean = ConditionOperator.AND == mapping.Operator;

            mapping.Conditions.forEach(function(condition: {
                From: number,
                Is: number,
                Not: boolean,
                To: number
            }) {
                if ((match === true && mapping.Operator == ConditionOperator.AND) || (match === false && ConditionOperator.OR)) {
                    condition = AutoComplete.merge({
                        Not: false
                    }, condition);

                    // For MappingConditionIs object
                    if (condition.hasOwnProperty("Is")) {
                        if (condition.Is == event.keyCode) {
                            match = !condition.Not;
                        } else {
                            match = condition.Not;
                        }
                    }
                    // For MappingConditionRange object
                    else if (condition.hasOwnProperty("From") && condition.hasOwnProperty("To")) {
                        if (event.keyCode >= condition.From && event.keyCode <= condition.To) {
                            match = !condition.Not;
                        } else {
                            match = condition.Not;
                        }
                    }
                }
            });

            if (match === true) {
                mapping.Callback.bind(params, event)();
            }
        };
    }

    ajax(params: Params, callback: any, timeout: boolean = true): void {
        if (params.$AjaxTimer) {
            window.clearTimeout(params.$AjaxTimer);
        }

        if (timeout === true) {
            params.$AjaxTimer = window.setTimeout(AutoComplete.prototype.ajax.bind(null, params, callback, false), params.Delay);
        } else {
            if (params.Request) {
                params.Request.abort();
            }
            
            var propertyHttpHeaders = Object.getOwnPropertyNames(params.HttpHeaders),
                method      = params._HttpMethod(),
                url         = params._Url(),
                queryParams = params.QueryArg + "=" + params._Pre();

            if (method.match(/^GET$/i)) {
                url += "?" + queryParams;
            }

            params.Request = new XMLHttpRequest();
            params.Request.open(method, url, true);

            for (var i = propertyHttpHeaders.length - 1; i >= 0; i--) {
                params.Request.setRequestHeader(propertyHttpHeaders[i], params.HttpHeaders[propertyHttpHeaders[i]]);
            }

            params.Request.onreadystatechange = callback;

            params.Request.send(queryParams);
        }
    }

    destroy(params: Params): void {
        for (var event in params.$Listeners) {
            params.Input.removeEventListener(event, params.$Listeners[event]);
        }

        params.DOMResults.parentNode.removeChild(params.DOMResults);
    }
}
