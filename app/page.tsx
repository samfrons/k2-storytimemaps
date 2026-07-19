import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// The story is verbatim static HTML (including its three classic <script>
// tags), not JSX — injected untouched so the page behaves exactly like the
// original single-file version. Do not convert it to components.
const story = readFileSync(join(process.cwd(), 'app/story.html'), 'utf8');

export default function Page() {
  return (
    <div
      style={{ display: 'contents' }}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: story }}
    />
  );
}
