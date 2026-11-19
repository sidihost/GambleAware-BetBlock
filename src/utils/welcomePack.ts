import { getRegistryMetrics } from './interactiveDemo';
import { TOP_BETTING_DOMAINS_FOR_IOS } from './platformCompatibility';
import { RECOVERY_RESOURCES } from './recoveryResources';
import {
  buildWelcomeEmailHtml as buildCoreWelcomeEmailHtml,
  buildWelcomePackHtml as buildCoreWelcomePackHtml,
  type WelcomeEmailParams,
  type WelcomePackParams,
} from './welcomePackCore';

export {
  buildWelcomeEmailSubject,
  escapeHtml,
  evaluatePasswordStrength,
  isValidEmailAddress,
  sanitizeFirstName,
  validateRegistrationInput,
  type PasswordStrengthResult,
  type RegistrationInput,
  type RegistrationValidationResult,
  type WelcomeEmailParams,
  type WelcomePackHelpline,
  type WelcomePackParams,
} from './welcomePackCore';

export function buildWelcomeEmailHtml(params: WelcomeEmailParams): string {
  const metrics = getRegistryMetrics();
  return buildCoreWelcomeEmailHtml({
    ...params,
    domainCount: params.domainCount ?? metrics.domainCount,
    appCount: params.appCount ?? metrics.appCount,
  });
}

export function buildWelcomePackHtml(params: WelcomePackParams = {}): string {
  const metrics = getRegistryMetrics();
  const helplines = RECOVERY_RESOURCES.filter((r) => r.category === 'HELPLINES').map((item) => ({
    title: item.title,
    region: item.region,
    subtitle: item.subtitle,
    phone: item.phone,
    url: item.url,
  }));
  return buildCoreWelcomePackHtml({
    ...params,
    domainCount: params.domainCount ?? metrics.domainCount,
    appCount: params.appCount ?? metrics.appCount,
    iosDomains: params.iosDomains ?? TOP_BETTING_DOMAINS_FOR_IOS,
    helplines: params.helplines ?? helplines,
  });
}
