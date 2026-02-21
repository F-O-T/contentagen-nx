import { CodeLeafStatic } from "@packages/ui/components/code-node-static";
import { HighlightLeafStatic } from "@packages/ui/components/highlight-node-static";
import { KbdLeafStatic } from "@packages/ui/components/kbd-node-static";
import {
   BaseBoldPlugin,
   BaseCodePlugin,
   BaseHighlightPlugin,
   BaseItalicPlugin,
   BaseKbdPlugin,
   BaseStrikethroughPlugin,
   BaseSubscriptPlugin,
   BaseSuperscriptPlugin,
   BaseUnderlinePlugin,
} from "@platejs/basic-nodes";

export const BaseBasicMarksKit = [
   BaseBoldPlugin,
   BaseItalicPlugin,
   BaseUnderlinePlugin,
   BaseCodePlugin.withComponent(CodeLeafStatic),
   BaseStrikethroughPlugin,
   BaseSubscriptPlugin,
   BaseSuperscriptPlugin,
   BaseHighlightPlugin.withComponent(HighlightLeafStatic),
   BaseKbdPlugin.withComponent(KbdLeafStatic),
];
