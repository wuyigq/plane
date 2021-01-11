// 云函数入口文件
const cloud = require('wx-server-sdk')

// 与小程序端一致，均需调用 init 方法初始化
cloud.init({
    // API 调用都保持和云函数当前所在环境一致
    env: cloud.DYNAMIC_CURRENT_ENV
})

// 可在入口函数外缓存 db 对象
const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
    const score = event.score
    const openid = event.openid
    const _ = db.command
    try {
        await db.collection('user').doc(openid).update({
            data: {
                // 表示指示数据库将字段自增 10
                score: score//_.inc(score)
            },
            success: function (res) {
                console.log("update score success")
            }
        })
    } catch (err) {
        console.log(err)
    }
    return {
        success: true,
        created: false,
    }
}
