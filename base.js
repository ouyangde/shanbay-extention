var version="0.3.1.4";
var logged;
var host="http://www.shanbay.com";

/** API **/
var QUERY_API=host+'/api/word/{{word}}';
var ADD_WORD_API=host+'/api/learning/add/{{word}}';
var ADD_EXAMPLE_API = host+'/api/example/add/{{learning_id}}?sentence={{sentence}}&translation={{translation}}';
var USER_INFO_API = host + '/api/user/info/';

/** 未登录使用接口 **/
var  E_QUERY_API=host+'/bdc/search/word/?{{word}}';


  //使用属性初始化界面
function initOption() {
    if (typeof localStorage.options == "undefined") {
      localStorage.options = JSON.stringify({
        global : {
          enabled  : true,
          ctrlmask : false
        },
        shanbaydict : {
          enabled : true,
          autoadd : false,
          autoplay: true
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

    var options = JSON.parse(localStorage.options);
  
    document.getElementById('selection_global_enabled').checked=options.global.enabled;
  }
  
function switchGlobalEnable() {
     var options = JSON.parse(localStorage.options);
     options.global.enabled = !options.global.enabled;
     document.getElementById('selection_global_enabled').checked= options.global.enabled;
     localStorage.options = JSON.stringify(options);
  }
  

function checkLogin(){
    handleJSONFromURL(USER_INFO_API,
      function(user){
	if(user&&user['result']==1){
	    username = user['nickname'];
	    logged=true;
	    loadJS('jsonquery.js');
	    data='<span class="username"><a href="#" onclick="goURL(&quot;'+host+'/home/&quot;)">'+username+'</a></span>';
	    var res = document.getElementById('ubar');
	    res.innerHTML = data;		    		
	}else{
	    logged = false;
	    loadJS('query.js');
	    data='<span class="username"><a href="#" onclick="goURL(&quot;'+host+'/accounts/login/&quot;)">登录</a></span>';
	    var res = document.getElementById('ubar');
	    res.innerHTML = data;
	}
	  
      });
    document.getElementById('word').focus();
}


//未做错误处理,参数以{{.+}}标记
function getAPIURL(api,args){
    var i, result=api,lens = arguments.length;
    for(i=1;i<lens;i++){
	result = result.replace(/{{.+?}}/, arguments[i]);
    }
    return result;
    
}

function handleJSONFromURL(url,handler){
    var req = new XMLHttpRequest();
     req.onreadystatechange = function(data) {
	// alert(req.readyState+"  "+ req.status);
	if (req.readyState == 4) {
	    if (req.status == 200) {
		var data = req.responseText;
		try{
		    var obj= data.parseJSON();
		    handler(obj);
		}catch(error){
		    console.log(error);
		    handler();
		}
	    }
	}
}
    req.open('GET', url , true);
    req.send(null);
}

function goURL(url){
    window.open(url);
    window.self.close();
}

function play_single_sound() {
    //alert("playing");
    document.getElementById('sound').play();
    document.getElementById('word').focus();
}


//http://www.somacon.com/p355.php  or http://blog.stevenlevithan.com/archives/faster-trim-javascript
function trim(stringToTrim) {
    return stringToTrim.replace(/^\s+|\s+$/g,"");
}

function waitForQuery(){
    var res = document.getElementById('result');
    res.innerHTML = '<br><img src="wait.gif">';
}


function loadJS(jsfile ) 

{ 
    var oHead = document.getElementsByTagName('HEAD').item(0); 
    var oScript= document.createElement("script"); 
    oScript.type = "text/javascript";
    oScript.src=jsfile; 
    oHead.appendChild(oScript); 

} 

Object.prototype.getName = function() { 
    var funcNameRegex = /function (.{1,})\(/;
    var results = (funcNameRegex).exec((this).constructor.toString());
    return (results && results.length > 1) ? results[1] : "";
};

$(function init(){
    checkLogin();
    initOption();
	$('#logo a').click(function(e){
		e.preventDefault();
		goURL("http://www.shanbay.com");
	});
	$('#word').keydown(function(e) {
		if(e.keyCode==13) query(document.getElementsByName("word")[0].value);
	});
	$('#search').click(function(e) {
		query(document.getElementsByName("word")[0].value);
	});
	$('#foot span').click(function(e) {
		switchGlobalEnable();
	});
	$('#feedback').click(function(e) {
		goURL("http://code.google.com/p/shanbay-chrome-extension/");
	});
});
