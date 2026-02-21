import { BaseTogglePlugin } from '@platejs/toggle';

import { ToggleElementStatic } from '@packages/ui/components/toggle-node-static';

export const BaseToggleKit = [
  BaseTogglePlugin.withComponent(ToggleElementStatic),
];
