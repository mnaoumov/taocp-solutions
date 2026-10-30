import { execFromRoot } from '@mnaoumov/typescript-dev-toolkit/root';

interface LintOptions {
  readonly paths?: string[] | undefined;
  readonly shouldFix?: boolean | undefined;
}

export async function lint(options?: LintOptions): Promise<void> {
  const { paths, shouldFix = false } = options ?? {};
  const targets = paths?.length ? paths : ['.'];
  await execFromRoot(['npx', 'markdownlint-cli2', ...(shouldFix ? ['--fix'] : []), { batchedArguments: targets }]);
}
