/*
 * Autocomplete.js v1.3.0 unstable
 * Developed by Baptiste Donaux
 * 
 * Under MIT Licence
 * (c) 2014, Baptiste Donaux
 */
var AutoComplete = function(params) {
	this.Ajax = function(request, customParams, queryParams, input, result) {
		if (request) {
			request.abort();
		};
		
		var method = customParams.method,
			url = customParams.url;

		if (method == "GET") {
			url += "?" + queryParams;
		};

		request = XMLHttpRequest();
		request.open(method, url, true);
		request.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		request.setRequestHeader("Content-length", queryParams.length);
		request.setRequestHeader("Connection", "close");

		request.onreadystatechange = function () {
			if (request.readyState == 4 && request.status == 200) {
				var response = request.response;

				switch (customParams.type) {
					case "HTML":
						result.innerHTML = response;
						break;

					default:
						response = JSON.parse(response);
						
						var empty,
							length = response.length,
							li = document.createElement("li"),
							ul = document.createElement("ul");

						if (Object.prototype.toString.call(response) == "[object Array]") {
							if (length) {
								for (var i = 0; i < length; i++) {
									li.innerHTML = response[i];
									ul.appendChild(li);
									li = document.createElement("li");
								};
							} else {
								//If the response is an object or an array and that the response is empty, so thi script is here, for the message no response.
								empty = true;
								li.setAttribute("class", "locked");
								li.innerHTML = customParams.noResult;
								ul.appendChild(li);
							};
						} else {
							for (var index in response) {
								if (response.hasOwnProperty(index)) {
									li.innerHTML = response[index];
									li.setAttribute("data-autocomplete-value", index);
									ul.appendChild(li);
									li = document.createElement("li");
								};
							};
						};

						if (result.hasChildNodes()) {
							result.childNodes[0].remove();
						};
						
						result.appendChild(ul);
				};

				if (empty !== true) {
					Open(input, result);
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
			if (input.nodeName.toUpperCase() == "INPUT" && input.type.toUpperCase() == "TEXT") {
				BindOne(input);
			};
		};
	};

	this.BindOne = function(input) {
		if (input != null) {
			var dataAutocompleteOldValueLabel = "data-autocomplete-old-value",
				result = document.createElement("div"),
				request;
			
			result.setAttribute("class", "resultsAutocomplete");
			result.setAttribute("style", "top:" + (input.offsetTop + input.offsetHeight) + "px;left:" + input.offsetLeft + "px;width:" + input.clientWidth + "px;");

			input.parentNode.appendChild(result);
			input.setAttribute("autocomplete", "off");
			
			input.addEventListener("focus", function() {
				var dataAutocompleteOldValue = input.getAttribute(dataAutocompleteOldValueLabel);
				if (!dataAutocompleteOldValue || input.value != dataAutocompleteOldValue) {
					result.setAttribute("class", "resultsAutocomplete open");
				};
			});

			input.addEventListener("blur", function() {
				Close(result);
			});

			input.addEventListener("keyup", function(e) {				
				var input = e.currentTarget,
					inputValue = input.value;

				if (inputValue) {
					var customParams = CustParams(input),
						queryParams = customParams.paramName + "=" + inputValue;

					if (customParams.url) {
						var dataAutocompleteOldValue = input.getAttribute(dataAutocompleteOldValueLabel);
						if (!dataAutocompleteOldValue || inputValue != dataAutocompleteOldValue) {
							result.setAttribute("class", "resultsAutocomplete open");
						};

						request = Ajax(request, customParams, queryParams, input, result);
					};
				};
			});
		};
	};

	this.Close = function(result, closeNow) {
		closeNow ? result.setAttribute("class", "resultsAutocomplete") : setTimeout(function() {Close(result, true);}, 150);
	};

	this.Initialize = function() {
		var defaultParams = {
			"method": "GET",
			"paramName": "q",
			"selector": ["input[data-autocomplete]"],
			"type": "JSON",
			"noResult": "No result",
		};

		if (this.params === undefined) {
			this.params = {};
		};

		this.params = Merge(defaultParams, this.params);
		this.params.method = this.params.method.toUpperCase();
		this.params.type = this.params.type.toUpperCase();

		if (!this.params.method.match("^GET|POST$")) {
			this.params.method = defaultParams.method;
		};

		if (!this.params.type.match("^JSON|HTML$")) {
			this.params.type = defaultParams.type;
		};

		if (!Array.isArray(this.params.selector)) {
			this.params.selector = defaultParams.selector;
		};
	};

	this.CreateCustParams = function(input) {
		var params = {
			"url":       input.getAttribute("data-autocomplete"),
			"method":    input.getAttribute("data-autocomplete-method"),
			"paramName": input.getAttribute("data-autocomplete-param-name"),
			"type":      input.getAttribute("data-autocomplete-type"),
			"noResult":  input.getAttribute("data-autocomplete-no-result")
		};

		for (var option in params) {
			if (params.hasOwnProperty(option) && !params[option]) {
				delete params[option];
			};
		};

		if (params.method) {
			(!params.method.match("^GET|POST$")) ? delete params.method : (params.method = params.method.toUpperCase());
		};

		if (params.type) {
			(!params.type.match("^JSON|HTML$")) ? delete params.type : (params.type = params.type.toUpperCase());
		};

		return Merge(this.params, params);
	};

	this.CustParams = function(input) {
		var dataAutocompleteIdLabel = "data-autocomplete-id";

		if (input.hasAttribute(dataAutocompleteIdLabel)) {
			return this.customParams[input.getAttribute(dataAutocompleteIdLabel)];
		} else {
			input.setAttribute(dataAutocompleteIdLabel, this.customParams.length);
			var newParams = CreateCustParams(input);
			this.customParams.push(newParams);

			return newParams;
		};
	};

	this.Open = function(input, result) {
		var liS = result.getElementsByTagName("li");
		for (var i = liS.length - 1; i >= 0; i--) {
			liS[i].addEventListener("click", function(e) {
				var li = e.currentTarget,
					dataAutocompleteValueLabel = "data-autocomplete-value";

				input.value = li.hasAttribute(dataAutocompleteValueLabel) ? li.getAttribute(dataAutocompleteValueLabel) : li.innerHTML;

				input.setAttribute("data-autocomplete-old-value", input.value);
			});
		};
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

	//Construct
	this.params = params;
	this.customParams = new Array();
	this.Initialize();

	for (var i = this.params.selector.length - 1; i >= 0; i--) {
		this.BindCollection(this.params.selector[i]);
	};
};