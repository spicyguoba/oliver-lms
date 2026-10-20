import { portraitResponse } from "../../../lib/portraits.mjs";
export const runtime = "nodejs";
export async function GET(request, { params }) {
  const { id } = await params;
  return portraitResponse(id);
}
