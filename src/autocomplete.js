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
            var i,
                self = this,
                defaultParams = {
                    limit:     0,
                    method:    "GET",
                    noResult:  "No result",
                    paramName: "q",
                    select: function(input, item) {
                        attr(input, {"data-autocomplete-old-value": input.value = attr(item, "data-autocomplete-value", item.innerHTML)});
                    },
                    open: function(input, result) {
                        var self = this;
                        Array.prototype.forEach.call(result.getElementsByTagName("li"), function(li) {
                            li.onclick = function(event) {
                                self.select(input, event.target);
                            };
                        });
                    },
                    post: function(result, response, custParams) {
                        try {
                            response = JSON.parse(response);
                            var createLi = function() {return domCreate("li");},
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
                                ul     = domCreate("ul"),
                                limit  = custParams.limit,
                                propertie,
                                properties,
                                value;
                                
                            if (Array.isArray(response)) {
                                if (length) {
                                    
                                    response = autoReverse(response, limit);

                                    for (; i < length && (i < Math.abs(limit) || !limit); i++) {
                                        li = addLi(ul, li, response[i]);
                                    }
                                } else {
                                    //If the response is an object or an array and that the response is empty, so this script is here, for the message no response.
                                    empty = true;
                                    attrClass(li, "locked");
                                    li = addLi(ul, li, custParams.noResult);
                                }
                            } else {
                                properties = autoReverse(Object.getOwnPropertyNames(response), limit);

                                for (propertie in properties) {
                                    value = properties[propertie];

                                    if (parseInt(propertie) < Math.abs(limit) || !limit) {
                                        attr(li, {"data-autocomplete-value": value});
                                        li = addLi(ul, li, response[value]);
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
                    selector: ["input[data-autocomplete]"]
                },
                selectors;

            self._custArgs = [];
            self._args     = merge(defaultParams, params || {});

            if (!self._args.method.match(/^GET|POST$/i)) {
                self._args.method = defaultParams.method;
            }

            selectors = self._args.selector;

            if (!Array.isArray(selectors)) {
                selectors = [selectors];
            }

            selectors.forEach(function(selector) {
                Array.prototype.forEach.call(document.querySelectorAll(selector), function(input) {
                    if (input.nodeName.match(/^INPUT$/i) && input.type.match(/^TEXT|SEARCH$/i)) {
                        var oldValueLabel = "data-autocomplete-old-value",
                            result        = domCreate("div"),
                            request;

                        attr(input, {"autocomplete": "off"});
                        
                        position(input, result);

                        var
                            positionLambda = function() {
                                position(input, result);
                            },
                            destroyLambda = function() {
                                input.onfocus = input.onblur = input.onkeyup = null;
                                input.removeEventListener("position", positionLambda);
                                input.removeEventListener("destroy", destroyLambda);
                                self.CustParams(input, true);
                            };

                        input.addEventListener("position", positionLambda);
                        input.addEventListener("destroy", destroyLambda);

                        input.parentNode.appendChild(result);
                        
                        input.onfocus = function() {
                            var dataAutocompleteOldValue = attr(input, oldValueLabel);
                            if (!dataAutocompleteOldValue || input.value != dataAutocompleteOldValue) {
                                attrClass(result, "autocomplete open");
                            }
                        };

                        input.onblur = function() {
                            closeBox(result);
                        };

                        input.onkeyup = function(e) {
                            var keyCode = e.keyCode,
                                input   = e.target,
                                liActive;

                            if (keyCode == 13 && attrClass(result).indexOf("open") != -1) {
                                liActive = result.querySelector("li.active");
                                if (liActive !== null) {
                                    self._args.select(input, liActive);
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
                                    var dataAutocompleteOldValue = attr(input, oldValueLabel);
                                    if (!dataAutocompleteOldValue || inputValue != dataAutocompleteOldValue) {
                                        attrClass(result, "autocomplete open");
                                    }

                                    request = ajax(request, custParams, custParams.paramName + "=" + inputValue, input, result);
                                }
                            }
                        };
                    }
                });
            });
        } else {
            new AutoComplete(params);
        }
    };

    AutoComplete.prototype = {
        CustParams: function(input, toDelete) {
            var dataAutocompleteIdLabel = "data-autocomplete-id",
                self = this;

            if (toDelete) {
                delete self._custArgs[attr(input, dataAutocompleteIdLabel)];
                return;
            }

            if (!input.hasAttribute(dataAutocompleteIdLabel)) {
                input.setAttribute(dataAutocompleteIdLabel, self._custArgs.length);

                var params = {
                    limit:     "data-autocomplete-limit",
                    method:    "data-autocomplete-method",
                    noResult:  "data-autocomplete-no-result",
                    paramName: "data-autocomplete-param-name",
                    url:       "data-autocomplete"
                };

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

                self._custArgs.push(merge(this._args, params));
            }

            return self._custArgs[attr(input, dataAutocompleteIdLabel)];
        }
    };

    //Method without object called
    function position(input, result) {
        attr(result, {
            "class": "autocomplete",
            "style": "top:" + (input.offsetTop + input.offsetHeight) + "px;left:" + input.offsetLeft + "px;width:" + input.clientWidth + "px;"
        });
    }

    function ajax(request, custParams, queryParams, input, result) {
        if (request) {
            request.abort();
        }
        
        var method = custParams.method,
            url    = custParams.url;

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
    }
    function closeBox(result, closeNow) {
        if (closeNow) {
            attrClass(result, "autocomplete");
        } else {
            setTimeout(function() {closeBox(result, true);}, 150);
        }
    }

    //Method deported
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

function attr(item, attrs, defaultValue) {
    if (item !== null) {
        if (typeof attrs == "string") {
            return item.hasAttribute(attrs) ? item.getAttribute(attrs) : defaultValue;
        }

        for (var key in attrs) {
            item.setAttribute(key, attrs[key]);
        }
    }
}

function attrClass(item, value) {
    if (item !== null) {
        if (value === undefined) {
            return attr(item, "class");
        }

        attr(item, {"class": value});
    }
}

function domCreate(item) {
    return document.createElement(item);
}