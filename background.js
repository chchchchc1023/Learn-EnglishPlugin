chrome.contextMenus.create({
  id: "vocabularyLookup",
  title: "使用 Vocabulary.com 查询",
  contexts: ["selection"]
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "vocabularyLookup") {
    console.log("Context menu item clicked. Word:", info.selectionText);
    chrome.tabs.sendMessage(tab.id, {
      action: "contextMenuLookup",
      word: info.selectionText
    });
  }
});

function fetchDefinition(word, tabId, requestId) {
  console.log(`Fetching definition for "${word}" (requestId: ${requestId})`);
  fetch(`https://www.vocabulary.com/dictionary/${encodeURIComponent(word)}`)
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.text();
    })
    .then(html => {
      console.log(`Definition fetched successfully for "${word}"`);
      chrome.tabs.sendMessage(tabId, {
        action: "displayDefinition",
        html: html,
        word: word,
        requestId: requestId
      });
    })
    .catch(error => {
      console.error('Error fetching definition:', error);
      chrome.tabs.sendMessage(tabId, {
        action: "displayError",
        message: "查询失败，请稍后再试",
        requestId: requestId
      });
    });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "fetchDefinition") {
    fetchDefinition(request.word, sender.tab.id, request.requestId);
  }
  return true; // 保持消息通道开放
});

// 移除这个监听器，因为我们已经在manifest.json中声明了content_scripts
// chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => { ... });
