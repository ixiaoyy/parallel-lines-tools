import { useTranslation as useInlineTranslation } from 'react-i18next';
import { Box } from '@mui/material';
import React, { useState } from 'react';
import * as Yup from 'yup';
import { GetGroupsType } from '@components/options/ToolOptions';
import TextFieldWithDesc from '@components/options/TextFieldWithDesc';
import ToolContent from '@components/ToolContent';
import { ToolComponentProps } from '@tools/defineTool';
import SimpleRadio from '@components/options/SimpleRadio';
import CheckboxWithDesc from '@components/options/CheckboxWithDesc';
import ToolMultipleImageInput, {
  MultiImageInput
} from '@components/input/ToolMultipleImageInput';
import ToolMultiFileResult from '@components/result/ToolMultiFileResult';
import ToolFileResult from '@components/result/ToolFileResult';
import { resizeImages } from './service';
import { InitialValuesType } from './types';
import { useTranslation } from 'react-i18next';

const initialValues: InitialValuesType = {
  resizeMethod: 'pixels' as 'pixels' | 'percentage',
  dimensionType: 'width' as 'width' | 'height',
  width: '800',
  height: '600',
  percentage: '50',
  maintainAspectRatio: true
};

export default function ResizeImage({ title }: ToolComponentProps) {
  // 仅本地化界面展示与校验提示；格式参数和处理流程保持原样。
  const { t: inlineText } = useInlineTranslation('image');
  const validationSchema = Yup.object({
    width: Yup.number().when('resizeMethod', {
      is: 'pixels',
      then: (schema) =>
        schema
          .min(1, inlineText('inline.widthMustBeAtLeast1px'))
          .required(inlineText('inline.widthIsRequired'))
    }),
    height: Yup.number().when('resizeMethod', {
      is: 'pixels',
      then: (schema) =>
        schema
          .min(1, inlineText('inline.heightMustBeAtLeast1px'))
          .required(inlineText('inline.heightIsRequired'))
    }),
    percentage: Yup.number().when('resizeMethod', {
      is: 'percentage',
      then: (schema) =>
        schema
          .min(1, inlineText('inline.percentageMustBeAtLeast1'))
          .max(1000, inlineText('inline.percentageMustBeAtMost1000'))
          .required(inlineText('inline.percentageIsRequired'))
    })
  });

  const { t } = useTranslation('image');
  const [input, setInput] = useState<MultiImageInput[]>([]);
  const [results, setResults] = useState<File[]>([]);
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const compute = async (
    optionsValues: InitialValuesType,
    input: MultiImageInput[]
  ) => {
    if (!input) return;
    try {
      setIsProcessing(true);

      const output = await resizeImages(
        input.map((img) => img.file),
        optionsValues
      );

      if (!output) {
        return;
      }

      setResults(output.results);
      setZipFile(output.zipFile);
    } catch (err) {
      console.error('Error in resizing:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const getGroups: GetGroupsType<InitialValuesType> = ({
    values,
    updateField
  }) => [
    {
      title: t('resize.resizeMethod'),
      component: (
        <Box>
          <SimpleRadio
            onClick={() => updateField('resizeMethod', 'pixels')}
            checked={values.resizeMethod === 'pixels'}
            description={t('resize.resizeByPixelsDescription')}
            title={t('resize.resizeByPixels')}
          />
          <SimpleRadio
            onClick={() => updateField('resizeMethod', 'percentage')}
            checked={values.resizeMethod === 'percentage'}
            description={t('resize.resizeByPercentageDescription')}
            title={t('resize.resizeByPercentage')}
          />
        </Box>
      )
    },
    ...(values.resizeMethod === 'pixels'
      ? [
          {
            title: t('resize.dimensionType'),
            component: (
              <Box>
                <CheckboxWithDesc
                  checked={values.maintainAspectRatio}
                  onChange={(value) =>
                    updateField('maintainAspectRatio', value)
                  }
                  description={t('resize.maintainAspectRatioDescription')}
                  title={t('resize.maintainAspectRatio')}
                />
                {values.maintainAspectRatio && (
                  <Box>
                    <SimpleRadio
                      onClick={() => updateField('dimensionType', 'width')}
                      checked={values.dimensionType === 'width'}
                      description={t('resize.setWidthDescription')}
                      title={t('resize.setWidth')}
                    />
                    <SimpleRadio
                      onClick={() => updateField('dimensionType', 'height')}
                      checked={values.dimensionType === 'height'}
                      description={t('resize.setHeightDescription')}
                      title={t('resize.setHeight')}
                    />
                  </Box>
                )}
                <TextFieldWithDesc
                  value={values.width}
                  onOwnChange={(val) => updateField('width', val)}
                  description={t('resize.widthDescription')}
                  disabled={
                    values.maintainAspectRatio &&
                    values.dimensionType === 'height'
                  }
                  inputProps={{
                    'data-testid': 'width-input',
                    type: 'number',
                    min: 1
                  }}
                />
                <TextFieldWithDesc
                  value={values.height}
                  onOwnChange={(val) => updateField('height', val)}
                  description={t('resize.heightDescription')}
                  disabled={
                    values.maintainAspectRatio &&
                    values.dimensionType === 'width'
                  }
                  inputProps={{
                    'data-testid': 'height-input',
                    type: 'number',
                    min: 1
                  }}
                />
              </Box>
            )
          }
        ]
      : [
          {
            title: t('resize.percentage'),
            component: (
              <Box>
                <TextFieldWithDesc
                  value={values.percentage}
                  onOwnChange={(val) => updateField('percentage', val)}
                  description={t('resize.percentageDescription')}
                  inputProps={{
                    'data-testid': 'percentage-input',
                    type: 'number',
                    min: 1,
                    max: 1000
                  }}
                />
              </Box>
            )
          }
        ])
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
        <ToolMultipleImageInput
          value={input}
          onChange={setInput}
          type="image"
          accept={[
            'image/jpeg',
            'image/png',
            'image/svg+xml',
            'image/gif',
            'image/webp'
          ]}
          title={t('resize.inputTitle')}
        />
      }
      resultComponent={
        zipFile ? (
          <ToolMultiFileResult
            title={t('resize.resultTitle')}
            value={results}
            zipFile={zipFile}
            loading={isProcessing}
          />
        ) : (
          <ToolFileResult
            title={t('resize.resultTitle')}
            value={results[0] ?? null}
            loading={isProcessing}
            extension={results[0]?.name.split('.').pop() || 'png'}
          />
        )
      }
      toolInfo={{
        title: t('resize.toolInfo.title'),
        description: t('resize.toolInfo.description')
      }}
    />
  );
}
