import { Analytics } from "@vercel/analytics/react";

import { Home } from "../../components/home";

import { getServerSideConfig } from "../../config/server";

const serverConfig = getServerSideConfig();

export default function Page({ params }: { params: { id: string } }) {
  return (
    <>
      <Home />
      {serverConfig?.isVercel && (
        <>
          <Analytics />
        </>
      )}
    </>
  );
}
