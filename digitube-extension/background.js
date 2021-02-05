/*--------------------------------------------------------------
>>> BACKGROUND:
----------------------------------------------------------------
1.0 Global variables
2.0 Functions
3.0 Context menu items
4.0 Message listener
5.0 Storage change listener
6.0 Initialization
--------------------------------------------------------------*/

/*-----------------------------------------------------------------------------
1.0 Global variables
-----------------------------------------------------------------------------*/
const YOUTUBE_REGEX = /^https?:\/\/(\w*.)?youtube.com/i
const YOUTUBE_AD_REGEX = /(doubleclick\.net)|(adservice\.google\.)|(youtube\.com\/api\/stats\/ads)|(&ad_type=)|(&adurl=)|(-pagead-id.)|(doubleclick\.com)|(\/ad_status.)|(\/api\/ads\/)|(\/googleads)|(\/pagead\/gen_)|(\/pagead\/lvz?)|(\/pubads.)|(\/pubads_)|(\/securepubads)|(=adunit&)|(googlesyndication\.com)|(innovid\.com)|(tubemogul\.com)|(youtube\.com\/pagead\/)|(google\.com\/pagead\/)|(flashtalking\.com)|(googleadservices\.com)|(s0\.2mdn\.net\/ads)|(www\.youtube\.com\/ptracking)|(www\.youtube\.com\/pagead)|(www\.youtube\.com\/get_midroll_)|(www\.youtube\.com\/api\/stats)/
const YOUTUBE_ANNOTATIONS_REGEX = /^https?:\/\/(\w*.)?youtube\.com\/annotations_invideo\?/
const tabTracker = new Set();
const log = () => {};
let isFirst = true;

var locale_code = 'en',
    browser_icon = false;


/*-----------------------------------------------------------------------------
2.0 Functions
-----------------------------------------------------------------------------*/

function isset(variable) {
    if (typeof variable === 'undefined' || variable === null) {
        return false;
    }

    return true;
}

function getTranslations() {
    var xhr = new XMLHttpRequest();

    xhr.addEventListener('load', function() {
        if (chrome && chrome.tabs) {
            chrome.tabs.query({}, function(tabs) {
                for (var i = 0, l = tabs.length; i < l; i++) {
                    if (tabs[i].hasOwnProperty('url')) {
                        chrome.tabs.sendMessage(tabs[i].id, {
                            name: 'translation_response',
                            value: xhr.responseText
                        });
                    }
                }
            });
        }

        chrome.runtime.sendMessage({
            name: 'translation_response',
            value: xhr.responseText
        });
    });

    xhr.open('POST', '../_locales/' + locale_code + '/messages.json', true);
    xhr.send();
}

function browserActionIcon() {
    if (browser_icon === 'always') {
        chrome.browserAction.setIcon({
            path: 'icons/32.png'
        });
    } else {
        chrome.browserAction.setIcon({
            path: 'icons/32g.png'
        });
    }
}


/*-----------------------------------------------------------------------------
3.0 Context menu items
-----------------------------------------------------------------------------*/

chrome.contextMenus.removeAll();

// chrome.contextMenus.create({
//     id: '1111',
//     title: 'Donate',
//     contexts: ['browser_action']
// });

// chrome.contextMenus.create({
//     id: '1112',
//     title: 'Rate me',
//     contexts: ['browser_action']
// });

// chrome.contextMenus.create({
//     id: '1113',
//     title: 'GitHub',
//     contexts: ['browser_action']
// });

chrome.contextMenus.onClicked.addListener(function(event) {
    if (event.menuItemId === '1111') {
        window.open('http://www.improvedtube.com/donate');
    } else if (event.menuItemId === '1112') {
        window.open('https://chrome.google.com/webstore/detail/improvedtube-for-youtube/bnomihfieiccainjcjblhegjgglakjdd');
    } else if (event.menuItemId === '1113') {
        window.open('https://github.com/ImprovedTube/ImprovedTube');
    }
});


