# Chrome 扩展本地测试完整指南

## 🎯 测试目标

测试 v1.4.1 的智能项目匹配功能，确保 "KIWIWASTE-006" 能正确匹配 "Kiwiwaste Job - Hailes Road"。

---

## 📋 测试前准备

### 1. 加载最新版本的扩展

```bash
# 1. 打开 Chrome 扩展管理页面
打开浏览器，访问: chrome://extensions/

# 2. 启用开发者模式
在右上角打开"开发者模式"开关

# 3. 移除旧版本（如果已安装）
找到 "Invoice Automation for Procore"
点击"移除"按钮

# 4. 加载新版本
点击"加载已解压的扩展程序"
选择文件夹: /Users/jundong/Documents/FREEAI/Dev/PO-workflow/chrome-extension
点击"选择"
```

### 2. 验证版本号

```
扩展列表中应显示:
✓ Invoice Automation for Procore
✓ 版本: 1.4.1
✓ 状态: 已启用
```

### 3. 配置 API Key

```bash
# 点击扩展图标 → 点击"⚙️ 设置"
# 输入 OpenAI API Key
# 点击"测试连接"验证
# 点击"保存设置"
```

---

## 🧪 完整测试流程

### 测试用例 1: 项目搜索匹配测试

#### 测试数据
- **Client Order Number**: KIWIWASTE-006
- **Procore 项目名称**: Kiwiwaste Job - Hailes Road
- **预期结果**: 使用策略2或策略3成功匹配

#### 测试步骤

**Step 1: 准备测试发票**

创建一个测试 PDF，内容包含：
```
Invoice Number: 335397
Client Order Number: KIWIWASTE-006
Total Amount (Ex GST): $1000.00
```

或者使用现有的测试发票。

**Step 2: 登录 Procore**

```bash
1. 在新标签页打开: https://us02.procore.com/
2. 登录您的账号
3. 如果有 2FA，完成验证
4. 确认已登录成功
```

**Step 3: 打开 Chrome DevTools**

```bash
# 在 Procore 页面上按 F12 或右键 → 检查
# 切换到 Console 标签
# 这样可以看到扩展的日志输出
```

**Step 4: 开始自动化**

```bash
1. 点击扩展图标打开弹窗
2. 上传测试 PDF 文件
3. 等待 AI 识别完成（约5-10秒）
4. 验证识别结果:
   ✓ Invoice Number: 335397
   ✓ Client Order Number: KIWIWASTE-006
   ✓ Total Amount: 1000.00
5. 点击"🚀 开始自动化"按钮
```

**Step 5: 观察执行过程**

在 Console 中应该看到以下日志：

```
[Invoice Automation] ℹ️ 正在搜索项目: KIWIWASTE-006
[Invoice Automation] ℹ️ 找到项目选择器，正在点击...
[Invoice Automation] ℹ️ 正在输入项目编号...
[Invoice Automation] ✓ 找到唯一匹配项目
[Invoice Automation] ℹ️ 尝试部分匹配: KIWIWASTE
[Invoice Automation] ℹ️ 正在选择项目...
[Invoice Automation] ✓ 项目选择完成
```

在扩展弹窗的执行日志中应该看到：
```
13:38:45 - PO编号: KIWIWASTE-006
13:38:45 - 发票号: 335397
13:38:46 - 步骤 1/4: 选择项目
13:38:46 - 正在搜索项目: KIWIWASTE-006
13:38:48 - 找到唯一搜索结果，正在准备...
13:38:51 - 转到唯一一正确项目 ✓ (绿色)
```

在 Procore 页面上应该看到：
```
✓ 项目搜索框输入了 "KIW"
✓ 下拉菜单显示 "Kiwiwaste Job - Hailes Road"
✓ 项目被自动选择
✓ 页面跳转到项目主页
```

在右下角紫色浮动面板应该看到：
```
🔄 正在选择项目...
━ 步骤进度:
  ✓ 选择项目
  🔄 导航到 Commitments
  ⏳ 查找并打开 PO
  ⏳ 更新 PO 字段
```

---

## 🐛 调试方法

### 方法 1: 查看 Console 日志

