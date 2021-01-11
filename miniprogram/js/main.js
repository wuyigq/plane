import Player from './player/index'
import Enemy from './npc/enemy'
import BackGround from './runtime/background'
import GameInfo from './runtime/gameinfo'
import Music from './runtime/music'
import DataBus from './databus'

let ctx = canvas.getContext('2d')
let databus = new DataBus()

wx.cloud.init({
    // env 参数说明：
    //   env 参数决定接下来小程序发起的云开发调用（wx.cloud.xxx）会默认请求到哪个云环境的资源
    //   此处请填入环境 ID, 环境 ID 可打开云控制台查看
    //   如不填则使用默认环境（第一个创建的环境）
    // env: 'my-env-id',
})
const db = wx.cloud.database()

/**
 * 游戏主函数
 */
export default class Main {
    constructor() {
        // 维护当前requestAnimationFrame的id
        this.aniId = 0
        this.personalHighScore = null

        this.restart()
        this.requestUserInfo()
    }

    requestUserInfo() {
        // 查看是否授权
        let that = this
        wx.getSetting({
            success(res) {
                if (res.authSetting['scope.userInfo']) {
                    // 已经授权，可以直接调用 getUserInfo 获取头像昵称
                    wx.getUserInfo({
                        success: function (res) {
                            const userInfo = res.userInfo;
                            //保存数据，进入游戏主界面
                            console.log(res.userInfo)
                            that.login(res.userInfo)
                        }
                    })
                } else {
                    // 未授权的要调用 createUserInfoButton 创建按钮引导玩家点击
                    const systemInfo = wx.getSystemInfoSync();
                    let safeArea = systemInfo.safeArea;
                    if (!safeArea){
                        safeArea = {
                            left:0,
                            top:0,
                            width:parseInt(window.width),
                            height:parseInt(window.height)
                        }
                    }
                    const button = wx.createUserInfoButton({
                        type: 'text',
                        text: '授权登录',
                        style: {
                            left: 10,
                            top: 76,
                            width: 200,
                            height: 40,
                            lineHeight: 40,
                            backgroundColor: '#ff0000',
                            color: '#ffffff',
                            textAlign: 'center',
                            fontSize: 16,
                            borderRadius: 4
                        }
                    })
                    button.onTap((res) => {
                        if (res && userInfo) {
                            //保存数据，进入游戏主界面
                            console.log(res.userInfo)
                            that.login(res.userInfo)
                        }
                    })
                }
            }
        })
    }

    login(userInfo) {
        let that = this
        this.userInfo = userInfo;
        this.restart()
        // 获取 openid
        if (this.userInfo) {
            wx.cloud.callFunction({
                name: 'login',
                data: {
                    userInfo:this.userInfo
                },
                success: res => {
                    that.userData = res.result
                    that.openid = that.userData.openid
                    that.prefetchHighScore()
                },
                fail: err => {
                    console.error('get openid failed with error', err)
                }
            })
        }
    }

    prefetchHighScore() {
        // 预取历史最高分
        // db.collection('user').doc(this.openid).get()
        //     .then(res => {
        //         if (this.personalHighScore) {
        //             if (res.data.max > this.personalHighScore) {
        //                 this.personalHighScore = res.data.max
        //             }
        //         } else {
        //             this.personalHighScore = res.data.max
        //         }
        //     })
        //     .catch(err => {
        //         console.error('db get score catch error', err)
        //         this.prefetchHighScoreFailed = true
        //     })
    }

    restart() {
        this.score = 0
        databus.reset()

        canvas.removeEventListener(
            'touchstart',
            this.touchHandler
        )

        this.bg = new BackGround(ctx)
        this.player = new Player(ctx)
        this.gameinfo = new GameInfo()
        this.music = new Music()

        this.bindLoop = this.loop.bind(this)
        this.hasEventBind = false

        // 清除上一局的动画
        window.cancelAnimationFrame(this.aniId);

        this.aniId = window.requestAnimationFrame(
            this.bindLoop,
            canvas
        )
    }

