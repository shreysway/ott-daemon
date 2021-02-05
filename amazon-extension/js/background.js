
chrome.runtime.onMessage.addListener(function(request, sender) {

    if(request.type == "setCookie"){
        console.error("Inside set cookie");
        var d = new Date();
        var year = d.getFullYear();
        var month = d.getMonth();
        var day = d.getDate();
        var c = new Date(year + 10, month, day);
        var ts = Math.round(c.getTime() / 1000);
        console.error(c);
        console.error(ts);
        let details = {
            url: "https://www.primevideo.com",
            name: "lc-main-av",
            value: "en_US", //en_US
            domain: ".primevideo.com",
            expirationDate: ts 
        }; 
        chrome.cookies.set(details, function(data){
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
                console.error('Send change history event to current tab content script');
                chrome.tabs.reload(tabs[0].id);
            });
        });
    }
});