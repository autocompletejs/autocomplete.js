/*
 * Autocomplete.js v1.0.0
 * Developed by Baptiste Donaux
 * 
 * Under MIT Licence
 * (c) 2014, Baptiste Donaux
 */
function AutoComplete(params) {
	var params = params;

	var __construct = function() {
		params = AutoComplete.initialize(params);

		for (var i = params.selector.length - 1; i >= 0; i--) {
			AutoComplete.bindCollection(params.selector[i], params);
		};
	}();
};

AutoComplete.ajax = function(request, url, method, type, queryParams, input, result, params) {
	if (request !== undefined) {
		request.abort();
	};
	
	if (method === "GET") {
		url = url + "?" + queryParams;
	};

	request = new XMLHttpRequest();
	request.open(method, url, true);
	request.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	request.setRequestHeader("Content-length", queryParams.length);
	request.setRequestHeader("Connection", "close");

	request.onreadystatechange = function () {
		if (request.readyState === 4 && request.status === 200) {
			if (type === "HTML") {
				result.innerHTML = request.response;
			} else {
				var li,
					response = JSON.parse(request.response),
					ul = document.createElement("ul");

				if (Object.prototype.toString.call(response) === "[object Array]") {
					for (var i = 0; i < response.length; i++) {
						li = document.createElement("li");
						li.innerHTML = response[i];
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

			AutoComplete.result(input, result);
		};
	};

	request.send(queryParams);

	return request;
};

AutoComplete.bindCollection = function(selector, params) {
	var input = null,
		inputs = document.querySelectorAll(selector);

	for (var i = inputs.length - 1; i >= 0; i--) {
		input = inputs[i];
		if (input.nodeName.toUpperCase() === "INPUT" && input.type.toUpperCase() === "TEXT") {
			AutoComplete.bindOne(input, params);
		};
	};
};

AutoComplete.bindOne = function(input, params) {
	if (input != null) {
		var result = document.createElement("div"),
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
			AutoComplete.close(result);
		});

		input.addEventListener("keyup", function(e) {				
			var inputValue = e.currentTarget.value;

			if (inputValue !== "") {
				var queryParams,
					url = e.currentTarget.getAttribute("data-autocomplete"),
					method = e.currentTarget.getAttribute("data-autocomplete-method"),
					paramName = e.currentTarget.getAttribute("data-autocomplete-param-name"),
					type = input.getAttribute("data-autocomplete-type");

				method = method !== null ? method.toUpperCase() : null;
				type = type !== null ? type.toUpperCase() : null;

				if (type === null || (type !== "JSON" && type !== "HTML")) {
					type = params.type;
				};

				if (method === null || (method != "GET" && method != "POST")) {
					method = params.method;
				};

				if (paramName === null) {
					paramName = params.paramName;
				};

				queryParams = paramName + "=" + inputValue;

				if (url !== null) {
					var dataAutocompleteOldValue = input.getAttribute("data-autocomplete-old-value");
					if (dataAutocompleteOldValue === null || inputValue !== dataAutocompleteOldValue) {
						result.setAttribute("class", "resultsAutocomplete open");
					};

					request = AutoComplete.ajax(request, url, method, type, queryParams, input, result, params);
				};
			};
		});
	};
};

AutoComplete.close = function(result, closeNow) {
	if (closeNow === true) {
		result.setAttribute("class", "resultsAutocomplete");
	} else {
		setTimeout(function() {AutoComplete.close(result, true);}, 100);
	};
};

AutoComplete.initialize = function(params) {
	if (params === undefined) {
		params = {};
	};

	if (params.method === undefined || (params.method.toUpperCase() !== "GET" && params.method.toUpperCase() !== "POST")) {
		params.method = "GET";
	} else {
		params.method = params.method.toUpperCase();
	};

	if (params.paramName === undefined) {
		params.paramName = "q";
	};

	if (params.selector === undefined) {
		params.selector = ["input[data-autocomplete]"];
	};

	if (params.type === undefined || (params.type.toUpperCase() !== "JSON" && params.type.toUpperCase() !== "HTML")) {
		params.type = "JSON";
	} else {
		params.type = params.type.toUpperCase();
	};

	return params;
};

AutoComplete.result = function(input, result) {
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