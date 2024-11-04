import { getToken } from "next-auth/jwt";

export async function GET(req) {
    const token = await getToken({ req, secret: process.env.SECRET });
    console.log(token);
    return new Response(JSON.stringify({ token }), {
        status: 200,
        headers: {
            'Content-Type': 'application/json',
        },
    });
}
