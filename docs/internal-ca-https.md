# WMS-A 内部 CA HTTPS 部署指南

## 概述

本文档说明如何为 WMS-A 配置内部 CA 签发的 HTTPS 证书，使内网用户可通过以下地址访问：

```
https://wms.factory.os
https://wms.factory.os/api
```

所有操作在 WMS 服务器（Linux / macOS）上执行，不在客户端机器上生成密钥。

---

## 1. 内网 DNS 配置

### 1.1 方法 A：路由器 DNS（推荐）

在路由器或内网 DNS 服务器中添加一条 A 记录：

```
wms.factory.os  →  192.168.x.x（WMS 服务器内网 IP）
```

配置后所有设备自动生效。

### 1.2 方法 B：hosts 文件

如果无 DNS 管理权限，在每台客户机上编辑 hosts 文件：

**Windows：**
```
C:\Windows\System32\drivers\etc\hosts
添加：192.168.x.x wms.factory.os
```

**macOS / Linux：**
```
/etc/hosts
添加：192.168.x.x wms.factory.os
```

**Android：** 需要 root 或使用个人 CA 证书配合 DNS

**iOS：** 需要在「设置 → 通用 → 关于 → 证书信任设置」中信任根证书，并在 Wi-Fi 配置中设置 DNS

---

## 2. 生成内部 Root CA

> 这些操作只需执行一次。Root CA 私钥必须安全保管。

### 2.1 创建 Root CA 密钥和证书

```bash
# 创建目录
mkdir -p ~/wms-ca && cd ~/wms-ca

# 生成 Root CA 私钥（带密码保护）
openssl genrsa -aes256 -out root-ca.key 4096

# 生成 Root CA 自签名证书（有效期 10 年）
openssl req -x509 -new -nodes -key root-ca.key \
  -sha256 -days 3650 \
  -out root-ca.crt \
  -subj "/C=CN/O=WMS Internal CA/CN=WMS Root CA"
```

**不要**提交 `root-ca.key` 到仓库。

---

## 3. 生成 wms.factory.os 服务器证书

### 3.1 配置文件

创建 `~/wms-ca/wms.factory.os.conf`：

```ini
[req]
default_bits        = 2048
distinguished_name  = req_distinguished_name
req_extensions      = req_ext
x509_extensions     = v3_ext
prompt              = no

[req_distinguished_name]
C   = CN
O   = WMS Internal
CN  = wms.factory.os

[req_ext]
subjectAltName = @alt_names

[v3_ext]
subjectAltName = @alt_names
keyUsage = digitalSignature, keyEncipherment
extendedKeyUsage = serverAuth

[alt_names]
DNS.1 = wms.factory.os
DNS.2 = *.factory.os
```

### 3.2 生成证书

```bash
cd ~/wms-ca

# 生成私钥
openssl genrsa -out wms.factory.os.key 2048

# 生成 CSR
openssl req -new -key wms.factory.os.key \
  -out wms.factory.os.csr \
  -config wms.factory.os.conf

# 用 Root CA 签发服务器证书（有效期 5 年）
openssl x509 -req -in wms.factory.os.csr \
  -CA root-ca.crt -CAkey root-ca.key \
  -CAcreateserial -out wms.factory.os.crt \
  -days 1825 -sha256 \
  -extensions v3_ext -extfile wms.factory.os.conf
```

### 3.3 验证证书

```bash
openssl verify -CAfile root-ca.crt wms.factory.os.crt
```
应输出：`wms.factory.os.crt: OK`

---

## 4. Nginx HTTPS 配置

### 4.1 放置证书文件

```bash
# 在 WMS 服务器上
sudo mkdir -p /etc/nginx/certs
sudo cp ~/wms-ca/wms.factory.os.crt /etc/nginx/certs/
sudo cp ~/wms-ca/wms.factory.os.key /etc/nginx/certs/
sudo chmod 600 /etc/nginx/certs/wms.factory.os.key
```

