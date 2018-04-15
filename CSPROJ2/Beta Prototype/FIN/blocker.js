(function (){
	"use strict";
	
	// Initiate closures
	var then = "", rval = "";
	var fromCache = false, fullblock = false;
	var blockLists = [], types = [];
	var type = 0;
	
	// Defined closures
	var tab = window.location.toString(), anchors = document.getElementsByTagName('a')
	
	// Objects
	var master = new Object(), slave = new Object(), now = new Date(), weekFromNow = new Date(now.getTime() + 604800000);
	master.sites = [];
	now.setHours(0,0,0,0);
	
	// Indexes
	var line = 0, k = 0, j = 0, a = 0, l = 0, index = 0;
	
	// Lib functions
	function retrieve(key) {
		chrome.storage.local.get(key, function(result){
			rval = result[key];
		});	return rval;
	}
	
	function provide(slaveData) {
		chrome.runtime.onMessage.addListener(
			function(message, sender, sendResponse) {
				sendResponse(slaveData);
			}
		);
	}
	
	// Runtime functions	
	window.onload = function() {
		getLists();
		document.styleSheets[0].addRule('.FNB_link:before','content: url(https://github.com/Fdebijl/FakeNewsBlocker/raw/master/logo16_fake.png); display: inline !important; visibility: visible !important; height: 1em !important; width: 1em !important; z-index: 999999999 !important; paddhing: .3em !important; ');
	};
	
	// Retrieve all the lists as set in options. If none are set, load the default list from our Github repo.
	function getLists() {
		chrome.storage.sync.get({
			lists: "https://rawgit.com/mnares/CSPROJ2---Fake-News/master/CSPROJ2/fakenews.txt",
			blacklist: false,
			types: [1,2],
			fullblock: false
		}, function(items) {

			if (items.lists.split(/\r\n|\r|\n/).length > 1) {
				blockLists = (items.lists.split('\n'));
			} else {
				blockLists = [items.lists];
			}
			
			types = items.types;
			fullblock = items.fullblock;

			if (items.blacklist) {
				master.blacklist = items.blacklist.split("\n");
			}

			if (JSON.stringify(master) != retrieve("FakeNews_blockList")) {
				// Setting has changed since we last imported the blocklists, time to craft a new master list
				loadFile(1);
			} else {
				loadFile();	
			}	
		});
	}

	// Import the blocklists as generated by getLists
	function loadFile(skipCheck) {		
		if (retrieve("FakeNews_blocklist") != null && skipCheck !== 1) {
			then = retrieve("FakeNews_expires");
			if (then < now || typeof(then) == null) {
				loadFile(1);
			} else {
				fromCache = true;
				matchURL();
			}
		} else {
			buildList();
		}
	} 
	
	// Construct our master blocklist from all supplied URL's and the one-off blacklist
	function buildList() {
		var link = blockLists[index];
		var limit = blockLists.length;
		
		if (index === limit) {		
			chrome.storage.local.set({
				'FakeNews_blocklist': JSON.stringify(master),
				'FakeNews_expires': weekFromNow.toString()
			}, function() {
				matchURL();
			});
			
			return;
		}
		
		var reader = new XMLHttpRequest();
		reader.open('get', link, true); 
		reader.onreadystatechange = function() {		
			if (reader.readyState === 4) {
				var exar = blockLists[index].split(".");
				
				if (exar[exar.length - 1] === "json") {
					try {
						var thisList = JSON.parse(reader.responseText);
					} catch (e) {
						alert(e + " - Invalid JSON in blocklist at " + link);
					}
					
					for (j = 0; j < thisList.sites.length; j++) {
						var y = {
							"url": thisList.sites[j].url,
							"type": thisList.sites[j].type,
							"proof": thisList.sites[j].proof,
							"notes": thisList.sites[j].notes,
							"origin": blockLists[index],
							"name": thisList.name,
							"author": thisList.author,
							"version": thisList.version,
							"kind": "Advanced"
						};
						console.dir(y);
						master.sites.push(y);
					}
				} else {					
					var listArray = reader.responseText.split("\n");					
					for (k = 0; k < listArray.length; k++) {
						var x = {
							"url": (listArray[k]).split(',')[0],
							"type": (listArray[k]).split(',')[1],
							"proof": (listArray[k]).split(',')[2],
							"notes": (listArray[k]).split(',')[3],
							"origin": blockLists[index],
							"kind": "Simple"
						};
						master.sites.push(x);
					}
				}
					
				index++;
				buildList();	
			}
		};
		reader.send(null);
	}
		
	function matchURL() {
		master = fromCache ? JSON.parse(retrieve("FakeNews_blocklist")) : master;
		var lines = master.sites;
		
		// Looping over the master blocklist
		// lines: array of all lines in the master blocklist
		// line: pointer (index) for the current line
		for (line = 0; line < lines.length; line++) {
			
			var url = lines[line].url,
				type = Number(lines[line].type),
				proof = lines[line].proof,
				notes = lines[line].notes,
				origin = lines[line].origin,
				name = lines[line].name,
				version = lines[line].version,
				kind = lines[line].kind;
				
			if (url.toUpperCase() == location.host.replace('www.','').toUpperCase() && types.indexOf(type) > -1 && fullblock) {
				var blockr = document.createElement('div');
				var blockrCore = document.createElement('div');
				var blockrImage = document.createElement('img');
				var blockrButton = document.createElement('button');
				
				blockrImage.src = chrome.extension.getURL("icons/logo128_fake.png");
								
				var blockrStyle = 'display:block;position:fixed;top:0;left:0;height:100vh;width:100vw;background:#FFF;content:"";z-index:99999999999999999999999999;opacity:0.97';
				var blockrCoreStyle = 'display:flex;flex-flow: column wrap;justify-content:center;align-items: center;align-content: center;width: 100%;height: 100%;font-size: 22px;';
				var blockrImageStyle = 'margin-bottom: 10px;';
				var blockrButtonStyle = 'font-size: 14px; margin-top: 20px;';
				
				blockr.style.cssText += ';' + blockrStyle;
				blockrCore.style.cssText += ';' + blockrCoreStyle;
				blockrImage.style.cssText += ';' + blockrImageStyle;
				blockrButton.style.cssText += ';' + blockrButtonStyle;
				
				blockr.id = "FNB_blockrmodal";
				blockrCore.appendChild(blockrImage);
				blockrCore.appendChild(document.createTextNode(chrome.i18n.getMessage("Attent", url)));
				blockrButton.appendChild(document.createTextNode("Continue anyway"));
				blockrButton.id = "FNB_continueButton";
				blockrCore.appendChild(blockrButton);
				
				blockr.appendChild(blockrCore);
				document.body.appendChild(blockr);			
				
				document.getElementById("FNB_continueButton").addEventListener("click", function() {
					document.body.removeChild(document.getElementById("FNB_blockrmodal"));
				});
				
				slave.url = url;
				slave.type = type;
				slave.proof = proof;
				slave.notes = notes;
				slave.origin = origin;
				slave.name = name;
				slave.version = version;
				slave.kind = kind;
				provide(slave);
			} else if (url.toUpperCase() == location.host.replace('www.','').toUpperCase() && types.indexOf(type) > -1) {
				chrome.runtime.sendMessage({
					t: "notu", 
					l: url
				});
				
				slave.url = url;
				slave.type = type;
				slave.proof = proof;
				slave.notes = notes;
				slave.origin = origin;
				slave.name = name;
				slave.version = version;
				slave.kind = kind;
				provide(slave);
			}
			
			for (a = 0; a < anchors.length; a++) {
                if(anchors[a].href.toUpperCase() == location.host.replace('www.','').toUpperCase() && url.toUpperCase() !== location.host.replace('www.','').toUpperCase && types.indexOf(type) > -1) {
					anchors[a].className += " FNB_link"; 
					anchors[a].setAttribute('title', "Possible fake news");
				}	
			}
    	}
	}
})();