/*-----------------------------------------------------------------------------
4.0 Message listener
-----------------------------------------------------------------------------*/

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (isset(request) && typeof request === 'object') {
        if (request.action === 'PAGE_READY') {
            sendResponse({ 
                is_first: isFirst
            });
            if(isFirst){
                isFirst = false;
                // checkCookie(function(isReload) {
                    chrome.tabs.reload(sender.tab.id, {
                        bypassCache: true
                    });
                // });
            } //else {
            //     console.log("Check cookie two");
            //     checkCookie(function(){});
            // }
        }
        if (request.enabled === true && browser_icon !== 'always') {
            chrome.browserAction.setIcon({
                path: 'icons/32.png',
                tabId: sender.tab.id
            });
        }

        if (request.name === 'translation_request') {
            getTranslations();
        }

        if (request.name === 'improvedtube-analyzer') {
            let data = request.value,
                date = new Date().toDateString(),
                hours = new Date().getHours() + ':00';

            chrome.storage.local.get(function(items) {
                if (!items.analyzer) {
                    items.analyzer = {};
                }

                if (!items.analyzer[date]) {
                    items.analyzer[date] = {};
                }

                if (!items.analyzer[date][hours]) {
                    items.analyzer[date][hours] = {};
                }

                if (!items.analyzer[date][hours][data]) {
                    items.analyzer[date][hours][data] = 0;
                }

                items.analyzer[date][hours][data]++;

                chrome.storage.local.set({
                    analyzer: items.analyzer
                });
            });
        }

        if (request.name === 'improvedtube-blacklist') {
            chrome.storage.local.get(function(items) {
                if (!items.blacklist || typeof items.blacklist !== 'object') {
                    items.blacklist = {};
                }

                if (request.data.type === 'channel') {
                    if (!items.blacklist.channels) {
                        items.blacklist.channels = {};
                    }

                    items.blacklist.channels[request.data.id] = {
                        title: request.data.title,
                        preview: request.data.preview
                    };
                }

                if (request.data.type === 'video') {
                    if (!items.blacklist.videos) {
                        items.blacklist.videos = {};
                    }

                    items.blacklist.videos[request.data.id] = {
                        title: request.data.title
                    };
                }

                chrome.storage.local.set({
                    blacklist: items.blacklist
                });
            });
        }

        if (request.name === 'download') {
            chrome.permissions.request({
                permissions: ['downloads'],
                origins: ['https://www.youtube.com/*']
            }, function(granted) {
                if (granted) {
                    try {
                        let blob = new Blob([JSON.stringify(request.value)], {
                            type: 'application/json;charset=utf-8'
                        });

                        chrome.downloads.download({
                            url: URL.createObjectURL(blob),
                            filename: request.filename,
                            saveAs: true
                        });
                    } catch (err) {
                        chrome.runtime.sendMessage({
                            name: 'dialog-error',
                            value: err
                        });
                    }
                } else {
                    chrome.runtime.sendMessage({
                        name: 'dialog-error',
                        value: 'permissionIsNotGranted'
                    });
                }
            });
        }

        if (isset(request.export)) {
            chrome.storage.local.get(function(data) {
                chrome.permissions.request({
                    permissions: ['downloads'],
                    origins: ['https://www.youtube.com/*']
                }, function(granted) {
                    if (granted) {
                        var blob = new Blob([JSON.stringify(data)], {
                                type: 'application/octet-stream'
                            }),
                            date = new Date();

                        chrome.downloads.download({
                            url: URL.createObjectURL(blob),
                            filename: 'improvedtube_' + (date.getMonth() + 1) + '_' + date.getDate() + '_' + date.getFullYear() + '.json',
                            saveAs: true
                        });
                    }
                });
            });
        }
    }
});


/*-----------------------------------------------------------------------------
5.0 Storage change listener
-----------------------------------------------------------------------------*/

chrome.storage.onChanged.addListener(function(changes) {
    if (isset(changes.improvedtube_language)) {
        locale_code = changes.improvedtube_language.newValue;
    }

    if (isset(changes.improvedtube_browser_icon)) {
        browser_icon = changes.improvedtube_browser_icon.newValue;
    }

    browserActionIcon();
});


/*-----------------------------------------------------------------------------
6.0 Initialization
-----------------------------------------------------------------------------*/

