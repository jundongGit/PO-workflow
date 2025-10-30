import React, { useState, useEffect, useRef } from 'react';
import './App.css';

function App() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [clientOrderNumber, setClientOrderNumber] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [originalInvoiceNumber, setOriginalInvoiceNumber] = useState('');
  const [originalClientOrderNumber, setOriginalClientOrderNumber] = useState('');
  const [originalTotalAmount, setOriginalTotalAmount] = useState('');
  const [automating, setAutomating] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('info');
  const [fileId, setFileId] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [showPreview, setShowPreview] = useState(true);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [logs, setLogs] = useState([]);
  const [showSteps, setShowSteps] = useState(false);
  const [steps, setSteps] = useState([
    { id: 1, text: '上传 PDF 文件', status: 'pending' },
    { id: 2, text: 'AI 提取发票信息', status: 'pending' },
    { id: 3, text: '浏览器自动化处理', status: 'pending' },
    { id: 4, text: '完成', status: 'pending' }
  ]);
  const [processingProgress, setProcessingProgress] = useState(0);

  const fileInputRef = useRef(null);
  const logConsoleRef = useRef(null);

  // Connect to log stream on mount
  useEffect(() => {
    const eventSource = new EventSource('http://localhost:3001/api/automation-logs');

    eventSource.onopen = () => {
      console.log('SSE connection opened');
    };

    eventSource.onmessage = (event) => {
      console.log('SSE message received:', event.data);
      const data = JSON.parse(event.data);
      if (data.type === 'log') {
        addLog(data);
      }
    };

    eventSource.onerror = (error) => {
      console.error('Log stream error:', error);
      console.error('EventSource readyState:', eventSource.readyState);
    };

    return () => {
      console.log('Closing SSE connection');
      eventSource.close();
    };
  }, []);

  // Auto scroll logs to bottom
  useEffect(() => {
    if (logConsoleRef.current) {
      logConsoleRef.current.scrollTop = logConsoleRef.current.scrollHeight;
    }
  }, [logs]);

  const addLog = (logData) => {
    setLogs(prevLogs => {
      const newLogs = [...prevLogs, logData];
      return newLogs.slice(-100); // Keep last 100 entries
    });
  };

  const updateStep = (stepId, status) => {
    setSteps(prevSteps =>
      prevSteps.map(step =>
        step.id === stepId ? { ...step, status } : step
      )
    );
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    handleFile(droppedFile);
  };

  const handleFileInputChange = (e) => {
    const selectedFile = e.target.files[0];
    handleFile(selectedFile);
  };

  const handleFile = (selectedFile) => {
    if (!selectedFile) return;

    if (selectedFile.type !== 'application/pdf') {
      showMessage('请选择 PDF 文件', 'error');
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      showMessage('文件大小不能超过 10MB', 'error');
      return;
    }

    setFile(selectedFile);
    setMessage('');
  };

  const handleUpload = async () => {
    if (!file) {
      showMessage('请先选择PDF文件', 'error');
      return;
    }

    setUploading(true);
    setProcessingProgress(0);
    setShowSteps(false);

    try {
      setProcessingProgress(10);
      showMessage('正在上传 PDF 文件...', 'info');

      const formData = new FormData();
      formData.append('pdf', file);

      setProcessingProgress(30);
      showMessage('PDF转图片处理中...', 'info');

      const response = await fetch('/api/upload-pdf', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setProcessingProgress(50);
        showMessage('AI 提取完成！请确认信息...', 'success');

        setInvoiceNumber(result.data.invoiceNumber || '');
        setClientOrderNumber(result.data.clientOrderNumber || '');
        setTotalAmount(result.data.totalAmountExGST || '');
        setOriginalInvoiceNumber(result.data.invoiceNumber || '');
        setOriginalClientOrderNumber(result.data.clientOrderNumber || '');
        setOriginalTotalAmount(result.data.totalAmountExGST || '');
        setFileId(result.fileInfo.id);

        // Load PDF preview
        const url = URL.createObjectURL(file);
        setPdfUrl(url);

        setShowConfirmation(true);
        setProcessingProgress(100);
        showMessage('✅ 信息提取完成！请确认并修改（如需要）', 'success');

        setTimeout(() => {
          setProcessingProgress(0);
        }, 2000);
      } else {
        setProcessingProgress(0);
        showMessage('PDF处理失败: ' + (result.error || '未知错误'), 'error');
      }
    } catch (error) {
      setProcessingProgress(0);
      showMessage('上传失败: ' + error.message, 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleAutomation = async () => {
    if (!clientOrderNumber) {
      showMessage('Client Order Number 不能为空', 'error');
      return;
    }

    setAutomating(true);
    setShowSteps(true);
    setProcessingProgress(0);
    setLogs([]); // Clear previous logs

    // Step 1 & 2 already completed
    updateStep(1, 'completed');
    updateStep(2, 'completed');
    setProcessingProgress(50);

    try {
      // Step 3: Automation
      updateStep(3, 'active');
      showMessage(`发票号: ${invoiceNumber}\n订单号: ${clientOrderNumber}\n正在启动 Procore 自动化...`, 'info');

      const response = await fetch('/api/automate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientOrderNumber,
          invoiceNumber,
          totalAmount,
          fileId,
        }),
      });

      const result = await response.json();

      if (result.success) {
        updateStep(3, 'completed');
        setProcessingProgress(90);

        // Step 4: Complete
        updateStep(4, 'completed');
        setProcessingProgress(100);

        showMessage(
          `✅ 自动化完成！\n发票号: ${invoiceNumber}\n订单号: ${clientOrderNumber}\n已完成步骤: ${result.data.completedSteps?.join(', ') || '所有步骤'}`,
          'success'
        );

        setShowConfirmation(false);

        // Reset after 5 seconds
        setTimeout(() => {
          handleClear();
        }, 5000);
      } else {
        showMessage('自动化失败: ' + (result.error || '未知错误'), 'error');
      }
    } catch (error) {
      showMessage('自动化失败: ' + error.message, 'error');
    } finally {
      setAutomating(false);
    }
  };

  const handleClear = () => {
    setFile(null);
    setInvoiceNumber('');
    setClientOrderNumber('');
    setTotalAmount('');
    setOriginalInvoiceNumber('');
    setOriginalClientOrderNumber('');
    setOriginalTotalAmount('');
    setFileId(null);
    setMessage('');
    setShowConfirmation(false);
    setShowSteps(false);
    setProcessingProgress(0);
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
      setPdfUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setSteps([
      { id: 1, text: '上传 PDF 文件', status: 'pending' },
      { id: 2, text: 'AI 提取发票信息', status: 'pending' },
      { id: 3, text: '浏览器自动化处理', status: 'pending' },
      { id: 4, text: '完成', status: 'pending' }
    ]);
  };

  const handleCancel = () => {
    setShowConfirmation(false);
    setMessage('');
    setShowSteps(false);
    setProcessingProgress(0);
  };

  const showMessage = (msg, type) => {
    setMessage(msg);
    setMessageType(type);
  };

  const getStepIcon = (status) => {
    if (status === 'completed') return '✅';
    if (status === 'active') return '⏳';
    return '⏳';
  };

  return (
    <div className="App">
      <div className="container">
        <h1>📄 Invoice PDF 自动化上传</h1>
        <p className="subtitle">上传 PDF 发票，自动提取信息并同步到 Procore</p>

        <div
          className={`upload-area ${dragOver ? 'dragover' : ''}`}
          onClick={() => fileInputRef.current.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="upload-icon">📁</div>
          <div className="upload-text">点击或拖拽 PDF 文件到这里</div>
          <div className="upload-hint">仅支持 PDF 格式，最大 10MB</div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleFileInputChange}
          style={{ display: 'none' }}
        />

        {file && (
          <div className="file-info show">
            <div className="file-name">📄 {file.name}</div>
            <div className="file-size">{(file.size / 1024).toFixed(2)} KB</div>
          </div>
        )}

        {pdfUrl && (
          <div className="pdf-preview-area show">
            <div className="pdf-preview-title">
              PDF 预览
              <button
                className="pdf-preview-toggle"
                onClick={() => setShowPreview(!showPreview)}
              >
                {showPreview ? '收起 ▲' : '展开 ▼'}
              </button>
            </div>
            {showPreview && (
              <div className="pdf-preview-container">
                <iframe src={pdfUrl} title="PDF Preview"></iframe>
              </div>
            )}
          </div>
        )}

        {showConfirmation && (
          <div className="confirmation-area show">
            <div className="confirmation-title">请确认提取的信息</div>
            <div className="extracted-data">
              <div className="data-field">
                <div className="data-label">Invoice Number (发票号)</div>
                <input
                  type="text"
                  className={`data-input ${invoiceNumber !== originalInvoiceNumber ? 'modified' : ''}`}
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  placeholder="例如: #335397"
                />
              </div>
              <div className="data-field">
                <div className="data-label">Client Order Number (订单号/PO号)</div>
                <input
                  type="text"
                  className={`data-input ${clientOrderNumber !== originalClientOrderNumber ? 'modified' : ''}`}
                  value={clientOrderNumber}
                  onChange={(e) => setClientOrderNumber(e.target.value)}
                  placeholder="例如: KIWIWASTE-006"
                />
              </div>
              <div className="data-field">
                <div className="data-label">Total Amount Ex GST (不含税总金额)</div>
                <input
                  type="text"
                  className={`data-input ${totalAmount !== originalTotalAmount ? 'modified' : ''}`}
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value)}
                  placeholder="例如: 989.40"
                />
              </div>
            </div>
            <div className="confirmation-hint">
              💡 提示：请检查并确认以上信息是否正确。您可以手动修改任何字段。确认无误后点击下方按钮开始自动化。
            </div>
            <button
              className="btn btn-confirm"
              onClick={handleAutomation}
              disabled={automating || !clientOrderNumber}
            >
              {automating ? '自动化执行中...' : '✅ 确认并开始自动化'}
            </button>
            <button
              className="btn btn-cancel"
              onClick={handleCancel}
              disabled={automating}
            >
              ❌ 取消
            </button>
          </div>
        )}

        {!showConfirmation && (
          <>
            <button
              className="btn btn-primary"
              onClick={handleUpload}
              disabled={!file || uploading}
            >
              {uploading ? '处理中...' : '上传 PDF 并提取信息'}
            </button>

            {file && (
              <button
                className="btn btn-secondary"
                onClick={handleClear}
              >
                清除并重新选择
              </button>
            )}
          </>
        )}

        {processingProgress > 0 && (
          <div className="progress show">
            <div className="progress-bar" style={{ width: `${processingProgress}%` }}></div>
          </div>
        )}

        {message && (
          <div className={`status show ${messageType}`}>
            {message.split('\n').map((line, i) => (
              <div key={i}>{line}</div>
            ))}
          </div>
        )}

        {showSteps && (
          <div className="steps show">
            {steps.map(step => (
              <div key={step.id} className={`step ${step.status}`}>
                <span className="step-icon">{getStepIcon(step.status)}</span>
                <span>{step.text}</span>
              </div>
            ))}
          </div>
        )}

        {(logs.length > 0 || automating) && (
          <div className="log-console show" ref={logConsoleRef}>
            <div style={{ color: '#999', marginBottom: '10px', fontWeight: 'bold' }}>
              📋 实时自动化日志
            </div>
            <div>
              {logs.length === 0 && automating ? (
                <div className="log-entry INFO">
                  <span className="log-time">
                    {new Date().toLocaleTimeString('zh-CN')}
                  </span>
                  <span className="log-level INFO">INFO</span>
                  <span className="log-message">等待自动化日志...</span>
                </div>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className={`log-entry ${log.level}`}>
                    <span className="log-time">
                      {new Date(log.timestamp).toLocaleTimeString('zh-CN')}
                    </span>
                    <span className={`log-level ${log.level}`}>{log.level}</span>
                    <span className="log-message">{log.message}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
