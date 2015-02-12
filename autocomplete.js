/*
 * Autocomplete.js v1.5.0
 * Developed by Baptiste Donaux
 * http://autocomplete-js.com
 * 
 * Under MIT Licence
 * (c) 2015, Baptiste Donaux
 */
"use strict";
var AutoComplete = function(params) {
    //Construct
    if (this) {
        this._args = params;
        this._custArgs = [];
        this.Init();

        for (var i = this._args.selector.length - 1; i >= 0; i--) {
            this.BindCollection(this._args.selector[i]);
        }
    } else {
        new AutoComplete(params);
    }
};

AutoComplete.prototype = {
    Ajax: function(request, custParams, queryParams, input, result) {
        if (request) {
            request.abort();
        }
        
        var method = custParams.method,
            url = custParams.url;

        if (method.match(/^GET$/i)) {
            url += "?" + queryParams;
        }

        request = new XMLHttpRequest();
        request.open(method, url, true);
        request.setRequestHeader("Content-type", "application/x-www-form-urlencoded");

        request.onreadystatechange = function () {
            if (request.readyState == 4 && request.status == 200) {
                if (custParams.post(result, request.response, custParams) !== true) {
                    custParams.open(input, result);
                }
            }
        };

        request.send(queryParams);

        return request;
    },
    BindCollection: function(selector) {
        var input,
            inputs = document.querySelectorAll(selector);

        for (var i = inputs.length - 1; i >= 0; i--) {
            input = inputs[i];

            if (input.nodeName.match(/^INPUT$/i) && (input.type.match(/^TEXT$/i) || input.type.match(/^SEARCH$/i))) {
                this.BindOne(input);
            }
        }
    },
    BindOne: function(input) {
        if (input) {
            var dataAutocompleteOldValueLabel = "data-autocomplete-old-value",
                self = this,
                result = domCreate("div"),
                request;
            
            attr(input, {"autocomplete": "off"});
            
            self.Position(input, result);

            input.addEventListener("autocomplete:position", function() {
                self.Position(input, result);
            });

            input.parentNode.appendChild(result);
            
            input.addEventListener("focus", function(event) {
                var dataAutocompleteOldValue = attr(input, dataAutocompleteOldValueLabel);
                if (!dataAutocompleteOldValue || input.value != dataAutocompleteOldValue) {
                    attr(result, {"class": "autocomplete open"});
                }
            });

            input.addEventListener("blur", function() {
                self.Close(result);
            });

            var keyEvent = function(e) {
                var keyCode = e.keyCode;
                if (keyCode == 38 || keyCode == 40) {
                    var liActive = result.querySelector("li.active");
                    if (liActive == null) {
                        var first = result.querySelector("li:first-child:not(.locked)");
                        if (first != null) {
                            attr(first, {"class": "active"});
                        }
                    } else {
                        var currentIndex = Array.prototype.indexOf.call(liActive.parentNode.children, liActive);
                        attr(liActive, {"class": ""});

                        var position = currentIndex + (keyCode - 39);
                        if (position < 0) {
                            position = result.getElementsByTagName("li").length - 1;
                        }

                        attr(liActive.parentElement.childNodes.item(position), {"class": "active"});
                    }
                } else if (keyCode < 35 || keyCode > 40) {
                    var input = e.currentTarget,
                        custParams = self.CustParams(input),
                        inputValue = custParams.pre(input);

                    if (inputValue && custParams.url) {
                        var dataAutocompleteOldValue = attr(input, dataAutocompleteOldValueLabel);
                        if (!dataAutocompleteOldValue || inputValue != dataAutocompleteOldValue) {
                            attr(result, {"class": "autocomplete open"});
                        }

                        request = self.Ajax(request, custParams, custParams.paramName + "=" + inputValue, input, result);
                    }
                }
            };

            input.addEventListener("keyup", keyEvent);
        }
    },
    Close: function(result, closeNow) {
        var self = this;
        if (closeNow) {
            attr(result, {"class": "autocomplete"});
        } else {
            setTimeout(function() {self.Close(result, true);}, 150);
        }
    },
    CreateCustParams: function(input) {
        var params = {
            limit:     "data-autocomplete-limit",
            method:    "data-autocomplete-method",
            noResult:  "data-autocomplete-no-result",
            paramName: "data-autocomplete-param-name",
            url:       "data-autocomplete"
        },
        self = this;

        var paramsAttribute = Object.getOwnPropertyNames(params);
        for (var i = paramsAttribute.length - 1; i >= 0; i--) {
            params[paramsAttribute[i]] = attr(input, params[paramsAttribute[i]]);
        }

        for (var option in params) {
            if (params.hasOwnProperty(option) && !params[option]) {
                delete params[option];
            }
        }

        if (params.method && !params.method.match(/^GET|POST$/i)) {
            delete params.method;
        }

        if (params.limit) {
            if (isNaN(params.limit)) {
                delete params.limit;
            } else {
                params.limit = parseInt(params.limit);
            }
        }

        return merge(self._args, params);
    },
    CustParams: function(input) {
        var dataAutocompleteIdLabel = "data-autocomplete-id",
            self = this;

        if (!input.hasAttribute(dataAutocompleteIdLabel)) {
            input.setAttribute(dataAutocompleteIdLabel, self._custArgs.length);

            self._custArgs.push(self.CreateCustParams(input));
        }

        return self._custArgs[attr(input, dataAutocompleteIdLabel)];
    },
    Init: function() {
        var self = this,
            defaultParams = {
                limit:     0,
                method:    "GET",
                noResult:  "No result",
                paramName: "q",
                open: function(input, result) {
                    var lambda = function(li) {
                        li.addEventListener("click", function(e) {
                            var li = e.currentTarget,
                                dataAutocompleteValueLabel = "data-autocomplete-value";

                            input.value = li.hasAttribute(dataAutocompleteValueLabel) ? attr(li, dataAutocompleteValueLabel) : li.innerHTML;

                            attr(input, {"data-autocomplete-old-value": input.value});
                        });
                    };

                    var liS = result.getElementsByTagName("li");
                    for (var i = liS.length - 1; i >= 0; i--) {
                        lambda(liS[i]);
                    }
                },
                post: function(result, response, custParams) {
                    try {
                        response = JSON.parse(response);
                        var empty,
                            length = response.length,
                            li = domCreate("li"),
                            ul = domCreate("ul");
                            
                        if (Array.isArray(response)) {
                            if (length) {
                                if (custParams.limit < 0) {
                                    response.reverse();
                                }

                                for (var i = 0; i < length && (i < Math.abs(custParams.limit) || !custParams.limit); i++) {
                                    li.innerHTML = response[i];
                                    ul.appendChild(li);
                                    li = domCreate("li");
                                }
                            } else {
                                //If the response is an object or an array and that the response is empty, so this script is here, for the message no response.
                                empty = true;
                                attr(li, {"class": "locked"});
                                li.innerHTML = custParams.noResult;
                                ul.appendChild(li);
                            }
                        } else {
                            var properties = Object.getOwnPropertyNames(response);

                            if (custParams.limit < 0) {
                                properties.reverse();
                            }

                            for (var propertie in properties) {
                                if (parseInt(propertie) < Math.abs(custParams.limit) || !custParams.limit) {
                                    li.innerHTML = response[properties[propertie]];
                                    attr(li, {"data-autocomplete-value": properties[propertie]});
                                    ul.appendChild(li);
                                    li = domCreate("li");
                                }
                            }
                        }

                        if (result.hasChildNodes()) {
                            result.childNodes[0].remove();
                        }
                        
                        result.appendChild(ul);

                        return empty;
                    } catch (e) {
                        result.innerHTML = response;
                    }
                },
                pre: function(input) {
                    return input.value;
                },
                selector:  ["input[data-autocomplete]"]
            };

        if (self._args === undefined) {
            self._args = {};
        }

        self._args = merge(defaultParams, self._args);

        if (!self._args.method.match(/^GET|POST$/i)) {
            self._args.method = defaultParams.method;
        }

        if (!Array.isArray(self._args.selector)) {
            self._args.selector = defaultParams.selector;
        }
    },
    Position: function(input, result) {
        attr(result, {
            "class": "autocomplete",
            "style": "top:" + (input.offsetTop + input.offsetHeight) + "px;left:" + input.offsetLeft + "px;width:" + input.clientWidth + "px;"
        });
    }
};

//Method deported
function attr(item, attrs) {
    if (item != null) {
        if (typeof attrs == "string") {
            return item.getAttribute(attrs);
        }

        for (var key in attrs) {
            item.setAttribute(key, attrs[key]);
        }
    }
}

function domCreate(item) {
    return document.createElement(item);
}

function merge(obj1, obj2) {
    var concat = {};
    
    for (var a in obj1) {
        concat[a] = obj1[a];
    }

    for (var b in obj2) {
        concat[b] = obj2[b];
    }

    return concat;
}