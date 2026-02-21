import { BaseCommentPlugin } from '@platejs/comment';

import { CommentLeafStatic } from '@packages/ui/components/comment-node-static';

export const BaseCommentKit = [
  BaseCommentPlugin.withComponent(CommentLeafStatic),
];