```bash
# 在 Procore 页面按 F12
# 切换到 Console 标签
# 筛选: 输入 "Invoice Automation" 过滤日志

# 正常日志示例:
✓ [Invoice Automation] ℹ️ 正在搜索项目: KIWIWASTE-006
✓ [Invoice Automation] ✓ 找到唯一匹配项目
✓ [Invoice Automation] ℹ️ 尝试部分匹配: KIWIWASTE
✓ [Invoice Automation] ✓ 项目选择完成

# 错误日志示例:
❌ [Invoice Automation] ❌ 找不到匹配的项目: KIWIWASTE-006
❌ [Invoice Automation] ❌ Error: 找不到项目选择器
```

### 方法 2: 查看扩展弹窗日志

```bash
# 打开扩展弹窗
# 查看"📋 执行日志"区域
# 日志按时间顺序显示，最新的在底部

# 可以看到:
- 每一步的执行状态
- 匹配策略的尝试过程
- 成功/失败的提示
- 错误信息（如果有）
```

### 方法 3: 检查 Background Service Worker

```bash
# 打开 chrome://extensions/
# 找到 Invoice Automation
# 点击"service worker" 链接
# 在 DevTools Console 中查看后台日志

# 可以看到:
- API 调用记录
- 消息传递日志
- 错误堆栈信息
```

### 方法 4: 单步调试

```bash
# 在 Procore 页面打开 DevTools
# 切换到 Sources 标签
# 左侧展开 Content scripts
# 找到 procore-automation.js
# 在 selectProject 函数设置断点 (第166行)
# 重新触发自动化
# 按 F10 单步执行，观察变量值
```

---

## 🔍 常见问题诊断

### 问题 1: 找到唯一选项但没有点击

**症状**:
- Console 显示: "找到唯一匹配项目" ✓
- 但页面没有变化
- 最后报错: "找不到匹配的项目"

**可能原因**:
1. `querySelectorWithText()` 函数返回空数组
2. `isVisible()` 判断不准确
3. 选项元素的 selector 不对

**调试方法**:
```javascript
// 在 Console 中手动执行:
document.querySelectorAll('[role="option"]')
document.querySelectorAll('[role="menuitem"]')

// 检查返回结果:
- 如果是空数组 → selector 不对
- 如果有元素 → 检查元素的 textContent
```

**解决方法**:
- 检查 Procore 页面的 HTML 结构
- 更新 optionSelectors 数组
- 添加更多的 selector 变体

### 问题 2: 项目选择后页面没跳转

**症状**:
- 项目被点击了
- 但没有跳转到项目主页
- 或者跳转很慢

**可能原因**:
- 点击后的等待时间不够
- Procore 页面加载较慢
- 点击事件没有正确触发

**解决方法**:
```javascript
// 增加等待时间
CONFIG.LONG_WAIT = 3000; // 从 2000 增加到 3000

// 或者添加页面加载等待:
await waitForNavigation();
```

### 问题 3: 输入搜索关键词后没有结果

**症状**:
- 搜索框输入了 "KIW"
- 但下拉菜单没有显示结果
- 或者显示 "No results"

**可能原因**:
- 输入速度太快
- 搜索接口没有返回
- 网络延迟

**解决方法**:
```javascript
// 增加输入延迟
CONFIG.TYPING_DELAY = 150; // 从 100 增加到 150

// 在输入后增加等待
await sleep(500);
```

---

## 📊 测试检查清单

使用此清单确保所有功能正常：

### 基础功能
- [ ] 扩展加载成功，版本显示 v1.4.1
- [ ] API Key 配置成功
- [ ] PDF 上传识别成功
- [ ] 识别结果正确显示

### 项目搜索匹配
- [ ] 策略1: 精确匹配 "KIWIWASTE-006" (如果项目名完全一致)
- [ ] 策略2: 部分匹配 "KIWIWASTE"
- [ ] 策略3: 模糊匹配 "kiwiw"
- [ ] 策略4: 唯一选项自动选择

### 可视化反馈
- [ ] 右下角浮动面板显示进度
- [ ] 操作元素有紫色高亮边框
- [ ] 元素上方显示操作提示气泡
- [ ] 步骤进度图标正确更新 (⏳ → 🔄 → ✓)

### 完整流程
- [ ] 步骤1: 选择项目 ✓
- [ ] 步骤2: 导航到 Commitments ✓
- [ ] 步骤3: 查找并打开 PO ✓
- [ ] 步骤4: 填充发票信息 ✓

