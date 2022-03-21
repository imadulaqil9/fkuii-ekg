class CoreRendererCanvasContext2D {

    context: CanvasRenderingContext2D

    constructor(context: CanvasRenderingContext2D) {
        this.context = context
    }

    draw(is_outline: boolean = false) {
        is_outline ? this.context.stroke() : this.context.fill()
    }

    rect(x: number, y: number, w: number, h: number, is_outline: boolean = false) {
        this.context.beginPath()
        this.context.rect(x, y, w, h)
        this.draw(is_outline)
    }

    circle(x: number, y: number, radius: number, is_outline: boolean = false) {
        this.context.beginPath()
        this.context.arc(x, y, radius, 0, core.math.TWO_PI)
        this.draw(is_outline)
    }

    clear() {
        this.context.clearRect(0, 0, this.context.canvas.width, this.context.canvas.height)
    }
}

interface CoreRenderer {
    create_canvas(width?: number, height?: number): HTMLCanvasElement
    create_context_draw(context: CanvasRenderingContext2D): CoreRendererCanvasContext2D
}

core.renderer = {
    create_canvas(w = 600, h = 300) {
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        canvas.style.width = `${w}px`
        canvas.style.height = `${h}px`
        return canvas
    },
    create_context_draw(ctx) {
        return new CoreRendererCanvasContext2D(ctx)
    }
}
