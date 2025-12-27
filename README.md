# 写真匣子 (Photo Box)

一个基于 Electron 开发的桌面写真图片管理工具，提供简洁高效的图片浏览和管理功能。

## ✨ 功能特性

- 📁 **目录扫描**：快速扫描并管理指定目录下的图片文件
- 🖼️ **图片浏览**：支持缩放、旋转、幻灯片等多种浏览模式
- ⚙️ **快捷键设置**：可自定义各种操作的快捷键
- 🔄 **自动更新**：启动时自动检查GitHub最新版本
- 🌐 **外部链接**：GitHub链接在默认浏览器中打开
- 📝 **更新日志**：查看版本更新内容

## 📦 安装

### 环境要求

- Node.js 14.0 或更高版本
- npm 6.0 或更高版本

### 安装步骤

1. **克隆仓库**
   ```bash
   git clone https://github.com/noocrush/photo-box.git
   cd photo-box
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **启动应用**
   ```bash
   npm start
   ```

## 🚀 使用方法

### 基本操作

1. **选择图片目录**：点击菜单栏「文件」→「选择扫描目录」或使用快捷键
2. **浏览图片**：在主界面选择图片进行浏览
3. **缩放控制**：使用鼠标滚轮或快捷键进行缩放
4. **快捷键设置**：点击菜单栏「设置」→「快捷键设置」进行自定义

### 更新检查

- **自动检查**：应用启动后会自动检查GitHub最新版本
- **手动检查**：点击「关于」页面中的「检查更新」按钮
- **更新提示**：发现新版本时会弹出对话框提示

### 外部链接

- **官方主页**：点击「关于」页面的「官方主页」按钮访问GitHub项目
- **问题反馈**：点击「关于」页面的「问题反馈」按钮提交Issue

## ⌨️ 快捷键

默认快捷键配置：

| 功能 | 快捷键 |
|------|--------|
| 扫描目录 | Ctrl+O |
| 退出应用 | Ctrl+Q |
| 刷新列表 | Ctrl+R |
| 关于页面 | F1 |
| 下一张图片 | ArrowRight |
| 上一张图片 | ArrowLeft |
| 放大 | Ctrl+Plus |
| 缩小 | Ctrl+Minus |
| 重置缩放 | Ctrl+0 |
| 关闭查看器 | Escape |

可在「快捷键设置」中自定义所有快捷键。

## 📁 项目结构

```
photo-box/
├── build/            # 构建资源
│   ├── icon.png      # 应用图标
│   └── icon.svg      # SVG图标
├── scripts/          # JavaScript脚本
│   ├── nav-handler.js       # 导航处理
│   ├── photo-viewer.js      # 图片查看器
│   ├── renderer.js          # 渲染进程逻辑
│   ├── shortcut-settings.js # 快捷键设置
│   └── utils.js             # 工具函数
├── styles/           # 样式文件
│   └── main.css      # 主样式表
├── about.html        # 关于页面
├── favorites.html    # 收藏页面
├── index.html        # 主页面
├── main.js           # 主进程入口
├── model-detail.html # 模型详情页面
├── package.json      # 项目配置
├── preload.js        # 预加载脚本
├── search.html       # 搜索页面
├── settings.html     # 设置页面
└── shortcut-settings.html # 快捷键设置页面
```

## 🤝 贡献

欢迎提交Issue和Pull Request来帮助改进项目！

1. Fork 本仓库
2. 创建您的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交您的更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开一个Pull Request

## 📄 许可证

本项目采用MIT许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 📧 联系方式

- **项目主页**：[https://github.com/noocrush/photo-box](https://github.com/noocrush/photo-box)
- **问题反馈**：[https://github.com/noocrush/photo-box/issues](https://github.com/noocrush/photo-box/issues)
- **联系邮箱**：mcc83500@163.com

---

**写真匣子** - 让图片管理更简单！ 🎉
