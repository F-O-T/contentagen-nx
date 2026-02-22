import { Badge } from "@packages/ui/components/badge";
import { Button } from "@packages/ui/components/button";
import { Card, CardContent } from "@packages/ui/components/card";
import {
   Empty,
   EmptyDescription,
   EmptyHeader,
   EmptyMedia,
   EmptyTitle,
} from "@packages/ui/components/empty";
import { createErrorFallback } from "@packages/ui/components/error-fallback";
import {
   Item,
   ItemActions,
   ItemContent,
   ItemDescription,
   ItemGroup,
   ItemMedia,
   ItemSeparator,
   ItemTitle,
} from "@packages/ui/components/item";
import { Skeleton } from "@packages/ui/components/skeleton";
import {
   Tooltip,
   TooltipContent,
   TooltipProvider,
   TooltipTrigger,
} from "@packages/ui/components/tooltip";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
   ChevronRight,
   Globe,
   Laptop,
   Link2,
   Mail,
   Monitor,
   Shield,
   Smartphone,
   Tablet,
   Trash2,
   User,
} from "lucide-react";
import { Fragment, Suspense } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import {
   useRevokeAllSessions,
   useRevokeOtherSessions,
} from "@/features/settings/hooks/use-session-actions";
import { SessionDetailsForm } from "@/features/settings/ui/session-details-form";
import { useSheet } from "@/hooks/use-sheet";
import { authClient } from "@/integrations/better-auth/auth-client";
import { orpc } from "@/integrations/orpc/client";

export const Route = createFileRoute(
   "/_authenticated/$slug/$teamSlug/_dashboard/settings/security",
)({
   component: SecurityPage,
});

function getDeviceIcon(userAgent: string | null | undefined) {
   if (!userAgent) return Monitor;
   const ua = userAgent.toLowerCase();
   if (ua.includes("mobile") || ua.includes("iphone") || ua.includes("android"))
      return Smartphone;
   if (ua.includes("tablet") || ua.includes("ipad")) return Tablet;
   if (ua.includes("mac") || ua.includes("windows") || ua.includes("linux"))
      return Laptop;
   return Monitor;
}

function formatLastActive(date: Date | string | null): string {
   if (!date) return "Agora";
   const d = new Date(date);
   const now = new Date();
   const diff = now.getTime() - d.getTime();
   const minutes = Math.floor(diff / 60000);
   const hours = Math.floor(diff / 3600000);
   const days = Math.floor(diff / 86400000);

   if (minutes < 1) return "Agora";
   if (minutes < 60) return `${minutes} min atrás`;
   if (hours < 24) return `${hours}h atrás`;
   if (days < 7) return `${days}d atrás`;
   return d.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
   });
}

function getLoginMethodDisplay(method: string | null | undefined): {
   label: string;
   Icon: typeof Mail;
} | null {
   if (!method) return null;

   switch (method) {
      case "email":
         return { label: "Email", Icon: Mail };
      case "google":
         return { label: "Google", Icon: Globe };
      case "otp":
         return { label: "OTP", Icon: Shield };
      case "magic-link":
         return { label: "Magic Link", Icon: Link2 };
      case "anonymous":
         return { label: "Anônimo", Icon: User };
      default:
         return { label: method, Icon: Shield };
   }
}

function SecuritySectionErrorFallback(props: FallbackProps) {
   return (
      <div className="space-y-6">
         <div>
            <h1 className="text-2xl font-semibold font-serif">Segurança</h1>
            <p className="text-sm text-muted-foreground mt-1">
               Gerencie suas sessões e configurações de segurança.
            </p>
         </div>
         <Card>
            <CardContent className="py-8">
               {createErrorFallback({
                  errorDescription: "Erro ao carregar sessões",
                  errorTitle: "Erro",
                  retryText: "Tentar novamente",
               })(props)}
            </CardContent>
         </Card>
      </div>
   );
}