    /**
     * 随着帧数变化的敌机生成逻辑
     * 帧数取模定义成生成的频率
     */
    enemyGenerate() {
        if (databus.frame % 30 === 0) {
            let enemy = databus.pool.getItemByClass('enemy', Enemy)
            enemy.init(6)
            databus.enemys.push(enemy)
        }
    }

    // 全局碰撞检测
    collisionDetection() {
        let that = this

        databus.bullets.forEach((bullet) => {
            for (let i = 0, il = databus.enemys.length; i < il; i++) {
                let enemy = databus.enemys[i]

                if (!enemy.isPlaying && enemy.isCollideWith(bullet)) {
                    enemy.playAnimation()
                    that.music.playExplosion()

                    bullet.visible = false
                    databus.score += 1

                    break
                }
            }
        })

        for (let i = 0, il = databus.enemys.length; i < il; i++) {
            let enemy = databus.enemys[i]

            if (this.player.isCollideWith(enemy)) {
                databus.gameOver = true

                // 获取历史高分
                // if (this.personalHighScore) {
                //     if (databus.score > this.personalHighScore) {
                //         this.personalHighScore = databus.score
                //     }
                // }
                this.uploadScore(databus.score)
                break
            }
        }
    }

    // 上传结果
    uploadScore(score) {
        if (score == 0) return;
        if (!this.userData) return;
        if (!this.userInfo) return;

        // 调用 uploadScore 云函数
        wx.cloud.callFunction({
            name: 'uploadScore',
            // data 字段的值为传入云函数的第一个参数 event
            data: {
                openid:this.openid,
                score: score
            },
            success: res => {
                if (this.prefetchHighScoreFailed) {
                    this.prefetchHighScore()
                }
            },
            fail: err => {
                console.error('upload score failed', err)
            }
        })
    }
    // 游戏结束后的触摸事件处理逻辑
    touchEventHandler(e) {
        e.preventDefault()

        let x = e.touches[0].clientX
        let y = e.touches[0].clientY

        let area = this.gameinfo.btnArea

        if (x >= area.startX
            && x <= area.endX
            && y >= area.startY
            && y <= area.endY)
            this.restart()
    }

    /**
     * canvas重绘函数
     * 每一帧重新绘制所有的需要展示的元素
     */
    render() {
        ctx.clearRect(0, 0, canvas.width, canvas.height)

        this.bg.render(ctx)

        databus.bullets
            .concat(databus.enemys)
            .forEach((item) => {
                item.drawToCanvas(ctx)
            })

        this.player.drawToCanvas(ctx)

        databus.animations.forEach((ani) => {
            if (ani.isPlaying) {
                ani.aniRender(ctx)
            }
        })

        this.gameinfo.renderGameScore(ctx, databus.score)

        // 游戏结束停止帧循环
        if (databus.gameOver) {
            this.gameinfo.renderGameOver(
                ctx,
                databus.score,
                this.personalHighScore
            )

            if (!this.hasEventBind) {
                this.hasEventBind = true
                this.touchHandler = this.touchEventHandler.bind(this)
                canvas.addEventListener('touchstart', this.touchHandler)
            }
        }
    }

    // 游戏逻辑更新主函数
    update() {
        if (databus.gameOver)
            return;

        this.bg.update()

        databus.bullets
            .concat(databus.enemys)
            .forEach((item) => {
                item.update()
            })

        this.enemyGenerate()

        this.collisionDetection()

        if (databus.frame % 20 === 0) {
            this.player.shoot()
            this.music.playShoot()
        }
    }

    // 实现游戏帧循环
    loop() {
        databus.frame++

        this.update()
        this.render()

        this.aniId = window.requestAnimationFrame(
            this.bindLoop,
            canvas
        )
    }
}
