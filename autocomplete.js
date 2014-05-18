/*
 * Autocomplete.js v1.4.0 unstable
 * Developed by Baptiste Donaux
 * 
 * Under MIT Licence
 * (c) 2014, Baptiste Donaux
 */
var AutoComplete = function(params) {
	this.Ajax = function(request, custParams, queryParams, input, result) {
		if (request) {
			request.abort();
		};
		
		var method = custParams.method,
			url = custParams.url;

		if (method.match("^GET$", "i")) {
			url += "?" + queryParams;
		};

		request = new XMLHttpRequest();
		request.open(method, url, true);
		request.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		request.setRequestHeader("Content-length", queryParams.length);
		request.setRequestHeader("Connection", "close");

		request.onreadystatechange = function () {
			if (request.readyState == 4 && request.status == 200) {
				if (custParams.post(result, request.response, custParams) !== true) {
					custParams.open(input, result);
				};
			};
		};

		request.send(queryParams);

		return request;
	};

	this.BindCollection = function(selector) {
		var input,
			inputs = document.querySelectorAll(selector);

		for (var i = inputs.length - 1; i >= 0; i--) {
			input = inputs[i];
			if (input.nodeName.match("^INPUT$", "i") && input.type.match("^TEXT$", "i")) {
				BindOne(input);
			};
		};
	};

	this.Position = function(input, result) {
		Attr(result, {
			"class": "autocomplete",
			"style": "top:" + (input.offsetTop + input.offsetHeight) + "px;left:" + input.offsetLeft + "px;width:" + input.clientWidth + "px;"
		});
	};

	this.BindOne = function(input) {
		if (input) {
			var dataAutocompleteOldValueLabel = "data-autocomplete-old-value",
				result = DOMCreate("div"),
				request;
			
			Attr(input, {"autocomplete": "off"});
			
			Position(input, result);

			input.addEventListener("autocomplete:position", function() {
				Position(input, result);
			});

			input.parentNode.appendChild(result);
			
			input.addEventListener("focus", function() {
				var dataAutocompleteOldValue = Attr(input, dataAutocompleteOldValueLabel);
				if (!dataAutocompleteOldValue || input.value != dataAutocompleteOldValue) {
					Attr(result, {"class": "autocomplete open"});
				};
			});

			input.addEventListener("blur", function() {
				Close(result);
			});

			input.addEventListener("keyup", function(e) {
				var input = e.currentTarget,
					custParams = CustParams(input),
					inputValue = custParams.pre(input);

				if (inputValue && custParams.url) {
					var dataAutocompleteOldValue = Attr(input, dataAutocompleteOldValueLabel);
					if (!dataAutocompleteOldValue || inputValue != dataAutocompleteOldValue) {
						Attr(result, {"class": "autocomplete open"});
					};

					request = Ajax(request, custParams, custParams.paramName + "=" + inputValue, input, result);
				};
			});
		};
	};

	this.Close = function(result, closeNow) {
		closeNow ? Attr(result, {"class": "autocomplete"}) : setTimeout(function() {Close(result, true);}, 150);
	};

	this.Init = function() {
		var defaultParams = {
			limit:     0,
			method:    "GET",
			noResult:  "No result",
			paramName: "q",
			open: function(input, result) {
				var liS = result.getElementsByTagName("li");
				for (var i = liS.length - 1; i >= 0; i--) {
					liS[i].addEventListener("click", function(e) {
						var li = e.currentTarget,
							dataAutocompleteValueLabel = "data-autocomplete-value";

						input.value = li.hasAttribute(dataAutocompleteValueLabel) ? Attr(li, dataAutocompleteValueLabel) : li.innerHTML;

						Attr(input, {"data-autocomplete-old-value": input.value});
					});
				};
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
							};

							for (var i = 0; i < length && (i < Math.abs(custParams.limit) || !custParams.limit); i++) {
								li.innerHTML = response[i];
								ul.appendChild(li);
								li = DOMCreate("li");
							};
						} else {
							//If the response is an object or an array and that the response is empty, so this script is here, for the message no response.
							empty = true;
							Attr(li, {"class": "locked"});
							li.innerHTML = custParams.noResult;
							ul.appendChild(li);
						};
					} else {
						var properties = Object.getOwnPropertyNames(response);

						if (custParams.limit < 0) {
							properties.reverse();
						};

						for (var propertie in properties) {
							if (parseInt(propertie) < Math.abs(custParams.limit) || !custParams.limit) {
								li.innerHTML = response[properties[propertie]];
								Attr(li, {"data-autocomplete-value": properties[propertie]});
								ul.appendChild(li);
								li = DOMCreate("li");
							};
						};
					};

					if (result.hasChildNodes()) {
						result.childNodes[0].remove();
					};
					
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

		if (this.params === undefined) {
			this.params = {};
		};

		this.params = Merge(defaultParams, this.params);

		if (!this.params.method.match("^GET|POST$", "i")) {
			this.params.method = defaultParams.method;
		};

		if (!Array.isArray(this.params.selector)) {
			this.params.selector = defaultParams.selector;
		};
	};

	this.CreateCustParams = function(input) {
		var params = {
			limit:	   "data-autocomplete-limit",
			method:    "data-autocomplete-method",
			noResult:  "data-autocomplete-no-result",
			paramName: "data-autocomplete-param-name",
			url:       "data-autocomplete"
		};

		var paramsAttribute = Object.getOwnPropertyNames(params);
		for (var i = paramsAttribute.length - 1; i >= 0; i--) {
			params[paramsAttribute[i]] = Attr(input, params[paramsAttribute[i]]);
		};

		for (var option in params) {
			if (params.hasOwnProperty(option) && !params[option]) {
				delete params[option];
			};
		};

		if (params.method && !params.method.match("^GET|POST$", "i")) {
			delete params.method;
		};

		if (params.limit) {
			isNaN(params.limit) ? delete params.limit : params.limit = parseInt(params.limit);
		};

		return Merge(this.params, params);
	};

	this.CustParams = function(input) {
		var dataAutocompleteIdLabel = "data-autocomplete-id";

		if (!input.hasAttribute(dataAutocompleteIdLabel)) {
			input.setAttribute(dataAutocompleteIdLabel, this.custParams.length);

			this.custParams.push(CreateCustParams(input));
		};

		return this.custParams[Attr(input, dataAutocompleteIdLabel)];
	};

	this.Merge = function(obj1, obj2) {
		var merge = {};
	    
	    for (var attrname in obj1) {
	    	merge[attrname] = obj1[attrname];
	    };

	    for (var attrname in obj2) {
	    	merge[attrname] = obj2[attrname];
	    };

	    return merge;
	};

	this.Attr = function(item, attrs) {
		if (typeof attrs == "string") {
			return item.getAttribute(attrs);
		};

		for (var key in attrs) {
			item.setAttribute(key, attrs[key]);
		};
	};

	this.DOMCreate = function(item) {
		return document.createElement(item);
	};

	//Construct
	this.params = params;
	this.custParams = [];
	this.Init();

	for (var i = this.params.selector.length - 1; i >= 0; i--) {
		this.BindCollection(this.params.selector[i]);
	};
};