---

## 🚨 如果测试失败

### 立即检查

1. **Console 日志**
   - 查找红色错误信息
   - 记录完整的错误堆栈

2. **网络请求**
   - DevTools → Network 标签
   - 检查是否有失败的请求

3. **扩展状态**
   - chrome://extensions/
   - 检查扩展是否报错
   - 查看 service worker 状态

### 收集信息

请提供以下信息以便调试：

```
1. 错误截图（包含 Console 日志）
2. 扩展弹窗的执行日志截图
3. Procore 页面的 HTML 结构（右键检查搜索下拉菜单）
4. Chrome 版本号
5. 测试的完整步骤
```

---

## 💡 高级调试技巧

### 技巧 1: 使用断点调试

```javascript
// 在代码中添加 debugger:
async function selectProject(clientOrderNumber) {
  debugger; // 代码会在这里暂停
  Logger.info(`正在搜索项目: ${clientOrderNumber}`);
  // ...
}
```

### 技巧 2: 添加详细日志

```javascript
// 在策略4的代码中添加日志:
if (!matchingOption) {
  Logger.info('尝试选择唯一选项');
  const optionCount = await getOptionCount();
  console.log('DEBUG: optionCount =', optionCount); // 添加

  if (optionCount === 1) {
    for (const selector of optionSelectors) {
      const elements = querySelectorWithText(selector);
      console.log('DEBUG: selector =', selector); // 添加
      console.log('DEBUG: elements =', elements); // 添加

      const visibleOptions = elements.filter(el => isVisible(el));
      console.log('DEBUG: visibleOptions =', visibleOptions); // 添加

      if (visibleOptions.length === 1) {
        matchingOption = visibleOptions[0];
        console.log('DEBUG: matchingOption =', matchingOption); // 添加
        Logger.success('找到唯一选项');
        break;
      }
    }
  }
}
```

### 技巧 3: 检查元素可见性

```javascript
// 在 Console 中运行:
function checkVisibility(selector) {
  const elements = document.querySelectorAll(selector);
  elements.forEach((el, index) => {
    const rect = el.getBoundingClientRect();
    const visible = rect.width > 0 && rect.height > 0 &&
                   window.getComputedStyle(el).visibility !== 'hidden' &&
                   window.getComputedStyle(el).display !== 'none';
    console.log(`Element ${index}:`, {
      text: el.textContent.trim(),
      visible: visible,
      rect: rect
    });
  });
}

checkVisibility('[role="option"]');
```

---

## 📝 测试报告模板

测试完成后，请填写以下报告：

```markdown
## 测试报告

**测试日期**: 2025-10-30
**测试版本**: v1.4.1
**测试人员**: [您的名字]

### 测试环境
- Chrome 版本:
- 操作系统:
- Procore 环境:

### 测试结果
- [ ] 通过
- [ ] 失败

### 测试详情

#### 项目搜索匹配
- 策略1: [ ] 通过 / [ ] 失败 / [ ] 未测试
- 策略2: [ ] 通过 / [ ] 失败 / [ ] 未测试
- 策略3: [ ] 通过 / [ ] 失败 / [ ] 未测试
- 策略4: [ ] 通过 / [ ] 失败 / [ ] 未测试

#### 完整流程
- 选择项目: [ ] 通过 / [ ] 失败
- 导航到 Commitments: [ ] 通过 / [ ] 失败
- 查找 PO: [ ] 通过 / [ ] 失败
- 填充信息: [ ] 通过 / [ ] 失败

### 发现的问题
1.
2.
3.

### 建议改进
1.
2.
3.

### 附件
- 截图:
- 日志文件:
```

---

## ✅ 测试通过标准

测试被认为通过，当且仅当：

1. ✅ 扩展成功加载，版本显示 v1.4.1
2. ✅ PDF 识别成功率 ≥ 90%
3. ✅ 项目搜索匹配成功率 = 100%（4种策略至少1种成功）
4. ✅ 完整自动化流程成功率 ≥ 80%
5. ✅ 无 Console 错误（警告可忽略）
6. ✅ 可视化反馈正常显示
7. ✅ 用户体验流畅，无明显卡顿

---

**祝测试顺利！** 🚀

如有任何问题，请查看上方的调试方法或联系开发团队。
