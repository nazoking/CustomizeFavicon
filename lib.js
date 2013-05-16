function getValues(elm){
  var array;
  if(elm[0].tagName.toLowerCase()!='form'){
    array = $('<form>').html(elm.clone()).serializeArray();
  }else{
    array = elm.serializeArray();
  }
  var map={};
  array.forEach(function(v){
    map[v.name]=v.value;
  });
  return map;
}
function toInt(s){
  var n= s-0;
  return Number.isNaN(n) ? 0 : n;
}
function doRender(elm){
  var data = getValues(elm);
  var canvas = elm.find(".renderImage")[0];
  var img = elm.find(".favIconImage")[0];
  var img2 = elm.find(".image2")[0];
  var img2Pos = (data.image2Pos||"0").split(",");
  img2Pos[0]=toInt(img2Pos[0]);
  img2Pos[1]=toInt(img2Pos[1]);
  img2Pos[2]=toInt(img2Pos[2])||(16-img2Pos[0]);
  img2Pos[3]=toInt(img2Pos[3])||(16-img2Pos[1]);
  $(canvas).css("image-rendering: -webkit-optimize-contrast;");
  var ctx = canvas.getContext("2d");
  ctx.clearRect(0,0,16,16);
  if(img.complete && img.src != document.location.href){
    ctx.drawImage(img,0,0,16,16);
  }
  if(data.hasOwnProperty("image2Fill") && data.image2Fill !== ""){
    ctx.fillStyle = data.image2Fill;
    ctx.fillRect.apply(ctx,img2Pos);
  }
  try{
    if(img2.complete && img2.src != document.location.href){
      ctx.drawImage.apply(ctx,[img2].concat(img2Pos));
    }
  }catch(e){
    Logger.error("img2 drow error",e); // 画像が指定されていなかったりするとエラー
  }
  try{
    if(data.code){
      //eval( data.code );
    }
  }catch(e){
    alert(e);
    throw e;
  }
}
function setSiteUrls(list,siteUrl){
  var n=siteUrl,nn=siteUrl.replace(/\#.*$/,"").replace(/\?.*$/,"");
  do{
    if(/\:\/\/.+/.test(nn)){
      $('<li style="width:250px;overflow:hidden;">').append($("<a>").data("text",nn).text(nn.replace(/.*(\/[^\/]+\/?)$/,"$1"))).appendTo(list);
    }
    n=nn;
  }while(n!=(nn=n.replace(/\/[^\/]+\/?$/,"/")));
}
function bindData(elm,data){
  if(data) {
    if(data.formData){
      $.map(data.formData,function(v,name){
        var e = elm.find("*[name="+name+"]");
        switch((e.attr("type")||"").toLowerCase()){
        case "checkbox":
        case "radio":
          if(e.attr("value")==v){
            e.attr('checked','checked');
          }else{
            e.removeAttr('checked');
          }
          break;
        default:
          e.val(v);
        }
        e.trigger("change");
      });
    }
    elm.find("*[name=dataId]").val(data.id);
    var siteUrl = elm.find("*[name=siteUrl]");
    siteUrl.val(data.siteUrl);
    setSiteUrls(elm.find(".siteUrls"),data.siteUrl);
    siteUrl.trigger("change");
  }else{
    elm.find("*[name=dataId]").val(-1);
  }
}
function doSave(elm, onSaved){
  var formData = getValues(elm);
  var favIconUrl = (formData.useEdited) ? elm.find(".renderImage")[0].toDataURL() : formData.imageUrl;
  var id = formData.dataId;
  if(id<0) id=undefined;
  var data = {
    id: id,
    siteUrl: formData.siteUrl,
    formData:formData,
    favIconUrl: favIconUrl
  };
  Logger.debug("saveing",data);
  chrome.extension.sendRequest({method: 'saveData', data:data},onSaved);
}
function doDelete(elm,onSuccess){
  var id = getValues(elm).dataId;
  console.log("doDelete!",getValues(elm));
  chrome.extension.sendRequest({method: 'deleteData', data:{
    id: id
  }}, function(result){
    console.log("reuslt!",reuslt);
    if(result){
      elm.remove();
      onSuccess(result);
    }
  });
}
function bindEvents(elm, options){
  elm.find('.x-save').click(function(e){
    e.preventDefault();
    doSave(elm, options.onSaved);
  });
  elm.find('.x-delete').click(function(){
    doDelete(elm,function(res){
      Logger.debug("deleted",res);
    });
  });
  elm.find('.x-changeing-render').bind('keyup change', function(){
    doRender(elm);
  });
  elm.find('.x-fold').bind("change",function(){
    $("#"+$(this).data("foldFor")).toggle(this.checked);
  });
  elm.find('.x-image-url').bind('keyup change', function(){
    var i=$(this);
    clearTimeout(i.data("updateImageTimer"));
    i.data("updateImageTimer",setTimeout(function() {
      var img = elm.find("."+i.data("urlDraw"));
      var src = i.val();
      if(img.data("src")!=src){
        img.attr("src",src);
        img.data("src",src);
      }
    },400));
  });
  var doRenderFunction = function(){ doRender(elm); };
  elm.find(".x-combo-box").delegate("li a","click",function(){
    $(this).parents(".x-combo-box").next("input").val($(this).data("text"));
  });
  elm.find(".x-render-resource").each(function(i,e){
    switch(e.tagName){
      case "BUTTON":
        $(e).bind('click',doRenderFunction);
        break;
      case "IMG":
        $(e).bind('load',doRenderFunction);
        break;
      case "INPUT":
        $(e).bind('keyup change',doRenderFunction);
        break;
      default:
        alert("unknown tag "+e.tagName);
    }
  });
  elm.find("select[name=siteUrls]").change(function(){
    elm.find('input[name=siteUrl]').val($(this).val());
  });
}