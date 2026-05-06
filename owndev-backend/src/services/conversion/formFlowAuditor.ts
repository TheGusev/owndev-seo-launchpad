/**
 * services/conversion — form flow auditor.
 *
 * Heuristic audit of forms on the page:
 *   • count fields (inputs/selects/textareas)
 *   • count required fields
 *   • detect inline validation (pattern, required, novalidate, custom data-* attrs)
 *   • detect 152-ФЗ / GDPR consent checkbox
 *   • detect dataLayer push or thank-you state markers
 */

import * as cheerio from 'cheerio';
import type { FormAuditInput, FormFlowAuditResult } from './types.js';

const FIELD_SELECTOR = 'input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="checkbox"]):not([type="radio"]), select, textarea';

export function auditFormFlow(input: FormAuditInput): FormFlowAuditResult {
  const $ = cheerio.load(input.html);
  const issues: string[] = [];
  const recommendations: string[] = [];

  const forms = $('form');
  const formCount = forms.length;

  let primaryFieldCount = 0;
  let primaryRequiredCount = 0;
  let hasInlineValidation = false;
  let hasConsent = false;

  if (formCount > 0) {
    // Pick the form with most fields = "primary"
    let bestForm: cheerio.Cheerio<any> | null = null;
    let bestCount = -1;
    forms.each((_, f) => {
      const fcount = $(f).find(FIELD_SELECTOR).length;
      if (fcount > bestCount) {
        bestCount = fcount;
        bestForm = $(f);
      }
    });

    if (bestForm) {
      const $form = bestForm as cheerio.Cheerio<any>;
      const fields = $form.find(FIELD_SELECTOR);
      primaryFieldCount = fields.length;
      primaryRequiredCount = fields.filter((_, el) => $(el).attr('required') !== undefined).length;

      hasInlineValidation =
        fields.filter((_, el) => {
          const $el = $(el);
          return (
            $el.attr('pattern') !== undefined ||
            $el.attr('minlength') !== undefined ||
            $el.attr('maxlength') !== undefined ||
            $el.attr('data-validate') !== undefined
          );
        }).length > 0;

      const consentRegex = /согласи|персональных данных|политикой|privacy|consent|152-ФЗ/i;
      $form.find('label, .consent, [class*="agree"], [class*="consent"], input[type="checkbox"]').each(
        (_, el) => {
          const text = $(el).text() + ' ' + ($(el).attr('name') ?? '') + ' ' + ($(el).attr('id') ?? '');
          if (consentRegex.test(text)) hasConsent = true;
        },
      );
    }
  }

  // dataLayer / GTM event detection (any inline script)
  const bodyHtml = $.html();
  const hasDataLayerEvent =
    /dataLayer\.push\s*\(\s*\{[^}]*(?:event|generate_lead|form_submit|sign_up|purchase)/i.test(bodyHtml);

  // Thank you state — typical heuristic: hidden div with class success/thank-you
  const hasThankYou =
    $('.thank-you, .success, .form-success, [data-success]').length > 0 ||
    /window\.location[^;]*\/(thank|success|spasibo)/i.test(bodyHtml);

  if (formCount === 0) {
    issues.push('На странице нет формы захвата');
    recommendations.push('Добавить lead-form с 3-5 полями');
  } else {
    if (primaryRequiredCount > 5) {
      issues.push(`Форма имеет ${primaryRequiredCount} обязательных полей (рекомендуется ≤ 5)`);
      recommendations.push('Сократить обязательные поля — оставить имя/телефон/комментарий');
    }
    if (!hasConsent) {
      issues.push('В форме нет чекбокса согласия на обработку персональных данных (152-ФЗ)');
      recommendations.push('Добавить required-чекбокс согласия со ссылкой на политику');
    }
    if (!hasInlineValidation) {
      recommendations.push('Добавить inline-валидацию (pattern для телефона/email)');
    }
    if (!hasThankYou) {
      issues.push('Нет thank-you состояния / редиректа после отправки');
      recommendations.push('Показывать success-состояние и пушить событие в dataLayer');
    }
    if (!hasDataLayerEvent) {
      issues.push('Нет события dataLayer.push на отправку формы');
      recommendations.push('Добавить dataLayer.push({event:"generate_lead"}) на сабмит');
    }
  }

  return {
    form_count: formCount,
    primary_form_field_count: primaryFieldCount,
    primary_form_required_count: primaryRequiredCount,
    has_inline_validation: hasInlineValidation,
    has_thank_you_state: hasThankYou,
    has_dataLayer_event: hasDataLayerEvent,
    consent_checkbox_present: hasConsent,
    issues,
    recommendations,
  };
}
