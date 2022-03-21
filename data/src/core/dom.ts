interface CoreDom {
    append(element: HTMLElement, parent?: HTMLElement): HTMLElement
}

core.dom = {
    append(el, parent = document.body) {
        return parent.appendChild(el)
    }
}
