import { Badge } from "@packages/ui/components/badge";
import {
   Item,
   ItemActions,
   ItemContent,
   ItemDescription,
   ItemGroup,
   ItemMedia,
   ItemTitle,
} from "@packages/ui/components/item";
import { Switch } from "@packages/ui/components/switch";
import { createFileRoute } from "@tanstack/react-router";
import { Bell, Clock, Lock, Shield, Wifi } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute(
   "/_authenticated/$slug/$teamSlug/_dashboard/settings/organization/security",
)({
   component: OrganizationSecurityPage,
});

// ============================================
// Free Feature: Two-Factor Authentication
// ============================================

function TwoFactorSection() {
   const [enabled, setEnabled] = useState(false);

   function handleToggle(checked: boolean) {
      setEnabled(checked);
      toast.info(
         "Em breve — esta funcionalidade será ativada em uma atualização futura.",
      );
   }

   return (
      <section className="space-y-3">
         <div>
            <h2 className="text-lg font-medium">
               Autenticação de dois fatores
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
               Exija que todos os membros da organização habilitem autenticação
               de dois fatores. Membros sem 2FA serão solicitados a configurá-lo
               no próximo login.
            </p>
         </div>
         <ItemGroup>
            <Item variant="muted">
               <ItemMedia variant="icon">
                  <Shield className="size-4" />
               </ItemMedia>
               <ItemContent className="min-w-0">
                  <ItemTitle>Exigir 2FA para todos os membros</ItemTitle>
                  <ItemDescription className="line-clamp-2">
                     Todos os membros precisarão configurar autenticação de dois
                     fatores
                  </ItemDescription>
               </ItemContent>
               <ItemActions>
                  <Switch
                     aria-label="Exigir 2FA para todos os membros"
                     checked={enabled}
                     onCheckedChange={handleToggle}
                  />
               </ItemActions>
            </Item>
         </ItemGroup>
      </section>
   );
}

// ============================================
// Free Feature: Notification Preferences
// ============================================

function NotificationPreferencesSection() {
   const [enabled, setEnabled] = useState(false);

   function handleToggle(checked: boolean) {
      setEnabled(checked);
      toast.info(
         "Em breve — esta funcionalidade será ativada em uma atualização futura.",
      );
   }

   return (
      <section className="space-y-3">
         <div>
            <h2 className="text-lg font-medium">Preferências de notificação</h2>
            <p className="text-sm text-muted-foreground mt-1">
               Configure como e quando os membros da organização são notificados
               sobre mudanças.
            </p>
         </div>
         <ItemGroup>
            <Item variant="muted">
               <ItemMedia variant="icon">
                  <Bell className="size-4" />
               </ItemMedia>
               <ItemContent className="min-w-0">
                  <ItemTitle>
                     Enviar email quando um novo membro entrar na organização
                  </ItemTitle>
                  <ItemDescription className="line-clamp-2">
                     Notifique administradores quando novos membros ingressarem
                  </ItemDescription>
               </ItemContent>
               <ItemActions>
                  <Switch
                     aria-label="Enviar email quando um novo membro entrar na organização"
                     checked={enabled}
                     onCheckedChange={handleToggle}
                  />
               </ItemActions>
            </Item>
         </ItemGroup>
      </section>
   );
}

// ============================================
// Addon-Gated: Session Timeout
// ============================================

function SessionTimeoutSection() {
   return (
      <section className="space-y-3">
         <div className="rounded-lg border bg-muted/30 p-4 opacity-75">
            <div className="flex items-center gap-2 mb-2">
               <Lock className="size-4 text-muted-foreground" />
               <Badge className="text-xs" variant="outline">
                  Requer addon Boost
               </Badge>
            </div>
            <h3 className="font-medium">Timeout de sessão</h3>
            <p className="text-sm text-muted-foreground mt-1">
               Defina um tempo máximo de inatividade antes que as sessões dos
               membros expirem automaticamente.
            </p>
            <div className="mt-3 pointer-events-none">
               <ItemGroup>
                  <Item variant="muted">
                     <ItemMedia variant="icon">
                        <Clock className="size-4 text-muted-foreground" />
                     </ItemMedia>
                     <ItemContent className="min-w-0">
                        <ItemTitle className="text-muted-foreground">
                           Tempo de inatividade
                        </ItemTitle>
                        <ItemDescription>4 horas (padrão)</ItemDescription>
                     </ItemContent>
                  </Item>
               </ItemGroup>
            </div>
         </div>
      </section>
   );
}

// ============================================
// Addon-Gated: Allowed IPs
// ============================================

function AllowedIPsSection() {
   return (
      <section className="space-y-3">
         <div className="rounded-lg border bg-muted/30 p-4 opacity-75">
            <div className="flex items-center gap-2 mb-2">
               <Lock className="size-4 text-muted-foreground" />
               <Badge className="text-xs" variant="outline">
                  Requer addon Boost
               </Badge>
            </div>
            <h3 className="font-medium">IPs permitidos</h3>
            <p className="text-sm text-muted-foreground mt-1">
               Restrinja o acesso à organização apenas a endereços IP
               específicos. Útil para garantir que membros acessem apenas de
               redes corporativas.
            </p>
            <div className="mt-3 pointer-events-none">
               <ItemGroup>
                  <Item variant="muted">
                     <ItemMedia variant="icon">
                        <Wifi className="size-4 text-muted-foreground" />
                     </ItemMedia>
                     <ItemContent className="min-w-0">
                        <ItemTitle className="text-muted-foreground">
                           Endereços IP permitidos
                        </ItemTitle>
                        <ItemDescription>
                           Todos os IPs (sem restrição)
                        </ItemDescription>
                     </ItemContent>
                  </Item>
               </ItemGroup>
            </div>
         </div>
      </section>
   );
}

// ============================================
// Main Page Component
// ============================================

function OrganizationSecurityPage() {
   return (
      <div className="space-y-6">
         <div>
            <h1 className="text-2xl font-semibold font-serif">Segurança</h1>
            <p className="text-sm text-muted-foreground mt-1">
               Políticas de segurança aplicadas a todos os membros da
               organização.
            </p>
         </div>

         <TwoFactorSection />
         <NotificationPreferencesSection />
         <SessionTimeoutSection />
         <AllowedIPsSection />
      </div>
   );
}
