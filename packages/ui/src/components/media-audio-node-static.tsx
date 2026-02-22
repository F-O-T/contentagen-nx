import type { TAudioElement } from "platejs";
import type { SlateElementProps } from "platejs/static";
import { SlateElement } from "platejs/static";

export function AudioElementStatic(props: SlateElementProps<TAudioElement>) {
   return (
      <SlateElement {...props} className="mb-1">
         <figure className="group relative cursor-default">
            <div className="h-16">
               {/* biome-ignore lint/a11y/useMediaCaption: audio player for user-uploaded content */}
               <audio className="size-full" controls src={props.element.url} />
            </div>
         </figure>
         {props.children}
      </SlateElement>
   );
}
