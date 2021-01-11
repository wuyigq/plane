# 云开发小游戏 QuickStart

## 快速启动步骤

1. 点击工具栏左侧 “云开发” 按钮，根据提示在控制台中开通云服务
2. 根据提示创建第一个环境（注：初始可免费拥有两个环境，建议一个为测试环境，一个为正式环境，分别命名为 test 和 release）
3. 在控制台中切换到 “数据库” 管理页，创建第一个名为 “score” 的集合，用于存放分数
4. 在工具编辑器目录树中，右键目录 "cloudfunction" 选择 “更多设置”，在打开的窗口上方下拉选择刚创建的环境
5. 在编辑器 "cloudfunction" 目录下，右击目录 “login”，选择新建并上传该云函数，该云函数负责获取用户 openid
6. 在编辑器 "cloudfunction" 目录下，右击目录 “uploadScore”，选择新建并上传该云函数，该云函数负责记录用户分数到数据库
7. 体验小游戏！

## 云开发版 QuickStart 小游戏端与普通小游戏 QuickStart 差异一览

- `main.js`：增加了云能力初始化方法（约 11 行）、获取用户 openid（约 22 行）、获取历史最高分（约 41 行）、调用云函数上传结果（约 130 行）、调用渲染 GameOver 画面时多传入历史最高分（约 198 行）
- `gameinfo.js`：增加了渲染历史最高分（约 37 行）


## 小游戏源码目录介绍

```
./miniprogram/js
├── base                                   // 定义游戏开发基础类
│   ├── animatoin.js                       // 帧动画的简易实现
│   ├── pool.js                            // 对象池的简易实现
│   └── sprite.js                          // 游戏基本元素精灵类
├── libs
│   ├── symbol.js                          // ES6 Symbol简易兼容
│   └── weapp-adapter.js                   // 小游戏适配器
├── npc
│   └── enemy.js                           // 敌机类
├── player
│   ├── bullet.js                          // 子弹类
│   └── index.js                           // 玩家类
├── runtime
│   ├── background.js                      // 背景类
│   ├── gameinfo.js                        // 用于展示分数和结算界面
│   └── music.js                           // 全局音效管理器
├── databus.js                             // 管控游戏状态
└── main.js                                // 游戏入口主函数

```

## 接口介绍

游戏内api
login (openid) 登录接口,返回动态资源信息，兑换历史信息，礼物列表
uploadScore (score) 上传分数
giftList 礼物列表，返回（登录给，方便显示）
rankList 排行榜
exchange (giftid) 兑换礼物
profile (name, address, phone) 个人信息
sendBoard (openid, name, content, time) 发送留言
boardList  留言板记录,返回数据数组成员同sendBoard接口
sendChat (openid, name, content, time) 发送系统的聊天
chatList  与系统的聊天记录,返回数据数组成员同sendChat接口
resourceCfg 动态资源（登录给），返回飞机图片url，背景url

后台api
公用游戏的api（rankList, giftList，boardList, chatList）
sendGift 发放礼物 
resUpdate (飞机图片,背景等) 动态资源
giftUpdate （name, 图片）更新礼物配置
sendChat 系统单聊用户（游戏api加个字段）
sendBoard 系统发送留言（游戏api加个字段）
getProfile 获取玩家信息，给他邮寄礼物
exchangeList 礼物兑换的记录（没说就不做）

后台UI
排行榜，礼物列表及增删改，广播列表及发送，单聊列表及回复，游戏资源列表及增删改，礼物兑换的记录（没说就不做）

数据库
用户表：openid, score, profile, exchange_record,name
礼物表：name, score, pic_url
留言表: penid, name, content, time
聊天表: openid, name, content, time
兑换表: openid, name, time, giftid

文件存储
游戏动态资源图，礼物图