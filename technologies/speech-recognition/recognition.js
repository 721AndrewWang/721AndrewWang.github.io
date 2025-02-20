let API_KEY;

// 页面加载时显示 API Key 输入弹窗
window.onload = function () {
    showApiKeyModal();
};

function showApiKeyModal() {
    // 创建模态框 HTML
    const modalHtml = `
        <div id="apiModal" class="modal">
            <div class="modal-content">
                <h3>Please enter your API key:</h3>
                <input type="text" id="apiInput" placeholder="Enter API Key">
                <div class="modal-buttons">
                    <button id="confirmApiKey">Confirm</button>
                </div>
            </div>
        </div>
    `;

    // 插入模态框到 body
    document.body.insertAdjacentHTML("beforeend", modalHtml);

    // 获取元素
    const modal = document.getElementById("apiModal");
    const confirmBtn = document.getElementById("confirmApiKey");
    const apiInput = document.getElementById("apiInput");

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

async function sendToAssemblyAI(audioBlob, API_KEY, clipContainer) {
    try {
        // Convert to WAV if needed
        const wavBlob = await convertToWav(audioBlob);
        console.log("Uploading audio to AssemblyAI...");
  
        // Convert Blob to File
        const audioFile = new File([wavBlob], "audio.wav", { type: "audio/wav" });
  
        // Upload audio file to AssemblyAI to get an audio URL
        const uploadResponse = await fetch("https://api.assemblyai.com/v2/upload", {
            method: "POST",
            headers: {
                Authorization: API_KEY,
            },
            body: audioFile, // Directly sending the file
        });
  
        const uploadData = await uploadResponse.json();
        if (!uploadData.upload_url) {
            throw new Error("Failed to upload audio to AssemblyAI");
        }
  
        console.log("Audio uploaded successfully:", uploadData.upload_url);
  
        // Now send the audio URL to request transcription
        const transcriptResponse = await fetch("https://api.assemblyai.com/v2/transcript", {
            method: "POST",
            headers: {
                Authorization: API_KEY,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                audio_url: uploadData.upload_url,
            }),
        });
  
        const transcriptData = await transcriptResponse.json();
        console.log("AssemblyAI Response:", transcriptData);
  
        if (transcriptData.id) {
            console.log(`Job ID: ${transcriptData.id}, waiting for transcription...`);
            const transcription = await getTranscription(transcriptData.id, API_KEY);
            
            // 创建转录文本部分
            const transcriptionSection = document.createElement('div');
            transcriptionSection.className = 'transcription-section';
            
            const transcriptionTitle = document.createElement('h4');
            transcriptionTitle.textContent = 'Transcription:';
            
            const transcriptionText = document.createElement('p');
            transcriptionText.className = 'transcription-text';
            transcriptionText.textContent = transcription;
            
            transcriptionSection.appendChild(transcriptionTitle);
            transcriptionSection.appendChild(transcriptionText);
            
            // 将转录文本添加到对应的录音容器中
            clipContainer.appendChild(transcriptionSection);
        }
    } catch (error) {
        console.error("Error sending to AssemblyAI:", error);
    }
}
  
async function getTranscription(transcriptionId, API_KEY) {
    const POLL_INTERVAL = 1000; // Check every 5 seconds
    console.log(`Checking transcription status for Job ID: ${transcriptionId}`);
    while (true) {
        try {
            // Fetch the transcription job status
            const response = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptionId}`, {
                method: "GET",
                headers: { Authorization: API_KEY },
            });
  
            const data = await response.json();
  
            if (data.status === "completed") {
                console.log("Transcription completed!");
                console.log("All Assembly AI data returned:!", data);
                console.log("Transcript:", data.text);
                return data.text; // Return the transcription result
            } else if (data.status === "failed") {
                console.error("Transcription failed:", data.error);
                return null;
            } else {
                console.log(`Status: ${data.status}... Waiting.`);
                await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL)); // Wait before checking again
            }
        } catch (error) {
            console.error("Error checking transcription status:", error);
            return null;
        }
    }
}