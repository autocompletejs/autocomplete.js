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
    ParamName:    string;
    Url:          string;

    // Workable elements
    DOMResults: Element;
    Request:    XMLHttpRequest;
    Input:      Element;

    // Workflow methods
    _EmptyMessage: any;
    _Limit:        any;
    _Method:       any;
    _ParamName:    any;
    _Url:          any;
    Blur:          any;
    Focus:         any;
    OnKeyUp:       any;
    Open:          any;
    Position:      any;
    Post:          any;
    Pre:           any;
    Select:        any;
}
 
// Core
class AutoComplete {
    static defaults: Params = {
        EmptyMessage: "No result here",
        Headers: {
            "Content-type": "application/x-www-form-urlencoded"
        },
        Limit: 0,
        Method: "GET",
        ParamName: "q",
        Url: null,

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
        _ParamName: function(): string {
            console.log("ParamName", this);

            if (this.Input.hasAttribute("data-autocomplete-param-name")) {
                return this.Input.getAttribute("data-autocomplete-param-name");
            }

            return this.ParamName;
        },
        _Url: function(): string {
            console.log("Url", this);

            if (this.Input.hasAttribute("data-autocomplete")) {
                return this.Input.getAttribute("data-autocomplete");
            }

            return this.Url;
        },
        Blur: function(now: boolean = false) {
            console.log("Blur", "Close results div", this);
    
            if (now) {
                this.DOMResults.setAttribute("class", "autocomplete");
            } else {
                var params = this;
                setTimeout(function() {
                    params.Blur(true);
                }, 150);
            }
        },
        Focus: function() {
            console.log("Focus", "Open results div", this);
            var oldValue: string = this.Input.getAttribute("data-autocomplete-old-value");
            console.log("Old value setted in input attribute", oldValue);
    
            if (!oldValue || this.Input.value != oldValue) {
                this.DOMResults.setAttribute("class", "autocomplete open");
            }
        },
        OnKeyUp: function(event: Event) {
            console.log("OnKeyUp", this, "Event", event);
    
            var first                    = this.DOMResults.querySelector("li:first-child:not(.locked)"),
                input                    = event.target,
                inputValue               = this.Pre(),
                dataAutocompleteOldValue = input.getAttribute("data-autocomplete-old-value"),
                keyCode                  = event.keyCode,
                currentIndex,
                position,
                lisCount,
                liActive;
    
            if (keyCode == 13 && this.DOMResults.getAttribute("class").indexOf("open") != -1) {
                liActive = this.DOMResults.querySelector("li.active");
                if (liActive !== null) {
                    this.Select(liActive);
                    this.DOMResults.setAttribute("class", "autocomplete");
                }
            }
            
            if (keyCode == 38 || keyCode == 40) {
                liActive = this.DOMResults.querySelector("li.active");
    
                if (liActive) {
                    currentIndex = Array.prototype.indexOf.call(liActive.parentNode.children, liActive);
                    position = currentIndex + (keyCode - 39);
                    lisCount = this.DOMResults.getElementsByTagName("li").length;
    
                    liActive.setAttribute("class", "");
    
                    if (position < 0) {
                        position = lisCount - 1;
                    } else if (position >= lisCount) {
                        position = 0;
                    }
    
                    liActive.parentElement.childNodes.item(position).setAttribute("class", "active");
                } else if (first) {
                    first.setAttribute("class", "active");
                }
            } else if (keyCode != 13 && (keyCode < 35 || keyCode > 40)) {
                if (inputValue && this._Url()) {
                    if (!dataAutocompleteOldValue || inputValue != dataAutocompleteOldValue) {
                        this.DOMResults.setAttribute("class", "autocomplete open");
                    }
    
                    AutoComplete.prototype.ajax(this);
                }
            }
        },
        Open: function() {
            console.log("Open", this);
            var params = this;
            Array.prototype.forEach.call(this.DOMResults.getElementsByTagName("li"), function(li) {
                li.onclick = function(event) {
                    params.Select(event.target);
                };
            });
        },
        Position:function() {
            console.log("Build results position", this);
            this.DOMResults.setAttribute("class", "autocomplete");
            this.DOMResults.setAttribute("style", "top:" + (this.Input.offsetTop + this.Input.offsetHeight) + "px;left:" + this.Input.offsetLeft + "px;width:" + this.Input.clientWidth + "px;");
        },
        Post: function(response) {
            console.log("Post", this);
            try {
                response = JSON.parse(response);
                var createLi = function() {return document.createElement("li");},
                    autoReverse = function(param, limit) {
                        return (limit < 0) ? param.reverse() : param;
                    },
                    addLi = function(ul, li, response) {
                        li.innerHTML = response;
                        ul.appendChild(li);
                        return createLi();
                    },
                    empty,
                    i = 0,
                    length = response.length,
                    li     = createLi(),
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
        Pre: function() {
            console.log("Pre", this);
    
            return this.Input.value;
        },
        Select: function(item) {
            console.log("Select", this);
            this.Input.setAttribute("data-autocomplete-old-value", this.Input.value = item.getAttribute("data-autocomplete-value", item.innerHTML));
        },
    };
    
    // Constructor
    constructor(params: Object = {}, selector: any = ["[data-autocomplete]"]) {
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

            AutoComplete.prototype.create(MergeObject(AutoComplete.defaults, params, {
                "Input": selector,
            }));
        }
    }

    create(params: Params) {
        console.log("Object", params);

        if (params.Input.nodeName.match(/^INPUT$/i) && params.Input.getAttribute("type").match(/^TEXT|SEARCH$/i)) {
            params.Input.setAttribute("autocomplete", "off");
            params.Position(params);
            params.Input.parentNode.appendChild(params.DOMResults);

            params.Input.addEventListener("blur", params.Blur.bind(params));
            params.Input.addEventListener("focus", params.Focus.bind(params));
            params.Input.addEventListener("keyup", params.OnKeyUp.bind(params));
            params.Input.addEventListener("position", params.Position.bind(params));
            params.Input.addEventListener("destroy", AutoComplete.prototype.destroy.bind(null, params));
        } else {
            console.log("Element not valid to build a autocomplete");
        }
    }

    ajax(params: Params) {
        console.log("AJAX", params);
        if (params.Request) {
            params.Request.abort();
        }
        
        var propertyHeaders = Object.getOwnPropertyNames(params.Headers),
            method      = params._Method(),
            url         = params._Url(),
            queryParams = params.ParamName + "=" + params.Pre();

        if (method.match(/^GET$/i)) {
            url += "?" + queryParams;
        }

        params.Request = new XMLHttpRequest();
        params.Request.open(method, url, true);

        for (var i = propertyHeaders.length - 1; i >= 0; i--) {
            params.Request.setRequestHeader(propertyHeaders[i], params.Headers[propertyHeaders[i]]);
        }

        params.Request.onreadystatechange = function () {
            if (params.Request.readyState == 4 && params.Request.status == 200) {
                if (!params.Post(params.Request.response)) {
                    params.Open();
                }
            }
        };

        params.Request.send(queryParams);
    }

    destroy(params: Params) {
        console.log("Destroy event received", params);

        params.Input.removeEventListener("position", params.Position);
        params.Input.removeEventListener("focus", params.Focus);
        params.Input.removeEventListener("blur", params.Blur);
        params.Input.removeEventListener("keyup", params.OnKeyUp);
        params.DOMResults.parentNode.removeChild(params.DOMResults);

        // delete(params);
    }
}

function MergeObject(): any {
    var merge: any = {},
        tmp: any;

    for (var i = 0; i < arguments.length; i++) {
        for (tmp in arguments[i]) {
            merge[tmp] = arguments[i][tmp];
        }
    }

    return merge;
}