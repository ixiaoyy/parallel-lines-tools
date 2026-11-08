import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { number, string } from 'yup';
import i18n from './index';
import english from '../../public/locales/en/translation.json';
import chinese from '../../public/locales/zh/translation.json';

const previousLanguage = i18n.resolvedLanguage || 'zh';

beforeAll(() => {
  i18n.addResourceBundle('en', 'translation', english, true, true);
  i18n.addResourceBundle('zh', 'translation', chinese, true, true);
});

afterAll(async () => {
  await i18n.changeLanguage(previousLanguage);
});

describe('validation message language', () => {
  it('updates an existing schema without changing its limits or original English messages', async () => {
    const schema = number().min(2).max(5).integer().required();
    await i18n.changeLanguage('zh');
    await expect(schema.validate(1)).rejects.toThrow('数值不能小于 2');
    await expect(schema.validate(6)).rejects.toThrow('数值不能大于 5');
    await expect(schema.validate(2.5)).rejects.toThrow('请输入整数');
    await expect(schema.validate(undefined)).rejects.toThrow('此项不能为空');
    await expect(schema.validate(2)).resolves.toBe(2);
    await expect(schema.validate(5)).resolves.toBe(5);

    await i18n.changeLanguage('en');
    await expect(schema.validate(1)).rejects.toThrow(
      'this must be greater than or equal to 2'
    );
    await expect(schema.validate(undefined)).rejects.toThrow(
      'this is a required field'
    );
    await expect(schema.validate('not a number')).rejects.toThrow(
      'this must be a `number` type'
    );
  });

  it('localizes the default type and text-format failures', async () => {
    await i18n.changeLanguage('zh');
    await expect(number().validate('not a number')).rejects.toThrow(
      '输入格式或数据类型不正确'
    );
    await expect(string().email().validate('invalid')).rejects.toThrow(
      '请输入有效的邮箱地址'
    );
  });
});
