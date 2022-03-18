import fs from 'fs'
import path from 'path'
import ts from 'typescript'
import sass from 'sass'
import readdr from 'fs-readdir-recursive'
import globcat from 'globcat'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const resolve = (...paths) => path.resolve(__dirname, ...paths)
const relative = (...paths) => path.relative(resolve('../../'), ...paths)

const log = (color_code, pre, content, ...misc) => console.log(`\x1b[${color_code}m%s\x1b[0m %s`, pre, content, ...misc)

const mkdir = (p, log_pre = '+ build') => {
    if (!fs.existsSync(p)) {
        fs.mkdirSync(p)
        if (log_pre) {
            log(32, log_pre, relative(p))
        }
    }
}

const write = (p, data = '', log_pre = '+ build', force = false) => {
    if (!fs.existsSync(p) || force) {
        fs.writeFileSync(p, data)
        if (log_pre) {
            log(32, log_pre, relative(p))
        }
    }
}

const stream_to_string = (stream) => {
    const chunks = []
    return new Promise((resolve, reject) => {
        stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)))
        stream.on('error', (err) => reject(err))
        stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    })
}

const public_path = resolve('../../public')

const ensure = () => {
    log(36, 'i build:', 'ensuring required path exists')

    // Public path check
    mkdir(public_path)
    mkdir(resolve(public_path, 'js'))
    mkdir(resolve(public_path, 'css'))
    write(resolve(public_path, 'js/app.js'), '')
    write(resolve(public_path, 'css/style.css'), '')
    write(resolve(public_path, 'index.html'), `<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
    <link rel="stylesheet" href="css/style.css">
</head>

<body>
    <script src="js/app.js"></script>
</body>

</html>`)

    // Data path check
    mkdir(resolve('../src'))

    // Dev path check
    mkdir(resolve('../js_build'))
}

const build_css = () => {
    try {
        write(
            resolve(public_path, 'css/style.css'),
            sass.compile(
                resolve('../', 'style.scss'),
                { style: 'compressed' }
            ).css, '+ css:', true
        )
    }
    catch (err) {
        console.log(err)
    }
}

const compile_ts = () => {
    log(36, 'i ts:', 'compiling...')

    const ts_files = readdr(resolve('../src')).map(p => resolve('../src', p))

    const program = ts.createProgram(ts_files, {
        target: 'es5',
        module: 'commonjs',
        lib: [
            'lib.dom.d.ts',
            'lib.es2018.d.ts'
        ],
        outDir: resolve('../js_build'),
        rootDir: resolve('../'),
        strict: true,
        skipLibCheck: true,
        removeComments: true,
    })

    const emit = program.emit()
    ts.getPreEmitDiagnostics(program)
        .concat(emit.diagnostics)
        .forEach(diag => {
            if (diag.file) {
                const { line, character } = ts.getLineAndCharacterOfPosition(diag.file, diag.start)
                const message = ts.flattenDiagnosticMessageText(diag.messageText, '\n')
                console.log(`${diag.file.fileName} (${line + 1},${character + 1}): ${message}`)
            }
            else {
                console.log(ts.flattenDiagnosticMessageText(diag.messageText, '\n'))
            }
        })
}

const clean_js = (fullclean = false) => {
    readdr(resolve('../js_build')).forEach(name => {
        const input = resolve('../', name.replace(/\.js$/i, '.ts'))
        if (!fs.existsSync(input) || fullclean) {
            const output = resolve('../js_build', name)
            fs.unlinkSync(output)
            log(31, '- js:', relative(output))
        }
    })
}

const build_js = async () => {
    clean_js()

    const comp = []
    const add = p => comp.push(resolve('../js_build/src', p))

    add('core/math.js')
    add('base/game_manager.js')

    const stream = await globcat(comp, { stream: true })
    const result = await stream_to_string(stream)

    write(resolve(public_path, 'js/app.js'), result, '+ js:', true)
}

const build = async () => {
    log(36, 'i build:', `start building: css, js`)
    ensure()
    build_css()
    compile_ts()
    await build_js()
}

// WATCH LOGIC

const rebounce_time = 1000
const watch = (path, filter, callback) => {
    let can_rebuild = true // for rebounce
    const reset = () => can_rebuild = true
    fs.watch(path, { recursive: true }, async (ev, name) => {
        if (can_rebuild && name && filter(name)) {
            can_rebuild = false
            setTimeout(reset, rebounce_time)
            await callback(ev, name)
        }
    })
}

await build()

log(36, 'i watch:', `start watching: css, js`)
watch(resolve('../'), name => /\.s[ac]ss$/i.test(name), async () => build_css())
watch(resolve('../src'), name => /\.ts$/i.test(name), async () => {
    compile_ts()
    await build_js()
})