import {
	DecoratorNode,
	type EditorConfig,
	type LexicalEditor,
	type LexicalNode,
	type NodeKey,
	type SerializedLexicalNode,
	type DOMExportOutput,
	type Spread,
} from "lexical";
import type { JSX } from "react";

export type ImageWidth = "small" | "medium" | "large" | "full";

export type SerializedImageNode = Spread<
	{
		src: string;
		alt: string;
		caption?: string;
		width: ImageWidth;
	},
	SerializedLexicalNode
>;

/**
 * ImageNode - A custom Lexical DecoratorNode for displaying images.
 *
 * This node is used to render images within the editor with support for:
 * - Alt text for accessibility and SEO
 * - Optional caption
 * - Configurable width (small, medium, large, full)
 * - Proper markdown export as ![alt](url)
 */
export class ImageNode extends DecoratorNode<JSX.Element> {
	__src: string;
	__alt: string;
	__caption?: string;
	__width: ImageWidth;

	static getType(): string {
		return "image";
	}

	static clone(node: ImageNode): ImageNode {
		return new ImageNode(
			node.__src,
			node.__alt,
			node.__caption,
			node.__width,
			node.__key,
		);
	}

	constructor(
		src: string,
		alt: string,
		caption?: string,
		width: ImageWidth = "full",
		key?: NodeKey,
	) {
		super(key);
		this.__src = src;
		this.__alt = alt;
		this.__caption = caption;
		this.__width = width;
	}

	getSrc(): string {
		return this.__src;
	}

	getAlt(): string {
		return this.__alt;
	}

	getCaption(): string | undefined {
		return this.__caption;
	}

	getWidth(): ImageWidth {
		return this.__width;
	}

	createDOM(_config: EditorConfig): HTMLElement {
		const figure = document.createElement("figure");
		figure.className = "editor-image";
		return figure;
	}

	updateDOM(): boolean {
		return false;
	}

	decorate(_editor: LexicalEditor, _config: EditorConfig): JSX.Element {
		return (
			<ImageComponent
				src={this.__src}
				alt={this.__alt}
				caption={this.__caption}
				width={this.__width}
			/>
		);
	}

	exportDOM(): DOMExportOutput {
		const img = document.createElement("img");
		img.setAttribute("src", this.__src);
		img.setAttribute("alt", this.__alt);

		if (this.__caption) {
			const figure = document.createElement("figure");
			figure.appendChild(img);
			const figcaption = document.createElement("figcaption");
			figcaption.textContent = this.__caption;
			figure.appendChild(figcaption);
			return { element: figure };
		}

		return { element: img };
	}

	static importJSON(serializedNode: SerializedImageNode): ImageNode {
		return $createImageNode(
			serializedNode.src,
			serializedNode.alt,
			serializedNode.caption,
			serializedNode.width,
		);
	}

	exportJSON(): SerializedImageNode {
		return {
			type: "image",
			version: 1,
			src: this.__src,
			alt: this.__alt,
			caption: this.__caption,
			width: this.__width,
		};
	}

	// Block-level element (not inline)
	isInline(): boolean {
		return false;
	}
}

/**
 * Create a new ImageNode with the given parameters.
 */
export function $createImageNode(
	src: string,
	alt: string,
	caption?: string,
	width: ImageWidth = "full",
): ImageNode {
	return new ImageNode(src, alt, caption, width);
}

/**
 * Type guard to check if a node is an ImageNode.
 */
export function $isImageNode(
	node: LexicalNode | null | undefined,
): node is ImageNode {
	return node?.getType() === "image";
}

/**
 * React component for rendering the image within the editor.
 */
function ImageComponent({
	src,
	alt,
	caption,
	width,
}: {
	src: string;
	alt: string;
	caption?: string;
	width: ImageWidth;
}) {
	const widthClasses: Record<ImageWidth, string> = {
		small: "max-w-xs",
		medium: "max-w-md",
		large: "max-w-2xl",
		full: "w-full",
	};

	return (
		<figure className={`editor-image-wrapper ${widthClasses[width]} mx-auto my-4`}>
			<img
				src={src}
				alt={alt}
				className="rounded-lg shadow-sm w-full h-auto"
				loading="lazy"
			/>
			{caption && (
				<figcaption className="text-sm text-muted-foreground text-center mt-2">
					{caption}
				</figcaption>
			)}
		</figure>
	);
}
