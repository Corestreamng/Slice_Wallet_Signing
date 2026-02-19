import { useEffect, useState } from "react";
import "./App.css";

interface user {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

function App() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<user | null>(null);
  const [link, setLink] = useState("");

  useEffect(() => {
    async function run() {
      const accounts = await (window as any).ethereum.request({
        method: "eth_requestAccounts",
      });
      const address = accounts[0];
      const message = "I am connecting my wallet to Slice platform";
      const signature = await (window as any).ethereum.request({
        method: "personal_sign",
        params: [message, address],
      });
      const chainId = await (window as any).ethereum.request({
        method: "eth_chainId",
      });

      setLink(
        `tg:join?invite=jbSDkmCvBQEyNTk0?address=${encodeURIComponent(
          address,
        )}&signature=${encodeURIComponent(signature)}&chainId=${encodeURIComponent(chainId)}`,
      );
    }
    run();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenFromUrl = params.get("token");

    if (tokenFromUrl) {
      setToken(tokenFromUrl);
      getProfile(tokenFromUrl);
    }
  }, []);

  async function getProfile(authToken: string) {
    try {
      const resp = await fetch("/api/auth/profile", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!resp.ok) {
        throw new Error("Failed to fetch profile");
      }

      const data = await resp.json();
      setUser(data);
      console.log("User loaded:", data);
    } catch (error) {
      console.error(error);
    }
  }

  if (!user) {
    return <>Profile not found</>;
  }

  return (
    <>
      <div>
        <pre>{user && JSON.stringify(user, null, 2)}</pre>
        <div></div>
      </div>
    </>
  );
}

export default App;
