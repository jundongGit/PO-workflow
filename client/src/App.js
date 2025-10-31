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

  const handleFile = async (selectedFile) => {
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

    // Auto load PDF preview
    const url = URL.createObjectURL(selectedFile);
    setPdfUrl(url);

    // Auto upload and process
    setUploading(true);
    setProcessingProgress(0);

    try {
      setProcessingProgress(10);
      addLog({ level: 'INFO', message: '正在上传 PDF 文件...', timestamp: new Date().toISOString() });

      const formData = new FormData();
      formData.append('pdf', selectedFile);

      setProcessingProgress(30);
      addLog({ level: 'INFO', message: 'PDF转图片处理中...', timestamp: new Date().toISOString() });

      const response = await fetch('/api/upload-pdf', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setProcessingProgress(100);
        addLog({ level: 'INFO', message: '✅ AI 提取完成！', timestamp: new Date().toISOString() });
        addLog({ level: 'INFO', message: `发票号: ${result.data.invoiceNumber || 'N/A'}`, timestamp: new Date().toISOString() });
        addLog({ level: 'INFO', message: `订单号: ${result.data.clientOrderNumber || 'N/A'}`, timestamp: new Date().toISOString() });
        addLog({ level: 'INFO', message: `金额: ${result.data.totalAmountExGST || 'N/A'}`, timestamp: new Date().toISOString() });

        setInvoiceNumber(result.data.invoiceNumber || '');
        setClientOrderNumber(result.data.clientOrderNumber || '');
        setTotalAmount(result.data.totalAmountExGST || '');
        setFileId(result.fileInfo.id);

        setTimeout(() => {
          setProcessingProgress(0);
        }, 2000);
      } else {
        setProcessingProgress(0);
        addLog({ level: 'ERROR', message: 'PDF处理失败: ' + (result.error || '未知错误'), timestamp: new Date().toISOString() });
      }
    } catch (error) {
      setProcessingProgress(0);
      addLog({ level: 'ERROR', message: '上传失败: ' + error.message, timestamp: new Date().toISOString() });
    } finally {
      setUploading(false);
    }
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
      addLog({ level: 'ERROR', message: 'Client Order Number 不能为空', timestamp: new Date().toISOString() });
      return;
    }

    setAutomating(true);
    setShowSteps(true);
    setProcessingProgress(0);

    // Step 1 & 2 already completed
    updateStep(1, 'completed');
    updateStep(2, 'completed');
    setProcessingProgress(50);

    try {
      // Step 3: Automation
      updateStep(3, 'active');
      addLog({ level: 'INFO', message: '=== 开始 Procore 自动化 ===', timestamp: new Date().toISOString() });
      addLog({ level: 'INFO', message: `发票号: ${invoiceNumber}`, timestamp: new Date().toISOString() });
      addLog({ level: 'INFO', message: `订单号: ${clientOrderNumber}`, timestamp: new Date().toISOString() });
      addLog({ level: 'INFO', message: `金额: ${totalAmount}`, timestamp: new Date().toISOString() });

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

        addLog({ level: 'INFO', message: '=== ✅ 自动化完成 ===', timestamp: new Date().toISOString() });

        // Reset after 3 seconds
        setTimeout(() => {
          setProcessingProgress(0);
        }, 3000);
      } else {
        addLog({ level: 'ERROR', message: '自动化失败: ' + (result.error || '未知错误'), timestamp: new Date().toISOString() });
      }
    } catch (error) {
      addLog({ level: 'ERROR', message: '自动化失败: ' + error.message, timestamp: new Date().toISOString() });
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
      {/* Header */}
      <div className="app-header">
        <h1>📄 Invoice PDF 自动化上传</h1>
        <p className="subtitle">上传 PDF 发票，自动提取信息并同步到 Procore</p>
      </div>

      <div className="container">
        {/* Left Panel - Data & Logs */}
        <div className="left-panel">
          {/* Extracted Data Section */}
          <div className="data-section">
            <div className="data-section-header">
              📊 提取的数据
              {uploading && <span className="loading-spinner">⏳ 处理中...</span>}
            </div>
            <div className="data-section-content">
              {invoiceNumber || clientOrderNumber || totalAmount ? (
                <>
                  <div className="data-field-edit">
                    <label className="data-field-label">发票号</label>
                    <input
                      type="text"
                      className="data-field-input"
                      value={invoiceNumber}
                      onChange={(e) => setInvoiceNumber(e.target.value)}
                      placeholder="例如: 335397"
                    />
                  </div>
                  <div className="data-field-edit">
                    <label className="data-field-label">订单号/PO号</label>
                    <input
                      type="text"
                      className="data-field-input"
                      value={clientOrderNumber}
                      onChange={(e) => setClientOrderNumber(e.target.value)}
                      placeholder="例如: KIWIWASTE-006"
                    />
                  </div>
                  <div className="data-field-edit">
                    <label className="data-field-label">不含税金额</label>
                    <input
                      type="text"
                      className="data-field-input"
                      value={totalAmount}
                      onChange={(e) => setTotalAmount(e.target.value)}
                      placeholder="例如: 1137.81"
                    />
                  </div>

                  <button
                    className="btn-automation"
                    onClick={handleAutomation}
                    disabled={automating || !clientOrderNumber}
                  >
                    {automating ? '⏳ 自动化执行中...' : '▶️ 开始自动化'}
                  </button>
                </>
              ) : (
                <div className="data-item-empty">
                  {uploading ? '⏳ 正在提取数据...' : '等待上传 PDF 文件...'}
                </div>
              )}
            </div>
          </div>

          {/* Logs Section */}
          <div className="log-console">
            <div className="log-console-header">
              📋 实时自动化日志
            </div>
            <div className="log-console-content" ref={logConsoleRef}>
              {logs.length === 0 ? (
                <div className="log-entry INFO">
                  <span className="log-time">
                    {new Date().toLocaleTimeString('zh-CN')}
                  </span>
                  <span className="log-level INFO">INFO</span>
                  <span className="log-message">等待操作...</span>
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
        </div>

        {/* Right Panel - PDF Preview Only */}
        <div className="right-panel">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleFileInputChange}
            style={{ display: 'none' }}
          />

          {pdfUrl ? (
            <div className="pdf-preview-fullscreen">
              <iframe src={pdfUrl} title="PDF Preview"></iframe>
            </div>
          ) : (
            <div
              className={`pdf-upload-placeholder ${dragOver ? 'dragover' : ''}`}
              onClick={() => fileInputRef.current.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="placeholder-icon">📄</div>
              <div className="placeholder-text">点击或拖拽 PDF 文件查看</div>
              <div className="placeholder-hint">支持 PDF 格式，最大 10MB</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
