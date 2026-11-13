// The study's 62 observations reduce to these 19 distinct six-color palettes.
// Substitution checks authored CSS, not operating-system forced-color painting.
export const palettes = [
	['#ffffff', '#000000', '#efefef', '#000000', '#ffffff', '#000000'],
	['#121212', '#ffffff', '#6b6b6b', '#ffffff', '#3b3b3b', '#ffffff'],
	['#ffffff', '#000000', '#e9e9ed', '#000000', '#ffffff', '#000000'],
	['#1c1b22', '#fbfbfe', '#2b2a33', '#fbfbfe', '#2b2a33', '#fbfbfe'],
	['#ffffff', '#000000', '#c0c0c0', '#000000d8', '#ffffff', '#000000d8'],
	['#1e1e1e', '#ffffff', '#ffffff3f', '#ffffffd8', '#ffffff3f', '#ffffffd8'],
	['#ffffff', '#000000', '#f0f0f0', '#000000', '#ffffff', '#000000'],
	['#202020', '#ffffff', '#202020', '#ffffff', '#202020', '#ffffff'],
	['#fffaef', '#3d3d3d', '#fffaef', '#202020', '#fffaef', '#3d3d3d'],
	['#2d3236', '#ffffff', '#2d3236', '#b6f6f0', '#2d3236', '#ffffff'],
	['#000000', '#ffffff', '#000000', '#ffee32', '#000000', '#ffffff'],
	['#000000', '#ffffff', '#000000', '#ffee32', '#000000', '#ffee32'],
	['#2d3236', '#ffffff', '#2d3236', '#b6f6f0', '#2d3236', '#b6f6f0'],
	['#fffaef', '#3d3d3d', '#fffaef', '#202020', '#fffaef', '#202020'],
	['#ffffff', '#000000', '#c0c0c0', '#000000', '#ffffff', '#000000'],
	['#000000', '#ffffff', '#c0c0c0', '#000000', '#ffffff', '#000000'],
	['#ffffff', '#000000', '#ffffff', '#000000d8', '#ffffff', '#000000d8'],
	['#282828', '#ffffff', '#202020', '#ffffff', '#202020', '#ffffff'],
	['#202020', '#ffffff', '#00000000', '#ffffff', '#00000000', '#ffffff'],
];

export function substitute(css, palette) {
	const tokens = [
		'Canvas',
		'CanvasText',
		'ButtonFace',
		'ButtonText',
		'Field',
		'FieldText',
	];
	const colors = Object.fromEntries(
		tokens.map((token, index) => [token.toLowerCase(), palette[index]]),
	);
	return css.replace(
		/\b(CanvasText|Canvas|ButtonFace|ButtonText|FieldText|Field)\b/gi,
		(token) => colors[token.toLowerCase()],
	);
}

export async function measurements(locator) {
	return locator.evaluate((element) => {
		const canvas = document.createElement('canvas');
		canvas.width = canvas.height = 1;
		const context = canvas.getContext('2d', { willReadFrequently: true });
		const pixel = () => [...context.getImageData(0, 0, 1, 1).data];
		const paint = (color) => {
			context.fillStyle = color;
			context.fillRect(0, 0, 1, 1);
			return pixel();
		};
		const background = (node) => {
			context.clearRect(0, 0, 1, 1);
			const ancestors = [];
			for (; node; node = node.parentElement) ancestors.unshift(node);
			for (const ancestor of ancestors) {
				const style = getComputedStyle(ancestor);
				if (style.opacity !== '1')
					throw new Error('Opacity requires group compositing.');
				paint(style.backgroundColor);
				if (style.backgroundImage !== 'none') {
					const gradient = style.backgroundImage.match(
						/^linear-gradient\((.+), \1\)$/,
					);
					if (!gradient)
						throw new Error(
							`Unsupported background: ${style.backgroundImage}`,
						);
					paint(gradient[1]);
				}
			}
			if (pixel()[3] !== 255)
				throw new Error('Expected an opaque surface.');
			return pixel();
		};
		const luminance = (rgb) =>
			rgb.slice(0, 3).reduce((sum, channel, index) => {
				const value = channel / 255;
				return (
					sum +
					(value <= 0.04045
						? value / 12.92
						: ((value + 0.055) / 1.055) ** 2.4) *
						[0.2126, 0.7152, 0.0722][index]
				);
			}, 0);
		const ratio = (a, b) => {
			const values = [luminance(a), luminance(b)].sort((a, b) => b - a);
			return (values[0] + 0.05) / (values[1] + 0.05);
		};
		const style = getComputedStyle(element);
		const fill = background(element);
		const text = ratio(paint(style.color), fill);
		background(element);
		const border = paint(style.borderTopColor);
		return { text, boundary: ratio(border, fill) };
	});
}
