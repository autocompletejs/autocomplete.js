/*
 * Autocomplete.js v1.5.0
 * Developed by Baptiste Donaux
 * http://autocomplete-js.com
 * 
 * Under MIT Licence
 * (c) 2015, Baptiste Donaux
 */
var AutoComplete = (function () {
    "use strict";
    var AutoComplete = function(params) {
        //Construct
        if (this) {
            this._args = params;
            this._custArgs = [];
            this.Init();

            for (var i = this._args.selector.length - 1; i >= 0; i--) {
                this.BindCollection(this, this._args.selector[i]);
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
        BindCollection: function(instance, selector) {
            var i,
                input,
                inputs = document.querySelectorAll(selector),
                type;

            for (i = inputs.length - 1; i >= 0; i--) {
                input = inputs[i];

                if (input.nodeName.match(/^INPUT$/i) && input.type.match(/^TEXT|SEARCH$/i)) {
                    this.BindOne(instance, input);
                }
            }
        },
        BindOne: function(instance, input) {
            if (input) {
                var dataAutocompleteOldValueLabel = "data-autocomplete-old-value",
                    self                          = this,
                    result                        = domCreate("div"),
                    addEventListener              = input.addEventListener,
                    request;

                attr(input, {"autocomplete": "off"});
                
                self.Position(input, result);

                addEventListener("position", function() {
                    self.Position(input, result);
                });

                input.parentNode.appendChild(result);
                
                addEventListener("focus", function() {
                    var dataAutocompleteOldValue = attr(input, dataAutocompleteOldValueLabel);
                    if (!dataAutocompleteOldValue || input.value != dataAutocompleteOldValue) {
                        attrClass(result, "autocomplete open");
                    }
                });

                addEventListener("blur", function() {
                    self.Close(result);
                });

                addEventListener("keyup", function(e) {
                    var keyCode = e.keyCode,
                        input   = e.target,
                        liActive;

                    if (keyCode == 13 && attrClass(result).indexOf("open") != -1) {
                        liActive = result.querySelector("li.active");
                        if (liActive !== null) {
                            instance._args.select(input, liActive);
                            attrClass(result, "autocomplete");
                        }
                    }
                    
                    if (keyCode == 38 || keyCode == 40) {
                        liActive = result.querySelector("li.active");
                        if (liActive === null) {
                            var first = result.querySelector("li:first-child:not(.locked)");
                            if (first !== null) {
                                attrClass(first, "active");
                            }
                        } else {
                            var currentIndex = Array.prototype.indexOf.call(liActive.parentNode.children, liActive);
                            attrClass(liActive, "");

                            var position = currentIndex + (keyCode - 39);
                            var lisCount = result.getElementsByTagName("li").length;

                            if (position < 0) {
                                position = lisCount - 1;
                            } else if (position >= lisCount) {
                                position = 0;
                            }

                            attrClass(liActive.parentElement.childNodes.item(position), "active");
                        }
                    } else if (keyCode < 35 || keyCode > 40) {
                        var custParams = self.CustParams(input),
                            inputValue = custParams.pre(input);

                        if (inputValue && custParams.url) {
                            var dataAutocompleteOldValue = attr(input, dataAutocompleteOldValueLabel);
                            if (!dataAutocompleteOldValue || inputValue != dataAutocompleteOldValue) {
                                attrClass(result, "autocomplete open");
                            }

                            request = self.Ajax(request, custParams, custParams.paramName + "=" + inputValue, input, result);
                        }
                    }
                });
            }
        },
        Close: function(result, closeNow) {
            var self = this;
            if (closeNow) {
                attrClass(result, "autocomplete");
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
                    select: function(input, item) {
                        var dataAutocompleteValueLabel = "data-autocomplete-value";
                        input.value = item.hasAttribute(dataAutocompleteValueLabel) ? attr(item, dataAutocompleteValueLabel) : item.innerHTML;
                        attr(input, {"data-autocomplete-old-value": input.value});
                    },
                    open: function(input, result) {
                        var lambda = function(self, li) {
                            li.addEventListener("click", function(e) {
                                self.select(input, e.target);
                            });
                        };

                        var liS = result.getElementsByTagName("li");
                        for (var i = liS.length - 1; i >= 0; i--) {
                            lambda(this, liS[i]);
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
                                    attrClass(li, "locked");
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
        if (item !== null) {
            if (typeof attrs == "string") {
                return item.getAttribute(attrs);
            }

            for (var key in attrs) {
                item.setAttribute(key, attrs[key]);
            }
        }
    }

    function attrClass(item, value) {
        if (item !== null) {
            if (typeof value === undefined) {
                return attr(item, "class");
            }

            attr(item, {"class": value});
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

    return AutoComplete;
}());