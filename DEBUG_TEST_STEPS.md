# 🐛 调试测试步骤 - v1.4.2

## 快速开始

```bash
# 运行快速测试脚本
cd /Users/jundong/Documents/FREEAI/Dev/PO-workflow
./quick-test.sh
```

---

## 📋 详细测试步骤

### 第 1 步：加载扩展

1. 打开 Chrome: `chrome://extensions/`
2. 启用"开发者模式"（右上角）
3. 移除旧版本（如果有）
4. 点击"加载已解压的扩展程序"
5. 选择: `/Users/jundong/Documents/FREEAI/Dev/PO-workflow/chrome-extension`
6. 验证版本号显示 **v1.4.2**

### 第 2 步：准备测试环境

1. 打开新标签页，访问 Procore
2. 登录您的账号
3. **按 F12 打开 DevTools**
4. **切换到 Console 标签**
5. **在 Console 顶部的筛选框输入: `Invoice`**

### 第 3 步：开始测试

1. 点击扩展图标
2. 上传测试 PDF（包含 KIWIWASTE-006）
3. 等待识别完成
4. 点击"开始自动化"

### 第 4 步：观察调试日志

在 Console 中您会看到详细的 DEBUG 日志：

#### ✅ 成功的日志应该像这样：

```
[Invoice Automation] ℹ️ 正在搜索项目: KIWIWASTE-006
[Invoice Automation] ℹ️ 找到项目选择器，正在点击...
[Invoice Automation] ℹ️ 正在输入项目编号...
[Invoice Automation] ✓ 找到唯一匹配项目
[Invoice Automation] ℹ️ 尝试部分匹配: KIWIWASTE

DEBUG: Selector "[role="option"]" found 1 elements
DEBUG: 1 visible options for selector "[role="option"]"
DEBUG: Selected unique option: Kiwiwaste Job - Hailes Road

[Invoice Automation] ℹ️ 正在选择项目...

DEBUG: About to click option with text: Kiwiwaste Job - Hailes Road
DEBUG: Current URL before click: https://us02.procore.com/...

[Invoice Automation] ℹ️ 点击元素: 选择项目: KIWIWASTE-006
Clicking element: <div role="option">...</div>
[Invoice Automation] ✓ 已点击: 选择项目: KIWIWASTE-006

DEBUG: URL after click: https://us02.procore.com/.../projects/598134326205987/...
[Invoice Automation] ✓ 页面已导航: [旧URL] → [新URL]
[Invoice Automation] ✓ 项目选择完成
```

#### ❌ 如果失败，您会看到：

```
DEBUG: No matching option found. Available options:
  Option 0: {text: "Kiwiwaste Job - Hailes Road", visible: true, selector: "option"}
  Option 1: {text: "Other Project", visible: false, selector: "option"}

[Invoice Automation] ❌ 找不到匹配的项目: KIWIWASTE-006
```

或者：

```
DEBUG: URL after click: https://us02.procore.com/... (相同)
[Invoice Automation] ⚠️ 警告: 点击后URL未改变，可能需要额外等待
```

---

## 🔍 关键调试信息

### 需要特别关注的日志：

1. **选项查找**
   ```
   DEBUG: Total visible option count: 1
   DEBUG: Selector "[role="option"]" found 1 elements
   DEBUG: 1 visible options for selector "[role="option"]"
   ```
   → 确认找到了多少个选项

2. **选中的选项**
   ```
   DEBUG: Selected unique option: Kiwiwaste Job - Hailes Road
   ```
   → 确认选中的是正确的项目

3. **点击事件**
   ```
   Clicking element: <div role="option">...</div>
   [Invoice Automation] ✓ 已点击: 选择项目: KIWIWASTE-006
   ```
   → 确认点击已执行

4. **URL 变化**
   ```
   DEBUG: Current URL before click: https://us02.procore.com/...
   DEBUG: URL after click: https://us02.procore.com/.../projects/598134326205987/...
   ```
   → 确认页面是否导航

---

## 🐛 常见问题排查

### 问题 1: 找到选项但没有点击

**症状**:
```
DEBUG: Selected unique option: Kiwiwaste Job - Hailes Road
DEBUG: About to click option with text: Kiwiwaste Job - Hailes Road
Clicking element: <div role="option">...</div>
✓ 已点击: 选择项目: KIWIWASTE-006
DEBUG: URL after click: [相同 URL]
⚠️ 警告: 点击后URL未改变
```

**原因**: 点击事件触发了，但 Procore 没有响应

**解决**:
1. 检查是否有 JavaScript 错误
2. 尝试手动点击看是否能正常工作
3. 可能需要不同的事件触发方式

### 问题 2: 找不到选项

**症状**:
```
DEBUG: No matching option found. Available options:
  Option 0: {text: "Kiwiwaste Job - Hailes Road", visible: true, selector: "option"}
```

**原因**: 匹配策略失败

**解决**:
1. 检查 Available options 列表
2. 看看项目名称是什么
3. 可能需要调整匹配策略

### 问题 3: 根本没有选项

**症状**:
```
DEBUG: Total visible option count: 0
DEBUG: No matching option found. Available options:
  (空列表)
```

**原因**: 下拉菜单没有打开或搜索没有返回结果

**解决**:
1. 检查项目选择器是否点击成功
2. 检查搜索输入是否正确
3. 手动测试搜索功能

---

## 📸 截图建议

请截图以下内容以便分析问题：

1. **Console 完整日志**
   - 包含所有 DEBUG 信息
   - 从"正在搜索项目"开始到错误/成功结束

2. **扩展弹窗的执行日志**
   - 显示所有步骤和状态

3. **Procore 页面状态**
   - 项目搜索框
   - 下拉菜单（如果有）

4. **Elements 面板**
   - 右键点击下拉选项 → 检查
   - 显示选项的 HTML 结构

---

## 🎯 测试成功标准

✅ **完全成功**:
- 所有 DEBUG 日志正常
- URL 成功改变
- 页面跳转到项目主页
- 执行继续到下一步（Commitments）

⚠️ **部分成功**:
- 找到并点击了选项
- 但 URL 未改变或延迟改变
- 需要增加等待时间

❌ **失败**:
- 找不到匹配的选项
- 或点击后无任何反应
- 需要深入分析

---

## 📞 反馈信息

如果测试失败，请提供：

1. ✅ Console 完整日志截图
2. ✅ 扩展弹窗执行日志截图
3. ✅ Procore 页面截图
4. ✅ 下拉选项的 HTML 结构（Elements 面板）
5. ✅ Chrome 版本号
6. ✅ 测试的详细步骤

将这些信息发送给开发团队进行分析。

---

## 🚀 版本更新

**v1.4.2 更新内容**:
- ✅ 增强点击事件触发（mousedown + mouseup + click）
- ✅ 添加详细的 DEBUG 日志
- ✅ 添加 URL 变化检测
- ✅ 添加所有可用选项的详细输出
- ✅ 改进错误提示信息

---

**开始测试！** 🎉
