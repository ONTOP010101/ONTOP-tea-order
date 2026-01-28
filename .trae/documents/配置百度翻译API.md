# 配置百度翻译API

## 问题分析

百度翻译未配置的问题是因为系统缺少百度翻译API的环境变量配置。从代码中可以看到，百度翻译服务需要两个环境变量：`BAIDU_TRANSLATE_APP_ID`和`BAIDU_TRANSLATE_SECRET_KEY`。

## 解决方案

1. **在.env文件中添加百度翻译API配置**

   * 在`apps/server/.env`文件末尾添加百度翻译API的配置项

2. **在.env.example文件中添加配置示例**

   * 在`apps/server/.env.example`文件末尾添加百度翻译API的配置示例，以便用户了解需要配置哪些项

3. **添加配置说明**

   * 在配置项旁边添加注释，说明如何获取百度翻译API的App ID和Secret Key

## 具体步骤

1. 编辑`apps/server/.env`文件，添加百度翻译API配置
2. 编辑`apps/server/.env.example`文件，添加配置示例
3. 重启后端服务器，使配置生效

## 预期结果

* 后端服务器启动时会显示"✅ \[百度翻译] 配置已加载"的信息

* 翻译功能将能够使用百度翻译API进行多语言翻译

* 系统的多语言支持功能将更加完善

