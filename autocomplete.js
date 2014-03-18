/*
 * Autocomplete.js v1.2.0
 * Developed by Baptiste Donaux
 * 
 * Under MIT Licence
 * (c) 2014, Baptiste Donaux
 */
var AutoComplete = function(params) {
	this.Ajax = function(request, customParams, queryParams, input, result) {
		if (request !== undefined) {
			request.abort();
		};
		
		var url = customParams.url;

		if (customParams.method === "GET") {
			url = customParams.url + "?" + queryParams;
		};

		request = new XMLHttpRequest();
		request.open(customParams.method, url, true);
		request.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		request.setRequestHeader("Content-length", queryParams.length);
		request.setRequestHeader("Connection", "close");

		request.onreadystatechange = function () {
			if (request.readyState === 4 && request.status === 200) {
				if (customParams.type === "HTML") {
					result.innerHTML = request.response;
				} else {
					var empty = false,
						li,
						response = JSON.parse(request.response),
						ul = document.createElement("ul");

					if (Object.prototype.toString.call(response) === "[object Array]") {
						if (response.length !== 0) {
								for (var i = 0; i < response.length; i++) {
								li = document.createElement("li");
								li.innerHTML = response[i];
								ul.appendChild(li);
							};
						} else {
							//If the response is an object or an array and that the response is empty, so thi script is here, for the message no response.
							empty = true;
							li = document.createElement("li");
							li.setAttribute("class", "locked");
							li.innerHTML = customParams.noResult;
							ul.appendChild(li);
						};
					} else {
						for (var index in response) {
							if (response.hasOwnProperty(index)) {
								li = document.createElement("li");
								li.innerHTML = response[index];
								li.setAttribute("data-autocomplete-value", index);
								ul.appendChild(li);
							};
						};
					};

					if (result.hasChildNodes()) {
						result.childNodes[0].remove();
					};
					
					result.appendChild(ul);
				};

				if (empty === false) {
					Result(input, result);
				};
			};
		};

		request.send(queryParams);

		return request;
	};

	this.BindCollection = function(selector) {
		var input = null,
			inputs = document.querySelectorAll(selector);

		for (var i = inputs.length - 1; i >= 0; i--) {
			input = inputs[i];
			if (input.nodeName.toUpperCase() === "INPUT" && input.type.toUpperCase() === "TEXT") {
				BindOne(input);
			};
		};
	};

	this.BindOne = function(input) {
		if (input != null) {
			var params = this.params,
				result = document.createElement("div"),
				request,
				top = input.offsetTop + input.offsetHeight,
				type;
			
			result.setAttribute("class", "resultsAutocomplete");
			result.setAttribute("style", "top:" + top + "px;left:" + input.offsetLeft + "px;width:" + input.clientWidth + "px;");

			input.parentNode.appendChild(result);
			input.setAttribute("autocomplete", "off");
			
			input.addEventListener("focus", function(e) {
				var dataAutocompleteOldValue = input.getAttribute("data-autocomplete-old-value");
				if (dataAutocompleteOldValue === null || input.value !== dataAutocompleteOldValue) {
					result.setAttribute("class", "resultsAutocomplete open");
				};
			});

			input.addEventListener("blur", function(e) {
				Close(result);
			});

			input.addEventListener("keyup", function(e) {				
				var input = e.currentTarget,
					inputValue = input.value;

				if (inputValue !== "") {
					var customParams = FindCustomParams(input),
						queryParams = customParams.paramName + "=" + inputValue;

					if (customParams.url) {
						var dataAutocompleteOldValue = input.getAttribute("data-autocomplete-old-value");
						if (dataAutocompleteOldValue === null || inputValue !== dataAutocompleteOldValue) {
							result.setAttribute("class", "resultsAutocomplete open");
						};

						request = Ajax(request, customParams, queryParams, input, result);
					};
				};
			});
		};
	};

	this.Close = function(result, closeNow) {
		if (closeNow === true) {
			result.setAttribute("class", "resultsAutocomplete");
		} else {
			setTimeout(function() {Close(result, true);}, 100);
		};
	};

	this.Initialize = function() {
		if (this.params === undefined) {
			this.params = {};
		};

		if (this.params.method === undefined || (this.params.method.toUpperCase() !== "GET" && this.params.method.toUpperCase() !== "POST")) {
			this.params.method = "GET";
		} else {
			this.params.method = this.params.method.toUpperCase();
		};

		if (this.params.paramName === undefined) {
			this.params.paramName = "q";
		};

		if (this.params.selector === undefined) {
			this.params.selector = ["input[data-autocomplete]"];
		};

		if (this.params.type === undefined || (this.params.type.toUpperCase() !== "JSON" && this.params.type.toUpperCase() !== "HTML")) {
			this.params.type = "JSON";
		} else {
			this.params.type = this.params.type.toUpperCase();
		};

		if (this.params.noResult === undefined) {
			this.params.noResult = "No result";
		};
	};

	this.GenerateCustomParams = function(input) {
		var params = {
			"url": input.getAttribute("data-autocomplete"),
			"method": input.getAttribute("data-autocomplete-method"),
			"paramName": input.getAttribute("data-autocomplete-param-name"),
			"type": input.getAttribute("data-autocomplete-type"),
			"noResult": input.getAttribute("data-autocomplete-no-result"),
		};

		for (var option in params) {
			if (params.hasOwnProperty(option) && params[option] === null) {
				delete params[option];
			};
		};

		if (params.method) {
			if (params.method.toUpperCase() !== "GET" && params.method.toUpperCase() !== "POST") {
				delete params.method;
			} else {
				params.method = params.method.toUpperCase();
			};
		};

		if (params.type) {
			if (params.type.toUpperCase() !== "JSON" && params.type.toUpperCase() !== "HTML") {
				delete params.type;
			} else {
				params.type = params.type.toUpperCase();
			};
		};

		//Merge
		var merge = {};
	    
	    for (var attrname in this.params) {
	    	merge[attrname] = this.params[attrname];
	    };

	    for (var attrname in params) {
	    	merge[attrname] = params[attrname];
	    };

	    return merge;
	};

	this.FindCustomParams = function(input) {
		if (input.hasAttribute("data-autocomplete-id")) {
			return this.customParams[input.getAttribute("data-autocomplete-id")];
		} else {
			input.setAttribute("data-autocomplete-id", this.customParams.length);
			var newParams = GenerateCustomParams(input);
			this.customParams.push(newParams);

			return newParams;
		};
	};

	this.Result = function(input, result) {
		var allLi = result.getElementsByTagName("li");
		for (var i = allLi.length - 1; i >= 0; i--) {
			allLi[i].addEventListener("click", function(e) {
				var li = e.currentTarget;
				if (li.hasAttribute("data-autocomplete-value")) {
					input.value = li.getAttribute("data-autocomplete-value");
				} else {
					input.value = li.innerHTML;
				};

				input.setAttribute("data-autocomplete-old-value", input.value);
			});
		};
	};

	//Construct
	this.params = params;
	this.customParams = new Array();
	this.Initialize();

	for (var i = this.params.selector.length - 1; i >= 0; i--) {
		this.BindCollection(this.params.selector[i]);
	};
};