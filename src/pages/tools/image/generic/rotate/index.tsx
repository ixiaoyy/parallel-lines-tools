import { useTranslation as useInlineTranslation } from 'react-i18next';
import { ToolComponentProps } from '@tools/defineTool';
import { InitialValuesType } from './type';
import * as Yup from 'yup';
import { getFileExtension } from '@utils/file';
import { useState } from 'react';
import { GetGroupsType } from '@components/options/ToolOptions';
import SimpleRadio from '@components/options/SimpleRadio';
import { Box } from '@mui/material';
import SelectWithDesc from '@components/options/SelectWithDesc';
import TextFieldWithDesc from '@components/options/TextFieldWithDesc';
import ToolContent from '@components/ToolContent';
import ToolImageInput from '@components/input/ToolImageInput';
import ToolFileResult from '@components/result/ToolFileResult';
import { processImage } from './service';
import { useTranslation } from 'react-i18next';

const initialValues: InitialValuesType = {
  rotateAngle: '90',
  rotateMethod: 'Preset'
};

export default function RotateImage({ title }: ToolComponentProps) {
  // 仅本地化界面展示与校验提示；格式参数和处理流程保持原样。
  const { t: inlineText } = useInlineTranslation('image');
  const validationSchema = Yup.object({
    rotateAngle: Yup.number().when('rotateMethod', {
      is: 'degrees',
      then: (schema) =>
        schema
          .min(-360, inlineText('inline.rotateAngleMustBeAtLeast360'))
          .max(360, inlineText('inline.rotateAngleMustBeAtMost360'))
          .required(inlineText('inline.rotateAngleIsRequired'))
    })
  });

  const { t } = useTranslation('image');
  const [input, setInput] = useState<File | null>(null);
  const [result, setResult] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const compute = async (optionsValues: InitialValuesType, input: any) => {
    if (!input) return;
    setLoading(true);
    try {
      const rotatedFile = await processImage(input, optionsValues);
      setResult(rotatedFile);
    } catch (err) {
      console.error(`Failed to rotate image input: ${err}`);
      setResult(null);
    } finally {
      setLoading(false);
    }
  };
  const getGroups: GetGroupsType<InitialValuesType> = ({
    values,
    updateField
  }) => [
    {
      title: t('rotate.options.method'),
      component: (
        <Box>
          <SimpleRadio
            onClick={() => updateField('rotateMethod', 'Preset')}
            checked={values.rotateMethod === 'Preset'}
            description={t('rotate.options.presetDesc')}
            title={t('rotate.options.presetTitle')}
          />
          <SimpleRadio
            onClick={() => updateField('rotateMethod', 'Custom')}
            checked={values.rotateMethod === 'Custom'}
            description={t('rotate.options.customDesc')}
            title={t('rotate.options.customTitle')}
          />
        </Box>
      )
    },
    ...(values.rotateMethod === 'Preset'
      ? [
          {
            title: t('rotate.options.angle'),
            component: (
              <Box>
                <SelectWithDesc
                  selected={values.rotateAngle}
                  onChange={(val) => updateField('rotateAngle', val)}
                  description={''}
                  options={[
                    { label: inlineText('inline.90Degrees'), value: '90' },
                    { label: inlineText('inline.180Degrees'), value: '180' },
                    { label: inlineText('inline.270Degrees'), value: '270' }
                  ]}
                />
              </Box>
            )
          }
        ]
      : [
          {
            title: t('rotate.options.angle'),
            component: (
              <Box>
                <TextFieldWithDesc
                  value={values.rotateAngle}
                  onOwnChange={(val) => updateField('rotateAngle', val)}
                  description={'- 360 ↔ 360'}
                  inputProps={{
                    type: 'number',
                    min: -360,
                    max: 360
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
        <ToolImageInput
          value={input}
          onChange={setInput}
          title={t('rotate.inputTitle')}
          accept={['image/*']}
        />
      }
      resultComponent={
        <ToolFileResult
          value={result}
          title={t('rotate.resultTitle')}
          loading={loading}
          extension={result ? getFileExtension(result.name) : undefined}
        />
      }
    />
  );
}
