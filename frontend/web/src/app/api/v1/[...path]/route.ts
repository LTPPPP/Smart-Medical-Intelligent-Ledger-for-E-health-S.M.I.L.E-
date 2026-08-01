import { NextRequest, NextResponse } from "next/server";


type RouteContext = {
    params: Promise<{
        path: string[];
    }>;
};

async function proxyRequest(
    request: NextRequest,
    context: RouteContext,
): Promise<Response> {
    const BACKEND_URL = process.env.BACKEND_URL;

    if (!BACKEND_URL) {
        return NextResponse.json(
            {
                error: "BACKEND_URL is not configured",
            },
            {
                status: 500,
            },
        );
    }
    const { path } = await context.params;

    const targetUrl = new URL(
        `/api/v1/${path.join("/")}`,
        BACKEND_URL,
    );

    targetUrl.search = request.nextUrl.search;

    const headers = new Headers(request.headers);
    const hopByHopHeaders = [
        "host",
        "connection",
        "keep-alive",
        "proxy-authenticate",
        "proxy-authorization",
        "te",
        "trailer",
        "transfer-encoding",
        "upgrade",
    ];

    for (const header of hopByHopHeaders) {
        headers.delete(header);
    }


    const hasBody = !["GET", "HEAD"].includes(request.method);

    const response = await fetch(targetUrl, {
        method: request.method,
        headers,
        body: hasBody ? request.body : undefined,
        redirect: "manual",
        cache: "no-store",
        duplex: hasBody ? "half" : undefined,
    } as RequestInit);

    const responseHeaders = new Headers(response.headers);
    responseHeaders.delete("content-length");
    responseHeaders.delete("content-encoding");

    return new NextResponse(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
    });
}

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const PATCH = proxyRequest;
export const DELETE = proxyRequest;
export const OPTIONS = proxyRequest;