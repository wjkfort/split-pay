export function Wordmark({ href = '/' }: { href?: string }) {
  return (
    <a className="wordmark" href={href}>
      <span className="wordmark-dinner">dinner</span>
      <span className="wordmark-slash" aria-hidden="true">
        /
      </span>
      <span className="wordmark-split">split</span>
    </a>
  );
}
