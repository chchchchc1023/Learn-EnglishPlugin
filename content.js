(function() {
    let queryButton, resultBox;
    let lastRequestId = 0;
    let currentRequestId = null;

    function initializeElements() {
        // 创建一个浮动的圆形查询按钮
        queryButton = document.createElement('div');
        queryButton.style.cssText = `
            position: fixed;
            z-index: 2147483647;
            width: 30px;
            height: 30px;
            border-radius: 50%;
            background-color: #007AFF;
            color: white;
            text-align: center;
            line-height: 30px;
            cursor: pointer;
            font-size: 14px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            display: none;
            font-family: Arial, sans-serif;
            user-select: none;
            transition: background-color 0.3s, transform 0.3s;
        `;
        queryButton.innerHTML = 'V';
        queryButton.title = '查询 Vocabulary.com';
        document.body.appendChild(queryButton);

        // 添加悬停效果
        queryButton.onmouseover = function() {
            this.style.backgroundColor = '#0056b3';
            this.style.transform = 'scale(1.1)';
        };
        queryButton.onmouseout = function() {
            this.style.backgroundColor = '#007AFF';
            this.style.transform = 'scale(1)';
        };

        // 创建结果显示框
        resultBox = document.createElement('div');
        resultBox.style.cssText = `
            position: fixed;
            z-index: 2147483646;
            background-color: white;
            border: none;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            display: none;
            width: 300px;
            max-height: 400px;
            overflow-y: auto;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif;
            font-size: 14px;
            line-height: 1.4;
        `;
        document.body.appendChild(resultBox);
    }

    function handleSelection(e) {
        setTimeout(() => {
            let selectedText = window.getSelection().toString().trim();
            if (selectedText.length > 0) {
                // 显示查询按钮
                queryButton.style.display = 'block';
                
                // 使用 clientX 和 clientY 来定位按钮
                queryButton.style.left = (e.clientX + 10) + 'px';
                queryButton.style.top = (e.clientY - 30) + 'px';
                
                // 为查询按钮添加点击事件
                queryButton.onclick = function(event) {
                    event.stopPropagation(); // 阻止事件冒泡
                    requestDefinition(selectedText, e.clientX, e.clientY);
                };
                console.log("Query button displayed at", e.clientX, e.clientY);
            } else {
                hideElements();
            }
        }, 10);
    }

    function handleClick(e) {
        if (e.target !== queryButton && e.target !== resultBox && !resultBox.contains(e.target)) {
            hideElements();
        }
    }

    function hideElements() {
        queryButton.style.display = 'none';
        resultBox.style.display = 'none';
    }

    function requestDefinition(word, x, y) {
        console.log("Requesting definition for:", word);
        displayLoading(x, y);
        currentRequestId = Date.now(); // 使用时间戳作为请求ID
        chrome.runtime.sendMessage({
            action: "fetchDefinition",
            word: word,
            requestId: currentRequestId
        });
    }

    function displayLoading(x, y) {
        resultBox.innerHTML = '<div style="padding: 15px;">查询中...</div>';
        resultBox.style.display = 'block';
        positionResultBox(x, y);
    }

    function displayDefinition(word, html, x, y) {
        let parser = new DOMParser();
        let doc = parser.parseFromString(html, 'text/html');
        let shortDefinition = doc.querySelector('.short');
        let longDefinition = doc.querySelector('.long');
        
        let result = `
            <div style="padding: 15px; border-bottom: 1px solid #e0e0e0;">
                <h2 style="margin: 0; font-size: 18px; color: #333;">${word}</h2>
            </div>
        `;
        if (shortDefinition) {
            result += `
                <div style="padding: 15px;">
                    <h3 style="margin: 0 0 10px 0; font-size: 16px; color: #666;">简短释义：</h3>
                    <p style="margin: 0; color: #333;">${shortDefinition.innerHTML}</p>
                </div>
            `;
        }
        if (longDefinition) {
            result += `
                <div style="padding: 15px; border-top: 1px solid #e0e0e0;">
                    <h3 style="margin: 0 0 10px 0; font-size: 16px; color: #666;">详细释义：</h3>
                    <p style="margin: 0; color: #333;">${longDefinition.innerHTML}</p>
                </div>
            `;
        }
        
        resultBox.innerHTML = result || '<div style="padding: 15px;">未找到释义</div>';
        resultBox.style.display = 'block';
        positionResultBox(x, y);
        console.log("Definition displayed");
    }

    function displayError(message, x, y) {
        resultBox.innerHTML = `<div style="padding: 15px;">${message}</div>`;
        resultBox.style.display = 'block';
        positionResultBox(x, y);
    }

    function positionResultBox(x, y) {
        const boxWidth = 300;
        const boxHeight = Math.min(resultBox.scrollHeight, 400);
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const buttonRect = queryButton.getBoundingClientRect();
        const selection = window.getSelection();
        const range = selection.getRangeAt(0);
        const selectionRect = range.getBoundingClientRect();
        
        // 尝试将结果框放在选中文本的右侧
        let left = selectionRect.right + 10;
        let top = selectionRect.top;
        
        // 如果结果框超出了视口右边界，就放在选中文本的左侧
        if (left + boxWidth > viewportWidth) {
            left = Math.max(selectionRect.left - boxWidth - 10, 0);
        }
        
        // 如果结果框超出了视口下边界，就向上移动
        if (top + boxHeight > viewportHeight) {
            top = Math.max(viewportHeight - boxHeight, 0);
        }
        
        // 确保结果框不会遮挡选中的文本
        if (top < selectionRect.bottom && left < selectionRect.right) {
            top = selectionRect.bottom + 10;
        }
        
        resultBox.style.left = `${left}px`;
        resultBox.style.top = `${top}px`;
        console.log("Result box positioned at", left, top);
    }

    function initialize() {
        if (window.self !== window.top) return; // 防止在iframe中运行
        console.log("Initializing content script");
        initializeElements();
        document.addEventListener('mouseup', handleSelection);
        document.addEventListener('click', handleClick);
        console.log("Event listeners added");
    }

    // 初始化
    initialize();

    // 理来自背景脚本的消息
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        console.log("Message received in content script:", request);
        if (request.action === "contextMenuLookup") {
            let selection = window.getSelection();
            let range = selection.getRangeAt(0);
            let rect = range.getBoundingClientRect();
            requestDefinition(request.word, rect.right, rect.top);
        } else if (request.action === "displayDefinition" && request.requestId === currentRequestId) {
            let selection = window.getSelection();
            let range = selection.getRangeAt(0);
            let rect = range.getBoundingClientRect();
            displayDefinition(request.word, request.html, rect.right, rect.top);
        } else if (request.action === "displayError" && request.requestId === currentRequestId) {
            let selection = window.getSelection();
            let range = selection.getRangeAt(0);
            let rect = range.getBoundingClientRect();
            displayError(request.message, rect.right, rect.top);
        }
        return true; // 保持消息通道开放
    });

    console.log("Content script loaded");
})();
