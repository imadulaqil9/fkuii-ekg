interface CoreMath {
    TWO_PI: number
    double(x: number): number
}

core.math = {
    TWO_PI: 2 * Math.PI,
    double(x) {
        return x * 2
    },
}
