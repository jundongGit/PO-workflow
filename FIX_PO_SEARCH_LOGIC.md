# PO 搜索逻辑修复 - 已完成

## 问题描述

**之前的错误逻辑**：
- Step 3 使用 **Invoice Number** (#335397) 来搜索 PO
- 这是错误的，因为 Procore 的左侧 Number 列显示的是 **Client Order Number** 的数字部分

**正确逻辑**：
- 应该使用 **Client Order Number** (KIWIWASTE-006) 来搜索
- 需要从 "KIWIWASTE-006" 中提取数字部分：006、06、6
- 在左侧的 Number 列中查找匹配的 job 名称

## 修复内容

### 1. 修改 `findAndOpenPO` 函数参数

**位置**: `playwrightAutomation.js:482-602`

**之前**:
```javascript
async function findAndOpenPO(page, invoiceNumber) {
  log(`Step 3: Finding PO with invoice number: ${invoiceNumber}`);
  // 错误地使用 invoiceNumber 搜索
}
```

**修复后**:
```javascript
async function findAndOpenPO(page, clientOrderNumber) {
  log(`Step 3: Finding PO with Client Order Number: ${clientOrderNumber}`);
  // 正确地使用 clientOrderNumber 搜索
}
```

### 2. 添加数字变体提取函数

**位置**: `playwrightAutomation.js:604-634`

新增了 `extractOrderNumberVariants` 函数，用于从 Client Order Number 中提取多种数字格式：

```javascript
/**
 * Extract order number variants from client order number
 * e.g., "KIWIWASTE-006" => ["006", "06", "6"]
 */
function extractOrderNumberVariants(clientOrderNumber) {
  // Extract the number part after the last hyphen
  const parts = clientOrderNumber.split('-');
  const numberPart = parts[parts.length - 1];

  // Generate variants: "006", "06", "6"
  const variants = [];

  // Add original
  variants.push(numberPart);

  // Try removing leading zeros
  const withoutLeadingZeros = numberPart.replace(/^0+/, '');
  if (withoutLeadingZeros && withoutLeadingZeros !== numberPart) {
    variants.push(withoutLeadingZeros);
  }

  // Try with one leading zero removed (if has more than one)
  if (numberPart.startsWith('00')) {
    const oneZeroRemoved = numberPart.substring(1);
    if (!variants.includes(oneZeroRemoved)) {
      variants.push(oneZeroRemoved);
    }
  }

  return variants;
}
```

### 3. 智能搜索逻辑

**新的搜索流程**：

```javascript
// 1. 提取数字变体
const orderNumbers = extractOrderNumberVariants(clientOrderNumber);
// 例如: "KIWIWASTE-006" => ["006", "06", "6"]

// 2. 依次尝试每个变体
for (const orderNum of orderNumbers) {
  log(`Trying to find job with number: ${orderNum}`);

  // 在 Number 列中查找包含该数字的链接
  const poLinkSelectors = [
    `a:has-text("${orderNum}")`,
    `link:has-text("${orderNum}")`,
    `td a:has-text("${orderNum}")`,
    `[role="gridcell"] a:has-text("${orderNum}")`
  ];

  // 找到第一个匹配的链接
  if (poLink) break;
}

// 3. 如果直接查找失败，使用搜索框
if (!poLink) {
  // 在搜索框中输入第一个变体（如 "006"）
  // 然后再次查找
}
```

### 4. 修改主函数调用

**位置**: `playwrightAutomation.js:780`

**之前**:
```javascript
await findAndOpenPO(page, invoiceNumber);  // ❌ 错误
```

**修复后**:
```javascript
await findAndOpenPO(page, clientOrderNumber);  // ✅ 正确
```

## 修复前后对比

### 修复前

```
Step 3: Finding PO with invoice number: #335397
❌ 在 Number 列中找不到 "#335397"
❌ 搜索失败
```

### 修复后

```
Step 3: Finding PO with Client Order Number: KIWIWASTE-006
Extracted order number variants: 006, 06, 6
Trying to find job with number: 006
✅ Found matching PO with number: 006
✅ PO opened for editing
```

## 实际案例

### 示例1: KIWIWASTE-006

```
输入: KIWIWASTE-006
提取变体: ["006", "06", "6"]
搜索顺序:
  1. 尝试 "006" → 可能找到
  2. 尝试 "06"  → 可能找到
  3. 尝试 "6"   → 可能找到
结果: 找到 Number 列中显示为 "6" 或 "06" 或 "006" 的 job
```

### 示例2: MAXION-023

```
输入: MAXION-023
提取变体: ["023", "23"]
搜索顺序:
  1. 尝试 "023" → 可能找到
  2. 尝试 "23"  → 可能找到
结果: 找到 Number 列中显示为 "23" 或 "023" 的 job
```

### 示例3: PROCORE-100

```
输入: PROCORE-100
提取变体: ["100"]
搜索顺序:
  1. 尝试 "100" → 可能找到
结果: 找到 Number 列中显示为 "100" 的 job
```

## 日志输出示例

### 成功找到 PO 的日志

```
[INFO] Step 3: Finding PO with Client Order Number: KIWIWASTE-006
[INFO] Extracted order number variants: 006, 06, 6
[INFO] Searching in Number column for: 006, 06, 6
[INFO] Trying to find job with number: 006
[INFO] Found 2 link(s) with order number 006
[INFO] Found matching PO with number: 006
[INFO] Found PO, clicking to open...
[INFO] ✓ Step 3 completed: PO opened for editing
```

### 使用搜索框查找的日志

```
[INFO] Step 3: Finding PO with Client Order Number: KIWIWASTE-006
[INFO] Extracted order number variants: 006, 06, 6
[INFO] Searching in Number column for: 006, 06, 6
[INFO] Order number not found directly, trying page search...
[INFO] Found search input, searching for: 006
[INFO] Found PO after search: 006
[INFO] Found PO, clicking to open...
[INFO] ✓ Step 3 completed: PO opened for editing
```

### 找不到 PO 的错误日志

```
[INFO] Step 3: Finding PO with Client Order Number: KIWIWASTE-999
[INFO] Extracted order number variants: 999
[INFO] Searching in Number column for: 999
[INFO] Order number not found directly, trying page search...
[ERROR] Could not find PO with Client Order Number: KIWIWASTE-999 (tried: 999)
[ERROR] Failed to find and open PO: Could not find PO with Client Order Number...
```

## 技术优势

### 1. 灵活匹配

支持多种数字格式，增加找到 PO 的成功率：
- "006" → ["006", "06", "6"]
- "023" → ["023", "23"]
- "100" → ["100"]

### 2. 智能搜索

1. 首先直接在页面中查找（最快）
2. 如果找不到，使用搜索框（兼容性更好）
3. 对每个变体都尝试多种选择器（提高成功率）

### 3. 详细日志

每一步都有日志输出，便于调试：
- 显示提取的变体
- 显示正在尝试的数字
- 显示找到的链接数量
- 显示匹配的 PO 编号

### 4. 错误处理

如果所有尝试都失败，会给出详细的错误信息：
- 显示尝试过的所有变体
- 便于用户检查 Client Order Number 是否正确

## 测试建议

### 测试用例1: 标准格式（带前导零）

```
Client Order Number: KIWIWASTE-006
预期: 成功找到 Number 列中的 "6" 或 "06" 或 "006"
```

### 测试用例2: 不带前导零

```
Client Order Number: MAXION-23
预期: 成功找到 Number 列中的 "23"
```

### 测试用例3: 三位数字

```
Client Order Number: PROCORE-100
预期: 成功找到 Number 列中的 "100"
```

### 测试用例4: 不存在的订单

```
Client Order Number: INVALID-999
预期: 显示错误信息，说明找不到 PO
```

## 文件修改清单

1. **server/src/playwrightAutomation.js**
   - 修改 `findAndOpenPO` 函数（第482-602行）
   - 新增 `extractOrderNumberVariants` 函数（第604-634行）
   - 修改 `automateProcore` 函数调用（第780行）

## 更新日志

**2025-10-26**
- ✅ 修复 PO 搜索逻辑，使用 Client Order Number 而不是 Invoice Number
- ✅ 添加数字变体提取功能（006 → [006, 06, 6]）
- ✅ 实现智能搜索（直接查找 + 搜索框）
- ✅ 添加详细的日志输出
- ✅ 重启后端服务器应用更新

---

**现在可以正确使用 Client Order Number 搜索 PO 了！🎉**
