/*
 * Autocomplete.js v2.0.0
 * Developed by Baptiste Donaux
 * http://autocomplete-js.com
 * 
 * Under MIT Licence
 * (c) 2015, Baptiste Donaux
 */
"use strict";

interface Params {
    // Custom params
    EmptyMessage: string;
    Headers:      Object;
    Limit:        number;
    Method:       string;
    QueryArg:     string;
    Url:          string;

    // Keyboard mapping event
    KeyboardMappings: { [name: string]: MappingEvent; };

    // Workable elements
    DOMResults: Element;
    Request:    XMLHttpRequest;
    Input:      Element;

    // Workflow methods
    _Blur:          any;
    _EmptyMessage:  any;
    _Focus:         any;
    _Limit:         any;
    _Method:        any;
    _Open:          any;
    _QueryArg:      any;
    _Position:      any;
    _Post:          any;
    _Pre:           any;
    _Select:        any;
    _Url:           any;
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
 
// Core
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
        EmptyMessage: "No result here",
        Headers: {
            "Content-type": "application/x-www-form-urlencoded"
        },
        Limit: 0,
        Method: "GET",
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
                Not: false,
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
                                if (!this._Post(this.Request.response)) {
                                    this._Open();
                                }
                            }
                        }.bind(this));
                    }
                },
                Operator: ConditionOperator.AND
            }
        },

        DOMResults: document.createElement("div"),
        Request: null,
        Input: null,
        
        _EmptyMessage: function(): string {
            console.log("EmptyMessage", this);

            if (this.Input.hasAttribute("data-autocomplete-empty-message")) {
                return this.Input.getAttribute("data-autocomplete-empty-message");
            }

            return this.EmptyMessage;
        },
        _Limit: function(): number {
            console.log("Limit", this);

            var limit = this.Input.getAttribute("data-autocomplete-limit");
            
            if (isNaN(limit)) {
                return this.Limit;
            }

            return parseInt(limit);
        },
        _Method: function(): string {
            console.log("Method", this);

            if (this.Input.hasAttribute("data-autocomplete-method")) {
                return this.Input.getAttribute("data-autocomplete-method");
            }

            return this.Method;
        },
        _QueryArg: function(): string {
            console.log("QueryArg", this);

            if (this.Input.hasAttribute("data-autocomplete-param-name")) {
                return this.Input.getAttribute("data-autocomplete-param-name");
            }

            return this.QueryArg;
        },
        _Url: function(): string {
            console.log("Url", this);

            if (this.Input.hasAttribute("data-autocomplete")) {
                return this.Input.getAttribute("data-autocomplete");
            }

            return this.Url;
        },
        _Blur: function(now: boolean = false): void {
            console.log("Blur", "Close results div", this);
    
            if (now) {
                this.DOMResults.setAttribute("class", "autocomplete");
            } else {
                var params = this;
                setTimeout(function() {
                    params._Blur(true);
                }, 150);
            }
        },
        _Focus: function(): void {
            console.log("Focus", "Open results div", this);
            var oldValue: string = this.Input.getAttribute("data-autocomplete-old-value");
            console.log("Old value setted in input attribute", oldValue);
    
            if (!oldValue || this.Input.value != oldValue) {
                this.DOMResults.setAttribute("class", "autocomplete open");
            }
        },
        _Open: function(): void {
            console.log("Open", this);
            var params = this;
            Array.prototype.forEach.call(this.DOMResults.getElementsByTagName("li"), function(li) {
                li.onclick = function(event) {
                    params._Select(event.target);
                };
            });
        },
        _Position:function(): void {
            console.log("Build results position", this);
            this.DOMResults.setAttribute("class", "autocomplete");
            this.DOMResults.setAttribute("style", "top:" + (this.Input.offsetTop + this.Input.offsetHeight) + "px;left:" + this.Input.offsetLeft + "px;width:" + this.Input.clientWidth + "px;");
        },
        _Post: function(response: string): void {
            console.log("Post", this);
            try {
                response = JSON.parse(response);
                var autoReverse = function(param, limit) {
                        return (limit < 0) ? param.reverse() : param;
                    },
                    addLi = function(ul, li, response) {
                        li.innerHTML = response;
                        ul.appendChild(li);
                        return document.createElement("li");
                    },
                    empty,
                    i = 0,
                    length = response.length,
                    li     = document.createElement("li"),
                    ul     = document.createElement("ul"),
                    limit  = this._Limit(),
                    propertie,
                    properties,
                    value;
    
                if (Array.isArray(response)) {
                    console.log("Response is a JSON Array");
                    if (length) {
                        response = autoReverse(response, limit);
    
                        for (; i < length && (i < Math.abs(limit) || !limit); i++) {
                            li = addLi(ul, li, response[i]);
                        }
                    } else {
                        //If the response is an object or an array and that the response is empty, so this script is here, for the message no response.
                        empty = true;
                        li.setAttribute("class", "locked");
                        li = addLi(ul, li, this._EmptyMessage());
                    }
                } else {
                    console.log("Response is a JSON Object");
                    properties = autoReverse(Object.getOwnPropertyNames(response), limit);
    
                    for (propertie in properties) {
                        value = properties[propertie];
    
                        if (parseInt(propertie) < Math.abs(limit) || !limit) {
                            li.setAttribute("data-autocomplete-value", value);
                            li = addLi(ul, li, response[value]);
                        }
                    }
                }
    
                if (this.DOMResults.hasChildNodes()) {
                    this.DOMResults.childNodes[0].remove();
                }
                
                this.DOMResults.appendChild(ul);
    
                return empty;
            } catch (e) {
                this.DOMResults.innerHTML = response;
            }
        },
        _Pre: function(): string {
            console.log("Pre", this);
    
            return this.Input.value;
        },
        _Select: function(item): void {
            console.log("Select", this);

            this.Input.value = item.getAttribute("data-autocomplete-value", item.innerHTML);
            this.Input.setAttribute("data-autocomplete-old-value", this.Input.value);
        },
    };
    
    // Constructor
    constructor(params: Object = {}, selector: any = "[data-autocomplete]") {
        if (Array.isArray(selector)) {
            selector.forEach(function(s: string) {
                new AutoComplete(params, s);
            });
        } else if (typeof selector == "string") {
            var elements: NodeList = document.querySelectorAll(selector);
            Array.prototype.forEach.call(elements, function(input: Element) {
                new AutoComplete(params, input);
            });
        } else {
            console.log("AutoComplete declaration");

            // Custom params
            console.log("Custom params", params);
            // Default params
            console.log("Default params", AutoComplete.defaults);

            console.log("Selector", selector);

            AutoComplete.prototype.create(AutoComplete.merge(AutoComplete.defaults, params, {
                Input: selector,
            }));
        }
    }

    create(params: Params): void {
        console.log("Object", params);

        if (params.Input.nodeName.match(/^INPUT$/i) && params.Input.getAttribute("type").match(/^TEXT|SEARCH$/i)) {
            params.Input.setAttribute("autocomplete", "off");
            params._Position(params);
            params.Input.parentNode.appendChild(params.DOMResults);

            params.Input.addEventListener("focus", params._Focus.bind(params));
            
            params.Input.addEventListener("keyup", AutoComplete.prototype.event.bind(null, params));

            params.Input.addEventListener("blur", params._Blur.bind(params));
            params.Input.addEventListener("position", params._Position.bind(params));
            params.Input.addEventListener("destroy", AutoComplete.prototype.destroy.bind(null, params));
        } else {
            console.log("Element not valid to build a autocomplete");
        }
    }

    event(params: Params, event: KeyboardEvent): void {
        console.log("Event", params, "KeyboardEvent", event);

        for (name in params.KeyboardMappings) {
            var mapping: MappingEvent = AutoComplete.merge({
                    Operator: ConditionOperator.AND
                }, params.KeyboardMappings[name]),
                match: boolean = ConditionOperator.AND == mapping.Operator;

            mapping.Conditions.forEach(function(condition: MappingCondition) {
                if ((match == true && mapping.Operator == ConditionOperator.AND) || (match == false && ConditionOperator.OR)) {
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

            if (match == true) {
                mapping.Callback.bind(params, event)();
            }
        };
    }

    ajax(params: Params, callback: any): void {
        console.log("AJAX", params);
        if (params.Request) {
            params.Request.abort();
        }
        
        var propertyHeaders = Object.getOwnPropertyNames(params.Headers),
            method      = params._Method(),
            url         = params._Url(),
            queryParams = params.QueryArg + "=" + params._Pre();

        if (method.match(/^GET$/i)) {
            url += "?" + queryParams;
        }

        params.Request = new XMLHttpRequest();
        params.Request.open(method, url, true);

        for (var i = propertyHeaders.length - 1; i >= 0; i--) {
            params.Request.setRequestHeader(propertyHeaders[i], params.Headers[propertyHeaders[i]]);
        }

        params.Request.onreadystatechange = callback;

        params.Request.send(queryParams);
    }

    destroy(params: Params): void {
        console.log("Destroy event received", params);

        params.Input.removeEventListener("position", params._Position);
        params.Input.removeEventListener("focus", params._Focus);
        params.Input.removeEventListener("blur", params._Blur);
        // params.Input.removeEventListener("keyup", AutoComplete.prototype.event);
        params.DOMResults.parentNode.removeChild(params.DOMResults);

        // delete(params);
    }
}

