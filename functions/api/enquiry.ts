// Cloudflare Pages routes /api/enquiry here. Keep only route handlers in functions/: Pages serves every file in it.
import { handleEnquiry, type EnquiryEnv } from '../../src/lib/enquiry-function';

export const onRequest = ({ request, env }: { request: Request; env: EnquiryEnv }) => handleEnquiry(request, env);
