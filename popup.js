$(function() {
  var elm = $("#newUrl");
  bindEvents(elm,{
    onSaved:function(res){
      Logger.debug("saved",res.status,res.data);
      window.close();
  }});
  chrome.tabs.query({active: true, currentWindow: true}, function(current) {
    var tab = current[0];
    chrome.extension.sendRequest({method: 'getFavicon', url:tab.url }, function(res){
      bindData(elm,res.data || {id:-1, siteUrl: res.url, formData: {imageUrl:tab.favIconUrl} });
    } );
  });
});