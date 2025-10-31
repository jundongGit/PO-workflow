import React, { useState, useEffect, useRef } from 'react';
import {
  Layout, Card, Button, Input, Upload, List, Tag, Space,
  Radio, message, Progress, Typography, Divider, Row, Col, Modal, Form
} from 'antd';
import {
  InboxOutlined, FileTextOutlined, PlayCircleOutlined,
  DeleteOutlined, EyeOutlined, CloudUploadOutlined,
  CheckCircleOutlined, LoadingOutlined, FileAddOutlined, SettingOutlined,
  ApiOutlined
} from '@ant-design/icons';
import './App.css';

const { Header, Content, Sider } = Layout;
const { Title, Text, Paragraph } = Typography;
const { Dragger } = Upload;

function App() {
  const [files, setFiles] = useState([]);
  const [primaryFileId, setPrimaryFileId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [recognizingFileId, setRecognizingFileId] = useState(null);
  const [autoRecognizeId, setAutoRecognizeId] = useState(null);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [clientOrderNumber, setClientOrderNumber] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [automating, setAutomating] = useState(false);
  const [logs, setLogs] = useState([]);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [settingsForm] = Form.useForm();
  const [savingSettings, setSavingSettings] = useState(false);
  const [testingApi, setTestingApi] = useState(false);
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

  // Auto recognize when only one file is uploaded
  useEffect(() => {
    if (autoRecognizeId && files.length > 0) {
      const fileExists = files.find(f => f.id === autoRecognizeId);
      if (fileExists) {
        addLog({ level: 'INFO', message: '只有一个文件，自动开始识别...', timestamp: new Date().toISOString() });
        handleRecognizeFile(autoRecognizeId);
        setAutoRecognizeId(null);
      }
    }
  }, [autoRecognizeId, files]);

  const addLog = (logData) => {
    setLogs(prevLogs => {
      const newLogs = [...prevLogs, logData];
      return newLogs.slice(-100);
    });
  };

  // 上传单个文件
  const uploadSingleFile = async (file, isPrimary = false, skipAI = false) => {
    const formData = new FormData();
    formData.append('pdf', file);
    const url = skipAI ? '/api/upload-pdf?useAI=false' : '/api/upload-pdf';
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });
    const result = await response.json();
    return { ...result, isPrimary };
  };

  // 处理多个文件
  const handleFiles = async (selectedFiles) => {
    if (!selectedFiles || selectedFiles.length === 0) return;

    const pdfFiles = selectedFiles.filter(file => {
      if (file.type !== 'application/pdf') {
        message.warning(`跳过非PDF文件: ${file.name}`);
        return false;
      }
      if (file.size > 10 * 1024 * 1024) {
        message.warning(`跳过超大文件: ${file.name}`);
        return false;
      }
      return true;
    });

    if (pdfFiles.length === 0) {
      message.error('没有有效的PDF文件');
      return;
    }

    setUploading(true);
    setProcessingProgress(0);

    try {
      addLog({ level: 'INFO', message: `正在上传 ${pdfFiles.length} 个PDF文件...`, timestamp: new Date().toISOString() });

      const uploadPromises = pdfFiles.map((file, index) =>
        uploadSingleFile(file, index === 0, true)
      );

      const results = await Promise.all(uploadPromises);
      const newFiles = [];
      let primaryId = null;

      results.forEach((result, index) => {
        if (result.success) {
          const file = pdfFiles[index];
          const url = URL.createObjectURL(file);
          const fileInfo = {
            id: result.fileInfo.id,
            name: file.name,
            size: file.size,
            url: url,
            fileId: result.fileInfo.id,
            invoiceNumber: undefined,
            clientOrderNumber: undefined,
            totalAmount: undefined
          };

          newFiles.push(fileInfo);

          if (result.isPrimary) {
            primaryId = result.fileInfo.id;
          }

          addLog({ level: 'INFO', message: `✅ 文件上传完成: ${file.name}`, timestamp: new Date().toISOString() });
        } else {
          addLog({ level: 'ERROR', message: `上传失败: ${pdfFiles[index].name}`, timestamp: new Date().toISOString() });
        }
      });

      setFiles(prevFiles => [...prevFiles, ...newFiles]);
      if (primaryId) {
        setPrimaryFileId(primaryId);
      }

      setProcessingProgress(100);
      setTimeout(() => {
        setProcessingProgress(0);
      }, 2000);

      if (newFiles.length === 1 && primaryId) {
        setAutoRecognizeId(primaryId);
      }
    } catch (error) {
      setProcessingProgress(0);
      message.error('上传失败: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSelectPrimaryFile = (fileId) => {
    setPrimaryFileId(fileId);
    const selectedFile = files.find(f => f.id === fileId);
    if (selectedFile) {
      addLog({ level: 'INFO', message: `选择主文件: ${selectedFile.name}`, timestamp: new Date().toISOString() });
      if (selectedFile.invoiceNumber !== undefined) {
        setInvoiceNumber(selectedFile.invoiceNumber || '');
        setClientOrderNumber(selectedFile.clientOrderNumber || '');
        setTotalAmount(selectedFile.totalAmount || '');
      }
    }
  };

  const handleRecognizeFile = async (fileId) => {
    const fileToRecognize = files.find(f => f.id === fileId);
    if (!fileToRecognize) {
      message.error('文件不存在');
      return;
    }

    setRecognizingFileId(fileId);
    addLog({ level: 'INFO', message: `开始识别文件: ${fileToRecognize.name}`, timestamp: new Date().toISOString() });

    try {
      const response = await fetch(fileToRecognize.url);
      const blob = await response.blob();
      const file = new File([blob], fileToRecognize.name, { type: 'application/pdf' });

      const formData = new FormData();
      formData.append('pdf', file);

      const uploadResponse = await fetch('/api/upload-pdf?useAI=true', {
        method: 'POST',
        body: formData,
      });

      const result = await uploadResponse.json();

      if (result.success) {
        setFiles(prevFiles => prevFiles.map(f => {
          if (f.id === fileId) {
            return {
              ...f,
              invoiceNumber: result.data.invoiceNumber || '',
              clientOrderNumber: result.data.clientOrderNumber || '',
              totalAmount: result.data.totalAmountExGST || ''
            };
          }
          return f;
        }));

        message.success(`识别完成: ${fileToRecognize.name}`);
        addLog({ level: 'INFO', message: `✅ 识别完成: ${fileToRecognize.name}`, timestamp: new Date().toISOString() });
        addLog({ level: 'INFO', message: `发票号: ${result.data.invoiceNumber || 'N/A'}`, timestamp: new Date().toISOString() });
        addLog({ level: 'INFO', message: `订单号: ${result.data.clientOrderNumber || 'N/A'}`, timestamp: new Date().toISOString() });
        addLog({ level: 'INFO', message: `金额: ${result.data.totalAmountExGST || 'N/A'}`, timestamp: new Date().toISOString() });

        if (fileId === primaryFileId) {
          setInvoiceNumber(result.data.invoiceNumber || '');
          setClientOrderNumber(result.data.clientOrderNumber || '');
          setTotalAmount(result.data.totalAmountExGST || '');
        }
      } else {
        message.error(`识别失败: ${result.error || '未知错误'}`);
      }
    } catch (error) {
      message.error(`识别失败: ${error.message}`);
    } finally {
      setRecognizingFileId(null);
    }
  };

  const handleRemoveFile = (fileId) => {
    const fileToRemove = files.find(f => f.id === fileId);
    if (fileToRemove) {
      URL.revokeObjectURL(fileToRemove.url);
      addLog({ level: 'INFO', message: `删除文件: ${fileToRemove.name}`, timestamp: new Date().toISOString() });
    }

    setFiles(prevFiles => prevFiles.filter(f => f.id !== fileId));

    if (fileId === primaryFileId) {
      setPrimaryFileId(null);
      setInvoiceNumber('');
      setClientOrderNumber('');
      setTotalAmount('');
    }
  };

  const handleAutomation = async () => {
    if (!clientOrderNumber) {
      message.error('Client Order Number 不能为空');
      return;
    }

    if (!primaryFileId) {
      message.error('请先选择主文件');
      return;
    }

    setAutomating(true);
    setProcessingProgress(0);

    try {
      addLog({ level: 'INFO', message: '=== 开始 Procore 自动化 ===', timestamp: new Date().toISOString() });
      addLog({ level: 'INFO', message: `发票号: ${invoiceNumber}`, timestamp: new Date().toISOString() });
      addLog({ level: 'INFO', message: `订单号: ${clientOrderNumber}`, timestamp: new Date().toISOString() });
      addLog({ level: 'INFO', message: `金额: ${totalAmount}`, timestamp: new Date().toISOString() });
      addLog({ level: 'INFO', message: `上传文件数: ${files.length}`, timestamp: new Date().toISOString() });

      const fileIds = files.map(f => f.fileId).filter(id => id);

      addLog({ level: 'INFO', message: `文件ID列表 (${fileIds.length}个):`, timestamp: new Date().toISOString() });
      files.forEach((f, index) => {
        addLog({
          level: 'INFO',
          message: `  ${index + 1}. ${f.name} -> fileId: ${f.fileId || 'undefined'}`,
          timestamp: new Date().toISOString()
        });
      });

      const response = await fetch('/api/automate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientOrderNumber,
          invoiceNumber,
          totalAmount,
          fileId: primaryFileId,
          fileIds: fileIds,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setProcessingProgress(100);
        message.success('自动化完成');
        addLog({ level: 'INFO', message: '=== ✅ 自动化完成 ===', timestamp: new Date().toISOString() });

        setTimeout(() => {
          setProcessingProgress(0);
        }, 3000);
      } else {
        message.error('自动化失败: ' + (result.error || '未知错误'));
      }
    } catch (error) {
      message.error('自动化失败: ' + error.message);
    } finally {
      setAutomating(false);
    }
  };

  // Load settings
  const loadSettings = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/settings');
      const result = await response.json();
      if (result.success) {
        settingsForm.setFieldsValue({
          openaiApiKey: result.settings.openaiApiKey || ''
        });
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  // Save settings
  const handleSaveSettings = async (values) => {
    setSavingSettings(true);
    try {
      const response = await fetch('http://localhost:3001/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          openaiApiKey: values.openaiApiKey
        }),
      });

      const result = await response.json();

      if (result.success) {
        message.success('设置保存成功');
        setSettingsVisible(false);
        settingsForm.resetFields();
      } else {
        message.error('保存失败: ' + (result.error || '未知错误'));
      }
    } catch (error) {
      message.error('保存失败: ' + error.message);
    } finally {
      setSavingSettings(false);
    }
  };

  // Test API Key
  const handleTestApi = async () => {
    try {
      const values = await settingsForm.validateFields(['openaiApiKey']);
      setTestingApi(true);

      const response = await fetch('http://localhost:3001/api/settings/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          openaiApiKey: values.openaiApiKey
        }),
      });

      const result = await response.json();

      if (result.success) {
        message.success(result.message || 'API Key 验证成功！');
      } else {
        message.error(result.error || 'API Key 验证失败');
      }
    } catch (error) {
      if (error.errorFields) {
        message.warning('请先输入 API Key');
      } else {
        message.error('测试失败: ' + error.message);
      }
    } finally {
      setTestingApi(false);
    }
  };

  // Open settings dialog
  const handleOpenSettings = () => {
    loadSettings();
    setSettingsVisible(true);
  };

  const uploadProps = {
    name: 'file',
    multiple: true,
    accept: '.pdf',
    showUploadList: false,
    beforeUpload: (file, fileList) => {
      handleFiles(fileList);
      return false;
    },
  };

  const getLogColor = (level) => {
    switch (level) {
      case 'ERROR': return 'error';
      case 'WARN': return 'warning';
      case 'INFO': return 'processing';
      default: return 'default';
    }
  };

  return (
    <Layout style={{ minHeight: '100vh', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Header style={{
        background: '#fff',
        padding: '16px 50px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        display: 'flex',
        alignItems: 'center',
        height: 'auto',
        lineHeight: 'normal',
        flex: '0 0 auto',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <FileTextOutlined style={{ fontSize: 32, color: '#1890ff', marginRight: 16 }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <Title level={3} style={{ margin: 0, lineHeight: 1.2 }}>Invoice PDF 自动化上传</Title>
            <Text type="secondary" style={{ fontSize: 12, lineHeight: 1.5 }}>上传 PDF 发票，自动提取信息并同步到 Procore</Text>
          </div>
        </div>
        <Button
          icon={<SettingOutlined />}
          onClick={handleOpenSettings}
          type="text"
        >
          设置
        </Button>
      </Header>

      <Layout style={{ flex: 1, overflow: 'hidden' }}>
        {/* Left Sidebar - Data & Controls */}
        <Sider width={450} theme="light" style={{
          background: '#f5f5f5',
          padding: '24px',
          overflow: 'auto',
          height: '100%'
        }}>
          {/* Extracted Data Card */}
          <Card
            title={
              <Space>
                <FileAddOutlined />
                提取的数据
                {uploading && <LoadingOutlined spin />}
              </Space>
            }
            style={{ marginBottom: 16 }}
            size="small"
          >
            {/* File List */}
            {files.length > 0 && (
              <>
                <Paragraph style={{ marginBottom: 8, fontWeight: 500 }}>
                  📁 已上传文件 ({files.length})
                </Paragraph>
                <Radio.Group
                  value={primaryFileId}
                  onChange={(e) => handleSelectPrimaryFile(e.target.value)}
                  style={{ width: '100%' }}
                >
                  <Space direction="vertical" style={{ width: '100%' }}>
                    {files.map((file) => (
                      <Card
                        key={file.id}
                        size="small"
                        bodyStyle={{ padding: '8px 12px' }}
                        style={{
                          background: primaryFileId === file.id ? '#e6f7ff' : '#fff',
                          cursor: 'pointer'
                        }}
                        onClick={() => handleSelectPrimaryFile(file.id)}
                      >
                        <Row gutter={8} align="middle">
                          <Col flex="auto">
                            <Radio value={file.id} style={{ marginRight: 8 }} />
                            <Text
                              ellipsis
                              style={{
                                fontFamily: 'monospace',
                                fontSize: 12
                              }}
                            >
                              {file.name}
                            </Text>
                          </Col>
                          <Col>
                            <Space size="small">
                              <Button
                                size="small"
                                type="primary"
                                ghost
                                icon={recognizingFileId === file.id ? <LoadingOutlined /> : <EyeOutlined />}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRecognizeFile(file.id);
                                }}
                                loading={recognizingFileId === file.id}
                              >
                                识别
                              </Button>
                              <Button
                                size="small"
                                danger
                                icon={<DeleteOutlined />}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveFile(file.id);
                                }}
                              />
                            </Space>
                          </Col>
                        </Row>
                      </Card>
                    ))}
                  </Space>
                </Radio.Group>
                <Text type="secondary" style={{ fontSize: 11, display: 'block', marginTop: 8 }}>
                  💡 上传后请点击"识别"按钮进行AI提取。选择一个文件作为主文件，其他文件将作为附件上传
                </Text>
                <Divider style={{ margin: '12px 0' }} />
              </>
            )}

            {/* Extracted Fields */}
            {invoiceNumber || clientOrderNumber || totalAmount ? (
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <Text type="secondary" style={{ fontSize: 12 }}>发票号</Text>
                  <Input
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    placeholder="例如: 335397"
                    style={{ marginTop: 4 }}
                  />
                </div>
                <div>
                  <Text type="secondary" style={{ fontSize: 12 }}>订单号/PO号</Text>
                  <Input
                    value={clientOrderNumber}
                    onChange={(e) => setClientOrderNumber(e.target.value)}
                    placeholder="例如: KIWIWASTE-006"
                    style={{ marginTop: 4 }}
                  />
                </div>
                <div>
                  <Text type="secondary" style={{ fontSize: 12 }}>不含税金额</Text>
                  <Input
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(e.target.value)}
                    placeholder="例如: 1137.81"
                    style={{ marginTop: 4 }}
                  />
                </div>

                {processingProgress > 0 && (
                  <Progress percent={processingProgress} status="active" />
                )}

                <Button
                  type="primary"
                  size="large"
                  icon={automating ? <LoadingOutlined /> : <PlayCircleOutlined />}
                  onClick={handleAutomation}
                  disabled={automating || !clientOrderNumber}
                  loading={automating}
                  block
                >
                  {automating ? '自动化执行中...' : '开始自动化'}
                </Button>
              </Space>
            ) : files.length === 0 ? (
              <Text type="secondary" style={{ display: 'block', textAlign: 'center', padding: '20px 0' }}>
                {uploading ? '⏳ 正在提取数据...' : '等待上传 PDF 文件...'}
              </Text>
            ) : (
              <Text type="secondary" style={{ display: 'block', textAlign: 'center', padding: '20px 0' }}>
                请选择主文件并点击"识别"查看提取的数据
              </Text>
            )}
          </Card>

          {/* Logs Card */}
          <Card
            title={<Space><FileTextOutlined />实时自动化日志</Space>}
            size="small"
            bodyStyle={{ padding: 0 }}
          >
            <div
              ref={logConsoleRef}
              style={{
                height: 300,
                overflow: 'auto',
                background: '#000',
                padding: '8px',
                fontFamily: 'monospace',
                fontSize: 11
              }}
            >
              {logs.length === 0 ? (
                <Text style={{ color: '#52c41a' }}>
                  [{new Date().toLocaleTimeString('zh-CN')}] [INFO] 等待操作...
                </Text>
              ) : (
                logs.map((log, index) => (
                  <div key={index} style={{
                    color: log.level === 'ERROR' ? '#ff4d4f' :
                           log.level === 'WARN' ? '#faad14' : '#52c41a',
                    marginBottom: 2
                  }}>
                    [{new Date(log.timestamp).toLocaleTimeString('zh-CN')}] [{log.level}] {log.message}
                  </div>
                ))
              )}
            </div>
          </Card>
        </Sider>

        {/* Main Content - PDF Preview */}
        <Content style={{ padding: 24, background: '#fff', height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {primaryFileId && files.find(f => f.id === primaryFileId) ? (
            <div style={{ flex: 1, border: '1px solid #d9d9d9', borderRadius: 4, overflow: 'hidden' }}>
              <iframe
                src={files.find(f => f.id === primaryFileId).url}
                title="PDF Preview"
                style={{ width: '100%', height: '100%', border: 'none' }}
              />
            </div>
          ) : (
            <Dragger
              {...uploadProps}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <p className="ant-upload-drag-icon">
                <InboxOutlined style={{ fontSize: 80, color: '#1890ff' }} />
              </p>
              <p className="ant-upload-text" style={{ fontSize: 18, fontWeight: 500 }}>
                点击或拖拽上传 PDF 文件
              </p>
              <p className="ant-upload-hint" style={{ fontSize: 14 }}>
                支持多个PDF文件，上传后点击"识别"进行AI提取
              </p>
            </Dragger>
          )}
        </Content>
      </Layout>

      {/* Settings Modal */}
      <Modal
        title="设置"
        open={settingsVisible}
        onCancel={() => setSettingsVisible(false)}
        footer={null}
        width={500}
      >
        <Form
          form={settingsForm}
          onFinish={handleSaveSettings}
          layout="vertical"
        >
          <Form.Item
            label="OpenAI API Key"
            name="openaiApiKey"
            rules={[
              { required: true, message: '请输入 OpenAI API Key' },
              { pattern: /^sk-/, message: 'API Key 必须以 sk- 开头' }
            ]}
            extra="请输入您的 OpenAI API Key，用于 GPT-4 Vision 识别发票信息"
          >
            <Input.Password
              placeholder="sk-proj-..."
              style={{ fontFamily: 'monospace' }}
            />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={savingSettings}>
                保存
              </Button>
              <Button onClick={handleTestApi} loading={testingApi} icon={<ApiOutlined />}>
                测试 API
              </Button>
              <Button onClick={() => setSettingsVisible(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
}

export default App;
