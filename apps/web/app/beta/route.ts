import { redirect } from 'next/navigation';
import { cleanRef, logBetaClick } from '../../lib/waitlist';

/**
 * semli.app/beta is the one link on flyers, bios and creator posts. It counts the click (with
 * the `?r=` tag that names who sent it) and goes to TestFlight once TESTFLIGHT_URL is set, or
 * to the waitlist until then. The tag survives the hop so a signup still credits its source.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const ref = cleanRef(url.searchParams.get('r'));
  await logBetaClick(ref);
  const testflight = process.env.TESTFLIGHT_URL;
  redirect(testflight || `/${ref ? `?r=${encodeURIComponent(ref)}` : ''}#beta`);
}
