<p align="center">
  <img src="public/icon.png" alt="SmbCatty" width="128" height="128">
</p>

<h1 align="center">SmbCatty</h1>

<p align="center">
  <strong>モダンな SMB/CIFS ネットワーク共有ブラウザ</strong>
</p>

<p align="center">
  Electron と React で構築された美しく機能豊富な SMB クライアント。<br/>
  Windows ネットワーク共有上のファイルを簡単に閲覧、管理、転送できます。
</p>

<p align="center">
  <a href="#"><img alt="Platform" src="https://img.shields.io/badge/プラットフォーム-macOS%20%7C%20Windows%20%7C%20Linux-blue?style=for-the-badge&logo=electron"></a>
  &nbsp;
  <a href="LICENSE"><img alt="License" src="https://img.shields.io/badge/ライセンス-GPL--3.0-green?style=for-the-badge"></a>
</p>

<p align="center">
  <a href="./README.md">English</a> · <a href="./README.zh-CN.md">简体中文</a> · <a href="./README.ja-JP.md">日本語</a>
</p>

---

# SmbCatty とは

SmbCatty は、Windows ネットワーク共有を閲覧・管理するためのモダンなクロスプラットフォーム SMB/CIFS クライアントです。SMB サーバーへの接続とファイル転送のための直感的なファイルブラウザインターフェースを提供します。

## 機能

- **SMB/CIFS プロトコルサポート** - Windows 共有、NAS デバイス、Samba サーバーに接続
- **デュアルペインファイルブラウザ** - ドラッグ＆ドロップでローカルとリモートのファイル管理
- **ホスト管理** - SMB サーバー接続を保存・整理
- **ファイル転送** - 進捗追跡付きでファイルをアップロード・ダウンロード
- **クロスプラットフォーム** - macOS、Windows、Linux で動作
- **クラウド同期** - デバイス間でホスト設定を同期

## インストール

リリースページからお使いのプラットフォーム用の最新リリースをダウンロードしてください。

### ソースからビルド

```bash
# リポジトリをクローン
git clone https://github.com/liubaicai/SmbCatty.git
cd SmbCatty

# 依存関係をインストール
npm install

# 開発モードで起動
npm run dev

# 本番用にビルド
npm run build
```

## ライセンス

GPL-3.0 ライセンス - 詳細は [LICENSE](LICENSE) を参照してください。
