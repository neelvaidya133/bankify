"use client";
import { Button } from "@/components/ui/button";
import { signInWithGoogle } from "@/lib/auth-actions";
import React from "react";

interface SignInWithGoogleButtonProps {
  disabled?: boolean;
}

const SignInWithGoogleButton = ({ disabled }: SignInWithGoogleButtonProps) => {
  return (
    <Button
      type="button"
      variant="outline"
      className="w-full"
      disabled={disabled}
      onClick={() => {
        signInWithGoogle();
      }}
    >
      Login with Google
    </Button>
  );
};

export default SignInWithGoogleButton;