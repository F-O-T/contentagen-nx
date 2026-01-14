import {
   Avatar,
   AvatarFallback,
   AvatarImage,
} from "@packages/ui/components/avatar";
import { Badge } from "@packages/ui/components/badge";
import {
   Card,
   CardContent,
   CardDescription,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import { Link } from "@tanstack/react-router";
import { Calendar, Hash, Link as LinkIcon, Tag, User } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
   archived: "bg-slate-500/10 text-slate-600 border-slate-200",
   draft: "bg-amber-500/10 text-amber-600 border-amber-200",
   published: "bg-green-500/10 text-green-600 border-green-200",
};

type ContentInfoCardProps = {
   content: {
      id: string;
      meta: {
         title: string;
         description: string;
         slug: string;
         keywords?: string[];
         sources?: string[];
      };
      status: string;
      createdAt: string;
      writer?: {
         id: string;
         name: string;
         profilePhotoUrl?: string | null;
      } | null;
   };
   slug: string;
};

export function ContentInfoCard({ content, slug }: ContentInfoCardProps) {
   const writer = content.writer;
   const initials = writer?.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

   return (
      <Card>
         <CardHeader>
            <div className="flex items-start justify-between gap-4">
               <div className="flex-1 min-w-0">
                  <CardTitle className="text-xl truncate">
                     {content.meta.title || "Sem título"}
                  </CardTitle>
                  <CardDescription className="mt-1">
                     {content.meta.description}
                  </CardDescription>
               </div>
               <Badge
                  className={STATUS_COLORS[content.status]}
                  variant="outline"
               >
                  {"Status}"}
               </Badge>
            </div>
         </CardHeader>
         <CardContent className="grid gap-4">
            {writer && (
               <div className="flex items-center gap-3">
                  <User className="size-4 text-muted-foreground" />
                  <Link
                     className="flex items-center gap-2 hover:underline"
                     params={{ slug, writerId: writer.id }}
                     to="/$slug/writers/$writerId"
                  >
                     <Avatar className="size-6">
                        <AvatarImage
                           alt={writer.name}
                           src={writer.profilePhotoUrl ?? undefined}
                        />
                        <AvatarFallback className="text-xs">
                           {initials}
                        </AvatarFallback>
                     </Avatar>
                     <span className="text-sm">{writer.name}</span>
                  </Link>
               </div>
            )}

            <div className="flex items-start gap-3">
               <Hash className="size-4 text-muted-foreground mt-0.5" />
               <div>
                  <p className="text-sm font-medium">{"Slug"}</p>
                  <p className="text-sm text-muted-foreground font-mono">
                     /{content.meta.slug}
                  </p>
               </div>
            </div>

            {content.meta.keywords && content.meta.keywords.length > 0 && (
               <div className="flex items-start gap-3">
                  <Tag className="size-4 text-muted-foreground mt-0.5" />
                  <div>
                     <p className="text-sm font-medium">{"Palavras-chave"}</p>
                     <div className="flex flex-wrap gap-1 mt-1">
                        {content.meta.keywords.map((keyword) => (
                           <Badge
                              className="text-xs"
                              key={keyword}
                              variant="secondary"
                           >
                              {keyword}
                           </Badge>
                        ))}
                     </div>
                  </div>
               </div>
            )}

            {content.meta.sources && content.meta.sources.length > 0 && (
               <div className="flex items-start gap-3">
                  <LinkIcon className="size-4 text-muted-foreground mt-0.5" />
                  <div>
                     <p className="text-sm font-medium">{"Fontes"}</p>
                     <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                        {content.meta.sources.map((source, index) => (
                           <li className="truncate" key={`source-${index + 1}`}>
                              <a
                                 className="hover:underline"
                                 href={source}
                                 rel="noopener noreferrer"
                                 target="_blank"
                              >
                                 {source}
                              </a>
                           </li>
                        ))}
                     </ul>
                  </div>
               </div>
            )}

            <div className="flex items-start gap-3">
               <Calendar className="size-4 text-muted-foreground mt-0.5" />
               <div>
                  <p className="text-sm font-medium">{"Criado em"}</p>
                  <p className="text-sm text-muted-foreground">
                     {new Date(content.createdAt).toLocaleDateString()}
                  </p>
               </div>
            </div>
         </CardContent>
      </Card>
   );
}
