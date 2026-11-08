import { useTranslation as useInlineTranslation } from 'react-i18next';
import { Box } from '@mui/material';
import React, { useContext, useState } from 'react';
import ToolContent from '@components/ToolContent';
import { ToolComponentProps } from '@tools/defineTool';
import ToolPdfInput from '@components/input/ToolPdfInput';
import ToolFileResult from '@components/result/ToolFileResult';
import { InitialValuesType } from './types';
import { protectPdf } from './service';
import TextFieldWithDesc from '@components/options/TextFieldWithDesc';
import { CustomSnackBarContext } from '../../../../contexts/CustomSnackBarContext';

const initialValues: InitialValuesType = {
  password: '',
  confirmPassword: ''
};

export default function ProtectPdf({
  title,
  longDescription
}: ToolComponentProps) {
  // 本工具的展示文案随语言切换更新；示例原始数据与计算参数保持不变。
  const { t: inlineText } = useInlineTranslation(['pdf', 'translation']);

  const [input, setInput] = useState<File | null>(null);
  const [result, setResult] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const { showSnackBar } = useContext(CustomSnackBarContext);

  const compute = async (values: InitialValuesType, input: File | null) => {
    if (!input) return;

    try {
      // Validate passwords match
      if (values.password !== values.confirmPassword) {
        showSnackBar(inlineText('inline.passwordsDoNotMatch'), 'error');
        return;
      }

      // Validate password is not empty
      if (!values.password) {
        showSnackBar(inlineText('inline.passwordCannotBeEmpty'), 'error');
        return;
      }

      setIsProcessing(true);
      const protectedPdf = await protectPdf(input, values);
      setResult(protectedPdf);
    } catch (error) {
      console.error('Error protecting PDF:', error);
      showSnackBar(
        inlineText('translation:common.pdfProtectionFailed', {
          error: String(error instanceof Error ? error.message : String(error))
        }),
        'error'
      );
      setResult(null);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <ToolContent
      title={title}
      input={input}
      setInput={setInput}
      initialValues={initialValues}
      compute={compute}
      inputComponent={
        <ToolPdfInput
          value={input}
          onChange={setInput}
          accept={['application/pdf']}
          title={inlineText('compressPdf.inputTitle')}
        />
      }
      resultComponent={
        <ToolFileResult
          title={inlineText('inline.protectedPdf')}
          value={result}
          extension={'pdf'}
          loading={isProcessing}
          loadingText={inlineText('inline.protectingPdf')}
        />
      }
      getGroups={({ values, updateField }) => [
        {
          title: inlineText('inline.passwordSettings'),
          component: (
            <Box>
              <TextFieldWithDesc
                title={inlineText('inline.password')}
                description={inlineText(
                  'inline.enterAPasswordToProtectYourPdf'
                )}
                placeholder={inlineText('inline.enterPassword')}
                type="password"
                value={values.password}
                onOwnChange={(value) => updateField('password', value)}
              />
              <TextFieldWithDesc
                title={inlineText('inline.confirmPassword')}
                description={inlineText('inline.reEnterYourPasswordToConfirm')}
                placeholder={inlineText('inline.confirmPassword2')}
                type="password"
                value={values.confirmPassword}
                onOwnChange={(value) => updateField('confirmPassword', value)}
              />
            </Box>
          )
        }
      ]}
    />
  );
}
