document.addEventListener('DOMContentLoaded', function() {
    const wordInput = document.getElementById('wordInput');
    const searchBtn = document.getElementById('searchBtn');
    const resultDiv = document.getElementById('result');

    // 添加回车键查询功能
    wordInput.addEventListener('keyup', function(event) {
        if (event.key === 'Enter') {
            lookupWord();
        }
    });

    // 点击查询按钮
    searchBtn.addEventListener('click', lookupWord);

    function lookupWord() {
        const word = wordInput.value.trim();
        if (word) {
            resultDiv.innerHTML = '正在查询...';
            fetch(`https://www.vocabulary.com/dictionary/${encodeURIComponent(word)}`)
                .then(response => response.text())
                .then(html => {
                    let parser = new DOMParser();
                    let doc = parser.parseFromString(html, 'text/html');
                    let shortDefinition = doc.querySelector('.short');
                    let longDefinition = doc.querySelector('.long');
                    
                    let result = '';
                    if (shortDefinition) {
                        result += `<div class="short-definition"><h3>简短释义：</h3>${shortDefinition.innerHTML}</div>`;
                    }
                    if (longDefinition) {
                        result += `<div class="long-definition"><h3>详细释义：</h3>${longDefinition.innerHTML}</div>`;
                    }
                    resultDiv.innerHTML = result || '未找到释义';
                })
                .catch(error => {
                    console.error('Error:', error);
                    resultDiv.innerHTML = '查询失败，请稍后再试';
                });
        }
    }

    // 处理来自 content script 的消息
    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
        if (request.action === "fillWord") {
            wordInput.value = request.word;
            lookupWord();
        }
    });
});
