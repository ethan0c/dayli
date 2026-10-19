import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="page notfound">
      <p className="big" aria-hidden="true">
        404
      </p>
      <h1>We couldn’t find that page.</h1>
      <p className="lede">The link may have changed. Head back to the home page to find your way.</p>
      <Link className="btn" href="/">
        Go to home page
      </Link>
    </main>
  );
}
