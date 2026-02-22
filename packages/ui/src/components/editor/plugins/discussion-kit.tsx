"use client";

import { BlockDiscussion } from "@packages/ui/components/block-discussion";
import type { TComment } from "@packages/ui/components/comment";
import type { Value } from "platejs";
import { createPlatePlugin } from "platejs/react";

export type TDiscussion = {
   id: string;
   comments: TComment[];
   createdAt: Date;
   isResolved: boolean;
   userId: string;
   documentContent?: string;
};

export type DiscussionUser = {
   id: string;
   avatarUrl: string;
   name: string;
   hue?: number;
};

export type DiscussionCallbacks = {
   onCreateDiscussion?: (discussion: TDiscussion) => Promise<void>;
   onAddReply?: (discussionId: string, reply: TComment) => Promise<void>;
   onResolveDiscussion?: (discussionId: string) => Promise<void>;
   onRemoveDiscussion?: (discussionId: string) => Promise<void>;
   onUpdateComment?: (commentId: string, contentRich: Value) => Promise<void>;
   onDeleteComment?: (commentId: string, discussionId: string) => Promise<void>;
};

export const discussionPlugin = createPlatePlugin({
   key: "discussion",
   options: {
      currentUserId: "" as string,
      discussions: [] as TDiscussion[],
      users: {} as Record<string, DiscussionUser>,
      // Persistence callbacks — injected by the app layer
      callbacks: {} as DiscussionCallbacks,
   },
})
   .configure({
      render: { aboveNodes: BlockDiscussion },
   })
   .extendSelectors(({ getOption }) => ({
      currentUser: () => getOption("users")[getOption("currentUserId")],
      user: (id: string) => getOption("users")[id],
   }));

export const DiscussionKit = [discussionPlugin];
