import React, { useState } from 'react';
import './App.css';

function App() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [extractedData, setExtractedData] = useState(null);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [clientOrderNumber, setClientOrderNumber] = useState('');
  const [automating, setAutomating] = useState(false);
  const [message, setMessage] = useState('');

  // Progress states
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingStage, setProcessingStage] = useState('');
  const [processingDetails, setProcessingDetails] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setMessage('');
    } else {
      setMessage('请选择PDF文件');
      setFile(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage('请先选择PDF文件');
      return;
    }

    setUploading(true);
    setExtractedData(null);
    setProcessingProgress(0);
    setProcessingDetails(null);

    // Stage 1: Uploading
    setProcessingStage('上传PDF文件中...');
    setProcessingProgress(10);

    const formData = new FormData();
    formData.append('pdf', file);

    try {
      // Stage 2: Converting
      setProcessingStage('PDF转图片处理中...');
      setProcessingProgress(30);

      // Stage 3: AI Recognition
      setTimeout(() => {
        setProcessingStage('AI智能识别中...');
        setProcessingProgress(60);
      }, 500);

      const response = await fetch('/api/upload-pdf', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        // Stage 4: Completed
        setProcessingStage('识别完成');
        setProcessingProgress(100);

        setExtractedData(result.data);
        setInvoiceNumber(result.data.invoiceNumber || '');
        setClientOrderNumber(result.data.clientOrderNumber || '');

        // Set processing details
        setProcessingDetails({
          fileName: result.fileInfo.originalName,
          fileSize: (result.fileInfo.fileSize / 1024).toFixed(2) + ' KB',
          uploadDate: new Date(result.fileInfo.uploadDate).toLocaleString('zh-CN'),
          processingMethod: result.fileInfo.processingMethod === 'vision-api' ? 'AI智能识别' : '正则表达式',
          aiModel: result.data.aiModel || '未使用',
          notes: result.data.notes || ''
        });

        setMessage('PDF处理成功！请确认识别结果。');

        // Clear progress after 2 seconds
        setTimeout(() => {
          setProcessingProgress(0);
          setProcessingStage('');
        }, 2000);
      } else {
        setProcessingProgress(0);
        setProcessingStage('');
        setMessage('PDF处理失败: ' + (result.error || '未知错误'));
      }
    } catch (error) {
      setProcessingProgress(0);
      setProcessingStage('');
      setMessage('上传失败: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleAutomation = async () => {
    if (!clientOrderNumber) {
      setMessage('Client Order Number 不能为空');
      return;
    }

    setAutomating(true);
    setMessage('正在启动自动化...');

    try {
      const response = await fetch('/api/automate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientOrderNumber,
          invoiceNumber,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setMessage('自动化执行成功！' + (result.data.message || ''));
      } else {
        setMessage('自动化失败: ' + (result.error || '未知错误'));
      }
    } catch (error) {
      setMessage('自动化失败: ' + error.message);
    } finally {
      setAutomating(false);
    }
  };

  return (
    <div className="App">
      <div className="container">
        <h1>Invoice自动化处理系统</h1>

        <div className="section">
          <h2>步骤1: 上传Invoice PDF</h2>
          <div className="upload-area">
            <input
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              disabled={uploading}
            />
            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="btn btn-primary"
            >
              {uploading ? '处理中...' : '上传并识别'}
            </button>
          </div>
          {file && <p className="file-info">已选择: {file.name}</p>}

          {/* Progress Bar */}
          {uploading && processingProgress > 0 && (
            <div className="progress-container">
              <div className="progress-info">
                <span className="progress-stage">{processingStage}</span>
                <span className="progress-percentage">{processingProgress}%</span>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${processingProgress}%` }}
                >
                  <div className="progress-shine"></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {extractedData && (
          <div className="section">
            <h2>步骤2: 确认识别结果</h2>

            <div className="form-group">
              <label>Invoice Number:</label>
              <input
                type="text"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="Invoice Number"
                className="input-field"
              />
              <span className="confidence">
                {extractedData.confidence?.invoiceNumber === 'high' ? '✓ 高置信度' : '⚠ 请手动检查'}
              </span>
            </div>

            <div className="form-group">
              <label>Client Order Number:</label>
              <input
                type="text"
                value={clientOrderNumber}
                onChange={(e) => setClientOrderNumber(e.target.value)}
                placeholder="Client Order Number"
                className="input-field"
              />
              <span className="confidence">
                {extractedData.confidence?.clientOrderNumber === 'high' ? '✓ 高置信度' : '⚠ 请手动检查'}
              </span>
            </div>

            <button
              onClick={handleAutomation}
              disabled={!clientOrderNumber || automating}
              className="btn btn-success"
            >
              {automating ? '自动化执行中...' : '确认并开始自动化'}
            </button>
          </div>
        )}

        {message && (
          <div className={`message ${message.includes('失败') || message.includes('错误') ? 'error' : 'success'}`}>
            {message}
          </div>
        )}

        <div className="info-section">
          <h3>使用说明：</h3>
          <ol>
            <li>上传包含Invoice Number和Client Order Number的PDF文件</li>
            <li>系统自动识别并显示结果，请仔细确认</li>
            <li>如有错误，可手动修改</li>
            <li>点击"确认并开始自动化"按钮启动Procore自动化流程</li>
            <li>浏览器将自动打开并执行操作</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

export default App;
