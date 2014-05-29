/*
learning_id, 如果用户之前保存过该单词，那么就存在对应的词汇学习记录（Learning）实例，会返回它的id；注意词汇学习记录实例和词汇实例的id是不同的；如果没有相应词汇学习记录，那么这个返回值为0，同时应用可以提示用户添加该单词
voc:词汇实例
    en_definitions: object, 一个Json Dictionary 对象，索引为词性，值为英语解释
    definition: string, 词汇的中文解释
    content: string, 词汇的内容，也就是单词本身
    content_id: int, 词汇实例的id
    content_type: vocabulary|sentence, 只可能为两个字符串值，'vocabulary'或者'sentence'，目前尚不支持'sentence'
    pron:string, 用国际音标表示的单词发音
    audio:string, 词汇的音频文件

*/

var  QUERY_API=host+'/api/word/{{word}}';
var ADD_WORD_API=host+'/api/learning/add/{{word}}';
var ADD_EXAMPLE_API = host+'/api/example/add/{{learning_id}}?sentence={{sentence}}&translation={{translation}}';

var gWord;

function query(word){
	/*
	chrome.tabs.query({active: true, currentWindow: true, windowType:"normal"}, function(tab) {
		console.log(tab);
		chrome.tabs.sendMessage(tab[0].id, {query:word}, function(data) {});
	});
	return;
	*/
    document.body.style.height="100px";
    document.getElementsByTagName("html")[0].style.height="100px"; //神奇的是加了这句代码就可以自适应
    waitForQuery();
    word = trim(word).toLowerCase();
    handleJSONFromURL(getAPIURL(QUERY_API,word),handleWord);
}

function handleWord(word){
    gWord=word;
    if(word.voc){//添加单词
	var w=document.createElement("div"); 
	var c =document.createElement("div");
	var other = document.createElement("div");
	var i = document.createElement("div");

	var t = document.createElement("span");//单词本体
	t.setAttribute("class", "wd");
	t.appendChild(document.createTextNode(word.voc["content"]));
	w.appendChild(t);
	t = document.createElement("span");//音标
	t.setAttribute("class", "prn");
	if(word.voc["pron"]!='')
	    t.innerHTML='['+word.voc.pron+'] ';
	w.appendChild(t);

	if(word.voc.audio){
	    t = document.createElement("img");//播放读音
	    t.setAttribute("src", "/img/SpeakerOffA20.png");
	    t.setAttribute("title", "发音");
	    var t1 =t ;
	    t =document.createElement("a");
	    t.setAttribute("href", "#");
	    t.setAttribute("onclick", "play_single_sound();");
	    t.appendChild(t1);
	    t1 = t;
	    t = document.createElement("span");
	    t.appendChild(t1);
	    w.appendChild(t);
	    var audioElement = document.getElementById('sound');
	    audioElement.removeAttribute('src');
	    audioElement.setAttribute('src', word.voc.audio);
	}

	w.setAttribute("id", "word");
	    
	t=document.createElement("span");
	t.innerHTML=word.voc["definition"].replace(/\n/g,"<br />"); //fixme
	t.setAttribute("class","content");
	c.appendChild(t);
	c.setAttribute("class","definition");
	
	t = document.createElement("input");
	t.setAttribute('id','interactive');
	t.setAttribute('type','button');
	if(!word.learning_id){
	    t.onclick=function(){save(word)};
	    t.setAttribute('value','添加单词');
	    t.setAttribute('title','单击添加新词');
	    i.appendChild(t);
	    
	}else{
	    t.onclick=function(){goURL('http://shanbay.com/learning/'+word.learning_id +'/')};
	    t.setAttribute('value','查看');
	    t.setAttribute('title','单击前往练习');
	    var t1 = document.createElement('input');
	    t1.setAttribute('type','button');
	    t1.setAttribute('id','example');
	    t1.setAttribute('value','添加例句');
	    t1.setAttribute('title','为当前单词添加例句');
	    t1.onclick=showExample;
	    i.appendChild(t);
	    i.appendChild(t1);
	}
	i.setAttribute('id','btns');

	other.appendChild(document.createElement('br'));
	other.setAttribute('id','other');
	
	result = document.getElementById('result');
	result.innerHTML='';
	result.appendChild(w);
	result.appendChild(c);
	result.appendChild(other);
	//
	
	result.appendChild(i);
    }else{  //找不到单词
	result = document.getElementById('result');
	word = document.getElementsByName("word")[0].value; //damn
	result.innerHTML='你查找的单词<span class="highlight">'+word+'</span> 没有找到<br><br>' ; 
	result.innerHTML+= ('<input type="button" onclick="goURL(&quot;http://shanbay.com/search/fail/'+escape(word)+'/&quot;)" value="添加" title="添加为短语或句子">');
    }
}


function save(word){
     waitForQuery();
    
    handleJSONFromURL(getAPIURL(ADD_WORD_API,word.voc.content),
		      function(result){ //handle addword
			  if(result.id){
			      word.learning_id=result.id;
			      handleWord(word);
			  }else{
			      alert(":'( 添加失败！");
			  }
		      });
}

function showExample(){
    var btns = document.getElementById('btns');
    var t = document.createElement('input');
    t.setAttribute('type','button');
    t.setAttribute('id','cnclex');
    t.setAttribute('value','取消');
    t.onclick=cancelAddExample;
    btns.appendChild(t);
    document.getElementById('example').onclick=addExample;
    var exdiv = document.getElementById('exdiv');
    if(!exdiv){
	exdiv = document.createElement('div');
	exdiv.setAttribute('id','exdiv');
    }
    exdiv.innerHTML ='<textarea class="raw" id="enex-box" onfocus=" firstFocus(this)" >添加包含'+gWord.voc.content+' 一词的例句。</textarea><textarea class="raw" id="cnex-box" onfocus=" firstFocus(this)" >请提供译文。</textarea>';
    document.getElementById('other').appendChild(exdiv);
}

function addExample(){
    var error =function(info){
	var etext = document.getElementById('exerr');
	if(!etext){
	    etext= document.createElement('span');
	    etext.setAttribute('id','exerr');
	    document.getElementById('exdiv').appendChild(etext);
	}
	etext.innerHTML = info;
    };
    handleJSONFromURL(
	getAPIURL(ADD_EXAMPLE_API,
				gWord.learning_id,
				document.getElementById('enex-box').value,
				document.getElementById('cnex-box').value
		 ),
	function(result){
	    if(result.example_status){
		switch(result.example_status){
		case 1:
		    cancelAddExample();
		    return;
		case -1:
		    error('指定词汇学习记录实例不存在，或者用户无权查看其内容');
		    return;
		case 0:
		    error('例句或者译文的长度为0');
		    return;
		case 100:
		    error('例句未包含指定原词，或者它的有效变体');
		    return;
		case 300:
		    error('例句及其译文总长超过300个字符');
		    return;
		}
	    }
		}
    );
    
}

function cancelAddExample(){
    document.getElementById('exdiv').innerHTML='';
    document.getElementById('example').onclick=showExample;
    document.getElementById('btns').removeChild(document.getElementById('cnclex'));
}

function firstFocus(elemt){
    if(elemt instanceof HTMLTextAreaElement){
	elemt.value='';
	elemt.onfocus=null;
	elemt.setAttribute("class","exta");
    }
}





//未做错误处理,参数以{{.+}}标记
function getAPIURL(api,args){
    var i, result=api,lens = arguments.length;
    for(i=1;i<lens;i++){
	result = result.replace(/{{.+?}}/, arguments[i]);
    }
    return result;
    
}

