function onClick(info, tab){
	chrome.tabs.sendMessage(tab.id, {querySelect:info}, function(data) {});
}
var id = chrome.contextMenus.create({
	"title" : "使用扇贝查词",
    	"onclick" : onClick,
    	"contexts" : ["selection"]
}, function(){
	console.log("Menu created");
});

/*
 * 用来绑定获取参数的监听器(后台页面)。
 */

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action == "getOptions")
    sendResponse(JSON.parse(localStorage.options));
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
