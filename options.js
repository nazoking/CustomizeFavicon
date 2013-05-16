/**
 script for option.html
 */
$(function() {
  function bindData(elem,data){
    elem.data("data",data);
    elem.find(".siteUrl").text(data.siteUrl);
    elem.find("input[name=dataId]").val(data.id);
    elem.find(".image").attr("src",data.favIconUrl);
    elem.appendTo("#urls").show();
  }
  /** add new row by data */
  function newRow(data){
    var elem = $("#template").clone();
    elem.removeAttr("id");
    bindData(elem,data);
    bindEvents(elem);
  }
  function getRowsBySiteUrl(siteUrl){
    return $("input[name=dataId]").filter(function(i,e){ return e.value == siteUrl; }).parents("tr");
  }
  function removeRow(siteUrl){
    getRowsBySiteUrl(siteUrl).fadeOut().remove();
  }
  function updateDatas(datas){
    for (var i=0;i<datas.length;i++) {
      newRow(datas[i]);
    }
  }
  /** add listener */
  chrome.extension.onRequest.addListener(function (request, sender, sendResponse) {
    if(request){
      switch(request.method){
        case "updateDatas":
          $("#urls").html("");
          updateDatas(request.datas);
          break;
      }
    }
  });
  // initialize
  chrome.extension.sendRequest({method: 'loadAll'}, function(res){
    if (res && res.datas) {
      updateDatas(res.datas);
    }
  } );
});