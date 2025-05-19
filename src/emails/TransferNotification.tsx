import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

interface TransferNotificationEmailProps {
  recipientName: string;
  senderName: string;
  amount: number;
  bankAccountNumber: string;
  date: string;
}

export const TransferNotificationEmail = ({
  recipientName,
  senderName,
  amount,
  bankAccountNumber,
  date,
}: TransferNotificationEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Money Transfer Received - Bankify</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Money Transfer Received</Heading>

          <Section style={section}>
            <Text style={text}>Dear {recipientName},</Text>

            <Text style={text}>
              You have received a money transfer of ${amount.toFixed(2)} from{" "}
              {senderName}.
            </Text>

            <Text style={text}>
              <strong>Transfer Details:</strong>
            </Text>

            <Text style={text}>
              Amount: ${amount.toFixed(2)}
              <br />
              From: {senderName}
              <br />
              To Account: ****{bankAccountNumber.slice(-4)}
              <br />
              Date: {date}
              <br />
            </Text>

            <Text style={text}>
              The amount has been credited to your bank account. You can view
              the transaction details in your Bankify dashboard.
            </Text>

            <Text style={text}>Thank you for using Bankify!</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

const main = {
  backgroundColor: "#ffffff",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  margin: "0 auto",
  padding: "20px 0 48px",
  maxWidth: "580px",
};

const section = {
  padding: "24px",
  backgroundColor: "#f6f9fc",
  borderRadius: "8px",
};

const h1 = {
  color: "#1a1a1a",
  fontSize: "24px",
  fontWeight: "bold",
  margin: "40px 0",
  padding: "0",
  textAlign: "center" as const,
};

const text = {
  color: "#1a1a1a",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "16px 0",
};

export default TransferNotificationEmail;
