// 云函数模板
// 部署：在 cloud-functions/login 文件夹右击选择 “上传并部署”

const cloud = require('wx-server-sdk')

// 初始化 cloud
cloud.init({
    // API 调用都保持和云函数当前所在环境一致
    env: cloud.DYNAMIC_CURRENT_ENV
})

// 可在入口函数外缓存 db 对象
const db = cloud.database()
const user_coll = db.collection('user');
const _ = db.command

/**
 * 这个示例将经自动鉴权过的小程序用户 openid 返回给小程序端
 * 
 * event 参数包含小程序端调用传入的 data
 * 
 */
exports.main = async (event, context) => {
    // 获取 WX Context (微信调用上下文)，包括 OPENID、APPID、及 UNIONID（需满足 UNIONID 获取条件）等信息
    const wxContext = cloud.getWXContext()

    let openid = wxContext.OPENID;
    let data
    try {
        const querResult = await user_coll.doc(openid).get()
        data = querResult.data
        await user_coll.doc(openid).update({
            data:{
                userInfo: _.set(
                    event.userInfo
                )
            },
            success: function(res) {
                console.log("update userInfo success")
            }
        })
    } catch (err) {
        // 新用户
        console.log("-------err---------")
        console.log(err)
    }
    console.log("-------event.userInfo---------")
    if (!data) {// 新用户注册
        data = {
            _id: openid,
            userInfo: event.userInfo,
            score: 0,
        }
        await user_coll.add({data: data})
    }

    //礼物列表
    try {
        const querResult = await db.collection('gift').get()
        data.gift = querResult.data
    } catch (err) {
    }
    
    // 兑换历史信息
    try {
        const querResult = await db.collection('exchange').get()
        data.exchange = querResult.data
    } catch (err) {
    }
    
    // 动态资源信息
    try {
        const querResult = await db.collection('res').get()
        data.res = querResult.data
    } catch (err) {
    }

    data.openid = wxContext.OPENID;
    data.appid = wxContext.APPID;
    data.unionid = wxContext.UNIONID;
    data.env = wxContext.ENV;

    return data
}

