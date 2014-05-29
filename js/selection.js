/*
 * selection.js
 * 2012-2-21
 * 
 * 用于在网页中选择文本时弹出翻译或相关内容。
 * 需求所有网页权限。
 * 
 * ----ChangeLog----
 * TODO：
 * 选项应该从引擎配置中读取
 *  
 * 2012-2-25 Tiao Lims <dourokinga@gmail.com>
 * 为扇贝引擎添加自动播放读音的开关
 * 为全局取词增加ctrl键开关
 * 更改options.html的switchCheck方法,只有更改引擎的总开关才切换子项。
 * 
 * 2012-2-24 MalFurion.StormRage@gmail.com
 * 加入选项，现在可以配置引擎
 * 为扇贝词典加入自动添加功能的支持
 * 当焦点在密码框中时不启用搜索
 * 
 * 2012-2-21 MalFurion.StormRage@gmail.com
 * 加入英文维基引擎
 * 为谷歌翻译引擎加入发音功能
 * 若干bug修复
 * 引擎编写指南(在引擎的定义文件engines.js中)
 * 
 * 2012-2-19 MalFurion.StormRage@gmail.com
 * 加入扇贝查词引擎，并实现添加生词
 * 加入维基百科引擎，抓取结果的第一段文本和第一张图片(如果有)
 * 为扇贝查词引擎加入登录判断，添加发音功能
 * 
 * 2012-2-18 MalFurion.StormRage@gmail.com
 * 使用jQuery重写
 * 使用全局的ShanbayChromeExtension对象避免命名空间污染
 * 重构：单独抽取引擎代码，更方便扩展其他搜索引擎
 * 展示层预留样式表接口
 * 
 * 2012-2-16 MalFurion.StormRage@gmail.com
 * 加入Google Translate引擎
 */

var ShanbayChromeExtension = {}

//引擎元数据
ShanbayChromeExtension._engineMeta = []

//结果展示层的样式
ShanbayChromeExtension._resultDivClass = "shanbay_extension_popover";
ShanbayChromeExtension._engineDivClass = "shanbay_extension_result_engine";
ShanbayChromeExtension._captionDivClass = "shanbay_extension_result_caption";
ShanbayChromeExtension._contentDivClass = "shanbay_extension_result_content";

//结果展示层的选择器
ShanbayChromeExtension._resultDivId = "shanbay_extension_result";
ShanbayChromeExtension._resultDivSelector = "#"
    + ShanbayChromeExtension._resultDivId;

//鼠标停留在结果上时不响应鼠标弹起事件
ShanbayChromeExtension._isMouseOnDiv = false;

//引擎
ShanbayChromeExtension._engines = new Array();

