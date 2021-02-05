// chrome.webNavigation.onHistoryStateUpdated.addListener(function(details) {
//     console.error('History change event called');
//     chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
//         console.error('Send change history event to current tab content script');
//         chrome.tabs.sendMessage(tabs[0].id, {
//             action: "historyChange",
//             data: details
//         });
//     });
// });


chrome.webNavigation.onCommitted.addListener(function(details) {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
        // console.error('Send change history event to current tab content script');
        // console.error("tabs", JSON.stringify(tabs));

        // chrome.tabs.get(tabs[0].id, function (tab){
        //     console.error('History on commited event called');
        //     console.error(JSON.stringify(tab));

        //     console.error('Send change history event to current tab content script');
        //     chrome.tabs.sendMessage(tabs[0].id, {
        //         action: "historyChange",
        //         data: tab
        //     });
        // });

        // console.error('Send change history event to current tab content script');
        chrome.tabs.sendMessage(tabs[0].id, {
            action: "historyChange",
            data: tabs[0]
        });

        // chrome.tabs.sendMessage(tabs[0].id, {
        //     action: "historyChange",
        //     data: details
        // });
    });
});