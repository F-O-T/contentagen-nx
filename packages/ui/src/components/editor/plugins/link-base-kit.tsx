import { BaseLinkPlugin } from '@platejs/link';

import { LinkElementStatic } from '@packages/ui/components/link-node-static';

export const BaseLinkKit = [BaseLinkPlugin.withComponent(LinkElementStatic)];
