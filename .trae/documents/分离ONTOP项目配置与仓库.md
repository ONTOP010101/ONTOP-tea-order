# 分离ONTOP项目配置与仓库计划

## 问题分析
1. 两个项目（原始和复制的）目前共用一个数据库 `tea_order_system`
2. 复制的项目需要与原始项目区分开，包括数据库和git仓库
3. 用户已创建新的GitHub仓库：`https://github.com/ONTOP010101/NewONTOP`

## 解决方案

### 1. 数据库分离
- 修改 `D:\NewONTOP\ONTOP\apps\server\.env` 文件
- 将数据库名从 `tea_order_system` 改为 `tea_order_system_new`
- 确保数据库服务已启动
- 创建新的数据库 `tea_order_system_new`（如果不存在）

### 2. Git仓库分离
- 移除 `D:\NewONTOP\ONTOP` 目录中的 `.git` 目录
- 初始化新的git仓库
- 创建 `.gitignore` 文件（如果不存在）
- 配置远程仓库为 `https://github.com/ONTOP010101/NewONTOP`

### 3. 服务端口调整（可选）
- 为了避免端口冲突，可以修改 `D:\NewONTOP\ONTOP\apps\server\.env` 中的服务端口
- 将 `PORT=3003` 改为 `PORT=3004`
- 相应地调整前端项目中的API配置

## 执行步骤
1. **修改数据库配置文件**
   - 编辑 `D:\NewONTOP\ONTOP\apps\server\.env` 文件
   - 更新数据库名称为 `tea_order_system_new`

2. **创建新数据库**
   - 连接到MySQL数据库
   - 执行 `CREATE DATABASE IF NOT EXISTS tea_order_system_new CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`

3. **移除旧的git配置**
   - 删除 `D:\NewONTOP\ONTOP\.git` 目录

4. **初始化新的git仓库**
   - 在 `D:\NewONTOP\ONTOP` 目录中执行 `git init`

5. **创建或更新 .gitignore 文件**
   - 确保 `.gitignore` 文件包含常见的忽略项

6. **配置远程仓库连接**
   - 执行 `git remote add origin https://github.com/ONTOP010101/NewONTOP`

7. **测试服务启动**
   - 启动后端服务
   - 启动前端服务
   - 验证服务正常运行

## 预期结果
- 两个项目使用不同的数据库，数据互不干扰
- 复制的项目有独立的git仓库，可以推送到新的远程仓库 `https://github.com/ONTOP010101/NewONTOP`
- 两个项目可以同时运行，不会相互影响