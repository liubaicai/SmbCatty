<p align="center">
  <img src="public/icon.png" alt="SmbCatty" width="128" height="128">
</p>

<h1 align="center">SmbCatty</h1>

<p align="center">
  <strong>现代化的 SMB/CIFS 网络共享浏览器</strong>
</p>

<p align="center">
  一款使用 Electron 和 React 构建的精美、功能丰富的 SMB 客户端。<br/>
  轻松浏览、管理和传输 Windows 网络共享上的文件。
</p>

<p align="center">
  <a href="#"><img alt="Platform" src="https://img.shields.io/badge/平台-macOS%20%7C%20Windows%20%7C%20Linux-blue?style=for-the-badge&logo=electron"></a>
  &nbsp;
  <a href="LICENSE"><img alt="License" src="https://img.shields.io/badge/许可证-GPL--3.0-green?style=for-the-badge"></a>
</p>

<p align="center">
  <a href="./README.md">English</a> · <a href="./README.zh-CN.md">简体中文</a> · <a href="./README.ja-JP.md">日本語</a>
</p>

---

# 什么是 SmbCatty

SmbCatty 是一款现代化的跨平台 SMB/CIFS 客户端,用于浏览和管理 Windows 网络共享。它提供直观的文件浏览器界面,用于连接 SMB 服务器和传输文件。

## 功能特性

- **SMB/CIFS 协议支持** - 连接 Windows 共享、NAS 设备和 Samba 服务器
- **双窗格文件浏览器** - 本地和远程文件管理,支持拖放操作
- **主机管理** - 保存和组织您的 SMB 服务器连接
- **文件传输** - 上传和下载文件,带进度跟踪
- **跨平台** - 支持 macOS、Windows 和 Linux
- **云同步** - 跨设备同步您的主机配置

## 安装

从发布页面下载适合您平台的最新版本。

### 从源码构建

```bash
# 克隆仓库
git clone https://github.com/liubaicai/SmbCatty.git
cd SmbCatty

# 安装依赖
npm install

# 以开发模式启动
npm run dev

# 构建生产版本
npm run build
```

## 许可证

GPL-3.0 许可证 - 详见 [LICENSE](LICENSE)。