function SecuritySectionSkeleton() {
   return (
      <div className="space-y-6">
         <div>
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-4 w-80 mt-2" />
         </div>
         <div className="space-y-1">
            {Array.from({ length: 3 }, (_, i) => i + 1).map((id) => (
               <Skeleton
                  className="h-16 w-full rounded-lg"
                  key={`skeleton-session-${id}`}
               />
            ))}
         </div>
         <div className="space-y-2">
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-10 w-full rounded-lg" />
         </div>
      </div>
   );
}

// ============================================
// Sessions Card Component
// ============================================

type SessionType = {
   id: string;
   token: string;
   userAgent: string | null;
   ipAddress: string | null;
   createdAt: Date;
   updatedAt: Date;
};

function SessionsSection({
   sessions,
   currentSessionId,
   currentSessionLoginMethod,
   openSheet,
}: {
   sessions: SessionType[];
   currentSessionId: string | undefined;
   currentSessionLoginMethod: string | null;
   openSheet: (options: { children: React.ReactNode }) => void;
}) {
   return (
      <section className="space-y-3">
         <div>
            <h2 className="text-lg font-medium">Sessões Ativas</h2>
            <p className="text-sm text-muted-foreground mt-1">
               Dispositivos que acessaram sua conta recentemente
            </p>
         </div>
         {sessions.length === 0 ? (
            <Empty className="border-none py-4">
               <EmptyHeader>
                  <EmptyMedia variant="icon">
                     <Globe className="size-6" />
                  </EmptyMedia>
                  <EmptyTitle>Nenhuma sessão ativa</EmptyTitle>
                  <EmptyDescription>
                     Não há sessões ativas no momento
                  </EmptyDescription>
               </EmptyHeader>
            </Empty>
         ) : (
            <ItemGroup>
               {sessions.map((session, index) => {
                  const isCurrentSession = session.id === currentSessionId;
                  const DeviceIcon = getDeviceIcon(session.userAgent ?? null);
                  // Only show login method for the current session (cookie-based storage)
                  const loginMethod = isCurrentSession
                     ? getLoginMethodDisplay(currentSessionLoginMethod)
                     : null;

                  return (
                     <Fragment key={session.id}>
                        <Item variant="muted">
                           <ItemMedia variant="icon">
                              <DeviceIcon className="size-4" />
                           </ItemMedia>
                           <ItemContent className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                 <ItemTitle className="truncate">
                                    {session.userAgent ||
                                       "Dispositivo desconhecido"}
                                 </ItemTitle>
                                 {isCurrentSession && (
                                    <Badge
                                       className="bg-green-500 hover:bg-green-500/90 shrink-0"
                                       variant="default"
                                    >
                                       Este dispositivo
                                    </Badge>
                                 )}
                              </div>
                              <ItemDescription className="flex items-center gap-2 flex-wrap">
                                 <span>
                                    {session.ipAddress || "IP desconhecido"}
                                 </span>
                                 {loginMethod && (
                                    <>
                                       <span className="text-muted-foreground/50">
                                          •
                                       </span>
                                       <span className="flex items-center gap-1">
                                          <loginMethod.Icon className="size-3" />
                                          {loginMethod.label}
                                       </span>
                                    </>
                                 )}
                                 <span className="text-muted-foreground/50">
                                    •
                                 </span>
                                 <span>
                                    {formatLastActive(session.updatedAt)}
                                 </span>
                              </ItemDescription>
                           </ItemContent>
                           <ItemActions>
                              <Tooltip>
                                 <TooltipTrigger asChild>
                                    <Button
                                       onClick={() =>
                                          openSheet({
                                             children: (
                                                <SessionDetailsForm
                                                   currentSessionId={
                                                      currentSessionId || null
                                                   }
                                                   session={session}
                                                />
                                             ),
                                          })
                                       }
                                       size="icon"
                                       variant="ghost"
                                    >
                                       <ChevronRight className="size-4" />
                                    </Button>
                                 </TooltipTrigger>
                                 <TooltipContent>Ver detalhes</TooltipContent>
                              </Tooltip>
                           </ItemActions>
                        </Item>
                        {index !== sessions.length - 1 && <ItemSeparator />}
                     </Fragment>
                  );
               })}
            </ItemGroup>
         )}
      </section>
   );
}

