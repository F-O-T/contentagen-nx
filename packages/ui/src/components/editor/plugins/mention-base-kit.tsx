import { BaseMentionPlugin } from '@platejs/mention';

import { MentionElementStatic } from '@packages/ui/components/mention-node-static';

export const BaseMentionKit = [
  BaseMentionPlugin.withComponent(MentionElementStatic),
];