//引擎类
ShanbayChromeExtension._Engine = function(index, meta) {
  //index: 在ShanbayChromeExtension._engines中的索引
  //meta: see ShanbayChromeExtension._engineMeta
  var attr;
  for (attr in meta) {
    this[attr] = meta[attr];
  }

  //标题和内容的选择器
  var prefix = ShanbayChromeExtension._resultDivId + "_" + this.id;
  this._engineDivId = prefix;
  this._captionDivId = prefix + "_caption";
  this._contentDivId = prefix + "_content";

  prefix = "#" + prefix;
  this._engineDivSelector = prefix;
  this._captionDivSelector = prefix + "_caption";
  this._contentDivSelector = prefix + "_content";

  //查询的文本
  this.$text = null;

  if (typeof ShanbayChromeExtension._Engine._initialized == "undefined") {
    ShanbayChromeExtension._Engine._initialized = true;

    //error handler
    ShanbayChromeExtension._Engine.prototype._onError = function(xhr, type,
        cause) {
      return (typeof this.error === "undefined" ? this.$defaultError(xhr, type,
          cause) : this.error(xhr, type, cause));
    }
  }

  //default error message
  ShanbayChromeExtension._Engine.prototype.$defaultError = function(xhr, type,
      cause) {
    return [ this.name, type + ": " + xhr.status + " " + cause ];
  }

  ShanbayChromeExtension._Engine.prototype._validateText = function(text,
      options) {
    var option = options[this.id];
    this.$option = option;

    if ((option && option.enabled === false) || this.enabled === false
        || this.filter(text) === false) {
      $(this._engineDivSelector).hide();
      return false;
    }
    return true;
  }

  //引擎的主要方法，查询并展示结果
  ShanbayChromeExtension._Engine.prototype._queryAndShow = function(text) {

    $(this._engineDivSelector).show();
    $(this._captionDivSelector).html(this.name + "<span>载入中...</span>");
    $(this._contentDivSelector).hide();
    var url = this.url.replace("{{text}}", text);
    this.$text = text;

    $.get(url, null, null, this.type).success(this.$bind("parser")).error(
        this.$bind("_onError"));
  }

  //转换查询结果并展示在自己的div中
  ShanbayChromeExtension._Engine.prototype._parseAndShow = function(data) {
    this._showResult(this.parser(data));
  }

  //展示结果，可以是字符串或jQuery对象或null，如果是null则不改动内容
  ShanbayChromeExtension._Engine.prototype._showResult = function(htmls) {
    if (!htmls)
      return;
    var selectors = [ this._captionDivSelector, this._contentDivSelector ];
    for ( var i in selectors) {
      if (htmls[i] != null)
        $(selectors[i]).empty().append(htmls[i]);
    }
    $(this._contentDivSelector).slideDown("slow");
  }

  //生成一个ID。不会自动产生不一样的ID，使用同一个suffix将返回相同ID。
  ShanbayChromeExtension._Engine.prototype.$generateId = function(suffix) {
    return this._engineDivId + '_' + suffix;
  }

  //生成一个在新窗口打开的链接，返回字符串。
  ShanbayChromeExtension._Engine.prototype.$generateLink = function(linkText,
      href) {
    return this.$$generateLink(linkText, href)[0].outerHTML;
  }

  //生成一个在新窗口打开的链接，返回jQuery对象。
  ShanbayChromeExtension._Engine.prototype.$$generateLink = function(linkText,
      href) {
    return $("<a/>").text("[" + linkText + "]").prop({
      target : "_blank",
      href : href
    });
  }

  //生成一个使用<t6>包装的标题，返回字符串。
  ShanbayChromeExtension._Engine.prototype.$generateTitle = function(title) {
    return this.$$generateTitle(title)[0].outerHTML;
  }

  //生成一个使用<t6>包装的标题，返回jQuery对象。
  ShanbayChromeExtension._Engine.prototype.$$generateTitle = function(title) {
    return $("<t6/>").text(title);
  }

  //生成一个使用<span>包装的提示信息，返回字符串。
  ShanbayChromeExtension._Engine.prototype.$generateTip = function(tipText) {
    return this.$$generateLink(linkText, href)[0].outerHTML;
  }

  //生成一个使用<span>包装的提示信息，返回jQuery对象。
  ShanbayChromeExtension._Engine.prototype.$$generateTip = function(tipText) {
    return $("<span/>").text(tipText);
  }

  //生成一个绑定了点击事件处理器的链接，返回字符串。
  //参数idSuffix可选，默认为与handlerName相同。
  ShanbayChromeExtension._Engine.prototype.$generateClickableLink = function(
      linkText, handlerName) {
    return this.$$generateClickableLink(linkText, handlerName)[0].outerHTML;
  }

  //生成一个绑定了点击事件处理器的链接，返回jQuery对象。
  //参数idSuffix可选，默认为与handlerName相同。
  ShanbayChromeExtension._Engine.prototype.$$generateClickableLink = function(
      linkText, handlerName) {
    return $("<a/>").text("[" + linkText + "]").click(this.$bind(handlerName));
  }

  //绑定this指针。
  ShanbayChromeExtension._Engine.prototype.$bind = function(handlerName) {
    var thisEngine = this;
    return (function() {
      var a = arguments;
      var htmls = eval("thisEngine." + handlerName + "(a[0], a[1], a[2])");
      thisEngine._showResult(htmls);
    });
  }
}

//初始化
ShanbayChromeExtension.initialize = function() {
  this._initEngine();
  this._initResultDiv();
}

//初始化查询引擎
ShanbayChromeExtension._initEngine = function() {
  var i;
  for (i in this._engineMeta) {
    this._engines[i] = new this._Engine(i, this._engineMeta[i]);
  }
}