### 4.2 Nginx 配置

参考仓库中的 `deploy/nginx/wms.factory.os.conf.example`。

主要配置要点：

```nginx
server {
    listen 80;
    server_name wms.factory.os;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name wms.factory.os;

    ssl_certificate     /etc/nginx/certs/wms.factory.os.crt;
    ssl_certificate_key /etc/nginx/certs/wms.factory.os.key;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # 前端静态文件
    root /var/www/wms;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # API 反向代理
    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 4.3 验证 Nginx 配置

```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

## 5. 客户端安装 Root CA 证书

### 5.1 Windows

1. 将 `root-ca.crt` 复制到 Windows 电脑
2. 双击 `root-ca.crt` → **安装证书**
3. 选择 **本地计算机**
4. 选择 **将所有证书放入下列存储** → **受信任的根证书颁发机构**
5. 完成

验证：浏览器打开 `https://wms.factory.os`，不应出现安全警告。

### 5.2 macOS

1. 将 `root-ca.crt` 复制到 Mac
2. 双击 `root-ca.crt` → 钥匙串访问自动打开
3. 证书出现在 **登录** 钥匙串 → 将其拖到 **系统** 钥匙串
4. 双击该证书 → 展开 **信任** → 将 **使用此证书时** 改为 **始终信任**
5. 关闭钥匙串访问，输入密码确认

### 5.3 Android（PDA）

1. 将 `root-ca.crt` 复制到 Android 设备
2. **设置 → 安全 → 加密与凭据 → 安装证书 → CA 证书**
3. 选择 `root-ca.crt` 文件
4. 确认安装

> **注意**：Android 7.0+ 默认不信任用户安装的 CA 证书用于应用流量。
> 如果 WMS 使用 WebView 或原生应用访问，可能需要配置网络安全策略。
> 但仅用浏览器访问 `https://wms.factory.os` 是可行的。

### 5.4 iOS / iPad

1. 将 `root-ca.crt` 通过邮件、AirDrop 或 Web 服务器下载到设备
2. **设置 → 通用 → VPN 与设备管理** → 点击证书 → **安装**
3. **设置 → 通用 → 关于 → 证书信任设置**
4. 找到 **WMS Root CA** → 开启开关

### 5.5 Android PDA 扫码要点

- PDA 通常运行 Android，部分厂家（如 Zebra、优博讯）有专用设置
- 如果 PDA 扫码 App 直接调用系统浏览器访问 `https://wms.factory.os`，安装 CA 证书后即可
- 如果 PDA 使用原生应用（如 HTTP 客户端库），可能需要应用级别的证书信任配置

---

## 6. 安全注意事项

| 事项 | 说明 |
|---|---|
| **不要提交私钥** | `*.key`、`*.pem` 已在 `.gitignore` 中禁止 |
| **不要提交证书文件** | `*.crt`、`*.csr` 已在 `.gitignore` 中禁止 |
| **不要提交 `.env`** | 已在 `.gitignore` 中禁止 |
| **Root CA 私钥保护** | `root-ca.key` 带密码加密，离线备份 |
| **证书泄露** | 服务器证书泄露仅影响该域名，重新签发即可 |
| **私钥泄露** | 立即撤销并重新签发 |

---

## 7. 验收清单

- [ ] `wms.factory.os` 解析到 WMS 服务器内网 IP
- [ ] `https://wms.factory.os` 可正常访问，无证书警告
- [ ] `https://wms.factory.os/api` 返回 API 响应
- [ ] `https://wms.factory.os/api/health` 返回 `{"status":"ok"}`
- [ ] 管理员可通过 `https://wms.factory.os` 登录
- [ ] 手机 / PDA 安装 CA 后无证书警告
- [ ] 仓库操作员可在手机 / PDA 上完成入库、出库操作
- [ ] Nginx 80 → 443 自动跳转
- [ ] 证书私钥未提交到仓库
- [ ] `.env` 未提交到仓库
