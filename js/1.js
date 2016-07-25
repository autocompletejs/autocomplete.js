/*
 * Autocomplete.js v1.7.1
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
                    headers: {
                        "Content-type": "application/x-www-form-urlencoded"
                    },
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

            selectors = self._args.selector;
            if (!Array.isArray(selectors)) {
                selectors = [selectors];
            }

            selectors.forEach(function(selector) {
                Array.prototype.forEach.call(document.querySelectorAll(selector), function(input) {
                    if (input.nodeName.match(/^INPUT$/i) && input.type.match(/^TEXT|SEARCH$/i)) {
                        var oldValueLabel = "data-autocomplete-old-value",
                            result        = domCreate("div"),
                            request,
                            positionLambda = function() {
                                attr(result, {
                                    "class": "autocomplete",
                                    "style": "top:" + (input.offsetTop + input.offsetHeight) + "px;left:" + input.offsetLeft + "px;width:" + input.clientWidth + "px;"
                                });
                            },
                            destroyLambda = function() {
                                input.onfocus = input.onblur = input.onkeyup = null;
                                input.removeEventListener("position", positionLambda);
                                input.removeEventListener("destroy", destroyLambda);
                                result.parentNode.removeChild(result);
                                self.CustParams(input, true);
                            },
                            focusLamdba = function() {
                                var dataAutocompleteOldValue = attr(input, oldValueLabel);
                                if (!dataAutocompleteOldValue || input.value != dataAutocompleteOldValue) {
                                    attrClass(result, "autocomplete open");
                                }
                            };

                        attr(input, {"autocomplete": "off"});

                        positionLambda(input, result);
                        input.addEventListener("position", positionLambda);
                        input.addEventListener("destroy", destroyLambda);

                        input.parentNode.appendChild(result);
                        
                        input.onfocus = focusLamdba;

                        input.onblur = closeBox.bind(null, result);

                        input.onkeyup = function(e) {
                            var first                    = result.querySelector("li:first-child:not(.locked)"),
                                input                    = e.target,
                                custParams               = self.CustParams(input),
                                inputValue               = custParams.pre(input),
                                dataAutocompleteOldValue = attr(input, oldValueLabel),
                                keyCode                  = e.keyCode,
                                currentIndex,
                                position,
                                lisCount,
                                liActive;

                            if (keyCode == 13 && attr(result, "class").indexOf("open") != -1) {
                                liActive = result.querySelector("li.active");
                                if (liActive !== null) {
                                    self._args.select(input, liActive);
                                    attrClass(result, "autocomplete");
                                }
                            }
                            
                            if (keyCode == 38 || keyCode == 40) {
                                liActive = result.querySelector("li.active");

                                if (liActive) {
                                    currentIndex = Array.prototype.indexOf.call(liActive.parentNode.children, liActive);
                                    position = currentIndex + (keyCode - 39);
                                    lisCount = result.getElementsByTagName("li").length;

                                    attrClass(liActive, "");

                                    if (position < 0) {
                                        position = lisCount - 1;
                                    } else if (position >= lisCount) {
                                        position = 0;
                                    }

                                    attrClass(liActive.parentElement.childNodes.item(position), "active");
                                } else if (first) {
                                    attrClass(first, "active");
                                }
                            } else if (keyCode != 13 && (keyCode < 35 || keyCode > 40)) {
                                if (inputValue && custParams.url) {
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
                self = this,
                prefix = "data-autocomplete",
                params = {
                    limit:     prefix + "-limit",
                    method:    prefix + "-method",
                    noResult:  prefix + "-no-result",
                    paramName: prefix + "-param-name",
                    url:       prefix
                },
                paramsAttribute = Object.getOwnPropertyNames(params),
                i;

            if (toDelete) {
                delete self._custArgs[attr(input, dataAutocompleteIdLabel)];
            } else {
                if (!input.hasAttribute(dataAutocompleteIdLabel)) {
                    input.setAttribute(dataAutocompleteIdLabel, self._custArgs.length);

                    for (i = paramsAttribute.length - 1; i >= 0; i--) {
                        params[paramsAttribute[i]] = attr(input, params[paramsAttribute[i]]);
                    }

                    for (i in params) {
                        if (params.hasOwnProperty(i) && !params[i]) {
                            delete params[i];
                        }
                    }

                    if (params.limit) {
                        if (isNaN(params.limit)) {
                            delete params.limit;
                        } else {
                            params.limit = parseInt(params.limit);
                        }
                    }

                    self._custArgs.push(merge(self._args, params));
                }

                return self._custArgs[attr(input, dataAutocompleteIdLabel)];
            }
        }
    };

    function ajax(request, custParams, queryParams, input, result) {
        if (request) {
            request.abort();
        }
        
        var headers     = custParams.headers,
            headersKeys = Object.getOwnPropertyNames(headers),
            method      = custParams.method,
            url         = custParams.url,
            i;

        if (method.match(/^GET$/i)) {
            url += "?" + queryParams;
        }

        request = new XMLHttpRequest();
        request.open(method, url, true);

        for (i = headersKeys.length - 1; i >= 0; i--) {
            request.setRequestHeader(headersKeys[i], headers[headersKeys[i]]);
        }

        request.onreadystatechange = function () {
            if (request.readyState == 4 && request.status == 200) {
                if (!custParams.post(result, request.response, custParams)) {
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
        var concat = {},
            tmp;
        
        for (tmp in obj1) {
            concat[tmp] = obj1[tmp];
        }

        for (tmp in obj2) {
            concat[tmp] = obj2[tmp];
        }

        return concat;
    }

    return AutoComplete;
}());

function attr(item, attrs, defaultValue) {
    if (item) {
        try {
            for (var key in attrs) {
                item.setAttribute(key, attrs[key]);
            }
        } catch (e) {
            return item.hasAttribute(attrs) ? item.getAttribute(attrs) : defaultValue;
        }
    }
}

function attrClass(item, value) {
    if (item) {
        return attr(item, typeof value === undefined ? "class" : {"class": value});
    }
}

function domCreate(item) {
    return document.createElement(item);
}

document.addEventListener("DOMContentLoaded", function() {
    AutoComplete({
        select: function(input, item) {
            window.open(item.children[0].getAttribute("href"), '_blank');
        },
        open: function(input, result) {},
        post: function(result, response, custParams) {
            response = JSON.parse(response);
            var empty,
                length = response.length,
                a = domCreate("a"),
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
                        a.innerHTML = response[properties[propertie]];
                        attr(a, {"href": properties[propertie], "target": "_blank"});
                        li.appendChild(a);
                        ul.appendChild(li);
                        a = domCreate("a");
                        li = domCreate("li");
                    }
                }
            }

            if (result.hasChildNodes()) {
                result.childNodes[0].remove();
            }
            
            result.appendChild(ul);

            return empty;
        }
    });

    $('.dropdown-toggle').dropdown();
    $('#menu').collapse();

    $("a[data-api]").on("click", function() {
        $("a.active[data-api]").removeClass("active");
        $("a[data-api=" + $(this).attr("data-api") + "]").addClass("active");
        $("div.active").removeClass("active");
        $("div[id=" + $(this).attr("data-api") + "]").addClass("active");
    });

    $("i[data-api-href]").on("click", function() {
        window.location.hash = $(this).attr("data-api-href");
    });

    if (window.location.hash != "") {
        var hash = window.location.hash.substr(1);
        if ($(".list-group > a[data-api=" + hash + "]").length == 1) {
            $(".list-group > a.active[data-api]").removeClass("active");
            $(".list-group > a[data-api=" + hash + "]").addClass("active");
            $("div.active").removeClass("active");
            $("div[id=" + hash + "]").addClass("active");
        }
    }

    $('pre').each(function(i, block) {
        hljs.highlightBlock(block);
    });
});