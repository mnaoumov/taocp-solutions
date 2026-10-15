import { execFromRoot } from '@mnaoumov/typescript-dev-toolkit/root';

interface LintParams {
  paths?: string[] | undefined;
  shouldFix?: boolean | undefined;
}

export async function lint(params?: LintParams): Promise<void> {
  const { paths, shouldFix = false } = params ?? {};
  const targets = paths?.length ? paths : ['.'];
  await execFromRoot(['npx', 'markdownlint-cli2', ...(shouldFix ? ['--fix'] : []), { batchedArguments: targets }]);
}
