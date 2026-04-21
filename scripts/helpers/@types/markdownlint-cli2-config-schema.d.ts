import { Rule } from 'markdownlint';

/**
 * Markdownlint-cli2 configuration schema : https://github.com/DavidAnson/markdownlint-cli2/blob/v0.18.1/schema/markdownlint-cli2-config-schema.json
 */
export interface MarkdownlintCli2ConfigurationSchema {
  /**
   * JSON Schema URI (expected by some editors)
   */
  $schema?: string;
  /**
   * Markdownlint configuration schema : https://github.com/DavidAnson/markdownlint/blob/v0.38.0/schema/.markdownlint.jsonc
   */
  config?: MarkdownlintConfigurationSchema;
  /**
   * Module names or paths of custom rules to load and use when linting : https://github.com/DavidAnson/markdownlint-cli2/blob/v0.18.1/README.md#markdownlint-cli2jsonc
   */
  customRules?: (Rule | string)[];
  /**
   * Whether to enable fixing of linting errors reported by rules that emit fix information : https://github.com/DavidAnson/markdownlint-cli2/blob/v0.18.1/README.md#markdownlint-cli2jsonc
   */
  fix?: boolean;
  /**
   * Regular expression used to match and ignore any front matter at the beginning of a document : https://github.com/DavidAnson/markdownlint-cli2/blob/v0.18.1/README.md#markdownlint-cli2jsonc
   */
  frontMatter?: string;
  /**
   * Whether to ignore files referenced by .gitignore (or glob expression) (only valid at the root) : https://github.com/DavidAnson/markdownlint-cli2/blob/v0.18.1/README.md#markdownlint-cli2jsonc
   */
  gitignore?: boolean | string;
  /**
   * Glob expressions to include when linting (only valid at the root) : https://github.com/DavidAnson/markdownlint-cli2/blob/v0.18.1/README.md#markdownlint-cli2jsonc
   */
  globs?: string[];
  /**
   * Glob expressions to ignore when linting : https://github.com/DavidAnson/markdownlint-cli2/blob/v0.18.1/README.md#markdownlint-cli2jsonc
   */
  ignores?: string[];
  /**
   * Markdown-it plugins to load and use when linting : https://github.com/DavidAnson/markdownlint-cli2/blob/v0.18.1/README.md#markdownlint-cli2jsonc
   */
  markdownItPlugins?:
    | [
      string,
      Record<string, unknown>
    ][]
    | [string];
  /**
   * Additional paths to resolve module locations from : https://github.com/DavidAnson/markdownlint-cli2/blob/v0.18.1/README.md#markdownlint-cli2jsonc
   */
  modulePaths?: string[];
  /**
   * Whether to disable the display of the banner message and version numbers on stdout (only valid at the root) : https://github.com/DavidAnson/markdownlint-cli2/blob/v0.18.1/README.md#markdownlint-cli2jsonc
   */
  noBanner?: boolean;
  /**
   * Whether to disable support of HTML comments within Markdown content : https://github.com/DavidAnson/markdownlint-cli2/blob/v0.18.1/README.md#markdownlint-cli2jsonc
   */
  noInlineConfig?: boolean;
  /**
   * Whether to disable the display of progress on stdout (only valid at the root) : https://github.com/DavidAnson/markdownlint-cli2/blob/v0.18.1/README.md#markdownlint-cli2jsonc
   */
  noProgress?: boolean;
  /**
   * Output formatters to load and use to customize markdownlint-cli2 output (only valid at the root) : https://github.com/DavidAnson/markdownlint-cli2/blob/v0.18.1/README.md#markdownlint-cli2jsonc
   */
  outputFormatters?:
    | [
      string,
      Record<string, unknown>
    ][]
    | [string];
  /**
   * Whether to show the list of found files on stdout (only valid at the root) : https://github.com/DavidAnson/markdownlint-cli2/blob/v0.18.1/README.md#markdownlint-cli2jsonc
   */
  showFound?: boolean;
}
/**
 * Markdownlint configuration schema : https://github.com/DavidAnson/markdownlint/blob/v0.38.0/schema/.markdownlint.jsonc
 */
export type MarkdownlintConfigurationSchema = Record<string, unknown>;
