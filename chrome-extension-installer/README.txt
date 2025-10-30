======================================
Invoice Automation Chrome 扩展
安装说明
======================================

【自动安装】（推荐）
------------------

Windows用户:
1. 双击运行 install.bat
2. 按照提示完成安装

Mac/Linux用户:
1. 打开终端
2. 运行: chmod +x install.sh
3. 运行: ./install.sh
4. 按照提示完成安装


【手动安装】
------------------

1. 打开Chrome浏览器

2. 地址栏输入: chrome://extensions/

3. 打开右上角的"开发者模式"开关

4. 点击"加载已解压的扩展程序"按钮

5. 选择解压后的 extension 文件夹

6. 点击"选择文件夹"


【使用方法】
------------------

1. 点击Chrome工具栏的扩展图标 📄

2. 在弹出窗口中上传PDF发票
   - 点击"选择PDF文件"按钮
   - 或直接拖拽PDF文件到窗口

3. 等待AI自动识别
   - 系统会自动提取Invoice Number
   - 自动提取Client Order Number
   - 自动提取Total Amount

4. 检查识别结果
   - 如有错误可点击"修改信息"按钮
   - 手动修正识别内容

5. 点击"开始自动化"按钮
   - 系统会自动打开Procore页面
   - 自动填充表单信息
   - 完成后请手动检查并保存


【常见问题】
------------------

Q: 提示"开发者模式扩展"警告？
A: 这是正常的，因为扩展未通过Chrome商店发布。
   点击"保留"即可继续使用。

Q: 扩展图标不显示？
A: 右键点击Chrome工具栏空白处 → "自定义工具栏"
   → 将扩展图标拖拽到工具栏

Q: 识别失败？
A: 1. 检查网络连接
   2. 确认后端API已正确配置
   3. 重试或联系技术支持

Q: 自动化失败？
A: 1. 确保已登录Procore网站
   2. 检查Client Order Number是否正确
   3. 手动完成剩余步骤

Q: 如何更新扩展？
A: 1. 下载新版本
   2. 覆盖安装即可
   3. 或在chrome://extensions/页面点击"更新"


【后端API配置】
------------------

如果需要修改API地址:

1. 找到文件: extension/background/service-worker.js

2. 修改第7行的 API_URL:
   const CONFIG = {
     API_URL: 'https://your-api.vercel.app/api'
   };

3. 保存后重新加载扩展


【技术支持】
------------------

问题反馈: support@your-company.com
使用文档: https://your-docs-url.com
技术支持: xxx-xxxx-xxxx


【版本信息】
------------------

版本: 1.0.0
发布日期: 2025-10-29
支持系统: Windows / Mac / Linux
支持浏览器: Chrome 88+


======================================
感谢使用 Invoice Automation！
======================================
