/**
 * Svelte action that shrinks an element's font-size only when its content would
 * overflow the available horizontal space. Text that already fits keeps the
 * font-size defined in CSS.
 *
 * Requirements on the target element (or its parent context):
 *  - white-space: nowrap
 *  - overflow: hidden (so we can measure scrollWidth vs clientWidth)
 *  - sized to available space (e.g. flex: 1 with min-width: 0)
 */
export function fitText(node: HTMLElement) {
	function adjust() {
		// Clear any inline font-size so we measure against the CSS-defined size
		node.style.fontSize = '';
		const natural = parseFloat(getComputedStyle(node).fontSize);
		if (node.scrollWidth > node.clientWidth && node.clientWidth > 0) {
			const newSize = natural * (node.clientWidth / node.scrollWidth);
			node.style.fontSize = `${newSize}px`;
		}
	}

	const schedule = () => requestAnimationFrame(adjust);

	schedule();

	const ro = new ResizeObserver(schedule);
	if (node.parentElement) ro.observe(node.parentElement);

	const mo = new MutationObserver(schedule);
	mo.observe(node, { childList: true, characterData: true, subtree: true });

	return {
		destroy() {
			ro.disconnect();
			mo.disconnect();
		}
	};
}
