import rss from "@astrojs/rss";
import { sdk, agentId } from "../contentagen";
import { SITE_DESCRIPTION, SITE_TITLE } from "../consts";

/**
 * @param {any} context
 */
export async function GET(context) {
   const response = await sdk.listContentByAgent({
      agentId,
      status: ["approved"],
      limit: 100,
      page: 1,
   });
   const posts = response.posts ?? [];

   return rss({
      title: SITE_TITLE,
      description: SITE_DESCRIPTION,
      site: context.site,
      items: posts.map((post) => {
         return {
            title: post.meta.title,
            description: post.meta.title,
            link: post.meta.slug,
            pubDate: post.createdAt,
         };
      }),
      customData: `<language>en-us</language>`,
   });
}
