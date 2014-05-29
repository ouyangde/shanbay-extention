

/********************************************************/

var newWord;

function query(word){
    document.body.style.height="100px";
    document.getElementsByTagName("html")[0].style.height="100px"; //神奇的是加了这句代码就可以自适应
    waitForQuery();
    word = trim(word).toLowerCase();
    handleJSONFromURL(getAPIURL(E_QUERY_API,word),handleWord);
}


function handleWord(word){
    gWord=word;
    if(word&&word["result"]==0){//添加单词
	var w=document.createElement("div"); 
	var c =document.createElement("div");
	var other = document.createElement("div");
	//var i = document.createElement("div");	
	var t = document.createElement("span");//单词本体
	t.setAttribute("class", "wd");
	t.appendChild(document.createTextNode(word["content"]));
	w.appendChild(t);
	t = document.createElement("span");//音标
	t.setAttribute("class", "prn");
	if(word["pron"]!='')
	    t.innerHTML='['+word.pron+'] ';
	w.appendChild(t);

	if(word.audio){
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
	    audioElement.setAttribute('src', word.audio);
	}

	w.setAttribute("id", "word");
	    
	t=document.createElement("span");
	t.innerHTML=word["definition"].replace(/\n/g,"<br />"); //fixme
	t.setAttribute("class","content");
	c.appendChild(t);
	c.setAttribute("class","definition");
	
	t = document.createElement("input");
	t.setAttribute('id','interactive');
	t.setAttribute('type','button');

	other.appendChild(document.createElement('br'));
	other.setAttribute('id','other');
	
	result = document.getElementById('result');
	result.innerHTML='';
	result.appendChild(w);
	result.appendChild(c);
	result.appendChild(other);
	
    }else{  //找不到单词
	result = document.getElementById('result');
	word = document.getElementsByName("word")[0].value; //damn
	result.innerHTML='你查找的单词<span class="highlight">'+word+'</span> 没有找到<br><br>' ; 
    }
}


