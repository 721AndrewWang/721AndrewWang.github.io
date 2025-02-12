// 配置 API 相关信息
const API_CONFIG = {
    synthesisURL: "https://api.elevenlabs.io/v1/text-to-speech/iP95p4xoKVk53GoZ742B?output_format=mp3_44100_128"
};

let API_KEY;

// 页面加载时显示 API Key 输入弹窗
window.onload = function () {
    showApiKeyModal();
};

function showApiKeyModal() {
    const referenceApiKey = "sk_03fe11f05a10f775e208d51d12aec655b01dcb9cc2d2e1b4";

    // 创建模态框 HTML
    const modalHtml = `
        <div id="apiModal" class="modal">
            <div class="modal-content">
                <h3>Please enter your API key:</h3>
                <input type="text" id="apiInput" placeholder="Enter API Key">
                
                <div class="api-key-container">
                    <strong>Reference Key:</strong>
                    <span id="apiKeyText">${referenceApiKey}</span>
                    <button id="copyBtn">Copy</button>
                </div>

                <div class="modal-buttons">
                    <button id="confirmApiKey">Confirm</button>
                </div>
            </div>
        </div>
    `;

    // 插入模态框到 `body`
    document.body.insertAdjacentHTML("beforeend", modalHtml);

    // 获取元素
    const modal = document.getElementById("apiModal");
    const confirmBtn = document.getElementById("confirmApiKey");
    const copyBtn = document.getElementById("copyBtn");
    const apiInput = document.getElementById("apiInput");
    const apiKeyText = document.getElementById("apiKeyText");

    // 复制 API Key
    copyBtn.addEventListener("click", function () {
        navigator.clipboard.writeText(apiKeyText.textContent).then(() => {
            alert("API Key copied!");
        });
    });

    // 确认 API Key
    confirmBtn.addEventListener("click", function () {
        API_KEY = apiInput.value.trim();
        if (!API_KEY) {
            alert("API Key cannot be empty!");
            return;
        }
        modal.remove(); // 关闭模态框
    });

    modal.style.display = "block"; // 显示模态框
}

// 处理语音合成
document.getElementById("synthesizeBtn").addEventListener("click", function () {
    const inputText = document.getElementById("inputText").value;
    const submittedText = document.getElementById("submittedText");
    const loadingText = document.getElementById("loadingText");

    // 检查输入是否为空
    if (inputText.trim() === "") {
        alert("Please enter some text before synthesizing.");
        return;
    }

    // 显示加载状态
    loadingText.style.display = "block";
    submittedText.textContent = `Generating speech for: "${inputText}"`;

    fetch(API_CONFIG.synthesisURL, {
        method: "POST",
        headers: {
            "xi-api-key": API_KEY,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            text: inputText,
            model_id: "eleven_multilingual_v2",
        }),
    })
    .then((response) => {
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.blob();
    })
    .then((blob) => {
        const audioUrl = URL.createObjectURL(blob);

        // 创建音频容器
        const audioWrapper = document.createElement("div");
        audioWrapper.classList.add("audio-wrapper");

        // 创建音频播放器
        const newAudioElement = document.createElement("audio");
        newAudioElement.src = audioUrl;
        newAudioElement.controls = true;
        newAudioElement.autoplay = false;
        newAudioElement.style.display = "block";

        // 创建文本标签
        const transcriptText = document.createElement("p");
        transcriptText.classList.add("audio-text");
        transcriptText.textContent = inputText;

        // 组合音频和文本
        audioWrapper.appendChild(newAudioElement);
        audioWrapper.appendChild(transcriptText);

        // 获取音频容器
        let audioContainer = document.getElementById("audioContainer");
        if (!audioContainer) {
            audioContainer = document.createElement("div");
            audioContainer.id = "audioContainer";
            document.querySelector(".container").appendChild(audioContainer);
        }

        // 限制最多存储 5 个音频
        if (audioContainer.childElementCount >= 5) {
            audioContainer.removeChild(audioContainer.firstChild);
        }

        audioContainer.appendChild(audioWrapper);
    })
    .catch((error) => {
        console.error("Error:", error);
        alert("Failed to generate speech. Please try again.");
    })
    .finally(() => {
        loadingText.style.display = "none";
    });
});
