function Database(localStorage) {
  this.localStorage = localStorage;
}
Database.prototype.setMaps = function (maps) {
  this.localStorage.MAPS = JSON.stringify(maps);
};
Database.prototype.getMaps = function () {
  try{
    var maps = JSON.parse(this.localStorage.MAPS);
    if(maps instanceof Array){
      return maps;
    }
  }catch(e){
  }
  return [];
};
Database.prototype.isMatchSiteUrl = function(siteUrl,url){
  var found = this.findFavicon(url);
  return found && found.siteUrl == siteUrl;
};
Database.prototype.findFavicon = function (url) {
  if(!url) return undefined;
  var maps = this.getMaps();
  var i;
  for (i = 0; i < maps.length; i++) {
    var data = maps[i];
    if (url.indexOf(data.siteUrl) === 0) {
      data.id = data.siteUrl;
      return data;
    }
  }
  return undefined;
};
Database.prototype.findAll = function (data) {
  var maps =  this.getMaps();
  for (i = 0; i < maps.length; i++) {
    maps[i].id = maps[i].siteUrl;
  }
  return maps;
};
Database.prototype.deleteData = function (data) {
  var maps =  this.getMaps();
  var deleted = false;
  for (i = 0; i < maps.length; i++) {
    if(maps[i].siteUrl==data.id){
      maps.splice(i, 1);
      deleted = true;
      break;
    }
  }
  if(deleted){
    this.setMaps(maps);
  }
  return deleted;
};
/** update database by data.id.
 if data.id is not exists, insert data to database.
 @return true = updated, false = inserted
*/
Database.prototype.updateData = function (data) {
  var maps =  this.getMaps();
  var updated = false;
  for (i = 0; i < maps.length; i++) {
    if(maps[i].siteUrl==data.id){
      maps[i] = data;
      updated = true;
      break;
    }
  }
  if(!updated){
    maps.push(data);
  }
  this.setMaps(maps);
  return updated;
};
Database.prototype.putData = function (data) {
  var maps = this.getMaps();
  var status = "no-action";
  if (data.siteUrl && data.favIconUrl) {
    if (data.id === undefined) {
      maps.push(data);
      status = "insert";
    } else {
      if(this.updateData(data)){
        status = "update";
      }else{
        status = "insert";
      }
    }
  } else if (data.id !== undefined) {
    if(this.deleteData(data)){
      status = "delete";
    }else{
      status = "nothing";
    }
  }
  this.setMaps(maps);
  return {status:status,data:data};
};

var DB = new Database(localStorage);

var Tabs ={
  setFavIcon: function (tab,data){
    chrome.tabs.sendRequest(tab.id,{method: 'setFavIcon', favIconUrl: data.favIconUrl});
  },
  removeFavIcon: function(tab,siteUrl){
    chrome.tabs.sendRequest(tab.id,{method: 'removeFavIcon', siteUrl: siteUrl});
  },
  updateDatas: function(datas){
    chrome.tabs.query({"url":document.location.origin+"/*"},
      function(tabs){
        for(var i=0; i<tabs.length; i++){
          chrome.tabs.sendRequest(tabs[i].id,{method: 'updateDatas', datas: datas});
        }
      }
    );
  },
  refleshIfFind: function (tab){
    if(tab && tab.url){
      var data = DB.findFavicon(tab.url);
      if (data) {
        this.setFavIcon(tab,data);
      }
    }
  },
  refleshAll: function(){
    chrome.tabs.query({status:"complete"}, function(tabs) {
      for(var i=0; i<tabs.length; i++){
        this.refleshTab(tabs[i]);
      }
    });
  },
  each: function(siteUrl,callback){
    chrome.tabs.query({status:"complete"}, function(tabs) {
      for(var i=0; i<tabs.length; i++){
        if(DB.isMatchSiteUrl(siteUrl, tabs[i].url)){
          callback(tabs[i]);
        }
      }
    });
  },
  dataDeleted: function(siteUrl){
    var self = this;
    this.each(siteUrl,function(tab){
      self.removeFavIcon(tab, siteUrl);
    });
  },
  dataInserted: function(data){
    var self = this;
    this.each(data.siteUrl,function(tab){
      self.setFavIcon(tab, data);
    });
  }
};

var Listener = {
  deleteData: function (request, sender, sendResponse) {
    var deleted = DB.deleteData(request.data);
    if(deleted){
      var siteUrl = request.data.id;
      Tabs.dataDeleted(siteUrl);
      Tabs.updateDatas(DB.findAll());
    }
  },
  saveData: function (request, sender, sendResponse) {
    var data = request.data;
    if(data.id){
      Listener.deleteData(request,sender,sendResponse);
    }
    var ret = DB.putData(data);
    Tabs.dataInserted(data);
    Tabs.updateDatas(DB.findAll());
    sendResponse(ret);
  },
  setFavicon: function (request, sender, sendResponse) {
    sendResponse({data: DB.putData(request.data)});
  },
  getFavicon: function (request, sender, sendResponse) {
    sendResponse({data: DB.findFavicon(request.url), url: request.url});
  },
  loadAll: function (request, sender, sendResponse) {
    sendResponse({datas: DB.findAll()});
  },
  refleshTab: function (request, sender, sendResponse) {
    Tabs.refleshIfFind(sender.tab);
  }
};

chrome.extension.onRequest.addListener(function (request, sender, sendResponse) {
  if (Listener.hasOwnProperty(request.method)) {
    Listener[request.method](request, sender, sendResponse);
  } else {
    console.log("unknown request ",request,sender);
  }
});
chrome.management.onEnabled.addListener(function (info) {
  Tabs.refleshTab();
});
