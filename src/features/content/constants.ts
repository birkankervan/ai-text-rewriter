export const MODAL_WIDTH = 380
export const PADDING = 12
export const OFFSET_Y = 12

export const isEditableElement = (element: Element | null): boolean => {
    if (!element) return false
    const tagName = element.tagName.toLowerCase()
    const isInput = tagName === "input" || tagName === "textarea"
    const isContentEditable = (element as HTMLElement).isContentEditable

    if (isInput) {
        const input = element as HTMLInputElement | HTMLTextAreaElement
        return !input.readOnly && !input.disabled
    }

    return isContentEditable
}
