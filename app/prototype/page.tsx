import React from "react";
import { getPrototypeDataAction } from "./actions";
import { PrototypeClient } from "./prototype-client";

export const dynamic = "force-dynamic";

export default async function PrototypePage() {
  const initialData = await getPrototypeDataAction();

  return <PrototypeClient initialData={initialData} />;
}
