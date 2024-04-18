import { NextResponse, NextRequest } from "next/server";

interface DetectData {
  confidence: number;
  language: string;
  isReliable: boolean;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchWithRetry(
  api: () => Promise<Response>,
  retryCount: number = 5,
) {
  const get = async () => {
    try {
      const res = await api();
      return res;
    } catch (error) {
      return null;
    }
  };

  let res = null;
  let n = 0;
  while (++n <= retryCount) {
    res = await get();
    if (res) {
      break;
    } else {
      await sleep(1);
    }
  }
  return res;
}

async function handle(req: NextRequest) {
  const controller = new AbortController();

  const timeoutId = setTimeout(
    () => {
      controller.abort();
    },
    10 * 60 * 1000,
  );

  try {
    const json = await req.json();

    const res = await fetchWithRetry(
      () =>
        fetch(
          `https://translation.googleapis.com/language/translate/v2/detect?key=AIzaSyCquW5jlTgTGc7jrNEPPRBng4G8NaUyc-Q&q=${json.q}`,
        ),
      3,
    );

    if (res) {
      const resJson = await res.json();

      const item = resJson.data.detections[0][0] as DetectData;
      return NextResponse.json(item);
    }

    return NextResponse.json(null);
  } finally {
    clearTimeout(timeoutId);
  }
}

export const GET = handle;
export const POST = handle;

export const runtime = "edge";
