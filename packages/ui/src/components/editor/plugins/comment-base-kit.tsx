import { CommentLeafStatic } from "@packages/ui/components/comment-node-static";
import { BaseCommentPlugin } from "@platejs/comment";

export const BaseCommentKit = [
   BaseCommentPlugin.withComponent(CommentLeafStatic),
];