//初始化展示结果用的层
ShanbayChromeExtension._initResultDiv = function() {
  //主层
  var resultDiv = document.createElement("div");
  resultDiv.id = this._resultDivId;
  resultDiv.className = this._resultDivClass;
  $("body").append(resultDiv);

  $(this._resultDivSelector).mouseover(function() {
    ShanbayChromeExtension._isMouseOnDiv = true;
  }).mouseout(function() {
    ShanbayChromeExtension._isMouseOnDiv = false;
  });

  //引擎层
  var i, engine, engineDiv, captionDiv, contentDiv;

  for (i in this._engines) {
    engine = this._engines[i];

    engineDiv = document.createElement("div");
    engineDiv.id = engine._engineDivId;
    engineDiv.className = this._engineDivClass;
    $(this._resultDivSelector).append(engineDiv);

    captionDiv = document.createElement("div");
    captionDiv.id = engine._captionDivId;
    captionDiv.className = this._captionDivClass;
    $(engine._engineDivSelector).append(captionDiv);
    $(engine._captionDivSelector);

    contentDiv = document.createElement("div");
    contentDiv.id = engine._contentDivId;
    contentDiv.className = this._contentDivClass;
    $(engine._engineDivSelector).append(contentDiv);
    $(engine._contentDivSelector);
  }
}

//获取选中的文本，如果无效，返回空
ShanbayChromeExtension._getValidSelection = function() {
  //trim
  var text = $.trim(String(window.getSelection()));

  //same word?
  if (this.lastQuery == text) {
    text = "";
  } else {
    this.lastQuery = text;
  }

  return text;
}

//监听鼠标释放事件
ShanbayChromeExtension.onSelect = function(event) {
    if (event.button != 0) //left button
	return;

  if (this._isMouseOnDiv == true) {
    return;
  }

  if (document.activeElement.type === "password") {
    return;
  }

  var text = this._getValidSelection();
  if (!text) {
    return $(this._resultDivSelector).fadeOut();
  }

  var x = event.pageX;
  var ox = document.body.offsetWidth;
  if (x > 500 && ox - x < 500) {
    x -= 500;
  }

  $(this._resultDivSelector).css("left", x + "px").css("top",
      event.pageY + 10 + "px");

  thisObj = this;
  if (!document.location.href.match(/www.shanbay.com/)) {
	  chrome.runtime.sendMessage({
		  action : "getOptions"
	  }, function(response) {
		  console.log(JSON.stringify(response));
		  if(response.global.ctrlmask&&!event.ctrlKey) //当开启ctrl取词时,只有按住ctrl键才能取词
		  return;
	  if (response.global.enabled === false)
		  return;
	  thisObj.queryAndShow(text, response);
	  });
  }
}

ShanbayChromeExtension.onQuery = function(text) {

  if (!text.length) {
    return $(this._resultDivSelector).fadeOut();
  }

  var x = Math.round(document.body.offsetWidth / 2 - 250) + window.scrollX;
  var y = 10 + window.scrollY + "px";

  $(this._resultDivSelector).css("left", x).css("top", y);

  thisObj = this;
  chrome.runtime.sendMessage({
    action : "getOptions"
  }, function(response) {
    thisObj.queryAndShow(text, response);
  });
}

ShanbayChromeExtension.queryAndShow = function(text, options) {

  var i, flag = false;
  for (i in this._engines) {
    if (this._engines[i]._validateText(text, options)) {
      flag = true;
      this._engines[i]._queryAndShow(text);
    }
  }

  if (flag === true) {
    $(this._resultDivSelector).fadeIn();
  }
}

$("body").ready(function() {
  ShanbayChromeExtension.initialize();
  $("body").mouseup(function(event) {
	  ShanbayChromeExtension.onSelect(event);
  });
  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	  console.log(request);
	  if (typeof request.querySelect != 'undefined') {
		  ShanbayChromeExtension.onQuery(request.querySelect.selectionText);
	  }
	  else if (typeof request.query != 'undefined') {
		  ShanbayChromeExtension.onQuery(request.query);
	  }
  }); 
});
