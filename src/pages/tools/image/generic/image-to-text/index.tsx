import { useTranslation as useInlineTranslation } from 'react-i18next';
import { Box } from '@mui/material';
import React, { useContext, useState } from 'react';
import * as Yup from 'yup';
import ToolImageInput from '@components/input/ToolImageInput';
import ToolTextResult from '@components/result/ToolTextResult';
import { GetGroupsType } from '@components/options/ToolOptions';
import ToolContent from '@components/ToolContent';
import { ToolComponentProps } from '@tools/defineTool';
import SelectWithDesc from '@components/options/SelectWithDesc';
import CheckboxWithDesc from '@components/options/CheckboxWithDesc';
import CircularProgress from '@mui/material/CircularProgress';
import { extractTextFromImage, getAvailableLanguages } from './service';
import { InitialValuesType } from './types';
import { CustomSnackBarContext } from '../../../../../contexts/CustomSnackBarContext';

const initialValues: InitialValuesType = {
  language: 'eng',
  detectParagraphs: true
};

export default function ImageToText({ title }: ToolComponentProps) {
  // 仅本地化界面展示与校验提示；格式参数和处理流程保持原样。
  const { t: inlineText } = useInlineTranslation('image');
  const validationSchema = Yup.object({
    language: Yup.string().required(inlineText('inline.languageIsRequired'))
  });

  const [input, setInput] = useState<File | null>(null);
  const [result, setResult] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const { showSnackBar } = useContext(CustomSnackBarContext);
  const compute = async (optionsValues: InitialValuesType, input: any) => {
    if (!input) return;

    setIsProcessing(true);

    try {
      const extractedText = await extractTextFromImage(input, optionsValues);
      setResult(extractedText);
    } catch (err: any) {
      showSnackBar(
        err.message || inlineText('inline.imageProcessingError'),
        'error'
      );
      setResult('');
    } finally {
      setIsProcessing(false);
    }
  };

  const getGroups: GetGroupsType<InitialValuesType> = ({
    values,
    updateField
  }) => [
    {
      title: inlineText('inline.ocrOptions'),
      component: (
        <Box>
          <SelectWithDesc
            selected={values.language}
            onChange={(val) => updateField('language', val)}
            description={inlineText(
              'inline.selectThePrimaryLanguageInTheImage'
            )}
            options={getAvailableLanguages()}
          />
          <CheckboxWithDesc
            checked={values.detectParagraphs}
            onChange={(value) => updateField('detectParagraphs', value)}
            description={inlineText(
              'inline.attemptToPreserveParagraphStructureInThe'
            )}
            title={inlineText('inline.detectParagraphs')}
          />
        </Box>
      )
    }
  ];

  return (
    <ToolContent
      title={title}
      initialValues={initialValues}
      getGroups={getGroups}
      compute={compute}
      input={input}
      validationSchema={validationSchema}
      inputComponent={
        <ToolImageInput
          value={input}
          onChange={setInput}
          accept={['image/jpeg', 'image/png']}
          title={inlineText('changeColors.inputTitle')}
        />
      }
      resultComponent={
        <ToolTextResult
          title={inlineText('inline.extractedText')}
          value={result}
          loading={isProcessing}
        />
      }
      toolInfo={{
        title: inlineText('imageToText.title'),
        description: inlineText('inline.thisToolExtractsTextFromImagesUsing')
      }}
    />
  );
}
