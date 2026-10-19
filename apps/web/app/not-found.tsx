import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="page notfound">
      <p className="big" aria-hidden="true">
        404
      </p>
      <h1>Nothing here.</h1>
      <p className="lede">That page doesn&apos;t exist or has moved.</p>
      <Link className="btn" href="/">
        Back home
      </Link>
    </main>
  );
}
