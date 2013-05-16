/** content script */
(function() {
  /** update favicon to src */
  function setFavIcon(src) {
    if(document.head){
      var link = document.querySelector("link[rel~='icon']");
      var data;
      if(!link){
        link = document.createElement('link');
        link.setAttribute("rel",'shortcut icon');
        data = {};
        document.head.appendChild(link);
      }else{
        data = link.dataset.changefaviconOrg;
        if(!data || data.setSrc != src){
          data = {
            'orgSrc' : link.getAttribute("href")
          };
        }
      }
      data.setSrc = src;
      link.dataset.changefaviconOrg = data;
      link.setAttribute("href", src);
    }
  }
  /** remove favicon if mine */
  function removeFavIcon() {
    if(document.head){
      var link = document.querySelector("link[rel~='icon']");
      if(link){
        var data = link.dataset.changefaviconOrg;
        if(data && data.orgSrc && data.setSrc == link.getAttribute("href")){
          link.setAttribute('href',data.orgSrc);
        }
      }
    }
  }
  chrome.extension.onRequest.addListener(function (request, sender, sendResponse) {
    if(request){
      switch(request.method){
        case "removeFavIcon":
          removeFavIcon();
          break;
        case "setFavIcon":
          setFavIcon(request.favIconUrl);
          break;
      }
    }
  });
  chrome.extension.sendRequest({method: 'refleshTab'});
})();