function onClick(info, tab){
	chrome.tabs.query({active:true}, function(e) {
		if (e.length) {
			chrome.tabs.sendMessage(e[0].id, {querySelect:info}, function(data) {});
		}
	});
}
var id = chrome.contextMenus.create({
	"title" : "使用扇贝查词",
    	"onclick" : onClick,
    	"contexts" : ["selection","frame"]
}, function(){
	console.log("Menu created");
});

function pass_ajax(option, sendResponse)
{
	option.success = function(data) {
		sendResponse({status: 'success', data: data});
	};
	option.error = function(xhr, type, cause) {
		xhr = {status: xhr.status};
		sendResponse({status: 'error', xhr: xhr, type: type, cause: cause});
	};
	$.ajax(option);
	return true;
}

/*
 * 用来绑定获取参数的监听器(后台页面)。
 */

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action == "getOptions")
    sendResponse(JSON.parse(localStorage.options));
  else if(request.action == "ajax")
	return pass_ajax(request.option, sendResponse);
  else
    sendResponse({});
});

if (typeof localStorage.options === "undefined") {
  localStorage.options = JSON.stringify({
    global : {
	enabled  : true,
        ctrlmask : false
    },
    shanbaydict : {
      enabled  : true,
      autoadd  : false,
      autoplay : true
    },
    googletran : {
      enabled : true
    },
    wikizh : {
      enabled : true
    },
    wikien : {
      enabled : true
    }
  })
}