// ============================================
// Security Actions Section Component
// ============================================

function SecurityActionsSection({
   sessionsCount,
   otherSessionsCount,
   isRevokingOthers,
   isRevokingAll,
   revokeOtherSessions,
   revokeAllSessions,
}: {
   sessionsCount: number;
   otherSessionsCount: number;
   isRevokingOthers: boolean;
   isRevokingAll: boolean;
   revokeOtherSessions: () => void;
   revokeAllSessions: () => void;
}) {
   return (
      <section className="space-y-3">
         <div>
            <h2 className="text-lg font-medium">Ações de Segurança</h2>
            <p className="text-sm text-muted-foreground mt-1">
               Resumo de segurança da sua conta
            </p>
         </div>
         <ItemGroup>
            <Item variant="muted">
               <ItemMedia variant="icon">
                  <Shield className="size-4" />
               </ItemMedia>
               <ItemContent>
                  <ItemTitle>Sessões ativas</ItemTitle>
                  <ItemDescription>
                     {sessionsCount === 1
                        ? "1 dispositivo conectado"
                        : `${sessionsCount} dispositivos conectados`}
                  </ItemDescription>
               </ItemContent>
            </Item>
         </ItemGroup>
         <div className="flex gap-2">
            <Button
               disabled={isRevokingOthers || otherSessionsCount === 0}
               onClick={revokeOtherSessions}
               size="sm"
               variant="outline"
            >
               <Trash2 className="size-4 mr-2" />
               Encerrar outras sessões
            </Button>
            <Button
               disabled={isRevokingAll}
               onClick={revokeAllSessions}
               size="sm"
               variant="destructive"
            >
               <Trash2 className="size-4 mr-2" />
               Encerrar todas as sessões
            </Button>
         </div>
      </section>
   );
}

// ============================================
// Main Content Component
// ============================================

function SecuritySectionContent() {
   const { openSheet } = useSheet();
   const { data: sessions } = useSuspenseQuery(
      orpc.session.listSessions.queryOptions({}),
   );
   const { data: currentSession } = useSuspenseQuery(
      orpc.session.getSession.queryOptions({}),
   );

   const { revokeOtherSessions, isRevoking: isRevokingOthers } =
      useRevokeOtherSessions();
   const { revokeAllSessions, isRevoking: isRevokingAll } =
      useRevokeAllSessions();

   const currentSessionId = currentSession?.session?.id;
   const currentSessionLoginMethod =
      authClient.getLastUsedLoginMethod?.() ?? null;
   const otherSessionsCount = sessions.filter(
      (s) => s.id !== currentSessionId,
   ).length;

   return (
      <TooltipProvider>
         <div className="space-y-6">
            <div>
               <h1 className="text-2xl font-semibold font-serif">Segurança</h1>
               <p className="text-sm text-muted-foreground mt-1">
                  Gerencie suas sessões e configurações de segurança.
               </p>
            </div>

            <SessionsSection
               currentSessionId={currentSessionId}
               currentSessionLoginMethod={currentSessionLoginMethod}
               openSheet={openSheet}
               sessions={sessions as SessionType[]}
            />

            <SecurityActionsSection
               isRevokingAll={isRevokingAll}
               isRevokingOthers={isRevokingOthers}
               otherSessionsCount={otherSessionsCount}
               revokeAllSessions={revokeAllSessions}
               revokeOtherSessions={revokeOtherSessions}
               sessionsCount={sessions.length}
            />
         </div>
      </TooltipProvider>
   );
}

function SecurityPage() {
   return (
      <ErrorBoundary FallbackComponent={SecuritySectionErrorFallback}>
         <Suspense fallback={<SecuritySectionSkeleton />}>
            <SecuritySectionContent />
         </Suspense>
      </ErrorBoundary>
   );
}
