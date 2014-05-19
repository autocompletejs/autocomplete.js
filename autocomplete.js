/*
 * Autocomplete.js v1.4.0 unstable
 * Developed by Baptiste Donaux
 * 
 * Under MIT Licence
 * (c) 2014, Baptiste Donaux
 */
"use strict";
var AutoComplete = function(params) {
    //Construct
    if (this) {
        this.params = params;
        this.custParams = [];
        this.Init();

        for (var i = this.params.selector.length - 1; i >= 0; i--) {
            this.BindCollection(this.params.selector[i]);
        }
    } else {
        new AutoComplete(params);
    }
};

AutoComplete.prototype = {
    BindOne: function(input) {
        if (input) {
            var dataAutocompleteOldValueLabel = "data-autocomplete-old-value",
                self = this,
                result = DOMCreate("div"),
                request;
            
            Attr(input, {"autocomplete": "off"});
            
            self.Position(input, result);

            input.addEventListener("autocomplete:position", function() {
                self.Position(input, result);
            });

            input.parentNode.appendChild(result);
            
            

            input.addEventListener("focus", function() {
                var dataAutocompleteOldValue = Attr(input, dataAutocompleteOldValueLabel);
                if (!dataAutocompleteOldValue || input.value != dataAutocompleteOldValue) {
                    Attr(result, {"class": "autocomplete open"});
                }
            });

            input.addEventListener("blur", function() {
                self.Close(result);
            });

            input.addEventListener("keyup", function(e) {
                var input = e.currentTarget,
                    custParams = self.CustParams(input),
                    inputValue = custParams.pre(input);

                if (inputValue && custParams.url) {
                    var dataAutocompleteOldValue = Attr(input, dataAutocompleteOldValueLabel);
                    if (!dataAutocompleteOldValue || inputValue != dataAutocompleteOldValue) {
                        Attr(result, {"class": "autocomplete open"});
                    }

                    request = self.Ajax(request, custParams, custParams.paramName + "=" + inputValue, input, result);
                }
            });
        }
    },
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
        request.setRequestHeader("Content-length", queryParams.length);
        request.setRequestHeader("Connection", "close");

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

            if (input.nodeName.match(/^INPUT$/i) && input.type.match(/^TEXT$/i)) {
                this.BindOne(input);
            }
        }
    },
    Position: function(input, result) {
        Attr(result, {
            "class": "autocomplete",
            "style": "top:" + (input.offsetTop + input.offsetHeight) + "px;left:" + input.offsetLeft + "px;width:" + input.clientWidth + "px;"
        });
    },
    Close: function(result, closeNow) {
        var self = this;
        if (closeNow) {
            Attr(result, {"class": "autocomplete"});
        } else {
            setTimeout(function() {self.Close(result, true);}, 150);
        }
    },
    Init: function() {
        var
        self = this,
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

                        input.value = li.hasAttribute(dataAutocompleteValueLabel) ? Attr(li, dataAutocompleteValueLabel) : li.innerHTML;

                        Attr(input, {"data-autocomplete-old-value": input.value});
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
                        li = DOMCreate("li"),
                        ul = DOMCreate("ul");
                        
                    if (Array.isArray(response)) {
                        if (length) {
                            if (custParams.limit < 0) {
                                response.reverse();
                            }

                            for (var i = 0; i < length && (i < Math.abs(custParams.limit) || !custParams.limit); i++) {
                                li.innerHTML = response[i];
                                ul.appendChild(li);
                                li = DOMCreate("li");
                            }
                        } else {
                            //If the response is an object or an array and that the response is empty, so this script is here, for the message no response.
                            empty = true;
                            Attr(li, {"class": "locked"});
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
                                Attr(li, {"data-autocomplete-value": properties[propertie]});
                                ul.appendChild(li);
                                li = DOMCreate("li");
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

        if (self.params === undefined) {
            self.params = {};
        }

        self.params = Merge(defaultParams, self.params);

        if (!self.params.method.match(/^GET|POST$/i)) {
            self.params.method = defaultParams.method;
        }

        if (!Array.isArray(self.params.selector)) {
            self.params.selector = defaultParams.selector;
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
            params[paramsAttribute[i]] = Attr(input, params[paramsAttribute[i]]);
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

        return Merge(self.params, params);
    },
    CustParams: function(input) {
        var dataAutocompleteIdLabel = "data-autocomplete-id",
            self = this;

        if (!input.hasAttribute(dataAutocompleteIdLabel)) {
            input.setAttribute(dataAutocompleteIdLabel, self.custParams.length);

            self.custParams.push(self.CreateCustParams(input));
        }

        return self.custParams[Attr(input, dataAutocompleteIdLabel)];
    }
};

//Method deported
function Attr(item, attrs) {
    if (typeof attrs == "string") {
        return item.getAttribute(attrs);
    }

    for (var key in attrs) {
        item.setAttribute(key, attrs[key]);
    }
};

function DOMCreate(item) {
    return document.createElement(item);
};

function Merge(obj1, obj2) {
    var merge = {};
    
    for (var a in obj1) {
        merge[a] = obj1[a];
    }

    for (var b in obj2) {
        merge[b] = obj2[b];
    }

    return merge;
}