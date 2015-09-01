/*
 * 引擎元数据
 * 
 * 1. 定义引擎需要提供的属性
 * 
 * id: String, 引擎的唯一标识，将作为div的id使用，必须是有效的DOM id
 * name: String, 引擎名，加载时标题栏将显示引擎名
 * enabled: boolean, 启用开关
 * url: String, 请求地址，查询字符串使用占位符{{text}}
 * type: String, 请求返回类型，one of [html, xml, json]
 * filter: 函数，文本过滤器，返回false时不发送请求。
 *             (选中的文本text:String) -> boolean
 * parser: 函数，结果转换器，请求成功时调用，返回值将作为查询的最终结果展示。
 *             (请求返回的数据data:{type指定的类型}) -> [标题html, 正文html]
 *             返回值类型可以是HTML字符串或是jQuery对象
 * error(optional): 可选的函数，请求发生错误时调用，返回值将作为查询的最终结果展示。
 *             (xhr:XHR, type:String, 描述desc:String) -> [标题html, 正文html]
 * 
 * '''提供这些属性后引擎就可以工作了，但这样编写引擎的工作比较繁琐，
 * 下面提供了一些可以提高开发效率的工具。'''
 * 
 * 2. this指针
 * 
 * 用法：
 *    this指针可在元数据定义的函数中使用。
 * 
 * 用途：
 *  * 访问元数据
 *    如this.name可获得引擎名。还可以定义函数并使用this.{函数名}调用。
 *  
 *  * 函数间共享数据
 *    可以向this指针写入任意属性，可用于在不存在调用关系的函数间共享数据，如ajax回调。
 *    *注意* 不要使用 $ 或 _(下划线) 开头的属性名。
 *    
 *  * 访问当前上下文数据
 *    this.$text: 选中的文本
 *    this.$option: 选项
 *    
 *  * 使用辅助函数
 *    this.$defaultError(xhr, type, cause) -> [String, String]
 *            默认的错误处理器，签名与error函数一致，可用作error函数的default分支。
 *            
 *    this.$generateId(idSuffix:String) -> String
 *            返回一个加上了引擎前缀的ID，避免与原始页面上的其他元素重复。
 *            *注意* 使用相同的参数调用这个函数将获得相同的返回值。
 *            
 *    this.$generateLink(linkText:String, href:String) -> HTML String
 *    this.$$generateLink(linkText:String, href:String) -> jQuery Object
 *            生成一个跳转到指定地址的超链接。
 *            
 *    this.$generateTitle(title:String) -> HTML String
 *    this.$$generateTitle(title:String) -> jQuery Object
 *            生成标题（使用<h6>包装）。
 *    
 *    this.$generateTip(tipString:String) -> HTML String
 *    this.$$generateTip(tipString:String) -> jQuery Object
 *            生成标题栏上的提示文本（使用<span>包装）。
 *    
 * '''
 *    ** 风格指南 **
 *    虽然标题和内容可以是任意的HTML，但建议你：
 *      - 使用上述函数生成标题栏上的元素：标题、链接、提示文本
 *      - 不要修改内容的整体样式，如把所有文本染色
 * '''
 * '''更进一步，如果你希望展示结果是可以交互的，
 * 那么请留意下边列出来的工具。'''
 *    
 * 3. more effective *this* pointer
 * 
 *  * 更多的辅助函数
 *    this.$generateClickableLink(linkText:String, handlerName:String) -> HTML String
 *    this.$$generateClickableLink(linkText:String, handlerName:String) -> jQuery Object
 *            生成一个绑定了点击事件处理器的链接的html字符串。点击该链接即可触发处理器。
 *            其中，handlerName是元数据中定义的一个函数的函数名，要求签名如下：
 *                () -> [标题html, 内容html]
 *            与parser或error的返回值不同的是，这里的两个值都可以是null，
 *            返回null时将不更新相应内容。
 *            另外，也可以不返回任何值，这种情况将视为返回[null, null]
 *    
 *            *示例* 播放音频
 *            元数据中定义函数播放一段音频：
 *            play: function() { $(*音频选择器*).get().play(); }
 *            在parser中，生成一个链接：
 *            parser: function() {
 *              return [*标题* + this.$generateClickableLink("播放", "play"), 
 *                      *包含音频播放器的内容*]} //链接和播放器的位置可以自行调整，此处仅作演示
 *            最终在标题栏上将出现一个"播放"链接，点击后将播放；
 *            由于处理函数play没有返回，标题和内容将保持不变。
 *    
 *    this.$bind(handlerName: String) -> function
 *            生成一个绑定了this指针的函数对象，可用于其他元素的事件绑定，或是ajax操作的回调。
 *            *注意* JS潜规则规定了如果直接使用元数据定义的函数对象绑定事件，
 *                  事件触发时this指针将指向事件的触发者；
 *                  此函数作用之一就是将this指针修复。另外，此函数还将处理器的返回值更新到界面中。
 *            handlerName要求签名如下：
 *                (*由事件提供*) -> [标题html, 内容html] //如果绑定$.getJSON()，参数将是JSON对象
 *            
 *            *示例* generateClickableLink的实现
 *            .$$generateClickableLink = function(linkText, handlerName) {
 *              return $("<a/>").text(linkText).click(this.$bind(handlerName));
 *            }
 *            
 *            *示例* 使用ajax获取资源并更新标题
 *            请查看扇贝词典引擎中add和addCallback的实现。
 */
