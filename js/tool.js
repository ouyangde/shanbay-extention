function ajax(option, success, error)
{
	chrome.runtime.sendMessage({
		action : "ajax",
		option : option
	}, function(response) {
		if (response.status == 'success' && success) {
			success(response.data);
		}
		if (response.status == 'error' && error) {
			error(response.xhr, response.type, response.cause);
		}
	});
}

function ajax_post(url, data, callback)
{
	return ajax({type: 'POST', url: url, data: data}, callback);
}