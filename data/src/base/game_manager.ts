const canvas = core.renderer.create_canvas()
const draw = core.renderer.create_context_draw(canvas.getContext('2d')!)

const world = {
    x: 4,
    y: 4,
    w: 600 - 8,
    h: 300 - 8,
}

const ball = {
    r: 30,
    x: 100,
    y: 100,
    px: 100,
    py: 100,
    spd: 10,
    vx: 10,
    vy: 10,
}

let shake = {
    x: 0,
    y: 0,
    mag: 3,
    time: 100,
    is_active: false,
    reset() {
        this.x = 0
        this.y = 0
        this.is_active = false
    },
    activate() {
        if (this.is_active) return
        this.is_active = true
        let expired_time = Date.now() + this.time
        const shake_loop = () => {
            shake.x = -this.mag + Math.random() * 2 * this.mag
            shake.y = -this.mag + Math.random() * 2 * this.mag
            if (Date.now() > expired_time) this.reset()
            else window.requestAnimationFrame(shake_loop)
        }
        window.requestAnimationFrame(shake_loop)
    },
}

const loop = () => {
    ball.px = ball.x
    ball.py = ball.y

    ball.x += ball.vx
    ball.y += ball.vy

    if (ball.x >= world.w - ball.r || ball.x <= ball.r) {
        // ball.x = ball.px
        ball.vx = -Math.sign(ball.vx) * Math.max(Math.abs(ball.vx), Math.random() * ball.spd)
        shake.activate()
    }

    if (ball.y >= world.h - ball.r || ball.y <= ball.r) {
        // ball.y = ball.py
        ball.vy = -Math.sign(ball.vy) * Math.max(Math.abs(ball.vy), Math.random() * ball.spd)
        shake.activate()
    }



    draw.clear()
    draw.circle(ball.x + shake.x, ball.y + shake.y, ball.r)
    draw.rect(world.x + shake.x, world.y + shake.y, world.w, world.h, true)
    window.requestAnimationFrame(loop)
}

core.dom.append(canvas)
loop()