ShanbayChromeExtension._engineMeta = ShanbayChromeExtension._engineMeta
    .concat([
        {
          id : "shanbaydict",
          name : "扇贝词典",
          enabled : true,
          url : "http://www.shanbay.com/api/v1/bdc/search/?word={{text}}",
          urlForgot : "http://www.shanbay.com/api/v1/bdc/learning/{{id}}/",
          urlDelete : "http://www.shanbay.com/api/v1/bdc/learning/{{id}}/",
          urlAdd : "http://www.shanbay.com/api/v1/bdc/learning/",
          urlLogin : "http://www.shanbay.com/accounts/login",
          type : "json",
	      retentionTmpl: '<div class="retention-progress" style="width: 100px; display:inline-block">'+
  '<div class="retention-reviewed" style="width: 0%"> <div class="bar" style="width: 100%;">0</div> </div>'+
  '<div class="retention-left"> <div class="bar" style="width: 100%;"></div> </div></div>',
          filter : function(text) { //长度<30且为英文
            if (text.length > 30) {
              return false;
            }
            for ( var i = 0; i < text.length; i++) {
              var charCode = text.charCodeAt(i);
              if (charCode > 128 || charCode == 10) { //10: "\n"
                return false;
              }
            }
            return true;
          },
          parser : function(result) {
            if (typeof result.data.id == "undefined") {
              return [ this.name, "词典中没有找到选择的内容" ];
            }
			this.voc_id = result.data.id;
	      // 根据设置决定是否自动播放读音  :Tiao Lims
              var caption = this.getTitle(result,this.$option.autoplay);

            if (!result.data.learning_id) {
              this.result = result;

              if (this.$option.autoadd) { //自动添加
                caption = this.add()[0];
              
              } else {
                //添加单词链接的事件监听器
                caption = $().add(caption).add(
                    this.$$generateClickableLink("添加", "add"));
              }
            } else {
			  this.learning_id = result.data.learning_id;
			  var percent = Math.max(10, Math.min(result.data.retention * 100 / result.data.target_retention, 100)) + '%';
			  var retention = $(this.retentionTmpl);
			  retention.find('.retention-reviewed').css({width:percent}).find(".bar").text(result.data.retention);
              caption = $().add(caption).
				  add(retention).
				  add(this.$$generateClickableLink("我忘了", "forgot")).
				  add(this.$$generateClickableLink("删除", "delete"));
            }

            var content = result.data.definition.replace("\n", "<br/>");
			content += "<br/>";
			var en = result.data.en_definitions;
			if (en) {
				for (var i in en) {
					content += i + ". ";
					content += en[i].join(";<br/>"+i + ". ");
					content += "<br/>";
				}
			}
            return [ caption, content ];
          },
          error : function(xhr, type, cause) {
            switch (xhr.status) {
            case 200:
              return [ "扇贝词典" + this.$generateLink("登录", this.urlLogin),
                  "登录后才能查询" ];
            default:
              return this.$defaultError(xhr, type, cause);
            }
          },
          play : function() {
            $("#" + this.audioId)[0].play();
          },
          add : function() { //添加单词
            ajax_post(this.urlAdd, {id: this.voc_id, content_type: "vocabulary"}, this.$bind("addCallback"));
            return [
                $().add(this.getTitle(this.result, false)).add(
                    this.$$generateTip("添加中...")), null ]
          },
		  forgot : function() {
            ajax({
				type: "PUT",
			    url: this.urlForgot.replace("{{id}}", this.learning_id),
			    data:{retention: 1}},
				this.$bind("forgotCallback"));
            return [
                $().add(this.getTitle(this.result, false)).add(
                    this.$$generateTip("添加中...")), null ]
		  },
		  delete : function() {
            ajax({
				type: "DELETE",
			    url: this.urlDelete.replace("{{id}}", this.learning_id)},
				this.$bind("deleteCallback"));
            return [
                $().add(this.getTitle(this.result, false)).add(
                    this.$$generateTip("删除中...")), null ]
		  },
          addCallback : function(data) {
            var tip = (data.id == 0) ? "添加失败，请重试" : "添加成功";
            return [
                $().add(this.getTitle(this.result, false)).add(
                    this.$$generateTip(tip)), null ];
          },
          forgotCallback : function(data) {
            var tip = (data.status_code != 0) ? "添加失败，请重试" : "已经重新安排学习";
            return [
                $().add(this.getTitle(this.result, false)).add(
                    this.$$generateTip(tip)), null ];
          },
          deleteCallback : function(data) {
            var tip = (data.status_code != 0) ? "删除失败，请重试" : "已删除";
            return [
                $().add(this.getTitle(this.result, false)).add(
                    this.$$generateTip(tip)), null ];
          },
          getTitle : function(result, autoplay) {
            var caption = this.$$generateTitle(result.data.content);
            if (result.data.pron)
              caption.html(caption.text() + "[" + result.data.pron + "]");

            if (result.data.audio) {
              this.audioId = this.$generateId("audio");
              props = {
                id : this.audioId,
                src : result.data.audio,
              };
              if (autoplay != false) {
                props.autoplay = "autoplay";
              }
              caption = $().add(caption).add($("<audio/>").prop(props)).add(
                  this.$$generateClickableLink("发音", "play"));
            }

            return caption;
          }
        },
        {
          id : "googletran",
          name : "谷歌翻译",
          enabled : true,
          url : "http://translate.google.com/translate_a/t?client=t&text={{text}}&hl=en&sl=auto&tl=zh-CN&multires=1&otf=2&ssel=0&tsel=0&uptl=zh-CN&sc=1",
          urlHome : "http://translate.google.com",
          urlAudio : "http://translate.google.cn/translate_tts?ie=UTF-8&q={{text}}&tl={{lang}}&prev=input",
          type : "html",
          filter : function(text) {
            if (text.length > 1000) { //长度不超过1000且非中文 /^[\u4E00-\u9FA5]+$/
              return false;
            }
            if (/^[\u4E00-\u9FA5]+$/.test(text)) {
              return false;
            }
            return true;
          },
          parser : function(data) {
            var result = eval(data); //parseJSON doesn't work

            this.audioId = this.$generateId("audio");
            var caption = this.$$generateTitle("谷歌翻译").add(
                //audio标签的跨域访问问题无法解决，使用替代方案：打开发音链接
                //                $("<audio/>").prop(
                //                    {
                //                      id : this.audioId,
                //                      src : this.urlAudio.replace("{{text}}", this.$text)
                //                          .replace("{{lang}}", result[2]),
                //                    //autoplay : "autoplay"
                //                    })).add(
                //                this.$$generateClickableLink("发音", "play").add(
                this.$$generateLink("发音", this.urlAudio.replace("{{text}}",
                    this.$text).replace("{{lang}}", result[2]))).add(
                this.$$generateLink("打开", this.urlHome));

            var content = "";
            var i;

            if (!result[1]) {
              //整句翻译
              for (i in result[0]) {
                content += result[0][i][0];
              }

            } else {
              //翻译一个单词，多种释义使用表格展示
              content = "<table>";
              for (i in result[1]) {
                content += "<tr><th style=\"background-color: lightgray;\">"
                    + result[1][i][0] + "</th><td>" + result[1][i][1].join("；")
                    + "</td></tr>";
              }
              content += "</table>";
            }

            return [ caption, content ];
          },
          play : function() {
            //audio标签的跨域访问问题无法解决，使用替代方案：打开发音链接
            //此函数闲置
            $("#" + this.audioId)[0].load();
          }
        },
        {
          id : "wikizh",
          name : "维基百科",
          enabled : true,
          url : "http://zh.wikipedia.org/wiki/{{text}}",
          type : "html",
          filter : function(text) {
            if (text.length > 30) {
              return false;
            }
            if (/\n/.test(text)) {
              return false;
            }
            return true;
          },
          parser : function(data) {
            var caption = this.getTitle();

            var content;

            if ($(data).find("#disambigbox").length != 0) { //消歧义页
              content = $("<ul/>");

              $(data).find(".mw-content-ltr:first").find(".toc").remove().end() //移除目录
              .find("ul > li").each(function(index) {
                $("<li/>").text($(this).text()).appendTo(content); //left.replace(/<a[^>]*>|<\/a>/g, "");
                return index < 5;
              });

            } else {
              content = $("<div/>");

              //get image
              var img = $(data).find(".infobox:first,.thumbinner:first")
                  .filter(":first").find("img:first");
              if (img.length != 0) {
                img.prop("src", function(i, val) {
                  return val.replace(/[^\/]*\/\//, "http://");
                }).css("float", "right").css("margin", "10px")
                    .appendTo(content);
              }

              //get text
              $("<span/>").text(
                  $(data).find(".mw-content-ltr:first").children("p:first")
                      .text().replace(/\[[^\]]+\]/g, "")) //remove reference
              .appendTo(content);
            }

            return [ caption, content.html() ];
          },
          error : function(xhr, type, cause) {
            switch (xhr.status) {
            case 404:
              return [ this.getTitle(), "暂时没有这个条目" ];
            case 400:
              return [ this.name, "条目名无效，可能包含了特殊字符" ];
            default:
              return this.$defaultError(xhr, type, cause);
            }
          },
          getTitle : function() {
            return this.name
                + this.$generateLink("查看详情", this.url.replace("{{text}}",
                    this.$text));
          }
        },
        {
          id : "wikien",
          name : "WikiPedia", //meta data copied from 维基百科中文
          enabled : true,
          url : "http://en.wikipedia.org/wiki/{{text}}",
          type : "html",
          filter : function(text) {
            if (text.length > 30) {
              return false;
            }
            for ( var i = 0; i < text.length; i++) {
              var charCode = text.charCodeAt(i);
              if (charCode > 128 || charCode == 10) { //10: "\n"
                return false;
              }
            }
            return true;
          },
          parser : function(data) {
            var caption = this.getTitle();

            var content;

            if ($(data).find("#disambigbox").length != 0) { //消歧义页
              content = $("<ul/>");

              $(data).find(".mw-content-ltr:first").find(".toc").remove().end() //移除目录
              .find("ul > li").each(function(index) {
                $("<li/>").text($(this).text()).appendTo(content); //left.replace(/<a[^>]*>|<\/a>/g, "");
                return index < 5;
              });

            } else {
              content = $("<div/>");

              //get image
              var img = $(data).find(".infobox:first,.thumbinner:first")
                  .filter(":first").find("img:first");
              if (img.length != 0) {
                img.prop("src", function(i, val) {
                  return val.replace(/[^\/]*\/\//, "http://");
                }).css("float", "right").css("margin", "10px")
                    .appendTo(content);
              }

              //get text
              $("<span/>").text(
                  $(data).find(".mw-content-ltr:first").children("p:first")
                      .text().replace(/\[[^\]]+\]/g, "")) //remove reference
              .appendTo(content);
            }

            return [ caption, content.html() ];
          },
          error : function(xhr, type, cause) {
            switch (xhr.status) {
            case 404:
              return [ this.getTitle(), "暂时没有这个条目" ];
            case 400:
              return [ this.name, "条目名无效，可能包含了特殊字符" ];
            default:
              return this.$defaultError(xhr, type, cause);
            }
          },
          getTitle : function() {
            return this.name
                + this.$generateLink("查看详情", this.url.replace("{{text}}",
                    this.$text));
          }
        } ]);
init();