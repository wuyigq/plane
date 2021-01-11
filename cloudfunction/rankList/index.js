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
    const _ = db.command
    try {
        const querResult = await db.collection('user').where({
            // gt 方法用于指定一个 "大于" 条件，此处 _.gt(30) 是一个 "大于 30" 的条件
            score: _.gt(0)
        }, { limit: 100 }).get()
        return {
            success: true,
            data: querResult.data,
        }
    } catch (err) {
        console.log(err)
    }
    return {
        success: false,
        data: []
    }
}