chrome.storage.local.get(function(items) {
    var version = chrome.runtime.getManifest().version;

    if (isset(items.improvedtube_language)) {
        locale_code = items.improvedtube_language;
    }

    if (isset(items.improvedtube_browser_icon)) {
        browser_icon = items.improvedtube_browser_icon;
    }

    browserActionIcon();
});


// Find Youtube Tabs and add them to the tabTracker
chrome.webRequest.onBeforeRequest.addListener(({ tabId, url }) => {
    if (YOUTUBE_REGEX.test(url)) {
      tabTracker.add(tabId)
    } else {
      tabTracker.delete(tabId)
    }
  }, {
      urls: [ 'http://*/*', 'https://*/*' ],
      types: [ 'main_frame' ]
    }
);

// Block ad/annotation request inside youtube tabs
chrome.webRequest.onBeforeRequest.addListener(({ tabId, url }) => {
    // Check if youtube tab
    if (!tabTracker.has(tabId)) {
      return
    }
  
    if (YOUTUBE_AD_REGEX.test(url)) {
      log('%cBLOCK AD', 'color: red;', url)
      return { cancel: true }
    }
  
    if (YOUTUBE_ANNOTATIONS_REGEX.test(url)) {
      log('%cBLOCK ANNOTATION', 'color: red;', url)
      return { cancel: true }
    }
  
    // log('%cALLOW', 'color: green;', url)
  }, {
      urls: ['http://*/*', 'https://*/*'],
      types: [
        'script',
        'image',
        'xmlhttprequest',
        'sub_frame'
      ]
    }, ['blocking']
);

function checkCookie (callback) {
    let cookieCount = {
        count: 0,
        visited: 0
    };
    chrome.cookies.get({
        url: "https://*.youtube.com/",
        name: "CONSENT"
    }, function(data){
        console.debug('Youtube all cookies:', data);
        cookieCount.visited += 1;
        if(data === null || !data.value.includes("YES+")) {
            cookieCount.count += 1;
            setCookie(cookieCount, ".youtube.com", callback)
        } else if(cookieCount.visited === 3) {
            callback(false)
        }
    });

    chrome.cookies.get({
        url: "https://*.google.fr/",
        name: "CONSENT"
    }, function(data){
        console.debug('Youtube all cookies:', data);
        cookieCount.visited += 1;
        if(data === null || !data.value.includes("YES+")) {
            cookieCount.count += 1;
            setCookie(cookieCount, ".google.fr", callback)
        } else if(cookieCount.visited === 3) {
            callback(false)
        }
    });

    chrome.cookies.get({
        url: "https://*.google.com/",
        name: "CONSENT"
    }, function(data){
        console.debug('Youtube all cookies:', data);
        cookieCount.visited += 1;
        if(data === null || !data.value.includes("YES+")) {
            cookieCount.count += 1;
            setCookie(cookieCount, ".google.com",callback)
        } else if(cookieCount.visited === 3) {
            callback(false)
        }
    });
}

function setCookie (cookieCount, domain, callback) {
    var d = new Date();
    var year = d.getFullYear();
    var month = d.getMonth();
    var day = d.getDate();
    var c = new Date(year + 18, month, day);
    var ts = Math.round(c.getTime() / 1000);
    console.error(c);
    console.error(ts);
    let details = {
        url: "https://www" + domain,
        name: "CONSENT",
        value: "YES+FR.en-GB+V9+BX",
        domain: domain,
        expirationDate: ts 
    };
    console.log("cookieCount", cookieCount);
    chrome.cookies.set(details, function(data){
        cookieCount.count -= 1;
        console.log("cookieCount", cookieCount);
        if(cookieCount.count === 0) {
            callback();
            chrome.tabs.query({ active: true, currentWindow: true }, function(tabs){
                console.error('Send change history event to current tab content script', tabs);
                // setTimeout(function() {
                    console.log("Reloading tabs", tabs);
                    chrome.tabs.reload(tabs[0].id);
                /*}, 1000);*/
            });
        }
    });

    chrome.cookies.set({
        url: "https://www" + domain,
        name: "VISITOR_INFO1_LIVE",
        value: "OPd7dm8wick",
        domain: ".youtube.com",
        expirationDate: ts 
    }, function(data){
        console.log("VISITOR_INFO1_LIVE cookie set");
    });
}