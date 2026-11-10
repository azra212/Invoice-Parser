import { useState } from "react";
import { Box, Button, Heading, Input, Text, VStack } from "@chakra-ui/react";
import {
  loginAccount,
  registerAccount,
  type SessionUser,
} from "../api/authApi";

export function AuthScreen({
  onSuccess,
}: {
  onSuccess: (user: SessionUser) => void;
}) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const submit = async () => {
    setPending(true);
    setError(null);
    try {
      const user =
        mode === "register"
          ? await registerAccount({ name, email, password })
          : await loginAccount({ email, password });
      onSuccess(user);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Sign in failed.");
    } finally {
      setPending(false);
    }
  };

  return (
    <Box minH="100vh" bg="gray.50" display="grid" placeItems="center" p={6}>
      <Box
        as="form"
        bg="white"
        borderWidth="1px"
        borderColor="gray.200"
        borderRadius="xl"
        p={8}
        w="full"
        maxW="420px"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <VStack align="stretch" gap={4}>
          <Heading size="md">
            {mode === "login" ? "Sign in" : "Create an account"}
          </Heading>
          <Text color="gray.600" fontSize="sm">
            Documents stay inside your workspace.
          </Text>
          {mode === "register" && (
            <Input
              aria-label="Name"
              placeholder="Name"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          )}
          <Input
            aria-label="Email"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <Input
            aria-label="Password"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          {error && (
            <Text color="red.600" fontSize="sm">
              {error}
            </Text>
          )}
          <Button type="submit" colorPalette="blue" loading={pending}>
            {mode === "login" ? "Sign in" : "Create account"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() =>
              setMode((current) => (current === "login" ? "register" : "login"))
            }
          >
            {mode === "login"
              ? "Need an account? Register"
              : "Already registered? Sign in"}
          </Button>
        </VStack>
      </Box>
    </Box>
  );
}
