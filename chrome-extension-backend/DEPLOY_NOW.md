# 🚀 立即部署后端API（5分钟）

## 一、安装Vercel CLI

打开终端，运行：

```bash
npm install -g vercel
```

## 二、登录Vercel

```bash
vercel login
```

**会打开浏览器让您登录：**
- 推荐使用GitHub账号登录
- 完全免费
- 登录后回到终端

## 三、部署API

```bash
# 进入后端目录
cd /Users/jundong/Documents/FREEAI/Dev/PO-workflow/chrome-extension-backend

# 安装依赖
npm install

# 首次部署
vercel

# 按照提示操作:
# ? Set up and deploy "~/chrome-extension-backend"? [Y/n] Y
# ? Which scope do you want to deploy to? [选择你的账号]
# ? Link to existing project? [N/y] n
# ? What's your project's name? invoice-automation-api
# ? In which directory is your code located? ./
#
# 等待部署完成...
#
# ✅ 部署成功！
#
# 你会看到类似的URL:
# https://invoice-automation-api-xxxxx.vercel.app
```

**🔴 重要：复制这个URL，我们稍后需要用到！**

## 四、生产部署

```bash
# 部署到生产环境
vercel --prod

# 会再次显示URL，例如:
# https://invoice-automation-api.vercel.app
```

**🔴 记下这个生产环境URL！**

## 五、配置OpenAI API Key

```bash
# 添加环境变量
vercel env add OPENAI_API_KEY

# 提示输入:
# ? What's the value of OPENAI_API_KEY?
# 粘贴你的OpenAI API Key: sk-proj-xxxxxxxxxxxxxxxxxxxxx

# 选择环境 (全选):
# ? Add OPENAI_API_KEY to which Environments?
#   ◉ Production
#   ◉ Preview
#   ◉ Development
# 按空格选择，回车确认

# ✅ 成功添加！
```

## 六、重新部署（使环境变量生效）

```bash
vercel --prod

# 等待部署完成...
# ✅ 完成！
```

## 七、测试API

```bash
# 测试API是否工作
curl -X POST https://your-api.vercel.app/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"image":"data:image/png;base64,test","fileName":"test.pdf"}'

# 应该返回错误（因为是测试数据），但不应该是404或500
# 看到类似 "Failed to parse AI response" 就说明API在工作
```

---

## ✅ 部署完成检查清单

- [ ] Vercel CLI已安装
- [ ] 已登录Vercel账号
- [ ] 已部署到Vercel
- [ ] 已获取生产环境URL
- [ ] 已添加OPENAI_API_KEY环境变量
- [ ] 已重新部署
- [ ] 已测试API（返回响应）

---

## 📝 记录您的API URL

**您的API地址是：**
```
https://invoice-automation-api.vercel.app
```

**完整API端点：**
```
https://invoice-automation-api.vercel.app/api/analyze
```

**⚠️ 请将此URL复制保存，下一步需要用到！**

---

## 💰 成本说明

**Vercel免费套餐包含：**
- ✅ 100GB带宽/月
- ✅ 100GB执行时间
- ✅ 无限函数调用
- ✅ 完全够用！

**OpenAI API成本：**
- ~$0.01/次识别
- 500次/月 = $5
- 完全可控

---

## ❓ 常见问题

### Q: vercel命令找不到？
```bash
# 重新安装
npm install -g vercel

# 或使用npx
npx vercel
```

### Q: 登录失败？
- 检查网络连接
- 尝试使用VPN
- 使用GitHub登录最稳定

### Q: 部署失败？
```bash
# 查看详细日志
vercel logs

# 删除重新部署
rm -rf .vercel
vercel --prod
```

### Q: API返回500错误？
```bash
# 检查环境变量
vercel env ls

# 重新添加
vercel env rm OPENAI_API_KEY
vercel env add OPENAI_API_KEY
vercel --prod
```

---

## 🎉 下一步

部署完成后，继续执行：

```bash
# 返回项目根目录
cd ..

# 继续下一步：配置Chrome扩展
# 查看文件: CONFIGURE_EXTENSION.md
```
