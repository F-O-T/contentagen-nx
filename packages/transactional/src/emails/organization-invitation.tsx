import { Section, Text, Button, Container } from "@react-email/components";
import { DefaultEmailLayout } from "./default-layout";
import { DefaultFooter } from "./default-footer";
import { DefaultHeading } from "./default-heading";

interface OrganizationInvitationEmailProps {
   invitedByUsername: string;
   invitedByEmail: string;
   teamName: string;
   inviteLink: string;
}

export default function OrganizationInvitationEmail({
   invitedByUsername,
   invitedByEmail,
   teamName,
   inviteLink,
}: OrganizationInvitationEmailProps) {
   return (
      <DefaultEmailLayout>
         <DefaultHeading />
         <Section className="bg-white p-2 space-y-2 rounded-t-lg">
            <Text className="text-xl font-semibold text-foreground text-center">
               You have been invited to join {teamName}
            </Text>
            <Text className="text-muted-foreground text-base text-center">
               <b>{invitedByUsername}</b> (<span>{invitedByEmail}</span>) has
               invited you to join the organization <b>{teamName}</b>.
            </Text>
            <Container className="text-center my-4">
               <Button
                  href={inviteLink}
                  className="bg-blue-600 text-white px-6 py-3 rounded-md font-bold text-base inline-block"
               >
                  Accept Invitation
               </Button>
            </Container>
            <Text className="text-muted-foreground text-base text-center">
               If you did not expect this invitation, you can safely ignore this
               email.
            </Text>
         </Section>
         <DefaultFooter />
      </DefaultEmailLayout>
   );
}

OrganizationInvitationEmail.PreviewProps = {
   invitedByUsername: "Jane Doe",
   invitedByEmail: "jane.doe@example.com",
   teamName: "Marketing Team",
   inviteLink: "https://app.contentagen.com/invite/1234",
};
